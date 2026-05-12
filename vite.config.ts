import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
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

    const supabaseUrl = env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      console.log('\x1b[32m%s\x1b[0m', '✅ Supabase configuration detected during build.');
    } else {
      console.error('\x1b[31m%s\x1b[0m', '❌ CRITICAL ERROR: Supabase configuration NOT detected! Build will result in a white screen.');
      console.log('Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in settings or .env');
    }
    
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react(), tailwindcss()],
      build: {
        outDir: 'dist',
        emptyOutDir: true,
        target: 'es2020',
        sourcemap: false,
        minify: 'esbuild',
      },
      define: {
        'process.env.GEMINI_API_KEY': JSON.stringify(geminiKey),
        'process.env.API_KEY': JSON.stringify(geminiKey),
        'process.env.VITE_GEMINI_API_KEY': JSON.stringify(geminiKey),
        'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(geminiKey),
        'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(supabaseUrl || ''),
        'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(supabaseKey || '')
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
