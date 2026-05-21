import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";

import "./globals.css";

import { OneSignalInit } from "@/components/notifications/onesignal-init";
import { getOneSignalBootstrapScript } from "@/lib/onesignal/bootstrap-init";
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
    default: "ShopTonDrone Privé",
    template: "%s · ShopTonDrone Privé",
  },
  description:
    "Un espace privé premium pour vos avantages, privilèges et réservations membres.",
  applicationName: "ShopTonDrone Privé",
  alternates: { canonical: "/" },
  appleWebApp: {
    capable: true,
    title: "ShopTonDrone Privé",
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

const oneSignalBootstrap = getOneSignalBootstrapScript();

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
        {oneSignalBootstrap ? (
          <Script
            id="onesignal-bootstrap"
            strategy="beforeInteractive"
            dangerouslySetInnerHTML={{ __html: oneSignalBootstrap }}
          />
        ) : null}
        {children}
        <AppToaster />
        <OneSignalInit />
        <PwaClient />
      </body>
    </html>
  );
}
