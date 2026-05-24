import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ command, mode }) => {
    return {
      plugins: [react(), tailwindcss()],
      build: {
        outDir: 'dist',
        assetsDir: 'assets',
        emptyOutDir: true,
        chunkSizeWarningLimit: 1200,
        rollupOptions: {
          output: {
            manualChunks: {
              react: ['react', 'react-dom'],
              charts: ['recharts'],
              ui: ['lucide-react']
            }
          }
        }
      }
    };
});
