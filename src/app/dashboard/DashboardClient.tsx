"use client"

import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Grid,
  LinearProgress,
  Paper,
  Typography,
} from "@mui/material"
import { signOut } from "@/lib/auth-client"

interface DashboardClientProps {
  user: {
    id: string
    name: string
    email: string
    image?: string | null
  }
}

export default function DashboardClient({ user }: DashboardClientProps) {
  const handleSignOut = async () => {
    await signOut({
      fetchOptions: {
        onSuccess: () => {
          window.location.href = "/"
        },
      },
    })
  }

  // Mock stats - will be replaced with real data
  const stats = {
    tournamentsPlayed: 12,
    wins: 8,
    losses: 4,
    winRate: 66.7,
    rank: 5,
    points: 2450,
    level: 15,
    xpProgress: 65,
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
        <Typography variant="h4" fontWeight="bold">
          🌀 Dashboard Blader
        </Typography>
        <Button variant="outlined" color="error" onClick={handleSignOut}>
          Déconnexion
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Profile Card */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent sx={{ textAlign: "center", py: 4 }}>
              <Avatar
                src={user.image ?? undefined}
                alt={user.name}
                sx={{ width: 100, height: 100, mx: "auto", mb: 2, border: "4px solid #dc2626" }}
              />
              <Typography variant="h5" fontWeight="bold" gutterBottom>
                {user.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {user.email}
              </Typography>
              <Box sx={{ mt: 2, display: "flex", gap: 1, justifyContent: "center", flexWrap: "wrap" }}>
                <Chip label={`Niveau ${stats.level}`} color="primary" />
                <Chip label={`Rang #${stats.rank}`} sx={{ bgcolor: "#fbbf24", color: "#000" }} />
              </Box>

              {/* XP Progress */}
              <Box sx={{ mt: 3 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Progression niveau {stats.level} → {stats.level + 1}
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={stats.xpProgress}
                  sx={{
                    height: 10,
                    borderRadius: 5,
                    bgcolor: "grey.800",
                    "& .MuiLinearProgress-bar": { bgcolor: "#dc2626" },
                  }}
                />
                <Typography variant="caption" color="text.secondary">
                  {stats.xpProgress}%
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Stats Cards */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Paper sx={{ p: 2, textAlign: "center", bgcolor: "background.paper" }}>
                <Typography variant="h4" fontWeight="bold" color="primary">
                  {stats.tournamentsPlayed}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Tournois
                </Typography>
              </Paper>
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Paper sx={{ p: 2, textAlign: "center", bgcolor: "background.paper" }}>
                <Typography variant="h4" fontWeight="bold" sx={{ color: "#22c55e" }}>
                  {stats.wins}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Victoires
                </Typography>
              </Paper>
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Paper sx={{ p: 2, textAlign: "center", bgcolor: "background.paper" }}>
                <Typography variant="h4" fontWeight="bold" sx={{ color: "#ef4444" }}>
                  {stats.losses}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Défaites
                </Typography>
              </Paper>
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Paper sx={{ p: 2, textAlign: "center", bgcolor: "background.paper" }}>
                <Typography variant="h4" fontWeight="bold" sx={{ color: "#fbbf24" }}>
                  {stats.winRate}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Win Rate
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          {/* Recent Activity */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                🏆 Activité récente
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {[
                  { event: "Victoire vs @Blader42", date: "Il y a 2h", type: "win" },
                  { event: "Inscription Tournoi RPB #5", date: "Il y a 1j", type: "register" },
                  { event: "Défaite vs @MasterBey", date: "Il y a 2j", type: "loss" },
                  { event: "Niveau 15 atteint !", date: "Il y a 3j", type: "level" },
                ].map((activity, index) => (
                  <Box
                    key={index}
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      p: 1.5,
                      borderRadius: 1,
                      bgcolor: "background.default",
                    }}
                  >
                    <Typography variant="body2">
                      {activity.type === "win" && "✅ "}
                      {activity.type === "loss" && "❌ "}
                      {activity.type === "register" && "📝 "}
                      {activity.type === "level" && "⬆️ "}
                      {activity.event}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {activity.date}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Upcoming Tournaments */}
        <Grid size={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                📅 Prochains tournois
              </Typography>
              <Grid container spacing={2}>
                {[
                  { name: "RPB Championship #6", date: "15 Jan 2026", spots: "12/16", status: "Inscriptions ouvertes" },
                  { name: "Weekly Battle", date: "10 Jan 2026", spots: "8/8", status: "Complet" },
                  { name: "Coupe de France", date: "1 Fév 2026", spots: "0/32", status: "Bientôt" },
                ].map((tournament, index) => (
                  <Grid size={{ xs: 12, md: 4 }} key={index}>
                    <Paper sx={{ p: 2, border: "1px solid", borderColor: "divider" }}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {tournament.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        📆 {tournament.date}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        👥 {tournament.spots}
                      </Typography>
                      <Chip
                        label={tournament.status}
                        size="small"
                        sx={{ mt: 1 }}
                        color={tournament.status === "Inscriptions ouvertes" ? "success" : "default"}
                      />
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  )
}
