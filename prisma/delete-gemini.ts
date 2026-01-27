import { PrismaClient } from "@prisma/client";
import "dotenv/config";

const prisma = new PrismaClient();

async function main() {
  const email = "gemini@rpbey.fr";
  console.log(`Deleting user: ${email}...`);

  try {
    const deleted = await prisma.user.delete({
      where: { email },
    });
    console.log("Deleted user:", deleted.email);
  } catch (error) {
    console.log("User not found or error deleting:", error);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
