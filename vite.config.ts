import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [tailwindcss(), ].filter((plugin) => plugin !== null),
  appType: 'spa',
  build: {
    outDir: 'dist',
    target: 'es2022',
    sourcemap: false,
  },
});
