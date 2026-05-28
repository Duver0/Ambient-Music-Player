/**
 * Generate PNG icons from SVG sources for PWA manifest compatibility.
 *
 * Some Android browsers don't support SVG icons in the manifest,
 * so we generate PNG fallbacks at 192x192 and 512x512.
 *
 * Usage: bun run scripts/generate-icons.ts
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { resolve } from 'path'
import sharp from 'sharp'

const ICONS_DIR = resolve(__dirname, '../public/icons')

interface IconConfig {
  src: string
  sizes: [number, number]
}

const ICONS: IconConfig[] = [
  { src: 'icon-192.svg', sizes: [192, 192] },
  { src: 'icon-512.svg', sizes: [512, 512] },
  { src: 'icon-maskable.svg', sizes: [512, 512] },
]

/**
 * Strip <animate> and <animateTransform> tags from SVG,
 * since they break rendering in some contexts.
 */
function stripAnimations(svg: string): string {
  return svg
    .replace(/<animate[^>]*\/>/g, '')
    .replace(/<animateTransform[^>]*\/>/g, '')
    .replace(/<\/animate>/g, '')
    .replace(/<\/animateTransform>/g, '')
}

async function generateIcons(): Promise<void> {
  // Ensure output directory exists
  mkdirSync(ICONS_DIR, { recursive: true })

  for (const icon of ICONS) {
    const svgPath = resolve(ICONS_DIR, icon.src)
    const pngPath = resolve(ICONS_DIR, icon.src.replace('.svg', `.png`))
    const [width, height] = icon.sizes

    try {
      const svgContent = readFileSync(svgPath, 'utf-8')
      const cleanSvg = stripAnimations(svgContent)

      await sharp(Buffer.from(cleanSvg))
        .resize(width, height)
        .png()
        .toFile(pngPath)

      const kb = (await import('fs')).statSync(pngPath).size / 1024
      console.log(`✓ ${icon.src} → ${icon.sizes[0]}x${icon.sizes[1]} PNG (${kb.toFixed(1)} KB)`)
    } catch (err) {
      console.error(`✗ Failed to convert ${icon.src}:`, err)
    }
  }

  console.log('\nDone! PNG icons generated in public/icons/')
}

generateIcons().catch(console.error)
