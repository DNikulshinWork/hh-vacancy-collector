import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import importPlugin from 'eslint-plugin-import';

/** @type {import('eslint').Linter.Config[]} */
export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: {
      import: importPlugin,
    },
    settings: {
      'import/resolver': {
        node: { extensions: [".js", ".jsx", ".ts", ".tsx"] },
      },
    },
    rules: {
      'no-console': 'off',
      'import/no-cycle': 'error',
      'import/no-restricted-paths': [
        'error',
        {
          zones: [
            // shared must not import features or services
            {
              target: '**/src/shared/**',
              from: '**/src/features/**',
              message: 'shared must not import from features (ED §15)',
            },
            {
              target: '**/src/shared/**',
              from: '**/src/services/**',
              message: 'shared must not import from services (ED §15)',
            },
            // services must not import features
            {
              target: '**/src/services/**',
              from: '**/src/features/**',
              message: 'services must not import from features (ED §15)',
            },
            // packages must not import apps
            {
              target: '**/packages/**',
              from: '**/apps/**',
              message: 'packages must not import from apps (ED §40)',
            },
          ],
        },
      ],
    },
  },
  {
    ignores: ['**/dist/**', '**/.next/**', '**/node_modules/**', '**/coverage/**'],
  },
];
