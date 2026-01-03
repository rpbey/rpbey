import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'
import Divider from '@mui/material/Divider'
import { SeriesCard } from '@/components/streaming/SeriesCard'
import { BEYBLADE_SERIES } from '@/lib/streaming'

export default function TVHomePage() {
  const seriesWithFilms = BEYBLADE_SERIES.filter((s) => s.hasFilm)
  const seriesWithScans = BEYBLADE_SERIES.filter((s) => s.hasScans)

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Section Animes */}
      <Box sx={{ mb: 6 }}>
        <Typography
          variant="h4"
          component="h1"
          fontWeight="bold"
          sx={{
            mb: 4,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            '&::before': {
              content: '""',
              width: 4,
              height: 32,
              bgcolor: 'primary.main',
              borderRadius: 1,
            },
          }}
        >
          BEYBLADE ANIMES
        </Typography>

        <Grid container spacing={3}>
          {BEYBLADE_SERIES.map((series) => (
            <Grid key={series.id} size={{ xs: 12, sm: 6, lg: 4, xl: 2.4 }}>
              <SeriesCard series={series} type="anime" />
            </Grid>
          ))}
        </Grid>
      </Box>

      <Divider sx={{ my: 4 }} />

      {/* Section Scans */}
      <Box sx={{ mb: 6 }}>
        <Typography
          variant="h4"
          component="h2"
          fontWeight="bold"
          sx={{
            mb: 4,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            '&::before': {
              content: '""',
              width: 4,
              height: 32,
              bgcolor: 'secondary.main',
              borderRadius: 1,
            },
          }}
        >
          BEYBLADE SCANS
        </Typography>

        <Grid container spacing={3}>
          {seriesWithScans.map((series) => (
            <Grid key={series.id} size={{ xs: 12, sm: 6, lg: 4, xl: 3 }}>
              <SeriesCard series={series} type="scan" />
            </Grid>
          ))}
        </Grid>
      </Box>

      <Divider sx={{ my: 4 }} />

      {/* Section Films */}
      <Box>
        <Typography
          variant="h4"
          component="h2"
          fontWeight="bold"
          sx={{
            mb: 4,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            '&::before': {
              content: '""',
              width: 4,
              height: 32,
              bgcolor: 'info.main',
              borderRadius: 1,
            },
          }}
        >
          BEYBLADE FILMS
        </Typography>

        <Grid container spacing={3}>
          {seriesWithFilms.map((series) => (
            <Grid key={series.id} size={{ xs: 12, sm: 6, lg: 4 }}>
              <SeriesCard series={series} type="film" />
            </Grid>
          ))}
        </Grid>
      </Box>
    </Container>
  )
}
