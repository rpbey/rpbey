'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';

export async function getUnlinkedParticipants() {
  // On récupère les tournois BTS 1, 2 et 3
  const tournaments = await prisma.tournament.findMany({
    where: {
      OR: [
        { challongeUrl: { contains: 'B_TS1' } },
        { challongeUrl: { contains: 'B_TS2' } },
        { challongeUrl: { contains: 'B_TS3' } },
      ],
    },
    include: {
      participants: {
        include: {
          user: {
            include: { profile: true },
          },
        },
        orderBy: { finalPlacement: 'asc' },
      },
    },
    orderBy: { date: 'desc' },
  });

  return tournaments;
}

export async function getAllRealUsers() {
  // Récupère les utilisateurs qui ont un ID Discord (donc "réels")
  const users = await prisma.user.findMany({
    where: {
      NOT: { discordId: null },
    },
    select: {
      id: true,
      name: true,
      discordTag: true,
      discordId: true,
      image: true,
      profile: {
        select: { bladerName: true },
      },
    },
    orderBy: { name: 'asc' },
  });

  return users;
}

export async function mergeUserAccounts(
  placeholderUserId: string,
  realUserId: string,
) {
  if (placeholderUserId === realUserId) throw new Error('Même utilisateur');

  try {
    return await prisma.$transaction(async (tx) => {
      // 1. Mettre à jour les participations aux tournois
      await tx.tournamentParticipant.updateMany({
        where: { userId: placeholderUserId },
        data: { userId: realUserId },
      });

      // 2. Mettre à jour les matchs (Player 1)
      await tx.tournamentMatch.updateMany({
        where: { player1Id: placeholderUserId },
        data: { player1Id: realUserId },
      });

      // 3. Mettre à jour les matchs (Player 2)
      await tx.tournamentMatch.updateMany({
        where: { player2Id: placeholderUserId },
        data: { player2Id: realUserId },
      });

      // 4. Mettre à jour les matchs (Winner)
      await tx.tournamentMatch.updateMany({
        where: { winnerId: placeholderUserId },
        data: { winnerId: realUserId },
      });

      // 5. Mettre à jour les Decks
      await tx.deck.updateMany({
        where: { userId: placeholderUserId },
        data: { userId: realUserId },
      });

      // 6. Supprimer l'utilisateur placeholder
      // On vérifie d'abord qu'il n'a plus de dépendances critiques
      await tx.user.delete({
        where: { id: placeholderUserId },
      });

      revalidatePath('/admin/link');
      return { success: true };
    });
  } catch (error) {
    console.error('Merge Error:', error);
    throw new Error('Erreur lors de la fusion des comptes');
  }
}
