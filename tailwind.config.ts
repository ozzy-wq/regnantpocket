import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#06070d',
        card: '#0f1220',
        accent: '#5eead4',
        bullish: '#22c55e',
        bearish: '#f43f5e'
      },
      boxShadow: {
        glow: '0 0 40px rgba(94, 234, 212, 0.15)'
      },
      animation: {
        pulseSlow: 'pulse 4s infinite'
      }
    }
  },
  plugins: []
};

export default config;
