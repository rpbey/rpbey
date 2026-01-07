'use client'

import { Card, CardContent, Typography, Box } from '@mui/material'
import Grid from '@mui/material/Grid'
import { BarChart } from '@mui/x-charts/BarChart'
import { PieChart } from '@mui/x-charts/PieChart'

interface StatsChartsProps {
  registrations: { month: string; count: number }[]
  tournaments: { month: string; count: number }[]
  matchesStatus: { status: string; count: number }[]
}

export function StatsCharts({ registrations, tournaments, matchesStatus }: StatsChartsProps) {
  return (
    <Grid container spacing={3} sx={{ mt: 3 }}>
      {/* User Growth */}
      <Grid size={{ xs: 12, md: 8 }}>
        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, height: '100%' }}>
          <CardContent>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Croissance Utilisateurs & Tournois
            </Typography>
            <Box sx={{ height: 350, width: '100%' }}>
              <BarChart
                xAxis={[{ 
                  scaleType: 'band', 
                  data: registrations.map(d => d.month) 
                }]}
                series={[
                  { 
                    data: registrations.map(d => d.count), 
                    label: 'Nouveaux Inscrits', 
                    color: '#3b82f6' 
                  },
                  { 
                    data: tournaments.map(d => d.count), 
                    label: 'Tournois Créés', 
                    color: '#fbbf24' 
                  }
                ]}
                height={300}
              />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Match Status Distribution */}
      <Grid size={{ xs: 12, md: 4 }}>
        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, height: '100%' }}>
          <CardContent>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              État des Matchs
            </Typography>
            <Box sx={{ height: 350, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <PieChart
                series={[
                  {
                    data: matchesStatus.map((s, i) => ({
                      id: i,
                      value: s.count,
                      label: s.status,
                      color: s.status === 'Terminé' ? '#22c55e' : 
                             s.status === 'En cours' ? '#3b82f6' : '#94a3b8'
                    })),
                    innerRadius: 30,
                    outerRadius: 100,
                    paddingAngle: 5,
                    cornerRadius: 5,
                  },
                ]}
                slotProps={{ legend: { hidden: true } }}
                height={300}
                margin={{ right: 5 }}
              />
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}
