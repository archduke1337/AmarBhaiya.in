/**
 * One-time: converts root Public/ camera photos into optimized WebP assets
 * under apps/web/public/images/. Run: node tooling/scripts/optimize-gallery.mjs
 */
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";

const SRC = path.resolve("Public");
const OUT = path.resolve("apps/web/public/images");
fs.mkdirSync(OUT, { recursive: true });

// name -> max width (landscape crops width; portrait uses maxH)
const targets = [
  ["IMG_1321", 1800],
  ["IMG_1322", 2000], // panorama
  ["IMG_1323", 2000],
  ["IMG_1324", 2400], // widest pano -> hero
  ["IMG_1326", 2000],
  ["IMG_1547", 1600],
  ["IMG_1548", 1600],
  ["IMG_2118", 1400],
  ["IMG_2175", 1600],
  ["IMG_8616", 1800],
  ["IMG_9129", 1600],
  ["IMG_9130", 1600],
  ["IMG_9133", 1800],
];

for (const [name, width] of targets) {
  const candidates = [`${name}.JPG`, `${name}.jpg`, `${name}.jpeg`, `${name}.png`];
  const input = candidates.map((c) => path.join(SRC, c)).find((c) => fs.existsSync(c));
  if (!input) {
    console.log(`skip ${name} (not found)`);
    continue;
  }
  const out = path.join(OUT, `${name}.webp`);
  await sharp(input).rotate().resize({ width, withoutEnlargement: true }).webp({ quality: 78 }).toFile(out);
  const kb = Math.round(fs.statSync(out).size / 1024);
  console.log(`${name}.webp  ${kb} KB`);
}
console.log("done");
