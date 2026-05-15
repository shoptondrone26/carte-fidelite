import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import "./globals.css";

import { PwaClient } from "@/components/pwa/pwa-client";
import { AppToaster } from "@/components/ui/app-toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

function getMetadataBase(): URL {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return new URL(process.env.NEXT_PUBLIC_SITE_URL);
  }
  if (process.env.VERCEL_URL) {
    return new URL(`https://${process.env.VERCEL_URL}`);
  }
  return new URL("http://localhost:3000");
}

const metadataBase = getMetadataBase();
const splashHref = new URL("/splash/apple", metadataBase).href;

export const metadata: Metadata = {
  metadataBase,
  title: {
    default: "Carte",
    template: "%s · Carte",
  },
  description:
    "Carte de fidélité premium, pensée pour le mobile — avantages, offres et expérience soignée.",
  applicationName: "Carte",
  alternates: { canonical: "/" },
  appleWebApp: {
    capable: true,
    title: "Carte",
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  themeColor: "#09090b",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`dark ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <link
          rel="apple-touch-startup-image"
          href={splashHref}
          media="(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
        />
        <link
          rel="apple-touch-startup-image"
          href={splashHref}
          media="(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
        />
        <link
          rel="apple-touch-startup-image"
          href={splashHref}
          media="(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
        />
      </head>
      <body className="min-h-dvh bg-background text-foreground">
        {children}
        <AppToaster />
        <PwaClient />
      </body>
    </html>
  );
}
