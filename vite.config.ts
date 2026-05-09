import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  root: '.',
  base: process.env.NODE_ENV === 'production' ? '/gerar-IR-de-renda-variavel/' : '/',
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          mui: ['@mui/material', '@mui/icons-material'],
        },
      },
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@adapters': path.resolve(__dirname, './src/infrastructure/adapters'),
      '@domain': path.resolve(__dirname, './src/core/domain'),
      '@ports': path.resolve(__dirname, './src/core/interfaces'),
      '@usecases': path.resolve(__dirname, './src/core/usecases'),
      '@utils': path.resolve(__dirname, './src/utils'),
    },
  },
});
