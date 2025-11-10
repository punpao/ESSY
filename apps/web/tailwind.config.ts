import type { Config } from 'tailwindcss';
import baseConfig from '../../packages/ui/tailwind.config.shared';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './features/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {}
  },
  plugins: baseConfig.plugins
};

export default config;
