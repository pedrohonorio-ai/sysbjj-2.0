import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ command, mode }) => {
    const env = loadEnv(mode, '.', '');
    const geminiKey = env.GEMINI_API_KEY || 
                    env.API_KEY || 
                    env.VITE_GEMINI_API_KEY || 
                    process.env.GEMINI_API_KEY || 
                    process.env.API_KEY || 
                    process.env.VITE_GEMINI_API_KEY || 
                    '';
    
    if (!geminiKey) {
      console.warn('\x1b[33m%s\x1b[0m', '⚠️ Warning: GEMINI_API_KEY is not defined in the environment. AI features will be disabled in the build.');
    } else {
      console.log('\x1b[32m%s\x1b[0m', '✅ GEMINI_API_KEY detected and injected into the build.');
    }

    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        hmr: command === 'serve'
      },
      plugins: [react(), tailwindcss()],
      build: {
        outDir: 'dist',
        emptyOutDir: true,
        target: 'es2020',
        sourcemap: false,
        minify: 'esbuild',
        chunkSizeWarningLimit: 1000,
        rollupOptions: {
          output: {
            manualChunks: {
              'vendor-react': ['react', 'react-dom', 'react-router-dom'],
              'vendor-ui': ['lucide-react', 'motion/react', 'recharts'],
              'vendor-utils': ['jspdf', 'date-fns'],
            }
          }
        }
      },
      define: {
        'process.env.GEMINI_API_KEY': JSON.stringify(geminiKey),
        'process.env.API_KEY': JSON.stringify(geminiKey),
        'process.env.VITE_GEMINI_API_KEY': JSON.stringify(geminiKey),
        'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(geminiKey)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
