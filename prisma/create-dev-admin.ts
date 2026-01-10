import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function main() {
  const email = "admin@rpbey.fr";
  const password = "password123";
  const name = "Dev Admin";

  console.log(`Creating/Updating admin user: ${email}...`);

  // 1. Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    console.log("User exists. Updating role to admin...");
    await prisma.user.update({
      where: { email },
      data: { role: "admin" },
    });
  } else {
    // 2. Create user via Better Auth API (mocking request/headers not needed if we use internal API properly or just prisma)
    // Better Auth stores password in Account.
    // Since we don't have easy access to the hashing utils of better-auth here without spinning up the server,
    // we will use the `signUpEmail` via a fetch to the running localhost server!

    console.log("User does not exist. Please run this script while the dev server is running.");

    try {
      const response = await fetch("http://localhost:3000/api/auth/sign-up/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "http://localhost:3000",
        },
        body: JSON.stringify({
          email,
          password,
          name,
        }),
      });

      if (!response.ok) {
        console.error("Failed to sign up:", await response.text());
      } else {
        console.log("Sign up successful! Promoting to admin...");
        // Wait a bit for DB propagation if async
        await new Promise((r) => setTimeout(r, 1000));
        await prisma.user.update({
          where: { email },
          data: { role: "admin" },
        });
        console.log("User promoted to admin.");
      }
    } catch (e) {
      console.error("Error connecting to dev server:", e);
    }
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
