"use client";

import { RpbLogo } from "@/components/ui/RpbLogo";
import { useSession } from "@/lib/auth-client";
import { AccountCircle } from "@mui/icons-material";
import { Avatar, Box, Container, IconButton, Stack, Typography, alpha } from "@mui/material";
import Link from "next/link";

export function MarketingHeader() {
  const { data: session } = useSession();

  return (
    <Box
      component="header"
      sx={{
        display: { xs: "flex", md: "none" },
        height: 64,
        alignItems: "center",
        bgcolor: alpha("#000", 0.7),
        borderBottom: "1px solid",
        borderColor: alpha("#fbbf24", 0.2),
        position: "fixed",
        left: { xs: 0, md: "auto" },
        right: 0,
        top: 0,
        width: { xs: "100%", md: "auto" },
        zIndex: 1100,
        backdropFilter: "blur(12px)",
      }}
    >
      <Container maxWidth="lg">
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Link
            href="/"
            style={{
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <RpbLogo size={28} />
            <Typography
              variant="h6"
              fontWeight="900"
              sx={{
                background: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                letterSpacing: "-0.02em",
                textTransform: "uppercase",
                fontSize: "1.1rem",
              }}
            >
              RPB
            </Typography>
          </Link>

          <Stack direction="row" spacing={1} alignItems="center">
            <IconButton
              component={Link}
              href={session ? "/dashboard" : "/sign-in"}
              sx={{
                p: 0.5,
                border: "1px solid",
                borderColor: alpha("#fbbf24", 0.3),
                color: "#fbbf24",
                bgcolor: alpha("#fbbf24", 0.1),
                "&:hover": {
                  bgcolor: alpha("#fbbf24", 0.2),
                  borderColor: "#fbbf24",
                },
              }}
            >
              {session?.user?.image ? (
                <Avatar
                  src={session.user.image}
                  sx={{ width: 28, height: 28, border: "1px solid #fbbf24" }}
                />
              ) : (
                <AccountCircle sx={{ fontSize: 24 }} />
              )}
            </IconButton>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
