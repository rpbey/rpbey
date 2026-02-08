'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';

export async function claimProfile(stubUserId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return { success: false, message: "Vous devez être connecté." };
  }

  const realUser = session.user;

  try {
    // 1. Verify Stub Exists and is actually a stub
    const stubUser = await prisma.user.findUnique({
      where: { id: stubUserId },
      include: { profile: true }
    });

    if (!stubUser || !stubUser.username?.startsWith('bts2_')) {
      return { success: false, message: "Ce profil n'est pas éligible à la liaison." };
    }

    // 2. Perform Merge
    await prisma.$transaction(async (tx) => {
        // Move Participations
        await tx.tournamentParticipant.updateMany({
            where: { userId: stubUserId },
            data: { userId: realUser.id }
        });

        // Move Match History (P1, P2, Winner)
        await tx.tournamentMatch.updateMany({ where: { player1Id: stubUserId }, data: { player1Id: realUser.id } });
        await tx.tournamentMatch.updateMany({ where: { player2Id: stubUserId }, data: { player2Id: realUser.id } });
        await tx.tournamentMatch.updateMany({ where: { winnerId: stubUserId }, data: { winnerId: realUser.id } });

        // Update real user profile stats if they are empty or just add them?
        // Actually, we should trigger a recalculation properly, but for now we can just sum them
        // For safety, let's just delete the stub profile and trigger a recalculation later or let the nightly job do it.
        // Or better: Update the real user's profile with the points immediately to reflect changes.
        
        // Delete Stub
        await tx.profile.deleteMany({ where: { userId: stubUserId } });
        await tx.user.delete({ where: { id: stubUserId } });
    });

    revalidatePath('/rankings');
    return { success: true, message: "Profil lié avec succès ! Les points seront mis à jour prochainement." };

  } catch (error) {
    console.error("Claim Error:", error);
    return { success: false, message: "Une erreur est survenue lors de la liaison." };
  }
}
