'use client'

import { motion, AnimatePresence } from 'framer-motion'
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

  const navItems = [
    { href: '/', label: 'Home' },
    { href: '/events', label: 'Events' },
    { href: '/gallery', label: 'Gallery' },
    { href: '/#faq', label: 'FAQ' },
  ]

  return (
    <>
      {/* Floating Pill Navbar */}
      <div className="absolute top-4 left-0 right-0 z-50 flex justify-center px-4">
        <motion.nav
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="w-full max-w-4xl px-4 sm:px-6 lg:px-8 py-2.5 bg-card/80 backdrop-blur-md border border-border/40 shadow-2xl transition-all duration-300 flex items-center justify-between gap-2 sm:gap-4 rounded-full"
        >
          {/* Logo */}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link href="/" className="flex items-center gap-2 group shrink-0">
              <div className="w-18 h-9 flex items-center justify-center">
                <motion.img
                  src="/vercera_logo_full.png"
                  alt="Vercera"
                  className="w-full h-full object-contain"
                  transition={{ duration: 0.6 }}
                />
              </div>
              {/* <span className="font-display font-bold text-xl text-foreground hidden md:inline">Vercera</span> */}
            </Link>
          </motion.div>

          {/* Desktop - centered links */}
          <div className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 items-center gap-1">
            {navItems.map((item, index) => (
              <motion.div
                key={item.href}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link
                  href={item.href}
                  className="px-3 py-1.5 text-foreground/70 hover:text-accent hover:bg-secondary/50 rounded-full transition-all text-sm font-medium relative group"
                >
                  {item.label}
                  <motion.span
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent"
                    initial={{ scaleX: 0 }}
                    whileHover={{ scaleX: 1 }}
                    transition={{ duration: 0.2 }}
                  />
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Desktop - Login/Sign Up or Dashboard/Logout */}
          <div className="hidden lg:flex items-center gap-1 shrink-0">
            {user ? (
              <>
                <Link href="/dashboard" className="px-3 py-1.5 text-foreground/70 hover:text-foreground rounded-full transition-all text-sm">
                  Dashboard
                </Link>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleLogout}
                  className="px-4 py-1.5 bg-accent text-accent-foreground rounded-full hover:bg-accent/90 transition-all text-sm font-medium"
                >
                  Logout
                </motion.button>
              </>
            ) : (
              <>
                <Link href="/login" className="px-3 py-1.5 text-foreground/70 hover:text-foreground rounded-full transition-all text-sm">
                  Login
                </Link>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link href="/signup" className="px-4 py-1.5 bg-accent text-accent-foreground rounded-full hover:bg-accent/90 transition-all text-sm font-medium">
                    Sign Up
                  </Link>
                </motion.div>
              </>
            )}
          </div>

          {/* Mobile/Tablet Menu Button */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden p-2 hover:bg-secondary/50 rounded-full transition-colors"
          >
            <AnimatePresence mode="wait">
              {isOpen ? (
                <motion.div
                  key="close"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <X size={20} className="text-foreground" />
                </motion.div>
              ) : (
                <motion.div
                  key="menu"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Menu size={20} className="text-foreground" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </motion.nav>
      </div>

      {/* Mobile Navigation Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="fixed top-20 left-4 right-4 z-40 lg:hidden"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="bg-card/95 backdrop-blur-md border border-border/40 rounded-2xl shadow-2xl p-4 space-y-2 w-full"
            >
              {navItems.map((item, index) => (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link
                    href={item.href}
                    className="block px-4 py-2 text-foreground/70 hover:text-accent hover:bg-secondary/50 rounded-full transition-all text-sm font-medium"
                    onClick={() => setIsOpen(false)}
                  >
                    {item.label}
                  </Link>
                </motion.div>
              ))}
              <div className="h-px bg-border/40 my-2"></div>
              {user ? (
                <>
                  <Link
                    href="/dashboard"
                    className="block px-4 py-2 text-foreground/70 hover:text-accent hover:bg-secondary/50 rounded-full transition-all text-sm font-medium"
                    onClick={() => setIsOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 bg-accent text-accent-foreground rounded-full font-medium text-sm hover:bg-accent/90 transition-colors"
                  >
                    Logout
                  </motion.button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="block px-4 py-2 text-foreground/70 hover:text-foreground rounded-full transition-all text-sm"
                    onClick={() => setIsOpen(false)}
                  >
                    Login
                  </Link>
                  <motion.div whileTap={{ scale: 0.95 }}>
                    <Link
                      href="/signup"
                      className="block px-4 py-2 bg-accent text-accent-foreground rounded-full font-medium text-sm hover:bg-accent/90 transition-colors"
                      onClick={() => setIsOpen(false)}
                    >
                      Sign Up
                    </Link>
                  </motion.div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
