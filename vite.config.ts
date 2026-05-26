import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ command, mode }) => {
    return {
      base: '/',
      plugins: [react(), tailwindcss()],
      resolve: {
        alias: {
          'react': path.resolve(__dirname, 'node_modules/react'),
          'react-dom': path.resolve(__dirname, 'node_modules/react-dom')
        }
      },
      optimizeDeps: {
        include: ['react', 'react-dom']
      },
      build: {
        outDir: 'dist',
        assetsDir: 'assets',
        sourcemap: false,
        manifest: true,
        chunkSizeWarningLimit: 1200,
        rollupOptions: {
          output: {
            assetFileNames: 'assets/[name]-[hash][extname]',
            chunkFileNames: 'assets/[name]-[hash].js',
            entryFileNames: 'assets/[name]-[hash].js',
            manualChunks(id) {
              if (id.includes('node_modules')) {
                if (id.includes('react') || id.includes('react-dom') || id.includes('react-router') || id.includes('scheduler')) {
                  return 'react-core';
                }
                if (id.includes('recharts') || id.includes('d3')) {
                  return 'recharts';
                }
                if (id.includes('jspdf') || id.includes('jspdf-autotable')) {
                  return 'pdf';
                }
                if (id.includes('lucide-react')) {
                  return 'icons';
                }
                if (id.includes('motion') || id.includes('framer-motion')) {
                  return 'motion';
                }
                if (id.includes('@google/genai')) {
                  return 'gemini';
                }
                return 'vendor';
              }
            }
          }
        }
      }
    };
});
