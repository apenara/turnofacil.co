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
          50: '#f0fdfa',
          100: '#ccfbf1',
          500: '#0D9488',
          600: '#0d7570',
          700: '#047857',
          DEFAULT: '#0D9488',
        },
        secondary: {
          50: '#fffbeb',
          100: '#fef3c7',
          500: '#F59E0B',
          600: '#d97706',
          700: '#B45309',
          DEFAULT: '#F59E0B',
        },
        // Colores semánticos unificados
        semantic: {
          success: '#10B981',
          warning: '#F59E0B',
          error: '#EF4444',
          info: '#3B82F6',
        },
        // Neutros unificados
        neutral: {
          'black': '#1F2937',
          'dark-gray': '#4B5563',
          'medium-gray': '#6B7280',
          'light-gray': '#9CA3AF',
          'off-white': '#F9FAFB',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config