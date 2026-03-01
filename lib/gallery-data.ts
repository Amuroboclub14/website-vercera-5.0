/**
 * Gallery images for Vercera 3.0 and 4.0.
 * After running `pnpm optimize-gallery`, images in gallery-source/vercera-40 and
 * gallery-source/vercera-30 are optimized and listed in lib/gallery-manifest.json.
 * This file uses that manifest so the gallery shows your images automatically.
 */

import manifest from './gallery-manifest.json'

export type GalleryEdition = '3.0' | '4.0'

export interface GalleryImage {
  id: string
  vercera: GalleryEdition
  src: string
  alt?: string
}

const LOCAL_IMG = (id: string) => `/images/gallery/${id}.webp`

const PLACEHOLDER = (seed: string, w = 800, h = 600) =>
  `https://picsum.photos/seed/${seed}/${w}/${h}`

function buildFromManifest(): GalleryImage[] {
  const list: GalleryImage[] = []
  for (const id of manifest['4.0']) {
    list.push({ id, vercera: '4.0', src: LOCAL_IMG(id), alt: 'Vercera 4.0' })
  }
  for (const id of manifest['3.0']) {
    list.push({ id, vercera: '3.0', src: LOCAL_IMG(id), alt: 'Vercera 3.0' })
  }
  return list
}

const PLACEHOLDER_IMAGES: GalleryImage[] = [
  { id: '40-1', vercera: '4.0', src: PLACEHOLDER('vercera40-1'), alt: 'Vercera 4.0' },
  { id: '40-2', vercera: '4.0', src: PLACEHOLDER('vercera40-2'), alt: 'Vercera 4.0' },
  { id: '40-3', vercera: '4.0', src: PLACEHOLDER('vercera40-3'), alt: 'Vercera 4.0' },
  { id: '30-1', vercera: '3.0', src: PLACEHOLDER('vercera30-1'), alt: 'Vercera 3.0' },
  { id: '30-2', vercera: '3.0', src: PLACEHOLDER('vercera30-2'), alt: 'Vercera 3.0' },
  { id: '30-3', vercera: '3.0', src: PLACEHOLDER('vercera30-3'), alt: 'Vercera 3.0' },
]

const fromManifest = buildFromManifest()
export const galleryImages: GalleryImage[] =
  fromManifest.length > 0 ? fromManifest : PLACEHOLDER_IMAGES

/** Few images for the home page highlight (4.0 and 3.0). */
export const featuredGalleryImages: GalleryImage[] = (() => {
  const v40 = galleryImages.filter((i) => i.vercera === '4.0')
  const v30 = galleryImages.filter((i) => i.vercera === '3.0')
  return [...v40.slice(0, 3), ...v30.slice(0, 3)]
})()
