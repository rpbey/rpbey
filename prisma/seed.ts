import prisma from '../src/lib/prisma'
import 'dotenv/config'

async function main() {
  console.log('Seeding tournaments...')

  const tournaments = [
    {
      name: 'RPB Championship #6',
      description: 'Le plus grand tournoi de la saison. Venez affronter les meilleurs bladers de France.',
      date: new Date('2026-01-15T14:00:00Z'),
      location: 'Paris, France',
      maxPlayers: 64,
      status: 'REGISTRATION_OPEN',
    },
    {
      name: 'Weekly Battle - Janvier W1',
      description: 'Tournoi hebdomadaire pour s\'entraîner et gagner des points au classement.',
      date: new Date('2026-01-10T18:00:00Z'),
      location: 'Online',
      maxPlayers: 16,
      status: 'UPCOMING',
    },
    {
      name: 'Coupe de France Beyblade X',
      description: 'Tournoi officiel qualificatif pour les championnats d\'Europe.',
      date: new Date('2026-02-01T10:00:00Z'),
      location: 'Lyon, France',
      maxPlayers: 128,
      status: 'UPCOMING',
    },
  ]

  for (const t of tournaments) {
    await prisma.tournament.upsert({
      where: { challongeId: (t as any).challongeId ?? t.name },
      update: {},
      create: {
        ...t,
        status: t.status as any,
      },
    })
  }

  console.log('Seed complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
