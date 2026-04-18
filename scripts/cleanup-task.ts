import { prisma } from "../src/lib/prisma";

async function main() {
  const lotteuxDiscordId = "672002003567640586";
  const yousraDiscordId = "331120115955531779";
  const narugoDiscordId = "529141451683266562";
  const mimiNames = ["Mimiwee", "MIMIX94"];

  console.log("1. Fixing photo for 672002003567640586...");
  await prisma.user.updateMany({
    where: { discordId: lotteuxDiscordId },
    data: { image: null, serverAvatar: null }
  });
  await prisma.staffMember.updateMany({
    where: { discordId: lotteuxDiscordId },
    data: { imageUrl: null }
  });
  console.log("Photo fixed (set to null).");

  console.log("2. Removing Yousra...");
  await prisma.staffMember.deleteMany({
    where: { discordId: yousraDiscordId }
  });
  // Delete user by discordId
  await prisma.user.deleteMany({
    where: { discordId: yousraDiscordId }
  });
  console.log("Yousra removed from Staff and Users.");

  console.log("3. Removing Narugo...");
  await prisma.user.deleteMany({
    where: { discordId: narugoDiscordId }
  });
  console.log("Narugo removed from Users.");

  console.log("4. Removing mimi (Mimiwee, MIMIX94)...");
  await prisma.user.deleteMany({
    where: { name: { in: mimiNames } }
  });
  console.log("mimi removed from Users.");

  console.log("Cleanup complete!");
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());