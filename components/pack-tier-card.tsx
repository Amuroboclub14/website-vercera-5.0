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
  /** If set, CTA is a Link to this href. */
  href?: string
  /** If set (and no href), CTA is a button that calls this (e.g. open modal). */
  onSelect?: () => void
}

export function PackTierCard({ bundle, purchased, href, onSelect }: PackTierCardProps) {
  const isHighlight = Boolean(bundle.highlight)
  const perks = bundle.perks ?? []

  return (
    <div
      className={`
        relative flex flex-col rounded-2xl border bg-card text-left overflow-hidden
        transition-all duration-300
        ${isHighlight
          ? 'border-accent shadow-lg shadow-accent/20 scale-105 z-10 ring-2 ring-accent/50'
          : 'border-border hover:border-accent/50'
        }
        ${isHighlight ? 'min-w-[280px] max-w-[320px] p-7' : 'min-w-[240px] max-w-[280px] p-5'}
      `}
    >
      {isHighlight && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-accent" aria-hidden />
      )}
      <div className="flex items-center gap-3 mb-3">
        <div className={`rounded-xl bg-accent/20 flex items-center justify-center flex-shrink-0 ${isHighlight ? 'w-12 h-12' : 'w-10 h-10'}`}>
          <Package className={`text-accent ${isHighlight ? 'h-6 w-6' : 'h-5 w-5'}`} />
        </div>
        <h3 className={`font-display font-bold text-foreground ${isHighlight ? 'text-xl' : 'text-lg'}`}>
          {bundle.name}
        </h3>
      </div>
      <div className="flex items-baseline gap-2 mb-2">
        <span className={`font-bold text-accent ${isHighlight ? 'text-2xl' : 'text-xl'}`}>
          ₹{bundle.price.toLocaleString('en-IN')}
        </span>
        {bundle.originalPrice != null && bundle.originalPrice > bundle.price && (
          <span className="text-foreground/50 line-through text-sm">
            ₹{bundle.originalPrice.toLocaleString('en-IN')}
          </span>
        )}
      </div>
      {bundle.description && (
        <p className="text-foreground/70 text-sm mb-4 line-clamp-2">{bundle.description}</p>
      )}
      {perks.length > 0 && (
        <ul className="space-y-2 mb-5 flex-1">
          {perks.map((perk, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-foreground/90">
              <Check className="h-4 w-4 text-accent flex-shrink-0 mt-0.5" strokeWidth={2.5} />
              <span>{perk}</span>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-auto pt-2">
        {purchased ? (
          <span className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent/20 text-accent font-semibold text-sm w-full justify-center">
            <BadgeCheck className="h-4 w-4" /> Purchased
          </span>
        ) : href ? (
          <Link
            href={href}
            className="inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-accent text-accent-foreground font-semibold text-sm hover:bg-accent/90 transition-colors"
          >
            View pack & events →
          </Link>
        ) : onSelect ? (
          <button
            type="button"
            onClick={onSelect}
            className="inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-accent text-accent-foreground font-semibold text-sm hover:bg-accent/90 transition-colors"
          >
            View pack & events →
          </button>
        ) : null}
      </div>
    </div>
  )
}
