import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const count = await prisma.contentBlock.count();
  console.log("ContentBlock count:", count);
  const blocks = await prisma.contentBlock.findMany();
  console.log("Blocks:", JSON.stringify(blocks, null, 2));
}
main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
