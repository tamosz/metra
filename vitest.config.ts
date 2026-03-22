import { defineConfig } from 'vitest/config';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@metra/engine': resolve(__dirname, 'packages/engine/src/index.ts'),
    },
  },
  test: {
    globals: true,
    exclude: ['web/**', 'node_modules/**', '.claude/**', '.worktrees/**'],
  },
});
