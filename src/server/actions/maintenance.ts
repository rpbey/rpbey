'use server';

import { revalidatePath } from 'next/cache';
import { dispatchBotAction } from '@/lib/bot';
import { prisma } from '@/lib/prisma';
import { ChallongeScraper } from '@/lib/scrapers/challonge-scraper';
import { recalculateRankings } from './ranking';

const POINT_ROLES = [
  { threshold: 40000, id: '1332498533504520224' },
  { threshold: 30000, id: '1332498472817131530' },
  { threshold: 20000, id: '1332498407457161236' },
  { threshold: 15000, id: '1332498580665143306' },
  { threshold: 10000, id: '1332498339744321536' },
  { threshold: 1000, id: '1332498240712736851' },
];

function normalizeName(s: string | null | undefined): string {
  if (!s) return '';
  return s
    .toLowerCase()
    .replace(/^(satr_|satr |teamarc|team arc |bts[1-3]_|@)/, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

// 1. Recalculate Rankings
export async function actionRecalculateRankings() {
  try {
    const result = await recalculateRankings();
    return { success: true, message: result.message };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 2. Clean Duplicate Users (Stub merging)
export async function actionMergeDuplicates() {
  try {
    const allUsers = await prisma.user.findMany({
      include: {
        profile: true,
        tournaments: true,
        decks: true,
        seasonEntries: true,
      },
    });

    const stubs = allUsers.filter((u) => u.username?.match(/^bts[1-3]_/));
    const realUsers = allUsers.filter((u) => !u.username?.match(/^bts[1-3]_/));

    let mergedCount = 0;

    for (const stub of stubs) {
      const sName = normalizeName(stub.name || stub.username);
      if (!sName) continue;

      const bestMatch = realUsers.find((real) => {
        const rNames = [
          normalizeName(real.name),
          normalizeName(real.username),
          normalizeName(real.profile?.bladerName),
        ].filter((n) => n.length > 0);
        return rNames.some(
          (rn) => rn === sName || rn.includes(sName) || sName.includes(rn),
        );
      });

      if (bestMatch) {
        await prisma.tournamentParticipant.updateMany({
          where: { userId: stub.id },
          data: { userId: bestMatch.id },
        });
        await prisma.tournamentMatch.updateMany({
          where: { player1Id: stub.id },
          data: { player1Id: bestMatch.id },
        });
        await prisma.tournamentMatch.updateMany({
          where: { player2Id: stub.id },
          data: { player2Id: bestMatch.id },
        });
        await prisma.tournamentMatch.updateMany({
          where: { winnerId: stub.id },
          data: { winnerId: bestMatch.id },
        });

        if (stub.profile)
          await prisma.profile.delete({ where: { id: stub.profile.id } });
        await prisma.user.delete({ where: { id: stub.id } });
        mergedCount++;
      }
    }

    return { success: true, message: `${mergedCount} doublons fusionnés.` };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 3. Import Challonge Tournament
export async function actionImportTournament(slug: string) {
  if (!slug) return { success: false, error: 'Slug manquant' };

  const scraper = new ChallongeScraper();
  const normalizedSlug = slug.replace(/[^a-z0-9]/gi, '_');
  const tournamentId = `cm-${normalizedSlug.toLowerCase()}-auto`;
  const categoryId = 'cmkxcqif90000rma3yonpba8r'; // BEY-TAMASHII SERIES

  try {
    const result = await scraper.scrape(slug);

    await prisma.tournament.upsert({
      where: { id: tournamentId },
      update: {
        name: result.metadata.name,
        challongeUrl: result.metadata.url,
        challongeId: String(result.metadata.id || ''),
        status: 'COMPLETE',
        standings: result.standings as any,
        categoryId: categoryId,
        description: result.raw.description || '',
      },
      create: {
        id: tournamentId,
        name: result.metadata.name,
        challongeUrl: result.metadata.url,
        challongeId: String(result.metadata.id || ''),
        date: new Date(),
        status: 'COMPLETE',
        standings: result.standings as any,
        categoryId: categoryId,
        description: result.raw.description || '',
      },
    });

    const statsMap = new Map<number, { wins: number; losses: number }>();
    for (const m of result.matches) {
      if (m.state === 'complete' && m.winnerId) {
        const w = statsMap.get(m.winnerId) || { wins: 0, losses: 0 };
        w.wins++;
        statsMap.set(m.winnerId, w);
        if (m.loserId) {
          const l = statsMap.get(m.loserId) || { wins: 0, losses: 0 };
          l.losses++;
          statsMap.set(m.loserId, l);
        }
      }
    }

    const allUsers = await prisma.user.findMany({ include: { profile: true } });
    const challongeIdToUserId = new Map<number, string>();

    for (const p of result.participants) {
      const sName = normalizeName(p.name);
      let matchedUser = allUsers.find((u) => {
        return (
          normalizeName(u.name) === sName ||
          normalizeName(u.username) === sName ||
          normalizeName(u.profile?.bladerName) === sName ||
          (p.challongeUsername &&
            normalizeName(u.username) === normalizeName(p.challongeUsername))
        );
      });

      if (!matchedUser) {
        matchedUser = await (prisma.user.create({
          data: {
            name: p.name,
            username: p.challongeUsername || `${normalizedSlug}_${sName}`,
            email: `${p.challongeUsername || sName}@placeholder.rpb`,
            profile: { create: { bladerName: p.name, rankingPoints: 0 } },
          },
          include: { profile: true },
        }) as any);
      }

      if (!matchedUser) continue;

      challongeIdToUserId.set(p.id, (matchedUser as any).id);
      const stats = statsMap.get(p.id) || { wins: 0, losses: 0 };
      const standing = result.standings.find(
        (s) => normalizeName(s.name) === sName,
      );

      const existingPart = await prisma.tournamentParticipant.findFirst({
        where: {
          tournamentId,
          userId: (matchedUser as any).id,
        },
      });

      if (existingPart) {
        await prisma.tournamentParticipant.update({
          where: { id: existingPart.id },
          data: {
            finalPlacement: standing?.rank || p.finalRank || 999,
            wins: stats.wins,
            losses: stats.losses,
          },
        });
      } else {
        await prisma.tournamentParticipant.create({
          data: {
            tournamentId,
            userId: (matchedUser as any).id,
            challongeParticipantId: String(p.id),
            finalPlacement: standing?.rank || p.finalRank || 999,
            wins: stats.wins,
            losses: stats.losses,
            checkedIn: true,
          },
        });
      }
    }

    for (const m of result.matches) {
      const p1Id = m.player1Id ? challongeIdToUserId.get(m.player1Id) : null;
      const p2Id = m.player2Id ? challongeIdToUserId.get(m.player2Id) : null;
      const winnerId = m.winnerId ? challongeIdToUserId.get(m.winnerId) : null;

      if (!p1Id && !p2Id) continue;

      await prisma.tournamentMatch.upsert({
        where: {
          tournamentId_challongeMatchId: {
            tournamentId,
            challongeMatchId: String(m.id),
          },
        },
        create: {
          id: `tm-${tournamentId}-${m.id}`,
          tournamentId,
          challongeMatchId: String(m.id),
          round: m.round,
          player1Id: p1Id || null,
          player2Id: p2Id || null,
          winnerId: winnerId || null,
          score: m.scores,
          state: m.state,
        },
        update: {
          player1Id: p1Id,
          player2Id: p2Id,
          winnerId,
          score: m.scores,
          state: m.state,
        },
      });
    }

    revalidatePath('/admin/tournaments');
    return {
      success: true,
      message: `Tournoi ${result.metadata.name} importé.`,
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 4. Sync Bey-Library
export async function actionTriggerSyncParts() {
  const fs = await import('node:fs/promises');
  const path = await import('node:path');

  try {
    const DATA_FILE = path.join(
      process.cwd(),
      'data/bey-library/bey-library.json',
    );
    const rawData = await fs.readFile(DATA_FILE, 'utf-8');
    const scrapedParts = JSON.parse(rawData);

    for (const part of scrapedParts) {
      const system = part.code?.startsWith('UX')
        ? 'UX'
        : part.code?.startsWith('CX')
          ? 'CX'
          : 'BX';
      await prisma.part.upsert({
        where: { externalId: part.id },
        update: {
          name: part.name,
          imageUrl: part.imageUrl,
          system: system,
          attack: part.specs.Attack || undefined,
          defense: part.specs.Defense || undefined,
          stamina: part.specs.Stamina || undefined,
          dash: part.specs.Dash || undefined,
          burst: part.specs.Burst || undefined,
        },
        create: {
          externalId: part.id,
          name: part.name,
          type: 'BLADE',
          imageUrl: part.imageUrl,
          system: system,
          attack: part.specs.Attack || '50',
          defense: part.specs.Defense || '50',
          stamina: part.specs.Stamina || '50',
          dash: part.specs.Dash || '50',
          burst: part.specs.Burst || '50',
        },
      });
    }
    return {
      success: true,
      message: `${scrapedParts.length} pièces synchronisées.`,
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 5. Clear Cache
export async function actionClearTournamentCache() {
  try {
    const tournaments = await prisma.tournament.findMany({
      where: { status: { in: ['COMPLETE', 'ARCHIVED'] } },
    });

    for (const t of tournaments) {
      await prisma.tournament.update({
        where: { id: t.id },
        data: { standings: [] as any },
      });
    }

    revalidatePath('/rankings');
    return { success: true, message: 'Cache des tournois vidé.' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 6. Ranking Config
export async function getRankingConfig() {
  return await prisma.rankingSystem.findFirst();
}

export async function actionUpdateRankingConfig(data: any) {
  const config = await prisma.rankingSystem.findFirst();
  if (!config) return { success: false, error: 'Config non trouvée' };

  try {
    await prisma.rankingSystem.update({
      where: { id: config.id },
      data: {
        participation: Number(data.participation),
        firstPlace: Number(data.firstPlace),
        secondPlace: Number(data.secondPlace),
        thirdPlace: Number(data.thirdPlace),
        matchWinWinner: Number(data.matchWinWinner),
        matchWinLoser: Number(data.matchWinLoser),
        top8: Number(data.top8),
      },
    });
    return { success: true, message: 'Barème mis à jour.' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 7. Sync Ranking Roles
export async function actionSyncRankingRoles() {
  try {
    const profiles = await prisma.profile.findMany({
      where: { user: { discordId: { not: null } } },
      include: { user: true },
    });

    let updates = 0;
    for (const profile of profiles) {
      const discordId = profile.user.discordId;
      if (!discordId) continue;

      const points = profile.rankingPoints;
      const correctRole = POINT_ROLES.find((r) => points >= r.threshold);

      const userRoles = (profile.user.roles as any[]) || [];

      if (correctRole && !userRoles.some((ur) => ur === correctRole.id)) {
        await dispatchBotAction('add_role', {
          userId: discordId,
          roleId: correctRole.id,
        });
        updates++;
      }

      for (const r of POINT_ROLES) {
        if (r.id !== correctRole?.id && userRoles.some((ur) => ur === r.id)) {
          await dispatchBotAction('remove_role', {
            userId: discordId,
            roleId: r.id,
          });
          updates++;
        }
      }
    }

    return {
      success: true,
      message: `${updates} rôles mis à jour sur Discord.`,
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
