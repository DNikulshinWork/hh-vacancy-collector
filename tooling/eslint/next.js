import base from './base.js';

/** @type {import('eslint').Linter.Config[]} */
export default [
  ...base,
  {
    rules: {
      // next/core-web-vitals equivalents for flat config baseline
      'react-hooks/rules-of-hooks': 'off',
    },
  },
];
