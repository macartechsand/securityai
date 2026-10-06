import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    // In development the browser calls /api on the Vite origin and Vite forwards it to the
    // FastAPI backend, so no CORS setup and no API URL are needed locally.
    proxy: {
      '/api': 'http://localhost:8000',
    },
  },
});
