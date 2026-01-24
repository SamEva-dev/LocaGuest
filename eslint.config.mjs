import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import envDevPlugin from './tools/eslint-rules/no-environment-dev-import.mjs';

export default [
  {
    ignores: [
      'dist/**',
      'coverage/**',
      'node_modules/**',
      '.angular/**',
      '**/*.min.*',
      'src/app/core/sdk/**',
    ],
  },
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      'local-env': envDevPlugin,
    },
    rules: {
      'local-env/no-environment-dev-import': 'error',
    },
  },
];
