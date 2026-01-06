import 'dotenv/config'
import prisma from '../src/lib/prisma'

async function main() {
  console.log('Suppression des faux tournois...')
  
  // Supprimer tous les tournois sans challongeId (faux tournois de seed)
  const deleted = await prisma.tournament.deleteMany({
    where: {
      challongeId: null
    }
  })
  
  console.log(`✅ ${deleted.count} faux tournois supprimés`)
  
  // Vérifier ce qui reste
  const remaining = await prisma.tournament.findMany()
  console.log(`📊 Tournois restants: ${remaining.length}`)
  for (const t of remaining) {
    console.log(`  - ${t.name} (Challonge: ${t.challongeId})`)
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
