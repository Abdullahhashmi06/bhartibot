/**
 * InternIQ PWA icon generator
 * Rasterizes the brand SVGs in public/brand/ into every icon size the PWA
 * needs (favicons, app icons, maskable, monochrome, apple-touch) plus iOS
 * splash screens. Run with: node scripts/generate-icons.mjs
 */
import sharp from "sharp";
import { mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const brand = (f) => join(root, "public", "brand", f);
const out = (f) => join(root, "public", f);

const ICONS_DIR = join(root, "public", "icons");
const SPLASH_DIR = join(root, "public", "splash");

mkdirSync(ICONS_DIR, { recursive: true });
mkdirSync(SPLASH_DIR, { recursive: true });

// --- Standard app icons (rounded tile) ---
const standardSizes = [16, 32, 48, 64, 96, 128, 192, 256, 384, 512];
for (const size of standardSizes) {
  await sharp(brand("logo.svg"))
    .resize(size, size)
    .png()
    .toFile(join(ICONS_DIR, `icon-${size}.png`));
  console.log(`icon-${size}.png`);
}

// --- Maskable icons (full-bleed gradient, safe zone) ---
for (const size of [192, 512]) {
  await sharp(brand("logo-maskable.svg"))
    .resize(size, size)
    .png()
    .toFile(join(ICONS_DIR, `maskable-${size}.png`));
  console.log(`maskable-${size}.png`);
}

// --- Monochrome icons (Android themed icon) ---
for (const size of [192, 512]) {
  await sharp(brand("logo-monochrome.svg"))
    .resize(size, size)
    .png()
    .toFile(join(ICONS_DIR, `monochrome-${size}.png`));
  console.log(`monochrome-${size}.png`);
}

// --- Apple touch icon (180px, no transparency tolerated by iOS) ---
await sharp(brand("logo.svg")).resize(180, 180).png().toFile(out("apple-touch-icon.png"));
console.log("apple-touch-icon.png");

// --- favicon PNGs (modern browsers accept PNG favicons; no .ico needed) ---
for (const size of [16, 32, 64]) {
  await sharp(brand("logo.svg")).resize(size, size).png().toFile(out(`favicon-${size}.png`));
  console.log(`favicon-${size}.png`);
}

// --- iOS splash screens (portrait, gradient + logo centered) ---
const SPLASH_SIZES = [
  { width: 1290, height: 2796, name: "splash-1290x2796.png" }, // iPhone 14 Pro Max / 15 Pro Max
  { width: 1179, height: 2556, name: "splash-1179x2556.png" }, // iPhone 14 Pro / 15 Pro
  { width: 1170, height: 2532, name: "splash-1170x2532.png" }, // iPhone 13 / 14
  { width: 2048, height: 2732, name: "splash-2048x2732.png" }, // iPad Pro 11"
];

const logoPng = await sharp(brand("logo.svg")).resize(256, 256).png().toBuffer();

for (const { width, height, name } of SPLASH_SIZES) {
  // Vertical brand gradient background
  const bg = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#0E8A6D"/>
          <stop offset="100%" stop-color="#17C6B5"/>
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#g)"/>
    </svg>`
  );
  await sharp(bg)
    .composite([
      {
        input: logoPng,
        gravity: "center",
      },
    ])
    .png()
    .toFile(join(SPLASH_DIR, name));
  console.log(name);
}

console.log("Done.");
