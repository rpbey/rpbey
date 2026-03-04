'use server';

import { google } from 'googleapis';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { getChallongeService } from '@/lib/challonge';
import { prisma } from '@/lib/prisma';

export async function reportChallongeMatch(
  tournamentId: string,
  matchId: string,
  data: { winnerId: string; score: string },
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (
      !session?.user ||
      (session.user.role !== 'admin' && session.user.role !== 'moderator')
    ) {
      return { error: 'Unauthorized' };
    }

    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: { participants: true },
    });

    if (!tournament?.challongeId) return { error: 'Tournament not linked' };

    // Find Challonge Participant ID for the winner
    const participant = tournament.participants.find(
      (p) => p.userId === data.winnerId,
    );
    if (!participant?.challongeParticipantId)
      return { error: 'Winner not synced with Challonge' };

    // Try to get Admin's Challonge Token
    const account = await prisma.account.findFirst({
      where: { userId: session.user.id, providerId: 'challonge' },
    });

    const challonge = getChallongeService();
    await challonge.reportMatchScore(tournament.challongeId, matchId, {
      winnerId: participant.challongeParticipantId,
      scoresCsv: data.score,
      userToken: account?.accessToken ?? undefined,
    });

    // Also update local DB for immediate feedback
    await prisma.tournamentMatch.update({
      where: {
        tournamentId_challongeMatchId: {
          tournamentId,
          challongeMatchId: matchId,
        },
      },
      data: {
        winnerId: data.winnerId,
        score: data.score,
        state: 'complete',
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Report failed:', error);
    return { error: 'Failed to report score to Challonge' };
  }
}

export async function exportTournamentToSheets(tournamentId: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (
      !session?.user ||
      (session.user.role !== 'admin' && session.user.role !== 'moderator')
    ) {
      return { error: 'Unauthorized' };
    }

    // Get Google Account token
    const account = await prisma.account.findFirst({
      where: {
        userId: session.user.id,
        providerId: 'google',
      },
    });

    if (!account || !account.accessToken) {
      return { error: 'NO_GOOGLE_ACCOUNT' };
    }

    // Fetch Tournament Data
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        participants: {
          include: {
            user: {
              include: {
                profile: true,
                decks: {
                  where: { isActive: true },
                  include: {
                    items: {
                      include: {
                        bey: true,
                        blade: true,
                        ratchet: true,
                        bit: true,
                      },
                    },
                  },
                },
              },
            },
          },
          orderBy: { seed: 'asc' },
        },
        matches: {
          include: {
            player1: { include: { profile: true } },
            player2: { include: { profile: true } },
            winner: { include: { profile: true } },
          },
          orderBy: [{ round: 'asc' }, { createdAt: 'asc' }],
        },
      },
    });

    if (!tournament) {
      return { error: 'Tournament not found' };
    }

    // Initialize Google Sheets API
    const authClient = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
    );

    authClient.setCredentials({
      access_token: account.accessToken,
      refresh_token: account.refreshToken, // Google API client handles refresh if provided
    });

    const sheets = google.sheets({ version: 'v4', auth: authClient });

    // Create Spreadsheet
    const spreadsheet = await sheets.spreadsheets.create({
      requestBody: {
        properties: {
          title: `RPB Tournament - ${tournament.name}`,
        },
      },
    });

    if (!spreadsheet.data.spreadsheetId) {
      throw new Error('Failed to create spreadsheet');
    }
    const spreadsheetId = spreadsheet.data.spreadsheetId;

    // Prepare Data
    // Sheet 1: Participants
    const participantHeader = [
      'Seed',
      'Pseudo',
      'Discord',
      'Deck',
      'Bey 1',
      'Bey 2',
      'Bey 3',
    ];
    const participantRows = tournament.participants.map((p) => {
      const deck = p.user?.decks?.[0];
      const items = deck?.items || [];

      const beyStrings = [0, 1, 2].map((i) => {
        const item = items.find((b) => b.position === i + 1);
        if (!item) return '-';

        // Custom build
        if (item.blade && item.ratchet && item.bit) {
          return `${item.blade.name} ${item.ratchet.height}-${item.ratchet.protrusions || '?'} ${
            item.bit.name
          }`;
        }
        // Pre-built
        if (item.bey) {
          return item.bey.name;
        }
        return '-';
      });

      return [
        p.seed || '-',
        p.playerName || p.user?.name || p.user?.email || 'Unknown',
        p.user?.discordTag || '-',
        deck?.name || 'Aucun deck',
        ...beyStrings,
      ];
    });

    // Sheet 2: Matches
    const matchHeader = ['Round', 'Joueur 1', 'Joueur 2', 'Score', 'Vainqueur'];
    const matchRows = tournament.matches.map((m) => [
      m.round,
      m.player1?.name || 'TBD',
      m.player2?.name || 'TBD',
      m.score || '-',
      m.winner?.name || '-',
    ]);

    // Write Data
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Sheet1!A1',
      valueInputOption: 'RAW',
      requestBody: {
        values: [participantHeader, ...participantRows],
      },
    });

    // Add Matches Sheet
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            addSheet: {
              properties: {
                title: 'Matchs',
              },
            },
          },
        ],
      },
    });

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Matchs!A1',
      valueInputOption: 'RAW',
      requestBody: {
        values: [matchHeader, ...matchRows],
      },
    });

    return { success: true, url: spreadsheet.data.spreadsheetUrl };
  } catch (error) {
    console.error('Export failed:', error);
    return { error: 'Failed to export to Sheets' };
  }
}
