"use client";

import { DynamicBlock } from "@/components/cms/DynamicBlock";
import { FeedMyPartnership, TournamentVideo } from "@/components/marketing";
import { useThemeMode } from "@/components/theme/ThemeRegistry";
import { ChallongeBracket } from "@/components/tournaments/ChallongeBracket";
import { DiscordStatusCard } from "@/components/ui/DiscordStatusCard";
import { useSession } from "@/lib/auth-client";
import type { DiscordStats, TeamGroup } from "@/lib/discord-data";
import { AdminPanelSettings } from "@mui/icons-material";
import { GlobalStyles, useMediaQuery, useTheme } from "@mui/material";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { AnimatePresence, motion, type MotionStyle } from "framer-motion";
import Link from "next/link";
import { useState } from "react";

// MD3 Expressive 2026 - Spring-based easing for organic motion
const EASE = {
  // Emphasized - main transitions
  EMPHASIZED: [0.2, 0.0, 0.0, 1.0] as const,
  // Emphasized Decelerate - entries
  EMPHASIZED_DECELERATE: [0.05, 0.7, 0.1, 1.0] as const,
  // Emphasized Accelerate - exits
  EMPHASIZED_ACCELERATE: [0.3, 0.0, 0.8, 0.15] as const,
  // Standard - subtle transitions
  STANDARD: [0.2, 0.0, 0, 1.0] as const,
  // Expressive - playful, bouncy (MD3 2026)
  EXPRESSIVE: [0.34, 1.56, 0.64, 1] as const,
};

// MD3 Expressive spring configs
const SPRING = {
  // Snappy for interactions
  snappy: { stiffness: 400, damping: 30, mass: 1 },
  // Bouncy for playful elements
  bouncy: { stiffness: 300, damping: 20, mass: 1.2 },
  // Gentle for large elements
  gentle: { stiffness: 100, damping: 20, mass: 1 },
};

interface HomeClientProps {
  activeTournament?: {
    id: string;
    name: string;
    challongeUrl: string | null;
  } | null;
  heroContent?: string;
  discordStats?: DiscordStats | null;
  discordTeam?: TeamGroup[];
}

export default function HomeClient({
  activeTournament,
  heroContent,
  discordStats,
  discordTeam,
}: HomeClientProps) {
  const { backgroundImage, mode } = useThemeMode();
  const { data: session } = useSession();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.down("md"));
  const [activeHeroTab, setActiveHeroTab] = useState<"tournament" | "discord">("tournament");
  const heroOpacity = 1;

  return (
    <>
      {/* Hero Section - Mobile-first with MD3 Expressive 2026 */}
      <Box
        component={motion.div}
        style={{ opacity: heroOpacity } as MotionStyle}
        sx={{
          position: "relative",
          // Mobile-first: fixed height or auto to avoid huge empty space
          minHeight: { xs: "auto", md: "90vh" },
          display: "flex",
          alignItems: { xs: "flex-start", md: "center" },
          overflow: "hidden",
          perspective: "1000px",
          // Removed top padding on mobile since header has it, minimal on desktop
          pt: { xs: 4, md: 0 },
        }}
      >
        {/* Background - Parallax removed */}
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `url(${backgroundImage})`,
            backgroundSize: "cover",
            backgroundPosition: { xs: "center top", md: "center" },
            zIndex: -1,
            transition: "background-image 0.5s cubic-bezier(0.2, 0, 0, 1)",
          }}
        />

        {/* Gradient overlay - darker on mobile for readability */}
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: {
              xs: "linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.85) 100%)",
              md: "linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.7) 100%)",
            },
            zIndex: 0,
          }}
        />

        <Container
          maxWidth="lg"
          sx={{
            position: "relative",
            zIndex: 1,
            // Mobile-first padding
            px: { xs: 2.5, sm: 3, md: 4 },
            pt: { xs: 4, sm: 6, md: 0 },
            pb: { xs: 8, sm: 6, md: 0 },
          }}
        >
          <Grid container spacing={{ xs: 3, md: 4 }} alignItems="center">
            <Grid size={{ xs: 12, md: 7 }}>
              <Box
                component={motion.div}
                initial={{ opacity: 0, y: 40, filter: "blur(10px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{
                  duration: 0.7,
                  ease: EASE.EMPHASIZED_DECELERATE,
                }}
              >
                {/* MD3 Expressive Typography - fluid scaling */}
                <Typography
                  variant="h1"
                  fontWeight={900}
                  sx={{
                    display: { xs: "none", md: "block" },
                    fontSize: {
                      sm: "3.5rem",
                      md: "4.5rem",
                      lg: "5.5rem",
                    },
                    textAlign: "left",
                    lineHeight: 1,
                    mb: 1.5,
                    color: "white",
                    textShadow: "0 4px 20px rgba(0,0,0,0.6)",
                    fontVariationSettings: '"opsz" 72',
                    textTransform: "uppercase",
                    letterSpacing: "-0.04em",
                  }}
                >
                  République
                  <br />
                  Populaire
                  <br />
                  <Box
                    component="span"
                    sx={{
                      background: "linear-gradient(135deg, #dc2626 0%, #fbbf24 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    Beyblade
                  </Box>
                </Typography>

                {/* Description - Now at the Top and Bold */}
                <Box
                  component={motion.div}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  sx={{
                    mb: 4,
                    maxWidth: "100%",
                    textAlign: "left",
                    px: { xs: 1, md: 0 },
                  }}
                >
                  <DynamicBlock
                    slug="home-hero-text"
                    initialContent={heroContent}
                    fallback="La communauté française de Beyblade qui allie divertissement et compétitivité"
                    className="hero-text-block"
                  />
                  <GlobalStyles
                    styles={{
                      ".hero-text-block p": {
                        color: "white",
                        fontSize: { xs: "1.1rem", md: "0.95rem" },
                        fontWeight: 800, // Bold as requested
                        lineHeight: 1.5,
                        textAlign: "left",
                        margin: 0,
                        maxWidth: "100%",
                        textShadow: "0 2px 10px rgba(0,0,0,0.3)",
                      },
                    }}
                  />
                </Box>

                {/* Mobile View Selector - Transition System */}
                {isMobile && (
                  <Stack
                    direction="row"
                    spacing={1}
                    sx={{
                      mb: 4,
                      p: 0.5,
                      borderRadius: "12px",
                      bgcolor: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      width: "fit-content",
                    }}
                  >
                    <Button
                      size="small"
                      onClick={() => setActiveHeroTab("tournament")}
                      sx={{
                        borderRadius: "8px",
                        px: 3,
                        bgcolor:
                          activeHeroTab === "tournament" ? "rgba(255,255,255,0.1)" : "transparent",
                        color: activeHeroTab === "tournament" ? "#fbbf24" : "text.secondary",
                        fontWeight: 800,
                        textTransform: "none",
                        "&:hover": { bgcolor: "rgba(255,255,255,0.15)" },
                      }}
                    >
                      Tournoi
                    </Button>
                    <Button
                      size="small"
                      onClick={() => setActiveHeroTab("discord")}
                      sx={{
                        borderRadius: "8px",
                        px: 3,
                        bgcolor:
                          activeHeroTab === "discord" ? "rgba(255,255,255,0.1)" : "transparent",
                        color: activeHeroTab === "discord" ? "#6366f1" : "text.secondary",
                        fontWeight: 800,
                        textTransform: "none",
                        "&:hover": { bgcolor: "rgba(255,255,255,0.15)" },
                      }}
                    >
                      Discord
                    </Button>
                  </Stack>
                )}

                <AnimatePresence mode="wait">
                  {(isMobile ? activeHeroTab === "tournament" : isTablet) && (
                    <Box
                      key="tournament-view"
                      component={motion.div}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                      sx={{
                        display: isMobile && activeHeroTab !== "tournament" ? "none" : "flex",
                        flexDirection: "column",
                        alignItems: isMobile ? "center" : "flex-start",
                        width: "100%",
                        mb: { xs: 4, md: 6 },
                      }}
                    >
                      {/* Tournament Poster for Mobile ONLY (Desktop has it on right) */}
                      {isMobile && (
                        <Box
                          component={motion.img}
                          src="/tournaments/BTS2.png"
                          alt="Tournoi"
                          sx={{
                            width: "85%",
                            maxWidth: "280px",
                            height: "auto",
                            borderRadius: 4,
                            mb: 2,
                            boxShadow: "0 24px 48px rgba(0,0,0,0.8)",
                            border: "1px solid rgba(255,255,255,0.1)",
                          }}
                        />
                      )}

                      <Button
                        component={Link}
                        href="/tournaments/cm-bts2-auto-imported"
                        variant="contained"
                        sx={{
                          width: { xs: "100%", sm: "auto" },
                          minWidth: { xs: "280px", md: "240px" },
                          py: 2,
                          borderRadius: 2,
                          background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
                          color: "#fff",
                          fontWeight: 900,
                          fontSize: "1.1rem",
                          textTransform: "none",
                          boxShadow: "0 10px 30px rgba(139, 92, 246, 0.4)",
                          "&:hover": {
                            transform: "translateY(-2px)",
                            boxShadow: "0 15px 40px rgba(139, 92, 246, 0.6)",
                          },
                        }}
                      >
                        Participer au Tournoi
                      </Button>
                    </Box>
                  )}

                  {(activeHeroTab === "discord" || !isMobile) && (
                    <Box
                      key="discord-view"
                      component={motion.div}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                      sx={{
                        display: isMobile && activeHeroTab !== "discord" ? "none" : "block",
                        width: "100%",
                        maxWidth: 400,
                        mt: { xs: 0, md: 4 },
                      }}
                    >
                      <DiscordStatusCard initialStats={discordStats} initialTeam={discordTeam} />
                    </Box>
                  )}
                </AnimatePresence>
              </Box>
            </Grid>

            {/* Hero image - visible on tablet+ */}
            {!isTablet && (
              <Grid size={{ xs: 12, md: 5 }}>
                <Box
                  sx={{
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                  }}
                >
                  <Box
                    component={motion.img}
                    src="/tournaments/BTS2.png"
                    alt="Tournoi Beyblade"
                    transition={{
                      delay: 0.2,
                      duration: 1.0,
                      type: "spring",
                      ...SPRING.bouncy,
                    }}
                    sx={{
                      width: "100%",
                      filter:
                        mode === "tournament"
                          ? "drop-shadow(0 40px 80px rgba(96,165,250,0.5))"
                          : "drop-shadow(0 40px 80px rgba(220,38,38,0.5))",
                      borderRadius: 4,
                      mb: 3,
                    }}
                  />
                  <Button
                    component={Link}
                    href="/tournaments/cm-bts2-auto-imported"
                    variant="contained"
                    size="large"
                    sx={{
                      width: "100%",
                      maxWidth: 300,
                      py: 2,
                      borderRadius: 3,
                      background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
                      color: "#fff",
                      fontWeight: 900,
                      fontSize: "1.1rem",
                      textTransform: "none",
                      boxShadow: "0 10px 30px rgba(139, 92, 246, 0.3)",
                      "&:hover": {
                        transform: "translateY(-2px)",
                        boxShadow: "0 15px 40px rgba(139, 92, 246, 0.4)",
                      },
                    }}
                  >
                    Participer au Tournoi
                  </Button>
                </Box>
              </Grid>
            )}
          </Grid>
        </Container>
      </Box>

      {/* Bracket Section - Only show if there's an active tournament */}
      {activeTournament?.challongeUrl && (
        <Box
          sx={{
            bgcolor: "surface.low",
            // Mobile-first padding
            py: { xs: 5, sm: 6, md: 8 },
          }}
        >
          <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
            <Box
              component={motion.div}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{
                duration: 0.6,
                ease: EASE.EMPHASIZED_DECELERATE,
              }}
            >
              {(isTablet || (typeof window !== "undefined" && window.innerWidth < 640)) && (
                <Box sx={{ display: "none" }} /> // Removed from here
              )}
            </Box>

            <Box
              sx={{
                width: "100%",
                overflowX: "auto",
                pb: 2,
                cursor: "grab",
                "&::-webkit-scrollbar": { height: 6 },
                "&::-webkit-scrollbar-thumb": {
                  bgcolor: "rgba(255,255,255,0.1)",
                  borderRadius: 10,
                },
              }}
            >
              <Box sx={{ minWidth: { xs: 800, md: "auto" } }}>
                <ChallongeBracket
                  challongeUrl={activeTournament.challongeUrl}
                  title="" // Removed duplicate title
                />
              </Box>
            </Box>
          </Container>
        </Box>
      )}

      {/* Video Section */}
      <TournamentVideo videoId="nIVOi5NFjAM" />

      {/* Partnership Section - MD3 Expressive */}
      <Container
        maxWidth="lg"
        sx={{
          py: { xs: 3, sm: 4, md: 4 },
          px: { xs: 2, sm: 3, md: 4 },
        }}
      >
        <Box
          component={motion.div}
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true, margin: "-30px" }}
          transition={{
            duration: 0.6,
            ease: EASE.EMPHASIZED,
          }}
        >
          <FeedMyPartnership />
        </Box>
      </Container>

      {/* CTA Section - MD3 Expressive with mobile-first design */}
      <Container
        maxWidth="lg"
        sx={{
          py: { xs: 4, sm: 6, md: 8 },
          px: { xs: 2, sm: 3, md: 4 },
          position: "relative",
        }}
      >
        <Box
          component={motion.div}
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{
            duration: 0.7,
            ease: EASE.EMPHASIZED_DECELERATE,
          }}
          sx={{
            position: "relative",
            // MD3 Expressive shape - larger radius on mobile
            borderRadius: { xs: 4, sm: 6, md: 8 },
            overflow: "hidden",
            background: "linear-gradient(135deg, #1a1a1a 0%, #450a0a 100%)",
            boxShadow: {
              xs: "0 10px 40px rgba(220, 38, 38, 0.15)",
              md: "0 20px 80px rgba(220, 38, 38, 0.2)",
            },
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          {/* Decorative Background Elements */}
          <Box
            sx={{
              position: "absolute",
              top: "-50%",
              left: "-20%",
              width: "80%",
              height: "200%",
              background: "radial-gradient(circle, rgba(220, 38, 38, 0.2) 0%, rgba(0,0,0,0) 70%)",
              transform: "rotate(-45deg)",
              pointerEvents: "none",
            }}
          />
          <Box
            sx={{
              position: "absolute",
              bottom: "-50%",
              right: "-20%",
              width: "80%",
              height: "200%",
              background: "radial-gradient(circle, rgba(251, 191, 36, 0.1) 0%, rgba(0,0,0,0) 70%)",
              transform: "rotate(-45deg)",
              pointerEvents: "none",
            }}
          />

          <Grid
            container
            alignItems="center"
            sx={{
              position: "relative",
              zIndex: 1,
              minHeight: { xs: "auto", md: 400 },
            }}
          >
            <Grid
              size={{ xs: 12, md: 7 }}
              sx={{
                // Mobile-first padding
                p: { xs: 3, sm: 4, md: 8 },
                textAlign: "left", // Force left
              }}
            >
              <Box
                component={motion.div}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{
                  delay: 0.2,
                  duration: 0.6,
                  ease: EASE.EMPHASIZED,
                }}
              >
                <Typography
                  variant="h2"
                  fontWeight={900}
                  gutterBottom
                  sx={{
                    color: "white",
                    // Fluid typography
                    fontSize: {
                      xs: "clamp(1.5rem, 5vw, 2rem)",
                      sm: "clamp(2rem, 5vw, 2.5rem)",
                      md: "clamp(2.5rem, 4vw, 3.5rem)",
                    },
                    letterSpacing: "-0.02em",
                    lineHeight: 1.1,
                  }}
                >
                  Prêt à rejoindre
                  <br />
                  <Box
                    component={motion.span}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    sx={{ color: "#fbbf24" }}
                  >
                    la communauté ?
                  </Box>
                </Typography>
              </Box>

              <Stack
                component={motion.div}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  delay: 0.3,
                  duration: 0.6,
                  ease: EASE.EMPHASIZED,
                }}
                direction={{ xs: "column", sm: "row" }}
                spacing={{ xs: 1.5, sm: 2 }}
                justifyContent="flex-start" // Force left
                sx={{ mt: { xs: 2, md: 0 } }}
              >
                <Button
                  component="a"
                  href="https://x.com/rpb_ey"
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="contained"
                  size="large"
                  startIcon={
                    <svg
                      width={isMobile ? 16 : 18}
                      height={isMobile ? 16 : 18}
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      aria-labelledby="x-icon-title-cta"
                    >
                      <title id="x-icon-title-cta">X (Twitter)</title>
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  }
                  sx={{
                    // MD3 touch target
                    minHeight: { xs: 40, md: 52 },
                    px: { xs: 2.5, md: 4 },
                    py: { xs: 1, md: 1.8 },
                    fontSize: { xs: "0.85rem", md: "1rem" },
                    fontWeight: 800,
                    textTransform: "none",
                    borderRadius: { xs: "12px", md: "16px" },
                    background: "#000000",
                    color: "#ffffff",
                    border: "1px solid rgba(255,255,255,0.1)",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.2)",
                    width: { xs: "100%", sm: "auto" },
                    "&:hover": {
                      background: "#000000",
                      borderColor: "rgba(255,255,255,0.3)",
                      transform: "translateY(-2px)",
                      boxShadow: "0 8px 30px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.3)",
                    },
                    "&:active": {
                      transform: "translateY(0) scale(0.98)",
                    },
                    transition: "all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)",
                  }}
                >
                  Nous suivre sur X
                </Button>

                {session?.user?.role === "admin" ? (
                  <Button
                    component={Link}
                    href="/dashboard"
                    variant="contained"
                    size="large"
                    startIcon={<AdminPanelSettings />}
                    sx={{
                      minHeight: { xs: 40, md: 52 },
                      px: { xs: 3, md: 4 },
                      py: { xs: 1.5, md: 1.8 },
                      fontSize: { xs: "0.95rem", md: "1rem" },
                      fontWeight: 700,
                      textTransform: "none",
                      borderRadius: { xs: "12px", md: "16px" },
                      color: "#000000",
                      background: "#fbbf24",
                      boxShadow: "0 4px 20px rgba(251, 191, 36, 0.3)",
                      width: { xs: "100%", sm: "auto" },
                      "&:hover": {
                        background: "#f59e0b",
                        transform: "translateY(-2px)",
                        boxShadow: "0 8px 30px rgba(251, 191, 36, 0.4)",
                      },
                      "&:active": {
                        transform: "translateY(0) scale(0.98)",
                      },
                      transition: "all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)",
                    }}
                  >
                    Administration
                  </Button>
                ) : (
                  <Button
                    component={Link}
                    href="/sign-in"
                    variant="outlined"
                    size="large"
                    sx={{
                      minHeight: { xs: 40, md: 52 },
                      px: { xs: 2.5, md: 4 },
                      py: { xs: 1, md: 1.8 },
                      fontSize: { xs: "0.9rem", md: "1rem" },
                      fontWeight: 700,
                      textTransform: "none",
                      borderRadius: { xs: "12px", md: "16px" },
                      color: "#ffffff",
                      borderColor: "rgba(255,255,255,0.2)",
                      borderWidth: 2,
                      background: "rgba(255,255,255,0.03)",
                      backdropFilter: "blur(10px)",
                      boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
                      width: { xs: "100%", sm: "auto" },
                      "&:hover": {
                        borderColor: "#ffffff",
                        borderWidth: 2,
                        background: "rgba(255,255,255,0.1)",
                        transform: "translateY(-2px)",
                        boxShadow: "0 8px 25px rgba(255, 255, 255, 0.1)",
                      },
                      "&:active": {
                        transform: "translateY(0) scale(0.98)",
                      },
                      transition: "all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)",
                    }}
                  >
                    Se connecter
                  </Button>
                )}
              </Stack>
            </Grid>
          </Grid>
        </Box>
      </Container>
    </>
  );
}
