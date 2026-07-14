import sharp from "sharp"
import { readFileSync } from "fs"

const svg = readFileSync("public/icon.svg")

const sizes = [
  { size: 192, name: "public/icon-192.png" },
  { size: 512, name: "public/icon-512.png" },
]

for (const { size, name } of sizes) {
  await sharp(svg, { density: 300 })
    .resize(size, size)
    .png()
    .toFile(name)
  console.log(`Generated ${name} (${size}x${size})`)
}

// Also generate apple-touch-icon and favicon
await sharp(svg, { density: 300 }).resize(180, 180).png().toFile("public/apple-touch-icon.png")
console.log("Generated public/apple-touch-icon.png (180x180)")
