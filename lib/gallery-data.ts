/**
 * Gallery images for Vercera 3.0 and 4.0.
 * Replace these with your actual image URLs (e.g. from Firebase Storage or /images/gallery/).
 */

export type GalleryEdition = '3.0' | '4.0'

export interface GalleryImage {
  id: string
  vercera: GalleryEdition
  src: string
  alt?: string
}

// Placeholder images – replace with real Vercera 3.0 / 4.0 photo URLs
const PLACEHOLDER = (seed: string, w = 800, h = 600) =>
  `https://picsum.photos/seed/${seed}/${w}/${h}`

export const galleryImages: GalleryImage[] = [
  // Vercera 4.0
  { id: '40-1', vercera: '4.0', src: PLACEHOLDER('vercera40-1'), alt: 'Vercera 4.0' },
  { id: '40-2', vercera: '4.0', src: PLACEHOLDER('vercera40-2'), alt: 'Vercera 4.0' },
  { id: '40-3', vercera: '4.0', src: PLACEHOLDER('vercera40-3'), alt: 'Vercera 4.0' },
  { id: '40-4', vercera: '4.0', src: PLACEHOLDER('vercera40-4'), alt: 'Vercera 4.0' },
  { id: '40-5', vercera: '4.0', src: PLACEHOLDER('vercera40-5'), alt: 'Vercera 4.0' },
  { id: '40-6', vercera: '4.0', src: PLACEHOLDER('vercera40-6'), alt: 'Vercera 4.0' },
  // Vercera 3.0
  { id: '30-1', vercera: '3.0', src: PLACEHOLDER('vercera30-1'), alt: 'Vercera 3.0' },
  { id: '30-2', vercera: '3.0', src: PLACEHOLDER('vercera30-2'), alt: 'Vercera 3.0' },
  { id: '30-3', vercera: '3.0', src: PLACEHOLDER('vercera30-3'), alt: 'Vercera 3.0' },
  { id: '30-4', vercera: '3.0', src: PLACEHOLDER('vercera30-4'), alt: 'Vercera 3.0' },
  { id: '30-5', vercera: '3.0', src: PLACEHOLDER('vercera30-5'), alt: 'Vercera 3.0' },
  { id: '30-6', vercera: '3.0', src: PLACEHOLDER('vercera30-6'), alt: 'Vercera 3.0' },
]

/** Few images for the home page highlight (4.0 and 3.0). */
export const featuredGalleryImages: GalleryImage[] = [
  galleryImages[0], // 4.0
  galleryImages[1], // 4.0
  galleryImages[2], // 4.0
  galleryImages[6], // 3.0
  galleryImages[7], // 3.0
  galleryImages[8], // 3.0
]
