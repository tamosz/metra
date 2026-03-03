import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';

export default defineConfig({
  base: '/metra/',
  plugins: [tailwindcss(), react()],
  resolve: {
    alias: {
      '@engine': resolve(__dirname, '../src'),
      '@data': resolve(__dirname, '../data'),
    },
  },
});
