import type { Config } from 'tailwindcss';
import { fontFamily } from 'tailwindcss/defaultTheme';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', '../../packages/ui/src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Noto Sans Thai"', ...fontFamily.sans],
      },
      colors: {
        primary: {
          DEFAULT: '#0EA5E9',
          foreground: '#FFFFFF',
        },
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
};

export default config;
