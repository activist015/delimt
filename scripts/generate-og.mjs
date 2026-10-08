import sharp from "sharp";
import { readFileSync } from "fs";

const svg = readFileSync("public/og.svg");

await sharp(Buffer.from(svg))
  .resize(1200, 630)
  .png()
  .toFile("public/og.png");

console.log("✅ og.png generated");