export interface VideoSource {
  name: string
  url: string
}

export interface Episode {
  number: number
  title?: string
  thumbnail?: string
  sources: {
    vostfr?: VideoSource[]
    vf?: VideoSource[]
  }
  downloadUrl?: string
}

export interface Season {
  id: string
  name: string
  description: string
  poster: string
  episodes: Episode[]
  hasVf: boolean
  hasVostfr: boolean
}

export interface Series {
  id: string
  name: string
  years: string
  color: string
  poster: string
  logo: string
  character: string
  description: string
  seasons: Season[]
  hasScans?: boolean
  hasFilm?: boolean
  filmUrl?: string
}

export type ContentType = 'anime' | 'scan' | 'film'
export type Language = 'vostfr' | 'vf'
