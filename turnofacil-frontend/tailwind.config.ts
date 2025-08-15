import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          main: '#0D9488',
          light: '#5EEAD4',
          dark: '#047857',
          DEFAULT: '#0D9488',
        },
        secondary: {
          main: '#F59E0B',
          light: '#FCD34D',
          dark: '#B45309',
          DEFAULT: '#F59E0B',
        },
        neutral: {
          black: '#111827',
          'dark-gray': '#4B5563',
          'medium-gray': '#9CA3AF',
          'light-gray': '#E5E7EB',
          'off-white': '#F9FAFB',
          white: '#FFFFFF',
        },
        semantic: {
          success: '#10B981',
          warning: '#FBBF24',
          error: '#EF4444',
          info: '#3B82F6',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      fontSize: {
        h1: ['2.25rem', { fontWeight: '700' }],
        h2: ['1.875rem', { fontWeight: '700' }],
        h3: ['1.5rem', { fontWeight: '600' }],
        'body-lg': ['1.125rem', { fontWeight: '400' }],
        body: ['1rem', { fontWeight: '400' }],
        caption: ['0.875rem', { fontWeight: '400' }],
        button: ['1rem', { fontWeight: '500' }],
      },
      spacing: {
        xs: '0.25rem',
        sm: '0.5rem',
        md: '1rem',
        lg: '1.5rem',
        xl: '2rem',
        xxl: '3rem',
      },
      borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '16px',
        full: '9999px',
      },
      boxShadow: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      },
    },
  },
  plugins: [],
}

export default config