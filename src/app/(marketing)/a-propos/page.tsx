import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Stack from '@mui/material/Stack'
import Avatar from '@mui/material/Avatar'
import Divider from '@mui/material/Divider'
import Button from '@mui/material/Button'
import Link from 'next/link'
import {
  EmojiEvents,
  Groups,
  Gavel,
  Favorite,
  Star,
  Shield,
} from '@mui/icons-material'
import { PageHeader } from '@/components/ui'
import { DiscordIcon } from '@/components/ui/Icons'

export const metadata = {
  title: 'À Propos',
  description: 'Découvrez la République Populaire du Beyblade, la communauté française de Beyblade X.',
}

const values = [
  {
    icon: Groups,
    title: 'Communauté',
    description: 'Une famille de passionnés qui partagent la même passion pour Beyblade.',
  },
  {
    icon: EmojiEvents,
    title: 'Compétition',
    description: 'Des tournois réguliers pour tous les niveaux, du débutant au champion.',
  },
  {
    icon: Favorite,
    title: 'Passion',
    description: 'L\'amour du Beyblade nous unit depuis la première génération.',
  },
  {
    icon: Shield,
    title: 'Fair-play',
    description: 'Le respect et la sportivité sont au cœur de notre communauté.',
  },
]

const rules = [
  {
    title: 'Respect mutuel',
    description: 'Traitez tous les membres avec respect et courtoisie. Aucune forme de harcèlement, discrimination ou comportement toxique ne sera tolérée.',
  },
  {
    title: 'Fair-play',
    description: 'Jouez de manière honnête. Pas de triche, pas de modifications non autorisées, pas de comportement antisportif.',
  },
  {
    title: 'Équipement officiel',
    description: 'Seules les toupies et accessoires officiels Takara Tomy et Hasbro sont autorisés en tournoi.',
  },
  {
    title: 'Ponctualité',
    description: 'Soyez présent et prêt à l\'heure pour vos matchs. Un retard excessif peut entraîner une disqualification.',
  },
  {
    title: 'Communication',
    description: 'Restez joignables sur Discord pendant les événements et signalez tout problème aux organisateurs.',
  },
]

const team = [
  {
    name: 'Yohan',
    role: 'Fondateur & Développeur',
    avatar: '/avatars/yohan.png',
    description: 'Créateur de la RPB et développeur du bot et du dashboard.',
  },
]

export default function AboutPage() {
  return (
    <>
      {/* Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 50%, #7f1d1d 100%)',
          color: 'white',
          py: { xs: 8, md: 12 },
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'url("/pattern.svg")',
            opacity: 0.1,
          }}
        />
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Typography
            variant="h2"
            fontWeight="bold"
            textAlign="center"
            sx={{ mb: 2 }}
          >
            République Populaire du Beyblade
          </Typography>
          <Typography
            variant="h5"
            textAlign="center"
            sx={{ opacity: 0.9, maxWidth: 600, mx: 'auto' }}
          >
            La communauté française de Beyblade qui allie divertissement et compétitivité
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 8 }}>
        {/* Notre Histoire */}
        <Box sx={{ mb: 10 }}>
          <Typography variant="h4" fontWeight="bold" sx={{ mb: 3 }}>
            Notre Histoire
          </Typography>
          <Grid container spacing={4}>
            <Grid size={{ xs: 12, md: 7 }}>
              <Typography variant="body1" sx={{ mb: 2, fontSize: '1.1rem', lineHeight: 1.8 }}>
                La <strong>République Populaire du Beyblade</strong> (RPB) est née de la passion 
                d'un groupe de fans français déterminés à créer la meilleure communauté Beyblade 
                de l'hexagone.
              </Typography>
              <Typography variant="body1" sx={{ mb: 2, fontSize: '1.1rem', lineHeight: 1.8 }}>
                Avec l'arrivée de <strong>Beyblade X</strong>, une nouvelle ère s'ouvre pour notre 
                communauté. Nous organisons des tournois réguliers, proposons du streaming des 
                animes, et offrons une plateforme complète pour les bladers français.
              </Typography>
              <Typography variant="body1" sx={{ fontSize: '1.1rem', lineHeight: 1.8 }}>
                Que tu sois un vétéran des premières générations ou un nouveau venu découvrant 
                Beyblade X, tu es le bienvenu dans notre communauté !
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 5 }}>
              <Card
                elevation={0}
                sx={{
                  bgcolor: 'primary.main',
                  color: 'white',
                  p: 4,
                  borderRadius: 4,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                }}
              >
                <Typography variant="h3" fontWeight="bold" sx={{ mb: 1 }}>
                  500+
                </Typography>
                <Typography variant="h6" sx={{ mb: 3, opacity: 0.9 }}>
                  Membres sur Discord
                </Typography>
                <Typography variant="h3" fontWeight="bold" sx={{ mb: 1 }}>
                  20+
                </Typography>
                <Typography variant="h6" sx={{ opacity: 0.9 }}>
                  Tournois organisés
                </Typography>
              </Card>
            </Grid>
          </Grid>
        </Box>

        {/* Nos Valeurs */}
        <Box sx={{ mb: 10 }}>
          <Typography variant="h4" fontWeight="bold" sx={{ mb: 4, textAlign: 'center' }}>
            Nos Valeurs
          </Typography>
          <Grid container spacing={3}>
            {values.map((value) => (
              <Grid key={value.title} size={{ xs: 12, sm: 6, md: 3 }}>
                <Card
                  elevation={0}
                  sx={{
                    textAlign: 'center',
                    p: 3,
                    height: '100%',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 3,
                    transition: 'all 0.3s',
                    '&:hover': {
                      borderColor: 'primary.main',
                      transform: 'translateY(-4px)',
                    },
                  }}
                >
                  <Avatar
                    sx={{
                      bgcolor: 'primary.main',
                      width: 64,
                      height: 64,
                      mx: 'auto',
                      mb: 2,
                    }}
                  >
                    <value.icon sx={{ fontSize: 32 }} />
                  </Avatar>
                  <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>
                    {value.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {value.description}
                  </Typography>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        <Divider sx={{ my: 6 }} />

        {/* Règlement */}
        <Box sx={{ mb: 10 }}>
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 4 }}>
            <Gavel sx={{ fontSize: 40, color: 'primary.main' }} />
            <Box>
              <Typography variant="h4" fontWeight="bold">
                Règlement
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Afin que chaque événement se passe sans soucis, la RPB possède un règlement.
              </Typography>
            </Box>
          </Stack>

          <Card
            elevation={0}
            sx={{
              bgcolor: 'warning.main',
              color: 'warning.contrastText',
              p: 3,
              borderRadius: 3,
              mb: 4,
            }}
          >
            <Typography variant="body1" fontWeight="medium">
              ⚠️ Nous serons intransigeants, alors merci de respecter ces règles afin que chacun 
              puisse passer un événement dans la joie et la bonne humeur.
            </Typography>
          </Card>

          <Grid container spacing={3}>
            {rules.map((rule, index) => (
              <Grid key={rule.title} size={{ xs: 12, md: 6 }}>
                <Card
                  elevation={0}
                  sx={{
                    p: 3,
                    height: '100%',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 3,
                  }}
                >
                  <Stack direction="row" spacing={2} alignItems="flex-start">
                    <Avatar
                      sx={{
                        bgcolor: 'primary.light',
                        color: 'primary.contrastText',
                        width: 36,
                        height: 36,
                        fontSize: '1rem',
                        fontWeight: 'bold',
                      }}
                    >
                      {index + 1}
                    </Avatar>
                    <Box>
                      <Typography variant="h6" fontWeight="bold" sx={{ mb: 0.5 }}>
                        {rule.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {rule.description}
                      </Typography>
                    </Box>
                  </Stack>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        <Divider sx={{ my: 6 }} />

        {/* Rejoindre */}
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <Typography variant="h4" fontWeight="bold" sx={{ mb: 2 }}>
            Prêt à rejoindre l'aventure ?
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 500, mx: 'auto' }}>
            Rejoins notre communauté Discord pour participer aux tournois, discuter avec d'autres 
            bladers et ne manquer aucun événement !
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
            <Button
              component="a"
              href="https://discord.gg/twdVfesrRj"
              target="_blank"
              rel="noopener noreferrer"
              variant="contained"
              size="large"
              startIcon={<DiscordIcon />}
              sx={{
                px: 4,
                py: 1.5,
                bgcolor: '#5865F2',
                '&:hover': { bgcolor: '#4752C4' },
              }}
            >
              Rejoindre le Discord
            </Button>
            <Button
              component={Link}
              href="/tournaments"
              variant="outlined"
              size="large"
              startIcon={<EmojiEvents />}
              sx={{ px: 4, py: 1.5 }}
            >
              Voir les tournois
            </Button>
          </Stack>
        </Box>
      </Container>
    </>
  )
}
