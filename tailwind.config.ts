import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#05070f',
        card: '#0c1222',
        accent: '#f59e0b',
        gold: '#fbbf24',
        navy: '#0b1730',
        bullish: '#22c55e',
        bearish: '#f43f5e'
      },
      boxShadow: {
        glow: '0 18px 60px rgba(251, 191, 36, 0.18)',
        soft: '0 8px 30px rgba(3, 7, 18, 0.55)'
      },
      keyframes: {
        float: {
          '0%,100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' }
        }
      },
      animation: {
        pulseSlow: 'pulse 4s infinite',
        float: 'float 5s ease-in-out infinite'
      }
    }
  },
  plugins: []
};

export default config;
