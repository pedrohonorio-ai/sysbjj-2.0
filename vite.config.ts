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
          includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
          manifest: false, // Usamos nosso manifesto manual
          workbox: {
            globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,webmanifest}'],
            cleanupOutdatedCaches: true,
            runtimeCaching: [
              {
                urlPattern: /\/api\/.*/i,
                handler: 'NetworkFirst',
                options: {
                  cacheName: 'api-cache',
                  expiration: {
                    maxEntries: 50,
                    maxAgeSeconds: 60 * 60 * 24 // 24 horas
                  },
                  cacheableResponse: {
                    statuses: [0, 200]
                  }
                }
              },
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
                  cacheName: 'image-cache',
                  expiration: {
                    maxEntries: 100,
                    maxAgeSeconds: 60 * 60 * 24 * 30 // 30 dias
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
                  cacheName: 'static-resources',
                  expiration: {
                    maxEntries: 50,
                    maxAgeSeconds: 60 * 60 * 24 * 7 // 7 dias
                  },
                  cacheableResponse: {
                    statuses: [0, 200]
                  }
                }
              }
            ]
          },
          devOptions: {
            enabled: false,
            type: 'module'
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
