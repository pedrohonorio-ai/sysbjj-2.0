import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ command, mode }) => {
    const isBuild = command === 'build';
    return {
      base: '/',
      plugins: [react(), tailwindcss()],
      ...(isBuild ? {} : {
        server: {
          port: 3000,
          host: '0.0.0.0',
          strictPort: true,
          allowedHosts: true,
          hmr: false,
          watch: {
            usePolling: false,
          },
        },
      }),
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
            manualChunks: {
              react: ['react', 'react-dom', 'react-router-dom'],
              charts: ['recharts'],
              pdf: ['jspdf', 'jspdf-autotable']
            }
          }
        }
      }
    };
});
