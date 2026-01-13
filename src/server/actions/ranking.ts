'use server';

import { revalidatePath } from 'next/cache';
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

  // 1. Récupérer tous les tournois terminés et leurs participants, avec leur catégorie
  const tournaments = await prisma.tournament.findMany({
    where: { status: 'COMPLETE' },
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

  // 3. Mettre à jour les profils en masse (ou un par un pour l'instant)
  // Pour l'optimisation, on pourrait faire des updateMany transactionnels,
  // mais une boucle update est acceptable pour quelques centaines de joueurs.

  // D'abord, on remet tout le monde à 0 pour gérer ceux qui n'ont plus de points
  await prisma.profile.updateMany({
    data: { rankingPoints: 0 },
  });

  // Ensuite on met à jour ceux qui ont des points
  for (const [userId, points] of playerPoints.entries()) {
    await prisma.profile.update({
      where: { userId },
      data: { rankingPoints: points },
    });
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
