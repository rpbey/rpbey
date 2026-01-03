import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import { Add, Edit, Delete } from '@mui/icons-material'
import prisma from '@/lib/prisma'
import { formatDateShort } from '@/lib/utils'

export default async function AdminTournamentsPage() {
  const tournaments = await prisma.tournament.findMany({
    orderBy: { date: 'desc' },
    include: {
      _count: {
        select: { participants: true }
      }
    }
  })

  const totalParticipants = await prisma.tournamentParticipant.count()
  const activeTournaments = tournaments.filter(t => 
    ['REGISTRATION_OPEN', 'UNDERWAY', 'CHECKIN'].includes(t.status)
  ).length

  const statusColors: Record<string, 'success' | 'warning' | 'default' | 'info'> = {
    REGISTRATION_OPEN: 'success',
    REGISTRATION_CLOSED: 'warning',
    UPCOMING: 'info',
    COMPLETE: 'default',
    UNDERWAY: 'success',
    CHECKIN: 'info',
    CANCELLED: 'error' as any,
  }

  const statusLabels: Record<string, string> = {
    REGISTRATION_OPEN: 'Inscriptions ouvertes',
    REGISTRATION_CLOSED: 'Inscriptions closes',
    UPCOMING: 'À venir',
    COMPLETE: 'Terminé',
    UNDERWAY: 'En cours',
    CHECKIN: 'Check-in',
    CANCELLED: 'Annulé',
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Tournois
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gérez les tournois Beyblade
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />}>
          Nouveau tournoi
        </Button>
      </Box>

      {/* Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          { label: 'Total tournois', value: tournaments.length },
          { label: 'En cours / Ouverts', value: activeTournaments },
          { label: 'Participants totaux', value: totalParticipants },
        ].map((stat) => (
          <Grid key={stat.label} size={{ xs: 12, sm: 4 }}>
            <Card
              elevation={0}
              sx={{
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h3" fontWeight="bold" color="primary">
                  {stat.value}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {stat.label}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Tournaments Table */}
      <Card
        elevation={0}
        sx={{
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nom</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Participants</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tournaments.map((tournament) => (
                <TableRow key={tournament.id} hover>
                  <TableCell>
                    <Typography fontWeight="bold">{tournament.name}</Typography>
                  </TableCell>
                  <TableCell>{formatDateShort(tournament.date)}</TableCell>
                  <TableCell>
                    {tournament._count.participants}/{tournament.maxPlayers}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={statusLabels[tournament.status] || tournament.status}
                      color={statusColors[tournament.status] || 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Button size="small" startIcon={<Edit />}>
                      Modifier
                    </Button>
                    <Button size="small" color="error" startIcon={<Delete />}>
                      Supprimer
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {tournaments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">Aucun tournoi trouvé</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Container>
  )
}
