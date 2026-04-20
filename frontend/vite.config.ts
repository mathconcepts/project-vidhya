import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/solutions': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/telegram': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React runtime
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // Animation
          'motion': ['framer-motion'],
          // Heavy client-side ML / parsing — lazy-loaded on demand
          'transformers': ['@xenova/transformers'],
          'pdf': ['pdfjs-dist', 'mammoth'],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
});
