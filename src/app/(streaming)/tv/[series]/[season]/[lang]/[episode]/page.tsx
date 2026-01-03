import { notFound } from 'next/navigation'
import { VideoPlayer } from '@/components/streaming/VideoPlayer'
import { getEpisode } from '@/lib/streaming'
import type { Language } from '@/lib/streaming'

interface EpisodePageProps {
  params: Promise<{ series: string; season: string; lang: string; episode: string }>
}

export async function generateMetadata({ params }: EpisodePageProps) {
  const { series: seriesId, season: seasonId, lang, episode: episodeNum } = await params
  const result = getEpisode(seriesId, seasonId, parseInt(episodeNum))
  if (!result?.episode || !result.season) return { title: 'Épisode non trouvé' }
  
  const langLabel = lang === 'vf' ? 'VF' : 'VOSTFR'
  return {
    title: `${result.series.name} - ${result.season.name} Épisode ${result.episode.number} ${langLabel}`,
  }
}

export default async function EpisodePage({ params }: EpisodePageProps) {
  const { series: seriesId, season: seasonId, lang, episode: episodeNum } = await params
  const episodeNumber = parseInt(episodeNum)
  
  // Handle trailer
  if (episodeNum === 'trailer') {
    // Trailer page - similar to episode but for trailer
    const result = getEpisode(seriesId, seasonId, 1)
    if (!result?.season) notFound()
    
    return (
      <VideoPlayer
        series={result.series}
        season={result.season}
        episodeNumber={0}
        language={(lang === 'vf' ? 'vf' : 'vostfr') as Language}
        isTrailer
      />
    )
  }

  const result = getEpisode(seriesId, seasonId, episodeNumber)
  
  if (!result?.episode || !result.season) {
    notFound()
  }

  const { series, season, episode } = result
  const language = (lang === 'vf' ? 'vf' : 'vostfr') as Language

  return (
    <VideoPlayer
      series={series}
      season={season}
      episodeNumber={episode.number}
      language={language}
    />
  )
}
