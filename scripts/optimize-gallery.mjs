#!/usr/bin/env node
/**
 * Optimize gallery images: resize and compress for web.
 * Put originals in gallery-source/vercera-40/ and gallery-source/vercera-30/
 * (any filenames). Run: node scripts/optimize-gallery.mjs
 * Output: public/images/gallery/40-1.webp, 40-2.webp, ..., 30-1.webp, 30-2.webp, ...
 * Also writes lib/gallery-manifest.json so the gallery shows all images.
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const SOURCE_BASE = path.join(ROOT, 'gallery-source')
const OUT_DIR = path.join(ROOT, 'public', 'images', 'gallery')
const MANIFEST_PATH = path.join(ROOT, 'lib', 'gallery-manifest.json')

const FOLDERS = [
  { dir: 'vercera-40', prefix: '40', edition: '4.0' },
  { dir: 'vercera-30', prefix: '30', edition: '3.0' },
]

const MAX_WIDTH = 1600
const WEBP_QUALITY = 82
const IMAGE_EXT = /\.(jpg|jpeg|png|webp)$/i

async function main() {
  let sharp
  try {
    sharp = (await import('sharp')).default
  } catch {
    console.error('Install sharp first: pnpm add -D sharp (or npm install -D sharp --legacy-peer-deps)')
    process.exit(1)
  }

  if (!fs.existsSync(SOURCE_BASE)) {
    fs.mkdirSync(path.join(SOURCE_BASE, 'vercera-40'), { recursive: true })
    fs.mkdirSync(path.join(SOURCE_BASE, 'vercera-30'), { recursive: true })
    console.log('Created gallery-source/vercera-40 and gallery-source/vercera-30 — add images and run again.')
    return
  }

  fs.mkdirSync(OUT_DIR, { recursive: true })

  const manifest = { '4.0': [], '3.0': [] }
  let total = 0

  for (const { dir, prefix, edition } of FOLDERS) {
    const sourceDir = path.join(SOURCE_BASE, dir)
    if (!fs.existsSync(sourceDir)) {
      console.log(`Skipping ${dir} (folder not found).`)
      continue
    }

    const files = fs
      .readdirSync(sourceDir)
      .filter((f) => IMAGE_EXT.test(f))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))

    if (files.length === 0) {
      console.log(`No images in gallery-source/${dir}/.`)
      continue
    }

    console.log(`\n${dir}/ (${files.length} images)`)
    for (let i = 0; i < files.length; i++) {
      const id = `${prefix}-${i + 1}`
      const inPath = path.join(sourceDir, files[i])
      const outPath = path.join(OUT_DIR, `${id}.webp`)
      const stat = fs.statSync(inPath)
      const sizeMB = (stat.size / 1024 / 1024).toFixed(2)

      await sharp(inPath)
        .resize(MAX_WIDTH, null, { withoutEnlargement: true })
        .webp({ quality: WEBP_QUALITY })
        .toFile(outPath)

      const outStat = fs.statSync(outPath)
      const outKB = (outStat.size / 1024).toFixed(0)
      console.log(`  ${files[i]} (${sizeMB} MB) → ${id}.webp (${outKB} KB)`)
      manifest[edition].push(id)
      total++
    }
  }

  if (total === 0) {
    console.log('No images found in gallery-source/vercera-40 or gallery-source/vercera-30.')
    return
  }

  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'utf8')
  console.log(`\nDone. Optimized ${total} images → public/images/gallery/`)
  console.log('Updated lib/gallery-manifest.json — gallery will use these images.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
