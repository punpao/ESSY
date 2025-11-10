import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './styles/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1D4ED8',
          foreground: '#ffffff'
        },
        success: '#16a34a',
        warning: '#f59e0b',
        danger: '#dc2626'
      },
      fontFamily: {
        sans: ['"Noto Sans Thai"', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: []
}

export default config
