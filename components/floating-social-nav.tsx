'use client'

import { Instagram, Linkedin, Globe } from 'lucide-react'

// Custom WhatsApp Icon Component
function WhatsAppIcon({ size = 18, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 22 23"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M16.6 14c-.2-.1-1.5-.7-1.7-.8c-.2-.1-.4-.1-.6.1c-.2.2-.6.8-.8 1c-.1.2-.3.2-.5.1c-.7-.3-1.4-.7-2-1.2c-.5-.5-1-1.1-1.4-1.7c-.1-.2 0-.4.1-.5c.1-.1.2-.3.4-.4c.1-.1.2-.3.2-.4c.1-.1.1-.3 0-.4c-.1-.1-.6-1.3-.8-1.8c-.1-.7-.3-.7-.5-.7h-.5c-.2 0-.5.2-.6.3c-.6.6-.9 1.3-.9 2.1c.1.9.4 1.8 1 2.6c1.1 1.6 2.5 2.9 4.2 3.7c.5.2.9.4 1.4.5c.5.2 1 .2 1.6.1c.7-.1 1.3-.6 1.7-1.2c.2-.4.2-.8.1-1.2l-.4-.2m2.5-9.1C15.2 1 8.9 1 5 4.9c-3.2 3.2-3.8 8.1-1.6 12L2 22l5.3-1.4c1.5.8 3.1 1.2 4.7 1.2c5.5 0 9.9-4.4 9.9-9.9c.1-2.6-1-5.1-2.8-7m-2.7 14c-1.3.8-2.8 1.3-4.4 1.3c-1.5 0-2.9-.4-4.2-1.1l-.3-.2l-3.1.8l.8-3l-.2-.3c-2.4-4-1.2-9 2.7-11.5S16.6 3.7 19 7.5c2.4 3.9 1.3 9-2.6 11.4" />
    </svg>
  )
}

const SOCIAL_LINKS = [
  { href: 'https://chat.whatsapp.com/FntN1V4Z8FUBeng03hZ1vg?mode=gi_t', label: 'WhatsApp Community', icon: WhatsAppIcon },
  { href: 'https://www.instagram.com/amuroboclub', label: 'Instagram', icon: Instagram },
  { href: 'https://www.linkedin.com/company/amuroboclub', label: 'LinkedIn', icon: Linkedin },
  { href: 'https://amuroboclub.com', label: 'AMURoboclub Website', icon: Globe },
]

export function FloatingSocialNav() {
  return (
    <nav
      className="fixed z-[101] flex items-center gap-1 px-2.5 py-2 bg-card/80 border border-border/40 shadow-2xl rounded-full backdrop-blur-md transition-all duration-300
        bottom-6 right-6
        md:bottom-6 md:right-6
        max-md:left-1/2 max-md:right-auto max-md:-translate-x-1/2 max-md:bottom-5"
      aria-label="Social links"
      style={{ isolation: 'isolate' }}
    >
      {SOCIAL_LINKS.map(({ href, label, icon: Icon }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 text-foreground/70 hover:text-accent hover:bg-secondary/50 rounded-full transition-colors"
          title={label}
        >
          <Icon size={18} aria-hidden />
        </a>
      ))}
    </nav>
  )
}
