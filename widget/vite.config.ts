import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';

// Виджет собирается в один IIFE-файл: подключение одним <script> на чужом сайте.
export default defineConfig({
  plugins: [preact()],
  build: {
    lib: {
      entry: 'src/main.tsx',
      name: 'Kvalify',
      formats: ['iife'],
      fileName: () => 'kvalify-widget.js',
    },
    target: 'es2019',
    minify: 'esbuild',
    outDir: 'dist',
  },
});
