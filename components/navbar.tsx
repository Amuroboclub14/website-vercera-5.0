'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Floating Pill Navbar - logo and links inside */}
      <nav className="floating-nav w-[calc(100%-2rem)] max-w-5xl px-4 py-3 bg-card/80 border border-border/40 shadow-2xl z-50 transition-all duration-300 flex items-center justify-between gap-4">
        {/* Logo - inside nav */}
        <Link href="/" className="flex items-center gap-2 group shrink-0">
          <div className="w-9 h-9 bg-gradient-to-br from-accent to-primary rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-accent/50 transition-all">
            <span className="text-foreground font-display font-bold text-lg">V</span>
          </div>
          <span className="font-display font-bold text-xl text-foreground hidden sm:inline">Vercera</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex flex-1 items-center justify-end gap-1">
          <Link
            href="/"
            className="px-4 py-2 text-foreground/70 hover:text-accent hover:bg-secondary/50 rounded-full transition-all text-sm font-medium"
          >
            Home
          </Link>
          <Link
            href="/events"
            className="px-4 py-2 text-foreground/70 hover:text-accent hover:bg-secondary/50 rounded-full transition-all text-sm font-medium"
          >
            Events
          </Link>
          <Link
            href="/#schedule"
            className="px-4 py-2 text-foreground/70 hover:text-accent hover:bg-secondary/50 rounded-full transition-all text-sm font-medium"
          >
            Schedule
          </Link>
          <Link
            href="/#faq"
            className="px-4 py-2 text-foreground/70 hover:text-accent hover:bg-secondary/50 rounded-full transition-all text-sm font-medium"
          >
            FAQ
          </Link>

          <div className="w-px h-6 bg-border/40 mx-1"></div>

          <Link
            href="/login"
            className="px-4 py-2 text-foreground/70 hover:text-foreground rounded-full transition-all text-sm"
          >
            Login
          </Link>
          <Link
            href="/signup"
            className="px-5 py-2 bg-gradient-to-r from-accent to-primary text-accent-foreground rounded-full hover:shadow-lg hover:shadow-accent/30 transition-all text-sm font-medium"
          >
            Sign Up
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden p-2 hover:bg-secondary/50 rounded-full transition-colors"
        >
          {isOpen ? <X size={20} className="text-foreground" /> : <Menu size={20} className="text-foreground" />}
        </button>
      </nav>

      {/* Mobile Navigation Menu */}
      {isOpen && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-40 w-[calc(100%-2rem)] md:hidden">
          <div className="bg-card/95 backdrop-blur-md border border-border/40 rounded-2xl shadow-2xl p-4 space-y-2">
            <Link
              href="/"
              className="block px-4 py-2 text-foreground/70 hover:text-accent hover:bg-secondary/50 rounded-lg transition-all text-sm font-medium"
              onClick={() => setIsOpen(false)}
            >
              Home
            </Link>
            <Link
              href="/events"
              className="block px-4 py-2 text-foreground/70 hover:text-accent hover:bg-secondary/50 rounded-lg transition-all text-sm font-medium"
              onClick={() => setIsOpen(false)}
            >
              Events
            </Link>
            <Link
              href="/#schedule"
              className="block px-4 py-2 text-foreground/70 hover:text-accent hover:bg-secondary/50 rounded-lg transition-all text-sm font-medium"
              onClick={() => setIsOpen(false)}
            >
              Schedule
            </Link>
            <Link
              href="/#faq"
              className="block px-4 py-2 text-foreground/70 hover:text-accent hover:bg-secondary/50 rounded-lg transition-all text-sm font-medium"
              onClick={() => setIsOpen(false)}
            >
              FAQ
            </Link>
            <div className="h-px bg-border/40 my-2"></div>
            <Link
              href="/login"
              className="block px-4 py-2 text-foreground/70 hover:text-foreground rounded-lg transition-all text-sm"
              onClick={() => setIsOpen(false)}
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="block px-4 py-2 bg-gradient-to-r from-accent to-primary text-accent-foreground rounded-lg font-medium text-sm"
              onClick={() => setIsOpen(false)}
            >
              Sign Up
            </Link>
          </div>
        </div>
      )}
    </>
  )
}
