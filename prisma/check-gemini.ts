import { PrismaClient } from "@prisma/client";
import "dotenv/config";

const prisma = new PrismaClient();

async function main() {
  const email = "gemini@rpbey.fr";
  console.log(`Checking for user: ${email}`);

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (user) {
    console.log("✅ User found:");
    console.log(JSON.stringify(user, null, 2));
  } else {
    console.log("❌ User NOT found.");
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
