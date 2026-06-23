import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'c8l-gold': '#D4AF37',
        'c8l-black': '#0A0A0A',
        'c8l-purple': '#8A2BE2',
        'c8l-pink': '#FF69B4',
        'c8l-cyan': '#00F3FF',
      },
      fontFamily: { outfit: ['Outfit', 'sans-serif'], inter: ['Inter', 'sans-serif'] },
      animation: { 'glow': 'glow 2s ease-in-out infinite alternate', 'float': 'float 3s ease-in-out infinite' },
      keyframes: {
        glow: { '0%': { boxShadow: '0 0 5px #D4AF37, 0 0 10px #D4AF37' }, '100%': { boxShadow: '0 0 20px #D4AF37, 0 0 40px #8A2BE2' } },
        float: { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-10px)' } },
      },
    },
  },
  plugins: [],
}
export default config
