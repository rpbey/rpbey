import { prisma } from "../src/lib/prisma";

async function main() {
  const discordId = "672002003567640586";
  const namesToRemove = ["Yousra", "mimi", "narugo"];

  console.log(`Checking user with Discord ID: ${discordId}`);
  const userById = await prisma.user.findUnique({
    where: { discordId },
    include: { profile: true }
  });

  if (userById) {
    console.log(`Found User: ${userById.name} (ID: ${userById.id}, Discord: ${userById.discordId})`);
    console.log(`Image: ${userById.image}`);
    console.log(`Server Avatar: ${userById.serverAvatar}`);
    console.log(`Global Name: ${userById.globalName}`);
  } else {
    console.log("User by Discord ID not found in 'users' table.");
  }

  const staffById = await prisma.staffMember.findFirst({
    where: { discordId }
  });

  if (staffById) {
    console.log(`Found Staff Member: ${staffById.name} (Discord: ${staffById.discordId})`);
    console.log(`Image URL: ${staffById.imageUrl}`);
  }

  console.log("\nChecking names to remove:");
  for (const name of namesToRemove) {
    const usersByName = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: name, mode: 'insensitive' } },
          { globalName: { contains: name, mode: 'insensitive' } },
          { username: { contains: name, mode: 'insensitive' } },
          { nickname: { contains: name, mode: 'insensitive' } },
          { profile: { bladerName: { contains: name, mode: 'insensitive' } } }
        ]
      },
      include: { profile: true }
    });

    console.log(`\nSearch for '${name}': found ${usersByName.length} users.`);
    usersByName.forEach(u => {
      console.log(`- ${u.name} | ${u.globalName} | ${u.discordId} | Blader: ${u.profile?.bladerName}`);
    });
    
    const staffByName = await prisma.staffMember.findMany({
        where: { name: { contains: name, mode: 'insensitive' } }
    });
    console.log(`Search for '${name}' in staff: found ${staffByName.length} members.`);
    staffByName.forEach(s => {
        console.log(`- Staff: ${s.name} | ${s.discordId} | Role: ${s.role}`);
    });
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
