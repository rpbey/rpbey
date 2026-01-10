import "dotenv/config";
import prisma from "../src/lib/prisma";

async function main() {
  const email = "gemini@rpbey.fr";
  const name = "Gemini Agent";

  console.log(`Checking for existing user: ${email}...`);

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    console.log(`User ${email} already exists. Updating role to admin...`);
    await prisma.user.update({
      where: { id: existingUser.id },
      data: { role: "admin" },
    });
    console.log("Role updated.");
  } else {
    console.log(`Creating new admin user: ${name}...`);
    const user = await prisma.user.create({
      data: {
        email,
        name,
        role: "admin",
        username: "gemini",
        displayUsername: "Gemini",
        emailVerified: true,
        image: "https://rpbey.fr/logo-admin.png", // Placeholder
        profile: {
          create: {
            bio: "I am the Gemini AI Agent managing this dashboard.",
            experience: "LEGEND",
            favoriteType: "BALANCE",
          },
        },
      },
    });
    console.log(`User created with ID: ${user.id}`);
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
