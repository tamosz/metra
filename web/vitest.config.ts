import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    exclude: ['e2e/**', 'node_modules/**'],
  },
  resolve: {
    alias: {
      '@metra/engine': resolve(__dirname, '../packages/engine/src/index.ts'),
      '@engine': resolve(__dirname, '../src'),
      '@data': resolve(__dirname, '../data'),
    },
  },
});
