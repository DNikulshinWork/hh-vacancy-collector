import nextConfig from '@repo/eslint-config/next';

export default [
  ...nextConfig,
  {
    ignores: ['next-env.d.ts', '.next/**'],
  },
];