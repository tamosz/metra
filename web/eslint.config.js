import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      // React hooks discipline — critical for correctness
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // Catch unused vars/imports
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],

      // Discourage `any` in UI code
      '@typescript-eslint/no-explicit-any': 'warn',

      // Ban @ts-ignore without explanation
      '@typescript-eslint/ban-ts-comment': [
        'error',
        { 'ts-ignore': 'allow-with-description' },
      ],

      // No var — always let/const
      'no-var': 'error',
      'prefer-const': 'error',

      // Prevent assignment in conditions
      'no-cond-assign': ['error', 'always'],

      // Prevent debugger statements
      'no-debugger': 'error',

      // Console is OK in web (dev tools), but warn to avoid shipping noise
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  {
    // Test files: relax rules
    files: ['**/*.test.{ts,tsx}'],
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    ignores: ['dist/', 'node_modules/', 'e2e/'],
  }
);
