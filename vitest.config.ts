import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    exclude: ['web/e2e/**', 'node_modules/**', 'web/node_modules/**'],
  },
});
