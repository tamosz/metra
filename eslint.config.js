import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.ts', 'scripts/**/*.ts'],
    rules: {
      // Prevent leftover debug logging in engine code
      'no-console': ['error', { allow: ['warn', 'error'] }],

      // Catch common agentic mistakes: unused vars/imports
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],

      // Discourage `any` — forces explicit typing
      '@typescript-eslint/no-explicit-any': 'warn',

      // Prevent accidental floating promises (missed awaits)
      '@typescript-eslint/no-floating-promises': 'off',

      // Ban @ts-ignore without explanation
      '@typescript-eslint/ban-ts-comment': [
        'error',
        { 'ts-ignore': 'allow-with-description' },
      ],

      // Ensure consistent return types on exported functions
      '@typescript-eslint/explicit-module-boundary-types': 'off',

      // No var — always let/const
      'no-var': 'error',
      'prefer-const': 'error',

      // Prevent unreachable code
      'no-unreachable': 'error',

      // Prevent duplicate case labels
      'no-duplicate-case': 'error',

      // Prevent assignment in conditions (common AI coding mistake)
      'no-cond-assign': ['error', 'always'],

      // Prevent debugger statements
      'no-debugger': 'error',
    },
  },
  {
    // CLI entry points and scripts are allowed to use console.log
    files: ['src/cli.ts', 'scripts/**/*.ts'],
    rules: {
      'no-console': 'off',
    },
  },
  {
    // Test files: relax rules that conflict with test patterns
    files: ['**/*.test.ts'],
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    ignores: ['dist/', 'node_modules/', 'web/', '.worktrees/', '.claude/'],
  }
);
