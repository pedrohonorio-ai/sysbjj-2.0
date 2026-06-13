import fs from 'fs';
import path from 'path';
import https from 'https';

const fontsDir = path.join(process.cwd(), 'public/assets/fonts');
if (!fs.existsSync(fontsDir)) {
  fs.mkdirSync(fontsDir, { recursive: true });
}

const fonts = [
  { name: 'Inter-Regular.woff2', url: 'https://rsms.me/inter/font-files/Inter-Regular.woff2' },
  { name: 'Inter-Medium.woff2', url: 'https://rsms.me/inter/font-files/Inter-Medium.woff2' },
  { name: 'Inter-SemiBold.woff2', url: 'https://rsms.me/inter/font-files/Inter-SemiBold.woff2' },
  { name: 'Inter-Bold.woff2', url: 'https://rsms.me/inter/font-files/Inter-Bold.woff2' },
  { name: 'Inter-ExtraBold.woff2', url: 'https://rsms.me/inter/font-files/Inter-ExtraBold.woff2' }
];

console.log('🥋 [FONTS AUTONOMIC] Baixando fontes oficiais Inter para o Dojo...');

const download = (url, dest) => {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to get '${url}' (Status Code: ${response.statusCode})`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
};

for (const font of fonts) {
  const destPath = path.join(fontsDir, font.name);
  try {
    await download(font.url, destPath);
    console.log(`  ✅ ${font.name} salva com sucesso!`);
  } catch (error) {
    console.error(`  ❌ Falha no download de ${font.name}:`, error.message);
  }
}

console.log('🎉 Fontes integradas de forma offline-first no Dojo!');
