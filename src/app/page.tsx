import { 
  Box, 
  Container, 
  Typography, 
  Button, 
  Card, 
  CardContent,
  Stack 
} from "@mui/material";
import Link from "next/link";

export default function Home() {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        py: 4,
      }}
    >
      <Container maxWidth="md">
        <Stack spacing={4} alignItems="center" textAlign="center">
          {/* Logo / Title */}
          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: "2.5rem", md: "4rem" },
              fontWeight: 700,
              background: "linear-gradient(135deg, #dc2626 0%, #fbbf24 100%)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            🌀 RPB Dashboard
          </Typography>

          <Typography
            variant="h5"
            color="text.secondary"
            sx={{ maxWidth: 600 }}
          >
            Bienvenue sur le dashboard officiel de la{" "}
            <Box component="span" sx={{ color: "primary.main", fontWeight: 600 }}>
              République Populaire du Beyblade
            </Box>
          </Typography>

          {/* Features */}
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={3}
            sx={{ width: "100%", mt: 4 }}
          >
            <FeatureCard
              emoji="🏆"
              title="Tournois"
              description="Inscris-toi aux tournois et suis les résultats en direct"
            />
            <FeatureCard
              emoji="👤"
              title="Profil"
              description="Personnalise ton profil de Blader et montre tes stats"
            />
            <FeatureCard
              emoji="📊"
              title="Classements"
              description="Consulte les classements et compare-toi aux autres"
            />
          </Stack>

          {/* CTA Buttons */}
          <Stack direction="row" spacing={2} sx={{ mt: 4 }}>
            <Button
              component={Link}
              href="/sign-in"
              variant="contained"
              size="large"
              sx={{
                px: 4,
                py: 1.5,
                fontSize: "1.1rem",
              }}
            >
              Se connecter
            </Button>
            <Button
              component={Link}
              href="/sign-up"
              variant="outlined"
              size="large"
              sx={{
                px: 4,
                py: 1.5,
                fontSize: "1.1rem",
              }}
            >
              Créer un compte
            </Button>
          </Stack>

          {/* Discord Link */}
          <Typography variant="body2" color="text.secondary" sx={{ mt: 4 }}>
            Rejoins notre communauté sur{" "}
            <Box
              component="a"
              href="https://discord.gg/twdVfesrRj"
              target="_blank"
              sx={{
                color: "#5865F2",
                fontWeight: 600,
                "&:hover": { textDecoration: "underline" },
              }}
            >
              Discord
            </Box>
          </Typography>
        </Stack>
      </Container>
    </Box>
  );
}

function FeatureCard({
  emoji,
  title,
  description,
}: {
  emoji: string;
  title: string;
  description: string;
}) {
  return (
    <Card
      sx={{
        flex: 1,
        transition: "transform 0.2s, box-shadow 0.2s",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: "0 8px 24px rgba(220, 38, 38, 0.2)",
        },
      }}
    >
      <CardContent sx={{ textAlign: "center", py: 3 }}>
        <Typography variant="h2" sx={{ fontSize: "2.5rem", mb: 1 }}>
          {emoji}
        </Typography>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
      </CardContent>
    </Card>
  );
}
