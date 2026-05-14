import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import pngToIco from 'png-to-ico';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SOURCE = join(ROOT, 'build', 'icon-source.png');
const BUILD_DIR = join(ROOT, 'build');
const RES_DIR = join(ROOT, 'resources');
const PUBLIC_DIR = join(ROOT, 'src', 'renderer', 'public');

if (!existsSync(SOURCE)) {
  console.error(`Source icon not found: ${SOURCE}`);
  console.error('Please save the logo PNG at build/icon-source.png (>= 512x512 recommended).');
  process.exit(1);
}

mkdirSync(BUILD_DIR, { recursive: true });
mkdirSync(RES_DIR, { recursive: true });
mkdirSync(PUBLIC_DIR, { recursive: true });

const SIZES = [16, 24, 32, 48, 64, 128, 256];

const buffers = await Promise.all(
  SIZES.map((s) => sharp(SOURCE).resize(s, s).png().toBuffer())
);

const ico = await pngToIco(buffers);
writeFileSync(join(BUILD_DIR, 'icon.ico'), ico);

await sharp(SOURCE).resize(256, 256).png().toFile(join(BUILD_DIR, 'icon.png'));
await sharp(SOURCE).resize(512, 512).png().toFile(join(RES_DIR, 'icon.png'));
await sharp(SOURCE).resize(512, 512).png().toFile(join(PUBLIC_DIR, 'icon.png'));
await sharp(SOURCE).resize(64, 64).png().toFile(join(PUBLIC_DIR, 'icon-64.png'));
await sharp(SOURCE).resize(32, 32).png().toFile(join(PUBLIC_DIR, 'favicon-32.png'));
await sharp(SOURCE).resize(16, 16).png().toFile(join(PUBLIC_DIR, 'favicon-16.png'));

console.log('Icon assets generated:');
console.log('  build/icon.ico              (Windows installer + exe)');
console.log('  build/icon.png              (electron-builder fallback)');
console.log('  resources/icon.png          (512x512, packaged)');
console.log('  src/renderer/public/icon.png       (UI use)');
console.log('  src/renderer/public/icon-64.png    (titlebar)');
console.log('  src/renderer/public/favicon-32.png (favicon)');
console.log('  src/renderer/public/favicon-16.png (favicon)');
