'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { Menu, X } from 'lucide-react'

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const { user, signOut } = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    await signOut()
    setIsOpen(false)
    router.push('/')
  }

  return (
    <>
      {/* Floating Pill Navbar - logo and links inside */}
      <nav className="floating-nav relative w-[calc(100%-2rem)] max-w-3xl px-3 py-2.5 bg-card/80 border border-border/40 shadow-2xl z-50 transition-all duration-300 flex items-center justify-between gap-2">
        {/* Logo - inside nav */}
        <Link href="/" className="flex items-center gap-2 group shrink-0">
          <div className="w-9 h-9 bg-gradient-to-br from-accent to-primary rounded-[100%] flex items-center justify-center shadow-lg group-hover:shadow-accent/50 transition-all">
            <span className="text-foreground font-display font-bold text-lg">V</span>
          </div>
          <span className="font-display font-bold text-xl text-foreground hidden sm:inline">Vercera</span>
        </Link>

        {/* Desktop - centered links only (Home, Events, Schedule, FAQ) */}
        <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 items-center gap-0.5">
          <Link
            href="/"
            className="px-3 py-1.5 text-foreground/70 hover:text-accent hover:bg-secondary/50 rounded-full transition-all text-sm font-medium"
          >
            Home
          </Link>
          <Link
            href="/events"
            className="px-3 py-1.5 text-foreground/70 hover:text-accent hover:bg-secondary/50 rounded-full transition-all text-sm font-medium"
          >
            Events
          </Link>
          <Link
            href="/#schedule"
            className="px-3 py-1.5 text-foreground/70 hover:text-accent hover:bg-secondary/50 rounded-full transition-all text-sm font-medium"
          >
            Schedule
          </Link>
          <Link
            href="/#faq"
            className="px-3 py-1.5 text-foreground/70 hover:text-accent hover:bg-secondary/50 rounded-full transition-all text-sm font-medium"
          >
            FAQ
          </Link>
        </div>

        {/* Desktop - Login/Sign Up or Dashboard/Logout */}
        <div className="hidden md:flex items-center gap-0.5 shrink-0">
          {user ? (
            <>
              <Link href="/dashboard" className="px-3 py-1.5 text-foreground/70 hover:text-foreground rounded-full transition-all text-sm">
                Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="px-4 py-1.5 bg-gradient-to-r from-accent to-primary text-accent-foreground rounded-full hover:shadow-lg hover:shadow-accent/30 transition-all text-sm font-medium"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="px-3 py-1.5 text-foreground/70 hover:text-foreground rounded-full transition-all text-sm">
                Login
              </Link>
              <Link href="/signup" className="px-4 py-1.5 bg-gradient-to-r from-accent to-primary text-accent-foreground rounded-full hover:shadow-lg hover:shadow-accent/30 transition-all text-sm font-medium">
                Sign Up
              </Link>
            </>
          )}
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
            {user ? (
              <>
                <Link href="/dashboard" className="block px-4 py-2 text-foreground/70 hover:text-accent hover:bg-secondary/50 rounded-lg transition-all text-sm font-medium" onClick={() => setIsOpen(false)}>
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 bg-gradient-to-r from-accent to-primary text-accent-foreground rounded-lg font-medium text-sm"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="block px-4 py-2 text-foreground/70 hover:text-foreground rounded-lg transition-all text-sm" onClick={() => setIsOpen(false)}>
                  Login
                </Link>
                <Link href="/signup" className="block px-4 py-2 bg-gradient-to-r from-accent to-primary text-accent-foreground rounded-lg font-medium text-sm" onClick={() => setIsOpen(false)}>
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
