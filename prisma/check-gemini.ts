import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import fs from "fs";
import { Pool } from "pg";

const content = fs.readFileSync("/root/rpb-dashboard/.env", "utf-8");
const lines = content.split("\n");
let url = "";

for (const line of lines) {
  const trimmed = line.trim();
  if (trimmed.startsWith("DATABASE_URL")) {
    const parts = trimmed.split("=");
    if (parts.length >= 2) {
      let val = parts.slice(1).join("=").trim();
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
      else if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
      url = val;
    }
  }
}

const pool = new Pool({ connectionString: url });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: "gemini@rpbey.fr" },
    include: { accounts: true },
  });
  console.log("User:", JSON.stringify(user, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
