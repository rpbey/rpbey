import type { Series } from './types'

// Données des séries Beyblade - basé sur streaming-espace.fr
export const BEYBLADE_SERIES: Series[] = [
  {
    id: 'x',
    name: 'Beyblade X',
    years: '2023-présent',
    color: '#dc2626',
    poster: 'https://i.ibb.co/n6TL20p/295343.webp',
    logo: 'https://i.ibb.co/KjRFQNV/beyblade-x.webp',
    character: 'https://i.ibb.co/qsxqjcg/bird.webp',
    description: "L'intrigue de l'anime se concentre sur Kazami Bird, qui aspire à devenir un joueur professionnel de Beyblade. Il veut aller à la X Tower, où se réunissent les joueurs professionnels de Beyblade.",
    hasScans: true,
    seasons: [
      {
        id: 'saison-1',
        name: 'Saison 1',
        description: "L'intrigue de l'anime se concentre sur Kazami Bird, qui aspire à devenir un joueur professionnel de Beyblade. Il veut aller à la X Tower, où se réunissent les joueurs professionnels de Beyblade.",
        poster: 'https://i.ibb.co/mbC48fn/beyximg.webp',
        hasVf: true,
        hasVostfr: true,
        episodes: Array.from({ length: 51 }, (_, i) => ({
          number: i + 1,
          sources: { vostfr: [], vf: [] },
        })),
      },
      {
        id: 'saison-2',
        name: 'Saison 2',
        description: 'La saison 2 commence immédiatement après le dernier épisode de la saison 1, et suit encore les Persona qui poursuivent leur ascension de la X Tower. De nouveaux ennemis se mettront en travers de leur chemin.',
        poster: 'https://i.ibb.co/DbF9Jqt/Cover-X-s2.webp',
        hasVf: false,
        hasVostfr: true,
        episodes: Array.from({ length: 26 }, (_, i) => ({
          number: i + 1,
          sources: { vostfr: [], vf: [] },
        })),
      },
      {
        id: 'saison-3',
        name: 'Saison 3',
        description: 'La saison 3 prend place juste après la fin de la saison 2, on continue de suivre la Team Persona qui veulent accomplir leurs objectifs.',
        poster: 'https://i.ibb.co/dwvJRBBG/Cover-X-s3.webp',
        hasVf: false,
        hasVostfr: true,
        episodes: Array.from({ length: 13 }, (_, i) => ({
          number: i + 1,
          sources: { vostfr: [], vf: [] },
        })),
      },
    ],
  },
  {
    id: 'burst',
    name: 'Beyblade Burst',
    years: '2016-2023',
    color: '#3b82f6',
    poster: 'https://i.ibb.co/kKkJMcn/bx21236-8-B4f-ORbu-Up6v.webp',
    logo: 'https://i.ibb.co/DLy9Ph4/beyblade-burst.webp',
    character: 'https://i.ibb.co/Y3yRh0Z/valt.webp',
    description: "Valt Aoi est un garçon passionné de Beyblade qui rêve de devenir le meilleur blader du monde. Avec sa toupie Valtryek, il va affronter de nombreux adversaires.",
    hasScans: true,
    seasons: [
      {
        id: 'burst',
        name: 'Burst',
        description: 'La première saison de Beyblade Burst suit Valt Aoi dans ses débuts.',
        poster: 'https://i.ibb.co/kKkJMcn/bx21236-8-B4f-ORbu-Up6v.webp',
        hasVf: true,
        hasVostfr: true,
        episodes: Array.from({ length: 51 }, (_, i) => ({
          number: i + 1,
          sources: { vostfr: [], vf: [] },
        })),
      },
      {
        id: 'evolution',
        name: 'Evolution',
        description: 'Valt part en Espagne pour participer au tournoi mondial.',
        poster: 'https://i.ibb.co/kKkJMcn/bx21236-8-B4f-ORbu-Up6v.webp',
        hasVf: true,
        hasVostfr: true,
        episodes: Array.from({ length: 51 }, (_, i) => ({
          number: i + 1,
          sources: { vostfr: [], vf: [] },
        })),
      },
      {
        id: 'turbo',
        name: 'Turbo',
        description: 'De nouveaux bladers apparaissent avec le système Turbo.',
        poster: 'https://i.ibb.co/kKkJMcn/bx21236-8-B4f-ORbu-Up6v.webp',
        hasVf: true,
        hasVostfr: true,
        episodes: Array.from({ length: 52 }, (_, i) => ({
          number: i + 1,
          sources: { vostfr: [], vf: [] },
        })),
      },
      {
        id: 'rise',
        name: 'Rise',
        description: 'La génération GT arrive avec de nouvelles toupies.',
        poster: 'https://i.ibb.co/kKkJMcn/bx21236-8-B4f-ORbu-Up6v.webp',
        hasVf: true,
        hasVostfr: true,
        episodes: Array.from({ length: 52 }, (_, i) => ({
          number: i + 1,
          sources: { vostfr: [], vf: [] },
        })),
      },
      {
        id: 'surge',
        name: 'Surge',
        description: 'Le système Sparking révolutionne le Beyblade.',
        poster: 'https://i.ibb.co/kKkJMcn/bx21236-8-B4f-ORbu-Up6v.webp',
        hasVf: true,
        hasVostfr: true,
        episodes: Array.from({ length: 52 }, (_, i) => ({
          number: i + 1,
          sources: { vostfr: [], vf: [] },
        })),
      },
      {
        id: 'quadstrike',
        name: 'QuadStrike',
        description: 'La dernière saison de Burst avec le système QuadDrive.',
        poster: 'https://i.ibb.co/kKkJMcn/bx21236-8-B4f-ORbu-Up6v.webp',
        hasVf: true,
        hasVostfr: true,
        episodes: Array.from({ length: 26 }, (_, i) => ({
          number: i + 1,
          sources: { vostfr: [], vf: [] },
        })),
      },
    ],
  },
  {
    id: 'metal',
    name: 'Metal Fight Beyblade',
    years: '2009-2012',
    color: '#a855f7',
    poster: 'https://i.ibb.co/THdHrp7/12-quvnwfn.webp',
    logo: 'https://i.ibb.co/FxkP8pC/beyblade-metal.webp',
    character: 'https://i.ibb.co/9ncz6fF/gingka.webp',
    description: "Gingka Hagane voyage à travers le monde avec sa toupie Storm Pegasus pour devenir le meilleur blader et arrêter les forces du mal.",
    hasScans: true,
    hasFilm: true,
    filmUrl: '/tv/metal/film',
    seasons: [
      {
        id: 'fusion',
        name: 'Metal Fusion',
        description: 'Gingka affronte la Dark Nebula et son leader Ryuga.',
        poster: 'https://i.ibb.co/THdHrp7/12-quvnwfn.webp',
        hasVf: true,
        hasVostfr: true,
        episodes: Array.from({ length: 51 }, (_, i) => ({
          number: i + 1,
          sources: { vostfr: [], vf: [] },
        })),
      },
      {
        id: 'masters',
        name: 'Metal Masters',
        description: 'Le championnat du monde de Beyblade commence.',
        poster: 'https://i.ibb.co/THdHrp7/12-quvnwfn.webp',
        hasVf: true,
        hasVostfr: true,
        episodes: Array.from({ length: 51 }, (_, i) => ({
          number: i + 1,
          sources: { vostfr: [], vf: [] },
        })),
      },
      {
        id: 'fury',
        name: 'Metal Fury',
        description: "La quête des bladers légendaires pour arrêter Nemesis.",
        poster: 'https://i.ibb.co/THdHrp7/12-quvnwfn.webp',
        hasVf: true,
        hasVostfr: true,
        episodes: Array.from({ length: 39 }, (_, i) => ({
          number: i + 1,
          sources: { vostfr: [], vf: [] },
        })),
      },
      {
        id: 'zero-g',
        name: 'Zero-G / Shogun Steel',
        description: 'Une nouvelle génération de bladers avec le système Zero-G.',
        poster: 'https://i.ibb.co/THdHrp7/12-quvnwfn.webp',
        hasVf: true,
        hasVostfr: true,
        episodes: Array.from({ length: 38 }, (_, i) => ({
          number: i + 1,
          sources: { vostfr: [], vf: [] },
        })),
      },
    ],
  },
  {
    id: 'bakuten',
    name: 'Bakuten Shoot Beyblade',
    years: '2001-2003',
    color: '#22c55e',
    poster: 'https://i.ibb.co/KskZBb6/3-UOE3xx-U-1.webp',
    logo: 'https://i.ibb.co/n6ckHZm/beyblade-bakuten.webp',
    character: 'https://i.ibb.co/9rsb5GT/tyson.webp',
    description: "Tyson Granger et les Bladebreakers voyagent à travers le monde pour devenir les champions du monde de Beyblade.",
    hasScans: false,
    hasFilm: true,
    filmUrl: '/tv/bakuten/film',
    seasons: [
      {
        id: 'saison-1',
        name: 'Saison 1',
        description: 'Tyson forme les Bladebreakers et participe au championnat du monde.',
        poster: 'https://i.ibb.co/KskZBb6/3-UOE3xx-U-1.webp',
        hasVf: true,
        hasVostfr: true,
        episodes: Array.from({ length: 51 }, (_, i) => ({
          number: i + 1,
          sources: { vostfr: [], vf: [] },
        })),
      },
      {
        id: 'v-force',
        name: 'V-Force',
        description: 'Les Bladebreakers affrontent de nouvelles menaces.',
        poster: 'https://i.ibb.co/KskZBb6/3-UOE3xx-U-1.webp',
        hasVf: true,
        hasVostfr: true,
        episodes: Array.from({ length: 51 }, (_, i) => ({
          number: i + 1,
          sources: { vostfr: [], vf: [] },
        })),
      },
      {
        id: 'g-revolution',
        name: 'G-Revolution',
        description: 'La dernière saison de la série originale.',
        poster: 'https://i.ibb.co/KskZBb6/3-UOE3xx-U-1.webp',
        hasVf: true,
        hasVostfr: true,
        episodes: Array.from({ length: 52 }, (_, i) => ({
          number: i + 1,
          sources: { vostfr: [], vf: [] },
        })),
      },
    ],
  },
]

export function getSeriesById(id: string): Series | undefined {
  return BEYBLADE_SERIES.find((s) => s.id === id)
}

export function getSeasonById(seriesId: string, seasonId: string) {
  const series = getSeriesById(seriesId)
  if (!series) return undefined
  return {
    series,
    season: series.seasons.find((s) => s.id === seasonId),
  }
}

export function getEpisode(seriesId: string, seasonId: string, episodeNumber: number) {
  const result = getSeasonById(seriesId, seasonId)
  if (!result?.season) return undefined
  return {
    ...result,
    episode: result.season.episodes.find((e) => e.number === episodeNumber),
  }
}
