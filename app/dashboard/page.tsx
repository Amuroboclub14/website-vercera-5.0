'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/contexts/auth-context'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { LogOut, Edit2, Clock, CheckCircle } from 'lucide-react'

interface Registration {
  eventId: string
  eventName: string
  registrationDate: string
  status: 'registered' | 'paid' | 'completed'
  amount: number
}

export default function DashboardPage() {
  const router = useRouter()
  const { user, profile, loading, signOut } = useAuth()
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [regsLoading, setRegsLoading] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login?redirect=/dashboard')
      return
    }
  }, [user, loading, router])

  useEffect(() => {
    if (!user) return
    const fetchRegistrations = async () => {
      try {
        const regsRef = collection(db, 'registrations')
        const q = query(regsRef, where('userId', '==', user.uid))
        const snapshot = await getDocs(q)
        const regs: Registration[] = snapshot.docs.map((doc) => {
          const d = doc.data()
          return {
            eventId: d.eventId,
            eventName: d.eventName || 'Event',
            registrationDate: d.registrationDate || '',
            status: d.status || 'registered',
            amount: d.amount || 0,
          }
        })
        setRegistrations(regs)
      } catch {
        setRegistrations([])
      } finally {
        setRegsLoading(false)
      }
    }
    fetchRegistrations()
  }, [user])

  const handleLogout = async () => {
    await signOut()
    router.push('/')
  }

  if (loading || (!user && !loading)) {
    return (
      <main className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-32 pb-20 flex items-center justify-center">
          <p className="text-foreground/60">Loading...</p>
        </div>
        <Footer />
      </main>
    )
  }

  if (!profile) {
    return (
      <main className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-32 pb-20 flex items-center justify-center">
          <p className="text-foreground/60">Loading profile...</p>
        </div>
        <Footer />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-24 pb-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h1 className="font-display text-4xl font-bold text-foreground">My Dashboard</h1>
              <p className="text-foreground/70 mt-2">Welcome back, {profile.fullName}!</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-6 py-2 bg-destructive text-destructive-foreground rounded-lg font-medium hover:bg-destructive/90 transition-colors flex items-center gap-2"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <div className="bg-card border border-border rounded-xl p-6 space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-accent to-primary rounded-full mx-auto mb-4 flex items-center justify-center">
                    <span className="text-2xl font-bold text-accent-foreground">{profile.fullName.charAt(0).toUpperCase()}</span>
                  </div>
                  <h2 className="font-display text-2xl font-bold text-foreground">{profile.fullName}</h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-foreground/60 text-sm mb-1">Email</p>
                    <p className="font-semibold text-foreground break-all">{profile.email}</p>
                  </div>
                  <div>
                    <p className="text-foreground/60 text-sm mb-1">WhatsApp</p>
                    <p className="font-semibold text-foreground">{profile.whatsappNumber}</p>
                  </div>
                  <div>
                    <p className="text-foreground/60 text-sm mb-1">College</p>
                    <p className="font-semibold text-foreground">{profile.collegeName}</p>
                  </div>
                  <div>
                    <p className="text-foreground/60 text-sm mb-1">Course / Dept</p>
                    <p className="font-semibold text-foreground">{profile.courseOfStudy}, {profile.department}</p>
                  </div>
                </div>

                <div className="border-t border-border" />
                <button className="w-full px-6 py-2 bg-secondary text-foreground rounded-lg font-medium hover:bg-secondary/80 transition-colors flex items-center justify-center gap-2" disabled>
                  <Edit2 size={18} />
                  Edit Profile (coming soon)
                </button>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-card border border-border rounded-xl p-6">
                  <p className="text-foreground/60 text-sm mb-2">Total Registrations</p>
                  <p className="font-display text-3xl font-bold text-accent">{regsLoading ? '...' : registrations.length}</p>
                </div>
                <div className="bg-card border border-border rounded-xl p-6">
                  <p className="text-foreground/60 text-sm mb-2">Total Spent</p>
                  <p className="font-display text-3xl font-bold text-accent">
                    ₹{regsLoading ? '...' : registrations.reduce((sum, r) => sum + r.amount, 0)}
                  </p>
                </div>
              </div>

              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="p-6 border-b border-border">
                  <h2 className="font-display text-2xl font-bold text-foreground">My Registrations</h2>
                </div>

                {regsLoading ? (
                  <div className="p-6 text-center text-foreground/60">Loading registrations...</div>
                ) : registrations.length > 0 ? (
                  <div className="divide-y divide-border">
                    {registrations.map((reg, index) => (
                      <div key={index} className="p-6 hover:bg-secondary/50 transition-colors">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                          <div className="flex-1">
                            <h3 className="font-semibold text-foreground text-lg mb-2">{reg.eventName}</h3>
                            <div className="flex flex-wrap gap-4 text-sm text-foreground/60">
                              <div className="flex items-center gap-2">
                                <Clock size={16} />
                                {reg.registrationDate}
                              </div>
                              <div>
                                Status: <span className="text-accent font-semibold capitalize">{reg.status === 'paid' ? 'Payment Completed' : 'Registered'}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="text-foreground/60 text-sm">Amount Paid</p>
                              <p className="font-bold text-accent text-lg">₹{reg.amount}</p>
                            </div>
                            <div className="text-accent">{reg.status === 'paid' ? <CheckCircle size={20} /> : <Clock size={20} />}</div>
                          </div>
                        </div>
                        <div className="mt-4 flex gap-3">
                          <Link href={`/events/${reg.eventId}`} className="px-4 py-2 bg-secondary text-foreground rounded-lg text-sm font-medium hover:bg-secondary/80 transition-colors">
                            View Event
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center">
                    <p className="text-foreground/60 mb-6">You haven&apos;t registered for any events yet.</p>
                    <Link href="/events" className="inline-block px-6 py-2 bg-accent text-accent-foreground rounded-lg font-medium hover:bg-accent/90 transition-colors">
                      Browse Events
                    </Link>
                  </div>
                )}
              </div>

              <div className="bg-secondary/30 border border-border rounded-xl p-6">
                <h3 className="font-semibold text-foreground mb-3">Need Help?</h3>
                <p className="text-foreground/70 text-sm mb-4">For any queries about your registrations or payments, contact our support team.</p>
                <Link href="/contact" className="text-accent hover:text-accent/80 text-sm font-medium">Contact Support →</Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  )
}
