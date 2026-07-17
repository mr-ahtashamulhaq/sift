// Run once: node scripts/gen-icons.mjs
// Requires: npm install sharp to-ico  (dev only)
import sharp from "sharp";
import toIco from "to-ico";
import { readFileSync, writeFileSync } from "fs";

const svg = readFileSync("public/icon.svg");

for (const size of [192, 512]) {
  await sharp(svg).resize(size, size).png().toFile(`public/icon-${size}.png`);
  console.log(`Generated icon-${size}.png`);
}

const favicon16 = await sharp(svg).resize(16, 16).png().toBuffer();
const favicon32 = await sharp(svg).resize(32, 32).png().toBuffer();
const favicon48 = await sharp(svg).resize(48, 48).png().toBuffer();

writeFileSync("public/favicon.ico", await toIco([favicon16, favicon32, favicon48]));
console.log("Generated favicon.ico");

await sharp(svg).resize(32, 32).png().toFile("public/favicon-32.png");
console.log("Generated favicon-32.png");
