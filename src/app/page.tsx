"use client"

import { 
  Box, 
  Container, 
  Typography, 
  Card, 
  CardContent,
  Stack,
  Button,
  Avatar,
  alpha,
} from "@mui/material";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import PersonIcon from "@mui/icons-material/Person";
import LeaderboardIcon from "@mui/icons-material/Leaderboard";
import LoginIcon from "@mui/icons-material/Login";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import Link from "next/link";
import type { SvgIconComponent } from "@mui/icons-material";

export default function Home() {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        py: 6,
        background: "linear-gradient(180deg, rgba(220,38,38,0.08) 0%, transparent 50%)",
      }}
    >
      <Container maxWidth="lg">
        <Stack spacing={6} alignItems="center" textAlign="center">
          {/* Hero */}
          <Stack spacing={2} alignItems="center">
            <Avatar
              sx={{
                width: 80,
                height: 80,
                mb: 2,
                bgcolor: "primary.main",
                boxShadow: "0 8px 32px rgba(220,38,38,0.4)",
              }}
            >
              <EmojiEventsIcon sx={{ fontSize: 40 }} />
            </Avatar>
            
            <Typography
              variant="h2"
              sx={{
                fontWeight: 700,
                letterSpacing: "-0.02em",
              }}
            >
              RPB Dashboard
            </Typography>

            <Typography
              variant="h6"
              color="text.secondary"
              sx={{ maxWidth: 500, fontWeight: 400 }}
            >
              Le dashboard officiel de la République Populaire du Beyblade
            </Typography>
          </Stack>

          {/* Feature Cards */}
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={3}
            sx={{ width: "100%", mt: 2 }}
          >
            <FeatureCard
              Icon={EmojiEventsIcon}
              title="Tournois"
              description="Inscris-toi et suis les résultats"
            />
            <FeatureCard
              Icon={PersonIcon}
              title="Profil"
              description="Personnalise ton profil Blader"
            />
            <FeatureCard
              Icon={LeaderboardIcon}
              title="Classements"
              description="Compare-toi aux meilleurs"
            />
          </Stack>

          {/* CTA */}
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mt: 2 }}>
            <Button
              component={Link}
              href="/sign-in"
              variant="contained"
              size="large"
              startIcon={<LoginIcon />}
              sx={{
                px: 4,
                py: 1.5,
                borderRadius: 3,
                textTransform: "none",
                fontSize: "1rem",
                fontWeight: 500,
              }}
            >
              Se connecter
            </Button>
            <Button
              component="a"
              href="https://discord.gg/twdVfesrRj"
              target="_blank"
              variant="outlined"
              size="large"
              endIcon={<ArrowForwardIcon />}
              sx={{
                px: 4,
                py: 1.5,
                borderRadius: 3,
                textTransform: "none",
                fontSize: "1rem",
                fontWeight: 500,
              }}
            >
              Rejoindre Discord
            </Button>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}

function FeatureCard({
  Icon,
  title,
  description,
}: {
  Icon: SvgIconComponent;
  title: string;
  description: string;
}) {
  return (
    <Card
      elevation={0}
      sx={{
        flex: 1,
        borderRadius: 4,
        border: "1px solid",
        borderColor: "divider",
        transition: "all 0.2s ease-in-out",
        "&:hover": {
          borderColor: "primary.main",
          transform: "translateY(-4px)",
          boxShadow: "0 12px 40px rgba(220,38,38,0.15)",
        },
      }}
    >
      <CardContent sx={{ textAlign: "center", py: 4, px: 3 }}>
        <Box
          sx={{
            display: "inline-flex",
            p: 2,
            borderRadius: 3,
            bgcolor: alpha("#dc2626", 0.1),
            color: "primary.main",
            mb: 2,
          }}
        >
          <Icon sx={{ fontSize: 32 }} />
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
      </CardContent>
    </Card>
  );
}
