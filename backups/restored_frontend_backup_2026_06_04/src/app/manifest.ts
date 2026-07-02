import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "C8L Agency",
    short_name: "C8L Agency",
    description: "The Quantum Leap in Content Creation. Corazones Locos Family.",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a0c",
    theme_color: "#f59e0b",
    icons: [
      {
        src: "/logo.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/assets/c8l_logo_gold_2d.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/favicon.ico",
        sizes: "48x48",
        type: "image/x-icon",
      }
    ],
  };
}
