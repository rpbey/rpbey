import { prisma } from '../src/lib/prisma';
import dotenv from 'dotenv';

dotenv.config();

async function cleanupDuplicateParts() {
  console.log('🧹 Début du nettoyage des pièces en double...');

  // Récupérer toutes les pièces
  const allParts = await prisma.part.findMany({
    orderBy: { updatedAt: 'desc' }, // Les plus récentes en premier
  });

  const partMap = new Map<string, typeof allParts[0][]>();

  // Grouper par nom + type
  for (const part of allParts) {
    const key = `${part.name}-${part.type}`;
    if (!partMap.has(key)) {
      partMap.set(key, []);
    }
    partMap.get(key)!.push(part);
  }

  let mergedCount = 0;
  let deletedCount = 0;

  for (const [key, parts] of partMap.entries()) {
    if (parts.length > 1) {
      // Le premier est le plus récent (à garder)
      const primaryPart = parts[0];
      const duplicates = parts.slice(1);

      console.log(`
🔍 Analyse de ${key} (${duplicates.length} doublons trouvés)`);

      for (const dup of duplicates) {
        try {
          await prisma.$transaction(async (tx) => {
            // Remplacer l'ID du doublon par l'ID principal dans toutes les configurations de Deck
            await tx.deckItem.updateMany({
              where: { bladeId: dup.id },
              data: { bladeId: primaryPart.id },
            });
            await tx.deckItem.updateMany({
              where: { overBladeId: dup.id },
              data: { overBladeId: primaryPart.id },
            });
            await tx.deckItem.updateMany({
              where: { ratchetId: dup.id },
              data: { ratchetId: primaryPart.id },
            });
            await tx.deckItem.updateMany({
              where: { bitId: dup.id },
              data: { bitId: primaryPart.id },
            });
            await tx.deckItem.updateMany({
              where: { lockChipId: dup.id },
              data: { lockChipId: primaryPart.id },
            });
            await tx.deckItem.updateMany({
              where: { assistBladeId: dup.id },
              data: { assistBladeId: primaryPart.id },
            });

            // Supprimer la pièce en double
            await tx.part.delete({
              where: { id: dup.id },
            });
          });
          
          deletedCount++;
        } catch (error) {
          console.error(`❌ Erreur lors de la suppression du doublon ${dup.id} pour ${key}:`, error);
        }
      }
      mergedCount++;
    }
  }

  console.log(`
✅ Nettoyage terminé.`);
  console.log(`   - Groupes de pièces nettoyés : ${mergedCount}`);
  console.log(`   - Pièces en double supprimées : ${deletedCount}`);
}

cleanupDuplicateParts()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
