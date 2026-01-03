import { notFound } from 'next/navigation'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardMedia from '@mui/material/CardMedia'
import Breadcrumbs from '@mui/material/Breadcrumbs'
import Link from '@mui/material/Link'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import NextLink from 'next/link'
import { Home, Subtitles, RecordVoiceOver } from '@mui/icons-material'
import { EpisodeList } from '@/components/streaming/EpisodeList'
import { getSeasonById } from '@/lib/streaming'
import type { Language } from '@/lib/streaming'

interface SeasonPageProps {
  params: Promise<{ series: string; season: string; lang: string }>
}

export async function generateMetadata({ params }: SeasonPageProps) {
  const { series: seriesId, season: seasonId, lang } = await params
  const result = getSeasonById(seriesId, seasonId)
  if (!result?.season) return { title: 'Saison non trouvée' }
  
  const langLabel = lang === 'vf' ? 'VF' : 'VOSTFR'
  return {
    title: `${result.series.name} - ${result.season.name} ${langLabel}`,
    description: result.season.description,
  }
}

export default async function SeasonPage({ params }: SeasonPageProps) {
  const { series: seriesId, season: seasonId, lang } = await params
  const result = getSeasonById(seriesId, seasonId)
  
  if (!result?.season) {
    notFound()
  }

  const { series, season } = result
  const language = (lang === 'vf' ? 'vf' : 'vostfr') as Language
  const isVf = language === 'vf'
  const otherLang = isVf ? 'vostfr' : 'vf'
  const hasOtherLang = isVf ? season.hasVostfr : season.hasVf

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
        <NextLink href={`/tv/${series.id}`} passHref legacyBehavior>
          <Link color="inherit">
            {series.name}
          </Link>
        </NextLink>
        <Typography color="text.primary">
          {season.name} - {isVf ? 'VF' : 'VOSTFR'}
        </Typography>
      </Breadcrumbs>

      {/* Header */}
      <Typography
        variant="h4"
        component="h1"
        fontWeight="bold"
        sx={{
          mb: 4,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          flexWrap: 'wrap',
          '&::before': {
            content: '""',
            width: 4,
            height: 32,
            bgcolor: series.color,
            borderRadius: 1,
          },
        }}
      >
        LISTE DES ÉPISODES DE
        <Box component="span" sx={{ color: series.color }}>
          {series.name.toUpperCase()}
        </Box>
        ({season.name.toUpperCase()}) EN {isVf ? 'VF' : 'VOSTFR'}
      </Typography>

      <Grid container spacing={4}>
        {/* Episodes List */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <EpisodeList
            series={series}
            season={season}
            language={language}
          />
        </Grid>

        {/* Season Info Card */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              position: 'sticky',
              top: 16,
            }}
          >
            <CardMedia
              component="img"
              height={300}
              image={season.poster}
              alt={season.name}
              sx={{ objectFit: 'cover' }}
            />
            <CardContent>
              <Typography variant="h5" fontWeight="bold" gutterBottom>
                {season.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                {season.description}
              </Typography>

              {/* Language Switch */}
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <Chip
                  icon={<Subtitles />}
                  label="VOSTFR"
                  color={!isVf ? 'primary' : 'default'}
                  variant={!isVf ? 'filled' : 'outlined'}
                  component={NextLink}
                  href={`/tv/${series.id}/${season.id}/vostfr`}
                  clickable
                  sx={{ cursor: 'pointer' }}
                />
                <Chip
                  icon={<RecordVoiceOver />}
                  label="VF"
                  color={isVf ? 'primary' : 'default'}
                  variant={isVf ? 'filled' : 'outlined'}
                  component={NextLink}
                  href={`/tv/${series.id}/${season.id}/vf`}
                  clickable
                  disabled={!season.hasVf}
                  sx={{ cursor: season.hasVf ? 'pointer' : 'not-allowed' }}
                />
              </Box>

              {/* Other language button */}
              {hasOtherLang && (
                <Button
                  component={NextLink}
                  href={`/tv/${series.id}/${season.id}/${otherLang}`}
                  variant="outlined"
                  fullWidth
                  sx={{
                    borderColor: series.color,
                    color: series.color,
                    '&:hover': {
                      borderColor: series.color,
                      bgcolor: `${series.color}10`,
                    },
                  }}
                >
                  Regarder en {otherLang.toUpperCase()}
                </Button>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  )
}
