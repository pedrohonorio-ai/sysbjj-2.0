import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

console.log('🥋 Gerando ícones PWA...');

// create dir if not exists
const iconsDir = path.join(process.cwd(), 'public/icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Check if sharp is installed, install if not
try {
  await import('sharp');
} catch {
  console.log('Instalando sharp para geração de ícones...');
  execSync('npm install -D sharp', { stdio: 'inherit' });
}

const { default: sharp } = await import('sharp');

for (const size of sizes) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
    <rect width="${size}" height="${size}" fill="#1a1a2e"/>
    <text x="50%" y="54%" text-anchor="middle" font-size="${size * 0.4}">🥋</text>
    <text x="50%" y="82%" text-anchor="middle" fill="#ffffff" font-family="system-ui, sans-serif" font-weight="bold" font-size="${size * 0.12}">SYSBJJ</text>
  </svg>`;
  
  const svgPath = path.join(process.cwd(), 'temp-icon.svg');
  fs.writeFileSync(svgPath, svg);
  
  await sharp(svgPath)
    .png()
    .resize(size, size)
    .toFile(path.join(iconsDir, `icon-${size}x${size}.png`));
  
  fs.unlinkSync(svgPath);
  console.log(`✅ Icon ${size}x${size} gerado`);
}

console.log('🎉 Todos os ícones gerados com sucesso!');
