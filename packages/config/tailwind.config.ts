import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#6C2BD9',
          50: '#F3EEFB',
          100: '#E3D5F7',
          200: '#C5A8EF',
          300: '#A87CE7',
          400: '#8A4FDF',
          500: '#6C2BD9',
          600: '#5621AE',
          700: '#411982',
          800: '#2B1057',
          900: '#16082B',
        },
        secondary: {
          DEFAULT: '#4A9EFF',
          500: '#4A9EFF',
        },
        background: '#0A0A0F',
        surface: {
          DEFAULT: '#14141E',
          elevated: '#1E1E2E',
        },
        success: '#00D68F',
        warning: '#FFAA44',
        danger: '#FF6B6B',
        'text-primary': '#FFFFFF',
        'text-secondary': '#A0A0B8',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
