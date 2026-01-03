import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Avatar from '@mui/material/Avatar'
import Chip from '@mui/material/Chip'
import TextField from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'
import { Search } from '@mui/icons-material'

const users = [
  {
    id: '1',
    name: 'Blader42',
    email: 'blader42@example.com',
    avatar: 'https://cdn.discordapp.com/embed/avatars/0.png',
    role: 'admin',
    joinedAt: '1 Jan 2024',
    tournaments: 15,
  },
  {
    id: '2',
    name: 'MasterBey',
    email: 'masterbey@example.com',
    avatar: 'https://cdn.discordapp.com/embed/avatars/1.png',
    role: 'member',
    joinedAt: '15 Mar 2024',
    tournaments: 8,
  },
  {
    id: '3',
    name: 'XBurst',
    email: 'xburst@example.com',
    avatar: 'https://cdn.discordapp.com/embed/avatars/2.png',
    role: 'member',
    joinedAt: '20 Jun 2024',
    tournaments: 3,
  },
]

const roleColors: Record<string, 'error' | 'default'> = {
  admin: 'error',
  member: 'default',
}

export default function AdminUsersPage() {
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Utilisateurs
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Gérez les utilisateurs de la plateforme
      </Typography>

      {/* Search */}
      <TextField
        fullWidth
        placeholder="Rechercher un utilisateur..."
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search />
            </InputAdornment>
          ),
        }}
        sx={{ mb: 3 }}
      />

      {/* Users Table */}
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
                <TableCell>Utilisateur</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Rôle</TableCell>
                <TableCell>Inscrit le</TableCell>
                <TableCell>Tournois</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id} hover sx={{ cursor: 'pointer' }}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar src={user.avatar} alt={user.name} />
                      <Typography fontWeight="bold">{user.name}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Chip
                      label={user.role}
                      color={roleColors[user.role]}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{user.joinedAt}</TableCell>
                  <TableCell>{user.tournaments}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Container>
  )
}
