'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { useAdmin } from '@/hooks/use-admin'
import {
  LayoutDashboard,
  ListChecks,
  Calendar,
  Receipt,
  QrCode,
  Users,
  LogOut,
  ShieldCheck,
  Menu,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const fullNav = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/registrations', label: 'Registrations', icon: ListChecks },
  { href: '/admin/events', label: 'Events', icon: Calendar },
  { href: '/admin/transactions', label: 'Transactions', icon: Receipt },
  { href: '/admin/scan', label: 'Ticket Scan', icon: QrCode },
  { href: '/admin/participants', label: 'Participants', icon: Users },
  { href: '/admin/admins', label: 'Manage admins', icon: ShieldCheck },
]
const scanOnlyNav = [{ href: '/admin/scan', label: 'Ticket Scan', icon: QrCode }]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useAuth()
  const { isAdmin, level, adminChecked, loading } = useAdmin()
  const isEventAdminOnly = level === 'event_admin'
  const nav = isEventAdminOnly ? scanOnlyNav : fullNav
  const redirectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    if (!adminChecked) return
    if (!user && !loading) {
      router.replace('/login?redirect=/admin')
      return
    }
    if (user && !loading && !isAdmin) {
      // Delay redirect slightly so we don't redirect on a brief stale state before check completes
      redirectTimeoutRef.current = setTimeout(() => {
        router.replace('/')
      }, 150)
      return () => {
        if (redirectTimeoutRef.current) {
          clearTimeout(redirectTimeoutRef.current)
          redirectTimeoutRef.current = null
        }
      }
    }
    // Cancel any pending redirect when we become admin
    if (redirectTimeoutRef.current) {
      clearTimeout(redirectTimeoutRef.current)
      redirectTimeoutRef.current = null
    }
    if (isAdmin && level === 'event_admin' && pathname !== '/admin/scan' && pathname.startsWith('/admin')) {
      router.replace('/admin/scan')
    }
  }, [adminChecked, isAdmin, level, loading, user, router, pathname])

  const handleSignOut = () => {
    router.push('/')
  }

  if (loading || !adminChecked) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground/70">Loading...</div>
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  const NavLinks = () => (
    <>
      {nav.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={() => setMenuOpen(false)}
          className={cn(
            'flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-colors min-h-[48px]',
            pathname === item.href
              ? 'bg-accent/20 text-accent'
              : 'text-foreground/70 hover:bg-secondary hover:text-foreground active:bg-secondary'
          )}
        >
          <item.icon className="h-5 w-5 shrink-0" />
          {item.label}
        </Link>
      ))}
      <Link
        href="/"
        onClick={() => {
          setMenuOpen(false)
          handleSignOut()
        }}
        className="flex items-center gap-3 px-4 py-3 rounded-lg text-base text-foreground/70 hover:bg-secondary hover:text-foreground active:bg-secondary min-h-[48px] mt-2 border-t border-border"
      >
        <LogOut className="h-5 w-5 shrink-0" />
        Back to site
      </Link>
    </>
  )

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row min-h-[100dvh]">
      {/* Mobile header */}
      <header className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 border-b border-border bg-card/50 backdrop-blur-sm safe-area-inset-top">
        <Link href="/admin" className="font-display font-bold text-lg text-foreground" onClick={() => setMenuOpen(false)}>
          Vercera Admin
        </Link>
        <button
          type="button"
          onClick={() => setMenuOpen((o) => !o)}
          className="p-2.5 rounded-lg hover:bg-secondary text-foreground touch-manipulation"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        >
          {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </header>

      {/* Mobile menu overlay */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden bg-black/50 backdrop-blur-sm"
          onClick={() => setMenuOpen(false)}
          aria-hidden
        />
      )}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full w-[min(280px,85vw)] max-w-full flex flex-col border-r border-border bg-card shadow-xl transition-transform duration-200 ease-out md:relative md:z-auto md:translate-x-0 md:shadow-none md:w-56',
          menuOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="p-4 border-b border-border flex items-center justify-between md:block">
          <Link href="/admin" className="font-display font-bold text-lg text-foreground" onClick={() => setMenuOpen(false)}>
            Vercera Admin
          </Link>
          <button
            type="button"
            className="md:hidden p-2 rounded-lg hover:bg-secondary text-foreground"
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          <NavLinks />
        </nav>
      </aside>

      <main className="flex-1 overflow-auto p-4 sm:p-6 md:p-8 pb-[env(safe-area-inset-bottom)] min-w-0">
        {children}
      </main>
    </div>
  )
}
