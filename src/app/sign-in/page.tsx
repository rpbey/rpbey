"use client"

import { Box, Button, Card, CardContent, Container, Divider, Typography, Alert, Stack } from "@mui/material"
import Link from "next/link"
import { signIn } from "@/lib/auth-client"
import { TwitchButton } from "@/components/auth"
import { useSearchParams } from "next/navigation"
import { Suspense, useState } from "react"
import { useThemeMode } from "@/components/theme/ThemeRegistry"

function SignInContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get("error")
  const [isLoading, setIsLoading] = useState(false)
  const { backgroundImage } = useThemeMode()

  const handleDiscordSignIn = async () => {
    setIsLoading(true)
    try {
      await signIn.social({
        provider: "discord",
        callbackURL: "/dashboard",
      })
    } catch (err) {
      console.error("Login failed", err)
      setIsLoading(false)
    }
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        py: 4,
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <Container maxWidth="sm">
        <Card sx={{ width: "100%", maxWidth: 400, borderRadius: 4, boxShadow: 3 }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ textAlign: "center", mb: 4 }}>
              <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
                Connexion
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Connecte-toi à la République Populaire du Beyblade
              </Typography>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                Une erreur est survenue lors de la connexion.
              </Alert>
            )}

            <Stack spacing={2}>
              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={handleDiscordSignIn}
                disabled={isLoading}
                sx={{
                  bgcolor: "#5865F2",
                  "&:hover": { bgcolor: "#4752C4" },
                  py: 1.5,
                  borderRadius: 2,
                  textTransform: "none",
                  fontSize: "1.1rem",
                  fontWeight: "bold",
                }}
                startIcon={
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                  </svg>
                }
              >
                {isLoading ? "Connexion..." : "Continuer avec Discord"}
              </Button>

              <TwitchButton callbackURL="/dashboard" />
            </Stack>

            <Divider sx={{ my: 3 }}>
              <Typography variant="body2" color="text.secondary">
                ou
              </Typography>
            </Divider>

            <Typography variant="body2" color="text.secondary" textAlign="center">
              Pas encore membre ?{" "}
              <Link href="https://discord.gg/twdVfesrRj" style={{ color: "inherit", fontWeight: "bold", textDecoration: "none" }}>
                Rejoins le Discord RPB
              </Link>
            </Typography>
          </CardContent>
        </Card>
      </Container>
    </Box>
  )
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <SignInContent />
    </Suspense>
  )
}
