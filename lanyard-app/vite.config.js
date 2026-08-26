import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/lanyard/',
  assetsInclude: ['**/*.glb'],
  build: {
    outDir: '../portfolio/lanyard',
    emptyOutDir: true
  }
});
