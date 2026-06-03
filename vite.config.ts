import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ command, mode }) => {
    const isBuild = command === 'build';
    return {
      base: '/',
      plugins: [
        react(), 
        tailwindcss(),
        VitePWA({
          registerType: 'autoUpdate',
          workbox: {
            globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
            cleanupOutdatedCaches: true,
            runtimeCaching: [
              {
                urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'google-fonts',
                  expiration: {
                    maxEntries: 10,
                    maxAgeSeconds: 60 * 60 * 24 * 365
                  },
                  cacheableResponse: {
                    statuses: [0, 200]
                  }
                }
              },
              {
                urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'assets-images',
                  expiration: {
                    maxEntries: 50,
                    maxAgeSeconds: 60 * 60 * 24 * 30
                  },
                  cacheableResponse: {
                    statuses: [0, 200]
                  }
                }
              },
              {
                urlPattern: /\.(?:js|css)$/i,
                handler: 'StaleWhileRevalidate',
                options: {
                  cacheName: 'code-assets',
                  expiration: {
                    maxEntries: 30,
                    maxAgeSeconds: 60 * 60 * 24 * 7
                  },
                  cacheableResponse: {
                    statuses: [0, 200]
                  }
                }
              }
            ]
          }
        })
      ],
      server: {
        port: 3000,
        host: '0.0.0.0',
        strictPort: true,
        allowedHosts: true,
        hmr: false,
        watch: {
          usePolling: false,
        },
        headers: {
          'Cache-Control': 'public, max-age=31536000, immutable'
        }
      },
      preview: {
        port: 3000,
        host: '0.0.0.0',
        strictPort: true,
        headers: {
          'Cache-Control': 'public, max-age=31536000, immutable'
        }
      },
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
