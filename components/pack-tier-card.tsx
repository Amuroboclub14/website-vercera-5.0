'use client'

import Link from 'next/link'
import { Package, Check, BadgeCheck } from 'lucide-react'

export type PackTierBundle = {
  id: string
  name: string
  price: number
  originalPrice?: number
  description?: string
  perks?: string[]
  highlight?: boolean
}

interface PackTierCardProps {
  bundle: PackTierBundle
  purchased?: boolean
  href?: string
  onSelect?: () => void
}

export function PackTierCard({ bundle, purchased, href, onSelect }: PackTierCardProps) {
  const isHighlight = Boolean(bundle.highlight)
  const perks = bundle.perks ?? []

  return (
    <div
      className={`
        relative flex flex-col h-full w-full min-h-[420px] sm:min-h-[440px] rounded-2xl sm:rounded-3xl border-2 overflow-hidden
        transition-all duration-300 bg-card
        ${isHighlight
          ? 'border-accent shadow-xl shadow-accent/25 ring-2 ring-accent/30'
          : 'border-border hover:border-accent/30 hover:shadow-lg'
        }
      `}
    >
      {isHighlight && (
        <div className="flex-shrink-0 py-2.5 px-4 bg-foreground text-background text-center">
          <span className="text-xs font-bold tracking-widest uppercase">Most Popular</span>
        </div>
      )}

      <div className={`flex flex-col flex-1 p-6 sm:p-8 ${isHighlight ? 'bg-accent/5' : ''}`}>
        <div className="flex justify-center mb-5 sm:mb-6">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-accent/20 flex items-center justify-center">
            <Package className="h-8 w-8 sm:h-9 sm:w-9 text-accent" />
          </div>
        </div>

        <h3 className="font-display font-bold text-foreground text-center text-base sm:text-lg uppercase tracking-wide mb-2 line-clamp-2 leading-tight">
          {bundle.name}
        </h3>

        {bundle.description && (
          <p className="text-foreground/70 text-sm text-center mb-4 line-clamp-2">
            {bundle.description}
          </p>
        )}

        <div className="flex items-baseline justify-center gap-2 mb-6">
          <span className="font-bold text-accent text-2xl sm:text-3xl">
            ₹{bundle.price.toLocaleString('en-IN')}
          </span>
          {bundle.originalPrice != null && bundle.originalPrice > bundle.price && (
            <span className="text-foreground/50 line-through text-base">
              ₹{bundle.originalPrice.toLocaleString('en-IN')}
            </span>
          )}
        </div>

        {perks.length > 0 && (
          <ul className="space-y-3 mb-6 flex-1 min-h-0">
            {perks.slice(0, 5).map((perk, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm sm:text-base text-foreground/90">
                <Check className="h-4 w-4 sm:h-5 sm:w-5 text-accent flex-shrink-0 mt-0.5" strokeWidth={2.5} />
                <span>{perk}</span>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-auto pt-5 space-y-2">
          {purchased ? (
            <span className="inline-flex items-center justify-center gap-2 w-full px-4 py-3.5 rounded-xl bg-accent/20 text-accent font-semibold text-sm sm:text-base">
              <BadgeCheck className="h-4 w-4 sm:h-5 sm:w-5" /> Purchased
            </span>
          ) : href ? (
            <Link
              href={href}
              className={`
                block w-full text-center px-4 py-3.5 rounded-xl font-semibold text-sm sm:text-base transition-colors
                ${isHighlight
                  ? 'bg-accent text-accent-foreground hover:bg-accent/90'
                  : 'bg-background border-2 border-foreground/20 text-foreground hover:border-accent/50 hover:bg-accent/10'
                }
              `}
            >
              View pack & events →
            </Link>
          ) : onSelect ? (
            <button
              type="button"
              onClick={onSelect}
              className={`
                w-full px-4 py-3.5 rounded-xl font-semibold text-sm sm:text-base transition-colors
                ${isHighlight
                  ? 'bg-accent text-accent-foreground hover:bg-accent/90'
                  : 'bg-background border-2 border-foreground/20 text-foreground hover:border-accent/50 hover:bg-accent/10'
                }
              `}
            >
              View pack & events →
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
