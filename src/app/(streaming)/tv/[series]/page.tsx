import { notFound } from 'next/navigation'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'
import Breadcrumbs from '@mui/material/Breadcrumbs'
import Link from '@mui/material/Link'
import NextLink from 'next/link'
import { Home } from '@mui/icons-material'
import { SeasonCard } from '@/components/streaming/SeasonCard'
import { getSeriesById } from '@/lib/streaming'

interface SeriesPageProps {
  params: Promise<{ series: string }>
}

export async function generateMetadata({ params }: SeriesPageProps) {
  const { series: seriesId } = await params
  const series = getSeriesById(seriesId)
  if (!series) return { title: 'Série non trouvée' }
  
  return {
    title: series.name,
    description: series.description,
  }
}

export default async function SeriesPage({ params }: SeriesPageProps) {
  const { series: seriesId } = await params
  const series = getSeriesById(seriesId)
  
  if (!series) {
    notFound()
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 3 }}>
        <NextLink href="/tv" passHref legacyBehavior>
          <Link
            color="inherit"
            sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
          >
            <Home fontSize="small" />
            Accueil
          </Link>
        </NextLink>
        <Typography color="text.primary">{series.name}</Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box
        sx={{
          mb: 4,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <Box
          component="img"
          src={series.logo}
          alt={series.name}
          sx={{ height: 48 }}
        />
        <Typography
          variant="h3"
          component="h1"
          fontWeight="bold"
          sx={{
            background: `linear-gradient(90deg, ${series.color}, ${series.color}99)`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          {series.name.toUpperCase()}
        </Typography>
      </Box>

      {/* Seasons Grid */}
      <Grid container spacing={4}>
        {series.seasons.map((season) => (
          <Grid key={season.id} size={{ xs: 12, md: 6, lg: 4 }}>
            <SeasonCard series={series} season={season} />
          </Grid>
        ))}

        {/* Scans Card */}
        {series.hasScans && (
          <Grid size={{ xs: 12, md: 6, lg: 4 }}>
            <SeasonCard 
              series={series} 
              season={{
                id: 'scans',
                name: 'Scans',
                description: `Lisez le manga ${series.name} en ligne.`,
                poster: series.poster,
                hasVf: true,
                hasVostfr: false,
                episodes: [],
              }}
              type="scan"
            />
          </Grid>
        )}
      </Grid>
    </Container>
  )
}
