import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        casino: {
          felt: "#1a5c2a",
          feltDark: "#0f3d1a",
          gold: "#c9a435",
          goldLight: "#e6c84d",
          goldDark: "#8b7023",
          red: "#8b1a1a",
          redBright: "#c62828",
          black: "#1a1a1a",
          green: "#00695c",
          greenBright: "#2e7d32",
          wood: "#4a2c17",
          woodLight: "#6d4227",
          panel: "rgba(10, 15, 20, 0.85)",
          carbon: "#1c1c1c",
        },
      },
      fontFamily: {
        display: ["Playfair Display", "serif"],
        game: ["Orbitron", "sans-serif"],
        numbers: ["Georgia", "serif"],
      },
      boxShadow: {
        gold: "0 0 15px rgba(201, 164, 53, 0.4)",
        "gold-strong": "0 0 25px rgba(201, 164, 53, 0.6)",
        inner: "inset 0 2px 8px rgba(0, 0, 0, 0.6)",
      },
    },
  },
  plugins: [],
};

export default config;
