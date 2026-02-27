import { prisma } from '../src/lib/prisma';

async function main() {
  const parts = await prisma.part.findMany({
    take: 10,
    select: { name: true, imageUrl: true, type: true }
  });
  console.log(JSON.stringify(parts, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
