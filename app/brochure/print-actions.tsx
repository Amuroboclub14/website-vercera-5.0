'use client'

import { useCallback } from 'react'
import { Copy, Printer } from 'lucide-react'

export function BrochureActions() {
  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
    } catch {
      // ignore
    }
  }, [])

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => window.print()}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary hover:bg-secondary/80 border border-border text-foreground text-sm font-medium transition-colors"
      >
        <Printer className="h-4 w-4 text-accent" />
        Print / Save PDF
      </button>
      <button
        type="button"
        onClick={copyLink}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary hover:bg-secondary/80 border border-border text-foreground text-sm font-medium transition-colors"
      >
        <Copy className="h-4 w-4 text-accent" />
        Copy link
      </button>
    </div>
  )
}

