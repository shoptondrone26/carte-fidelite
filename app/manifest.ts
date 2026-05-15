import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Carte — Fidélité premium",
    short_name: "Carte",
    description:
      "Carte de fidélité premium pour mobile : avantages, offres et réservations, installable comme une application.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "browser"],
    orientation: "portrait",
    background_color: "#09090b",
    theme_color: "#09090b",
    categories: ["lifestyle", "food"],
    lang: "fr",
    icons: [
      {
        src: "/icons/icon-192",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
