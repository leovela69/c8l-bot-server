import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'c8l-black': '#0d0d0d',
        'c8l-gold': '#D4AF37',
        'c8l-purple': '#8A2BE2',
        'c8l-pink': '#FF69B4',
        'c8l-deep-purple': '#1a0a2e',
        'c8l-neon-blue': '#00BFFF',
        'c8l-neon-cyan': '#00F3FF',
      },
      fontFamily: {
        display: ['Outfit', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        tech: ['Space Grotesk', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
