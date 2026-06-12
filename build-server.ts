import * as esbuild from 'esbuild';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function build() {
  await esbuild.build({
    entryPoints: ['server.ts'],
    bundle: true,
    platform: 'node',
    format: 'esm',
    outfile: 'dist/server.js',
    external: ['express', 'vite', '@prisma/client', 'url', 'path'], // Keep these external to avoid giant bundle and issues
    banner: {
      js: "import { createRequire } from 'module'; const require = createRequire(import.meta.url);", // Compatibility for ESM
    },
  });
  console.log('Sensei! Server built successfully in dist/server.js');
}

build().catch((err) => {
  console.error('Build failed:', err);
  process.exit(1);
});
