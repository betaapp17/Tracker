import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        taquinho: '#FFCC00',
        profit: '#30D158',
        expense: '#FF453A',
        warning: '#FF9F0A',
        // iOS-inspired neutrals
        ios: {
          bg: '#F5F5F7',
          surface: '#FFFFFF',
          primary: '#1C1C1E',
          secondary: '#8E8E93',
          tertiary: '#AEAEB2',
          border: '#E5E5EA',
          separator: '#C6C6C8',
          fill: '#F2F2F7',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
        '4xl': '32px',
      },
      boxShadow: {
        'card': '0 2px 12px rgba(0,0,0,0.06)',
        'card-lg': '0 4px 24px rgba(0,0,0,0.10)',
        'fab': '0 4px 24px rgba(0,0,0,0.20)',
        'sheet': '0 -4px 32px rgba(0,0,0,0.12)',
      },
      screens: {
        xs: '375px',
      },
    },
  },
  plugins: [],
}

export default config
