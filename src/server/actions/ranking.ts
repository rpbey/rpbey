'use server';

import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth'; // Assuming auth helper is here, check import path
import prisma from '@/lib/prisma';

export async function getRankingConfig() {
  let config = await prisma.rankingSystem.findFirst();

  if (!config) {
    config = await prisma.rankingSystem.create({
      data: {
        participation: 5,
        firstPlace: 50,
        secondPlace: 25,
        thirdPlace: 15,
        top8: 10,
        matchWin: 5,
      },
    });
  }

  return config;
}

export async function updateRankingConfig(data: {
  participation: number;
  firstPlace: number;
  secondPlace: number;
  thirdPlace: number;
  top8: number;
  matchWin: number;
}) {
  const config = await getRankingConfig();

  await prisma.rankingSystem.update({
    where: { id: config.id },
    data,
  });

  revalidatePath('/admin/rankings');
}

export async function recalculateRankings() {
  const config = await getRankingConfig();
  
  // Get current season to determine start date
  const currentSeason = await prisma.rankingSeason.findFirst({
    where: { isActive: true },
  });

  // If no season is defined, we might default to all-time or a specific date.
  // For now, let's assume if no season exists, we count everything (or create a default season 1 manually).
  const startDate = currentSeason?.startDate || new Date(0); // Epoch if no season

  // 1. Récupérer tous les tournois terminés et leurs participants, avec leur catégorie
  // Filter by date >= season start
  const tournaments = await prisma.tournament.findMany({
    where: { 
      status: 'COMPLETE',
      date: { gte: startDate }
    },
    include: {
      category: true,
      participants: {
        include: {
          user: {
            include: {
              profile: true,
            },
          },
        },
      },
    },
  });

  // Map pour stocker les points par joueur
  const playerPoints = new Map<string, number>();

  // 2. Parcourir chaque tournoi pour calculer les points
  for (const tournament of tournaments) {
    // Utiliser le multiplicateur de la catégorie si présent, sinon le weight du tournoi
    const multiplier =
      (tournament.category?.multiplier ?? tournament.weight) || 1.0;

    for (const participant of tournament.participants) {
      if (!participant.user.profile) continue;

      const userId = participant.userId;
      let points = 0;

      // Points de participation
      points += config.participation;

      // Points de placement
      if (participant.finalPlacement === 1) points += config.firstPlace;
      else if (participant.finalPlacement === 2) points += config.secondPlace;
      else if (participant.finalPlacement === 3) points += config.thirdPlace;
      else if (participant.finalPlacement && participant.finalPlacement <= 8)
        points += config.top8;

      // Points de victoire (basé sur wins stocké dans participant)
      points += participant.wins * config.matchWin;

      // Appliquer le coefficient du tournoi
      const weightedPoints = Math.round(points * multiplier);

      // Ajouter au total du joueur
      const currentPoints = playerPoints.get(userId) || 0;
      playerPoints.set(userId, currentPoints + weightedPoints);
    }
  }

  // 3. Ajouter les ajustements manuels
  const adjustments = await prisma.pointAdjustment.findMany();
  for (const adj of adjustments) {
    const currentPoints = playerPoints.get(adj.userId) || 0;
    playerPoints.set(adj.userId, currentPoints + adj.points);
  }

  // 4. Mettre à jour les profils en masse

  // D'abord, on remet tout le monde à 0 pour gérer ceux qui n'ont plus de points
  // Attention : cela réinitialise aussi ceux qui n'ont QUE des ajustements manuels si on ne les a pas ajoutés à la map
  // C'est pourquoi on itère sur la map qui contient TOUS les ids concernés (tournois + ajustements)

  await prisma.profile.updateMany({
    data: { rankingPoints: 0 },
  });

  // Ensuite on met à jour ceux qui ont des points
  for (const [userId, points] of playerPoints.entries()) {
    // S'assurer que le profil existe (normalement oui via la logique précédente, mais au cas où pour les ajustements isolés)
    const profile = await prisma.profile.findUnique({ where: { userId } });
    if (profile) {
      await prisma.profile.update({
        where: { userId },
        data: { rankingPoints: points },
      });
    } else {
      // Créer le profil si inexistant (cas rare)
      await prisma.profile.create({
        data: {
          userId,
          rankingPoints: points,
        },
      });
    }
  }

  revalidatePath('/rankings');
  revalidatePath('/admin/rankings');

  return {
    success: true,
    message: `Classement recalculé pour ${playerPoints.size} joueurs.`,
  };
}

// Gestion des catégories de tournois
export async function getTournamentCategories() {
  return await prisma.tournamentCategory.findMany({
    orderBy: { multiplier: 'desc' },
  });
}

export async function createTournamentCategory(data: {
  name: string;
  multiplier: number;
  color?: string;
}) {
  const category = await prisma.tournamentCategory.create({
    data,
  });
  revalidatePath('/admin/rankings');
  return category;
}

export async function updateTournamentCategory(
  id: string,
  data: { name?: string; multiplier?: number; color?: string },
) {
  const category = await prisma.tournamentCategory.update({
    where: { id },
    data,
  });
  revalidatePath('/admin/rankings');
  return category;
}

export async function deleteTournamentCategory(id: string) {
  // Vérifier si des tournois utilisent cette catégorie
  const count = await prisma.tournament.count({ where: { categoryId: id } });
  if (count > 0) {
    throw new Error(
      `Impossible de supprimer cette catégorie car elle est utilisée par ${count} tournois.`,
    );
  }

  await prisma.tournamentCategory.delete({
    where: { id },
  });
  revalidatePath('/admin/rankings');
  return { success: true };
}

// --- GESTION DES AJUSTEMENTS MANUELS ---

export async function getPointAdjustments(limit = 20) {
  return await prisma.pointAdjustment.findMany({
    take: limit,
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
      admin: {
        select: {
          name: true,
        },
      },
    },
  });
}

export async function addPointAdjustment(
  userId: string,
  points: number,
  reason: string,
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) throw new Error('Unauthorized');

  const adjustment = await prisma.pointAdjustment.create({
    data: {
      userId,
      points,
      reason,
      adminId: session.user.id,
    },
  });

  // Mise à jour incrémentale immédiate
  await prisma.profile.update({
    where: { userId },
    data: {
      rankingPoints: {
        increment: points,
      },
    },
  });

  revalidatePath('/admin/rankings');
  return adjustment;
}

export async function deletePointAdjustment(id: string) {
  const adjustment = await prisma.pointAdjustment.findUnique({ where: { id } });
  if (!adjustment) throw new Error('Ajustement introuvable');

  await prisma.pointAdjustment.delete({ where: { id } });

  // Mise à jour décrémentale immédiate (on retire les points ajoutés, ou on ajoute les points retirés)
  await prisma.profile.update({
    where: { userId: adjustment.userId },
    data: {
      rankingPoints: {
        decrement: adjustment.points,
      },
    },
  });

  revalidatePath('/admin/rankings');
}

export async function searchUsers(query: string) {
  if (query.length < 2) return [];

  return await prisma.user.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } },
        { discordTag: { contains: query, mode: 'insensitive' } },
      ],
    },
    take: 5,
    select: {
      id: true,
      name: true,
      image: true,
      email: true,
    },
  });
}
