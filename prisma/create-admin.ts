
import 'dotenv/config'
import { prisma } from '../src/lib/prisma'

async function main() {
  const email = 'yohanpierre15@gmail.com'
  
  console.log(`Configuring admin access for ${email}...`)

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      role: 'admin',
      emailVerified: true,
    },
    create: {
      email,
      name: 'Admin User',
      role: 'admin',
      emailVerified: true,
    },
  })

  console.log(`User ${user.email} is now an admin (ID: ${user.id})`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
