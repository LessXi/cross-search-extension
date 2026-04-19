import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'popup.html'),
        float: resolve(__dirname, 'float.html'),
        background: resolve(__dirname, 'background.ts'),
      },
      output: {
        entryFileNames: '[name].js',
      },
    },
  },
});
