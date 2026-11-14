import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        sky: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        gold: {
          50: '#fffdf5',
          100: '#fef9e8',
          200: '#fcf0c5',
          300: '#fae39b',
          400: '#f5d061',
          500: '#d4af37', // Official Royal Gold
          600: '#b89428',
          700: '#94721d',
          800: '#75581b',
          900: '#604819',
        },
      },
      boxShadow: {
        'gold-glow': '0 0 15px -3px rgba(212, 175, 55, 0.3)',
        'sky-glow': '0 0 20px -3px rgba(14, 165, 233, 0.25)',
      },
      borderColor: {
        'gold-line': '#d4af37',
      },
    },
  },
  plugins: [],
};

export default config;
