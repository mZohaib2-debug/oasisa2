import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
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
        cream: { 50: '#fdfbf6', 100: '#f9f4e8', 200: '#f2e8cf' },
        gold: { 400: '#d4af5a', 500: '#c39a3e', 600: '#a37f2f' },
        charcoal: { 700: '#33383b', 800: '#25292b', 900: '#181a1c' },
        ink: {
          50: '#f6f7f8',
          100: '#eceef0',
          200: '#d9dde1',
          300: '#b7bfc6',
          400: '#8a95a0',
          500: '#66717d',
          600: '#4e5862',
          700: '#3f4750',
          800: '#2b3037',
          900: '#1b1e23',
        },
      },
      fontFamily: { sans: ['var(--font-sans)', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
};

export default config;
