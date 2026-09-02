import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Deep forest / emerald green
        forest: {
          50: '#f0f7f2',
          100: '#dcecdf',
          200: '#bcd9c3',
          300: '#8fbd9c',
          400: '#5e9a70',
          500: '#3d7d51',
          600: '#2c6440',
          700: '#245036',
          800: '#1f402d',
          900: '#1b3527',
          950: '#0d1f16',
        },
        // Warm cream
        cream: {
          50: '#fdfbf6',
          100: '#f9f4e8',
          200: '#f2e8cf',
          300: '#e8d7ab',
        },
        // Subtle gold accent
        gold: {
          400: '#d4af5a',
          500: '#c39a3e',
          600: '#a37f2f',
        },
        charcoal: {
          700: '#33383b',
          800: '#25292b',
          900: '#181a1c',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl: '0.9rem',
      },
      boxShadow: {
        card: '0 1px 2px rgba(24, 26, 28, 0.06), 0 6px 20px -12px rgba(24, 26, 28, 0.18)',
      },
    },
  },
  plugins: [],
};

export default config;
