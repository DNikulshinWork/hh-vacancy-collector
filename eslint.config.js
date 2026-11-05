// Корневой flat-config для lint-staged (pre-commit). ESLint v9 применяет конфиг
// относительно CWD, а в монорепо flat-config живёт внутри каждого пакета.
// Здесь объединяем их через files-скоуп, чтобы `eslint --fix` из корня работал.
import nodeConfig from '@repo/eslint-config/node';
import nextConfig from '@repo/eslint-config/next';

const scope = (configs, files) => configs.map((config) => ({ ...config, files }));

export default [
  ...scope(nodeConfig, [
    'apps/api/**/*.ts',
    'apps/worker/**/*.ts',
    'packages/**/*.ts',
    'tooling/**/*.js',
  ]),
  ...scope(nextConfig, ['apps/web/**/*.{ts,tsx,js,mjs}']),
];
