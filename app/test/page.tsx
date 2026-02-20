'use client'

import { AntigravityVerceraLogo } from '@/components/antigravity-vercera-logo'
import Link from 'next/link'

export default function TestPage() {
  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center gap-12 p-8">
      <div className="text-center space-y-2">
        <h1 className="font-display text-3xl font-bold text-foreground">
          Antigravity Vercera Logo
        </h1>
        <p className="text-foreground/70 max-w-md">
          Hover over the circle — particles repel from the cursor like a magnet.
          Same idea as{' '}
          <a
            href="https://reactbits.dev/animations/antigravity"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline"
          >
            React Bits Antigravity
          </a>
          , with a Vercera ring + center text.
        </p>
      </div>

      <AntigravityVerceraLogo />

      <Link
        href="/"
        className="px-6 py-2 rounded-full bg-accent text-accent-foreground font-medium hover:bg-accent/90 transition-colors"
      >
        Back to Home
      </Link>
    </main>
  )
}
