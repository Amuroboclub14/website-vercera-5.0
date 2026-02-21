'use client'

import { useEffect, useRef } from 'react'
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

  return (
    <div className="min-h-screen bg-background flex">
      <aside className="w-56 border-r border-border bg-card/30 flex flex-col">
        <div className="p-4 border-b border-border">
          <Link href="/admin" className="font-display font-bold text-lg text-foreground">
            Vercera Admin
          </Link>
        </div>
        <nav className="flex-1 p-2 space-y-0.5">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                pathname === item.href
                  ? 'bg-accent/20 text-accent'
                  : 'text-foreground/70 hover:bg-secondary hover:text-foreground'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-2 border-t border-border">
          <Link
            href="/"
            onClick={handleSignOut}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-foreground/70 hover:bg-secondary hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            Back to site
          </Link>
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-6 md:p-8">
        {children}
      </main>
    </div>
  )
}
