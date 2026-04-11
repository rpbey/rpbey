import type { TournamentStatus } from "@prisma/client";
import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("Clearing old tournaments...");
  await prisma.tournament.deleteMany({});
  console.log("Seeding tournaments...");

  const tournaments = [
    {
      name: "BEY-TAMASHII SERIES #1",
      description:
        "Le tout premier tournoi compétitif de la RPB ! Au Dernier Bar Avant la Fin du Monde à Paris.",
      date: new Date("2026-01-11T14:00:00Z"),
      location: "Dernier Bar Avant la Fin du Monde, 19 Avenue Victoria, 75001 Paris",
      maxPlayers: 64,
      status: "REGISTRATION_OPEN",
      format: "3on3 Double Elimination",
      challongeUrl: "https://challonge.com/fr/B_TS1",
    },
  ];

  for (const t of tournaments) {
    await prisma.tournament.upsert({
      where: { id: t.name }, // Using name as ID placeholder for seed
      update: {},
      create: {
        ...t,
        status: t.status as TournamentStatus,
      },
    });
  }

  console.log("Seeding content blocks...");

  const contentBlocks = [
    {
      slug: "about-intro",
      title: "A Propos - Introduction",
      type: "markdown",
      content: `La **République Populaire du Beyblade** (RPB) est née de la passion d'un groupe de fans français déterminés à créer la meilleure communauté Beyblade de l'hexagone.

Avec l'arrivée de **Beyblade X**, une nouvelle ère s'ouvre pour notre communauté. Nous organisons des tournois réguliers et offrons une plateforme complète pour les bladers français.

Que tu sois un vétéran des premières générations ou un nouveau venu découvrant Beyblade X, tu es le bienvenu dans notre communauté !`,
    },
    {
      slug: "about-values",
      title: "A Propos - Nos Valeurs",
      type: "json",
      content: JSON.stringify([
        {
          icon: "Groups",
          title: "Communauté",
          description: "Une famille de passionnés qui partagent la même passion pour Beyblade.",
        },
        {
          icon: "EmojiEvents",
          title: "Compétition",
          description: "Des tournois réguliers pour tous les niveaux, du débutant au champion.",
        },
        {
          icon: "Favorite",
          title: "Passion",
          description: "L'amour du Beyblade nous unit depuis la première génération.",
        },
        {
          icon: "Shield",
          title: "Fair-play",
          description: "Le respect et la sportivité sont au cœur de notre communauté.",
        },
      ]),
    },
    {
      slug: "about-rules",
      title: "A Propos - Règlement",
      type: "json",
      content: JSON.stringify([
        {
          title: "Respect mutuel",
          description:
            "Traitez tous les membres avec respect et courtoisie. Aucune forme de harcèlement, discrimination ou comportement toxique ne sera tolérée.",
        },
        {
          title: "Fair-play",
          description:
            "Jouez de manière honnête. Pas de triche, pas de modifications non autorisées, pas de comportement antisportif.",
        },
        {
          title: "Équipement officiel",
          description:
            "Seules les toupies et accessoires officiels Takara Tomy et Hasbro sont autorisés en tournoi.",
        },
        {
          title: "Ponctualité",
          description:
            "Soyez présent et prêt à l'heure pour vos matchs. Un retard excessif peut entraîner une disqualification.",
        },
        {
          title: "Communication",
          description:
            "Restez joignables sur Discord pendant les événements et signalez tout problème aux organisateurs.",
        },
      ]),
    },
  ];

  for (const block of contentBlocks) {
    await prisma.contentBlock.upsert({
      where: { slug: block.slug },
      update: {}, // Don't overwrite if exists
      create: block,
    });
  }

  console.log("Seed complete!");
}

// Helper to run other seed scripts
import { execSync } from "child_process";

function runSeed(script: string) {
  console.log(`\n▶ Running ${script}...`);
  try {
    execSync(`bunx tsx prisma/${script}`, { stdio: "inherit" });
  } catch (error) {
    console.error(`❌ Failed to run ${script}`);
    throw error;
  }
}

async function runAll() {
  await main();

  // Run specialized seeders
  runSeed("seed-products.ts");
  runSeed("seed-parts.ts");
  runSeed("seed-beyblades.ts");
}

runAll()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
