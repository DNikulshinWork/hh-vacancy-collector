import path from 'node:path';
import type { Config } from 'tailwindcss';

const config: Config = {
  // Абсолютный путь к src — независимо от CWD (который в монорепо = корень).
  content: [path.join(__dirname, 'src', '**', '*.{ts,tsx}')],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;