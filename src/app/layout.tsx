import ThemeRegistry from "@/components/theme/ThemeRegistry";
import { SmoothScroll } from "@/components/ui/SmoothScroll";
import { googleSansFlex } from "@/lib/fonts";
import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#dc2626",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://rpbey.fr"),
  title: {
    default: "RPB - République Populaire du Beyblade",
    template: "%s | RPB",
  },
  description: "La communauté française de Beyblade X. Tournois, classements et plus encore.",
  keywords: ["Beyblade", "Beyblade X", "tournoi", "France", "communauté", "RPB"],
  authors: [{ name: "RPB" }],
  creator: "République Populaire du Beyblade",
  icons: {
    icon: "/logo.svg",
    apple: "/logo.svg",
  },
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: "https://rpbey.fr",
    siteName: "RPB - République Populaire du Beyblade",
    title: "RPB - République Populaire du Beyblade",
    description: "La communauté française de Beyblade X. Tournois, classements et plus encore.",
    images: [
      {
        url: "/banner.png",
        width: 1200,
        height: 630,
        alt: "RPB Banner",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "RPB - République Populaire du Beyblade",
    description: "La communauté française de Beyblade X. Tournois, classements.",
    images: ["/banner.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={googleSansFlex.variable}>
      <body>
        <ThemeRegistry>
          <SmoothScroll />
          {children}
        </ThemeRegistry>
      </body>
    </html>
  );
}
