import { prisma } from '../src/lib/prisma';

async function main() {
  console.log('🛠 Fixing part systems...');

  // 1. Fix standard Ratchets that were incorrectly marked as CX due to re-release
  const ratchetsToFix = ['0-60', '1-50', '4-55', '6-60', '6-80', '7-80'];
  const res1 = await prisma.part.updateMany({
    where: {
      type: 'RATCHET',
      name: { in: ratchetsToFix },
      system: 'CX'
    },
    data: { system: 'BX' }
  });
  console.log(`✅ Fixed ${res1.count} Ratchets (moved from CX to BX)`);

  // 2. Fix standard Bits that were incorrectly marked as CX
  const bitsToFix = ['Yielding'];
  const res2 = await prisma.part.updateMany({
    where: {
      type: 'BIT',
      name: { in: bitsToFix },
      system: 'CX'
    },
    data: { system: 'BX' }
  });
  console.log(`✅ Fixed ${res2.count} Bits (moved from CX to BX)`);

  // 3. Assign BX as default for parts with NULL system
  // This ensures they show up when filtering by BX
  const res3 = await prisma.part.updateMany({
    where: {
      system: null
    },
    data: { system: 'BX' }
  });
  console.log(`✅ Assigned BX system to ${res3.count} parts with NULL system`);

  // 4. Specific known misclassifications (if any blades were found)
  // Checking Leon Fang (Red Ver.) - if user thinks it's BX
  const res4 = await prisma.part.updateMany({
    where: {
      name: 'Leon Fang (Red Ver.)',
      system: 'CX'
    },
    data: { system: 'BX' }
  });
  console.log(`✅ Updated Leon Fang (Red Ver.) to BX: ${res4.count}`);

  console.log('✨ All fixes applied!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
