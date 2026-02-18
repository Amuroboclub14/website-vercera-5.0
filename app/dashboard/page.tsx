'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/contexts/auth-context'
import { Navbar } from '@/components/animated-navbar'
import { Footer } from '@/components/footer'
import { LogOut, Edit2, Clock, CheckCircle, QrCode, Copy, Check } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { motion } from 'framer-motion'

interface Registration {
  id: string
  eventId: string
  eventName: string
  registrationDate: string
  status: 'registered' | 'paid' | 'completed'
  amount: number
  attended?: boolean
}

type TeamMember = {
  userId: string
  verceraId: string
  fullName: string
  email: string
  isLeader?: boolean
}

interface TeamDoc {
  id: string
  teamName: string | null
  verceraTeamId: string
  eventId: string
  eventName: string
  members: TeamMember[]
  size?: number
}

export default function DashboardPage() {
  const router = useRouter()
  const { user, profile, loading, signOut } = useAuth()
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [regsLoading, setRegsLoading] = useState(true)
  const [teams, setTeams] = useState<TeamDoc[]>([])
  const [teamsLoading, setTeamsLoading] = useState(true)
  const [copied, setCopied] = useState(false)

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
            id: doc.id,
            eventId: d.eventId,
            eventName: d.eventName || 'Event',
            registrationDate: d.registrationDate || '',
            status: d.status || 'registered',
            amount: d.amount || 0,
            attended: d.attended || false,
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

  useEffect(() => {
    if (!user) return
    const fetchTeams = async () => {
      try {
        const teamsRef = collection(db, 'teams')
        const q = query(teamsRef, where('memberIds', 'array-contains', user.uid))
        const snapshot = await getDocs(q)
        const list: TeamDoc[] = snapshot.docs.map((docSnap) => {
          const d = docSnap.data()
          return {
            id: docSnap.id,
            teamName: (d.teamName as string | null) ?? null,
            verceraTeamId: String(d.verceraTeamId ?? ''),
            eventId: String(d.eventId ?? ''),
            eventName: String(d.eventName ?? 'Event'),
            members: (d.members as TeamMember[]) ?? [],
            size: d.size as number | undefined,
          }
        })
        setTeams(list)
      } catch {
        setTeams([])
      } finally {
        setTeamsLoading(false)
      }
    }
    fetchTeams()
  }, [user])

  // Handle legacy users without verceraId (generate one if missing)
  useEffect(() => {
    const generateMissingVerceraId = async () => {
      if (user && profile && !profile.verceraId) {
        try {
          const response = await fetch('/api/user/generate-vercera-id', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.uid }),
          })

          if (response.ok) {
            // Reload page to show new ID
            window.location.reload()
          } else {
            const error = await response.json()
            console.error('Failed to generate Vercera ID:', error.error)
          }
        } catch (err) {
          console.error('Failed to generate Vercera ID:', err)
        }
      }
    }

    generateMissingVerceraId()
  }, [user, profile])

  const handleLogout = async () => {
    await signOut()
    router.push('/')
  }

  const copyVerceraId = () => {
    if (profile?.verceraId) {
      navigator.clipboard.writeText(profile.verceraId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const qrValue = profile?.verceraId || ''

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
            <div className="lg:col-span-1 space-y-6">
              {/* Profile Card */}
              <div className="bg-card border border-border rounded-xl p-6 space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-accent rounded-full mx-auto mb-4 flex items-center justify-center">
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

                {/* <div className="border-t border-border" /> */}
                {/* <button className="w-full px-6 py-2 bg-secondary text-foreground rounded-lg font-medium hover:bg-secondary/80 transition-colors flex items-center justify-center gap-2" disabled>
                  <Edit2 size={18} />
                  Edit Profile (coming soon)
                </button> */}
              </div>

              {/* Vercera ID & QR Code Card */}
              {profile.verceraId && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="bg-card border border-border rounded-xl p-6 space-y-6"
                >
                  <div className="text-center space-y-4">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <QrCode size={20} className="text-accent" />
                      <h3 className="font-display text-xl font-bold text-foreground">Vercera ID</h3>
                    </div>

                    {/* QR Code */}
                    <div className="flex justify-center p-4 bg-white rounded-lg border-2 border-accent/20">
                      <QRCodeSVG
                        value={qrValue}
                        size={180}
                        level="H"
                        includeMargin={false}
                        fgColor="#000000"
                        bgColor="#ffffff"
                      />
                    </div>

                    {/* Vercera ID Display */}
                    <div className="space-y-2">
                      <p className="text-foreground/60 text-sm">Your Unique ID</p>
                      <div className="flex items-center justify-center gap-2">
                        <code className="px-4 py-2 bg-secondary border border-border rounded-lg font-mono font-bold text-accent text-lg">
                          {profile.verceraId}
                        </code>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={copyVerceraId}
                          className="p-2 hover:bg-secondary rounded-lg transition-colors"
                          title="Copy Vercera ID"
                        >
                          {copied ? (
                            <Check size={18} className="text-accent" />
                          ) : (
                            <Copy size={18} className="text-foreground/60" />
                          )}
                        </motion.button>
                      </div>
                    </div>

                    <p className="text-foreground/60 text-xs">
                      Show this QR code at event check-ins for attendance
                    </p>
                  </div>
                </motion.div>
              )}
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
                              {reg.attended && (
                                <div className="flex items-center gap-2 text-accent">
                                  <CheckCircle size={16} />
                                  <span className="font-semibold">Attended</span>
                                </div>
                              )}
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

              {/* Your Teams */}
              {(teamsLoading || teams.length > 0) && (
                <div className="bg-card border border-border rounded-xl overflow-hidden">
                  <div className="p-6 border-b border-border">
                    <h2 className="font-display text-2xl font-bold text-foreground">Your Teams</h2>
                    <p className="text-foreground/60 text-sm mt-1">Teams you are part of for event registrations</p>
                  </div>
                  {teamsLoading ? (
                    <div className="p-6 text-center text-foreground/60">Loading teams...</div>
                  ) : teams.length > 0 ? (
                    <div className="divide-y divide-border">
                      {teams.map((team) => (
                        <div key={team.id} className="p-6 hover:bg-secondary/30 transition-colors">
                          <div className="flex flex-col sm:flex-row gap-6">
                            <div className="flex-1 space-y-3">
                              <div>
                                <h3 className="font-semibold text-foreground text-lg">{team.teamName || 'Unnamed Team'}</h3>
                                <p className="text-foreground/60 text-sm">{team.eventName}</p>
                              </div>
                              <div>
                                <p className="text-foreground/60 text-xs mb-1">Team ID</p>
                                <code className="text-accent font-mono text-sm">{team.verceraTeamId}</code>
                              </div>
                              <ul className="space-y-1.5 text-sm text-foreground/80">
                                {team.members.map((m) => (
                                  <li key={m.userId} className="flex items-center gap-2">
                                    <span>{m.fullName}</span>
                                    {m.isLeader && (
                                      <span className="px-2 py-0.5 bg-accent/20 text-accent text-xs font-medium rounded">Leader</span>
                                    )}
                                    <span className="text-foreground/50 text-xs">{m.verceraId}</span>
                                  </li>
                                ))}
                              </ul>
                              <Link
                                href={`/events/${team.eventId}`}
                                className="inline-block px-4 py-2 bg-secondary text-foreground rounded-lg text-sm font-medium hover:bg-secondary/80 transition-colors"
                              >
                                View Event
                              </Link>
                            </div>
                            <div className="flex flex-col items-center justify-center gap-2 sm:border-l sm:border-border sm:pl-6">
                              <p className="text-foreground/60 text-xs">Team QR</p>
                              <div className="bg-white rounded-lg p-2 border border-border">
                                <QRCodeSVG value={team.verceraTeamId} size={120} level="H" fgColor="#000000" bgColor="#ffffff" />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center text-foreground/60 text-sm">
                      You are not part of any team registrations yet.
                    </div>
                  )}
                </div>
              )}

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
