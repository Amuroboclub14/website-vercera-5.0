'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { doc, setDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { generateVerceraId } from '@/lib/vercera-id'
import { verifyAMURoboclubMember } from '@/lib/verification'
import { Navbar } from '@/components/animated-navbar'
import { Footer } from '@/components/footer'
import { Eye, EyeOff } from 'lucide-react'

const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year']
const HEARD_ABOUT_OPTIONS = ['WhatsApp', 'Instagram', 'Friend', 'Posters', 'Others']

export default function SignupPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    fullName: '',
    whatsappNumber: '',
    facultyNumber: '',
    enrollmentNumber: '',
    courseOfStudy: '',
    department: '',
    yearOfStudy: '',
    heardAbout: '',
    collegeName: '',
    isAMURoboclubMember: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [agreeTerms, setAgreeTerms] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    const facultyNo = formData.facultyNumber.trim() || 'N/A'
    const enrollNo = formData.enrollmentNumber.trim() || 'N/A'

    if (!formData.fullName || !formData.whatsappNumber || !formData.courseOfStudy || !formData.department || !formData.yearOfStudy || !formData.heardAbout || !formData.collegeName || !formData.isAMURoboclubMember || !formData.email || !formData.password) {
      setError('Please fill in all required fields')
      setIsLoading(false)
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      setIsLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      setIsLoading(false)
      return
    }

    if (!agreeTerms) {
      setError('Please agree to the terms and conditions')
      setIsLoading(false)
      return
    }

    if (formData.isAMURoboclubMember === 'yes') {
      if (!facultyNo || facultyNo === 'N/A' || !enrollNo || enrollNo === 'N/A') {
        setError('Faculty number and Enrollment number are required for AMURoboclub members')
        setIsLoading(false)
        return
      }
      setError('Verifying AMURoboclub membership...')
      const result = await verifyAMURoboclubMember({
        enrollmentNumber: enrollNo,
        facultyNumber: facultyNo,
        mobile: formData.whatsappNumber.trim(),
        email: formData.email.trim().toLowerCase(),
      })
      if (!result.verified) {
        setError(result.error || 'Membership verification failed')
        setIsLoading(false)
        return
      }
    }

    try {
      // Generate unique Vercera ID
      let verceraId = generateVerceraId()
      let isUnique = false
      let attempts = 0
      const maxAttempts = 10

      // Ensure Vercera ID is unique
      while (!isUnique && attempts < maxAttempts) {
        const checkQuery = query(collection(db, 'vercera_5_participants'), where('verceraId', '==', verceraId))
        const snapshot = await getDocs(checkQuery)
        if (snapshot.empty) {
          isUnique = true
        } else {
          verceraId = generateVerceraId()
          attempts++
        }
      }

      if (!isUnique) {
        setError('Failed to generate unique ID. Please try again.')
        setIsLoading(false)
        return
      }

      const userCredential = await createUserWithEmailAndPassword(auth, formData.email.trim(), formData.password)
      const user = userCredential.user

      const profile = {
        uid: user.uid,
        email: formData.email.trim().toLowerCase(),
        fullName: formData.fullName.trim(),
        verceraId,
        whatsappNumber: formData.whatsappNumber.trim(),
        facultyNumber: facultyNo,
        enrollmentNumber: enrollNo,
        courseOfStudy: formData.courseOfStudy.trim(),
        department: formData.department.trim(),
        yearOfStudy: formData.yearOfStudy,
        heardAbout: formData.heardAbout,
        collegeName: formData.collegeName.trim(),
        isAMURoboclubMember: formData.isAMURoboclubMember === 'yes',
        createdAt: new Date().toISOString(),
      }

      await setDoc(doc(db, 'vercera_5_participants', user.uid), profile)
      router.push('/dashboard')
    } catch (err: unknown) {
      const code = err && typeof err === 'object' && 'code' in err ? (err as { code: string }).code : ''
      if (code === 'auth/email-already-in-use') {
        setError('An account with this email already exists. Please sign in.')
      } else if (code === 'auth/invalid-email') {
        setError('Please enter a valid email address.')
      } else if (code === 'auth/weak-password') {
        setError('Password is too weak. Use at least 6 characters.')
      } else {
        setError('Registration failed. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const isMember = formData.isAMURoboclubMember === 'yes'

  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-32 pb-20 flex items-center justify-center">
        <div className="w-full max-w-lg mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="font-display text-4xl font-bold text-foreground mb-2">Join Vercera</h1>
            <p className="text-foreground/70">Create your account to register for events</p>
          </div>

          <div className="bg-card border border-border rounded-xl p-8 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-destructive/20 border border-destructive rounded-lg p-3 text-destructive text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="fullName" className="block text-sm font-medium text-foreground">Full Name *</label>
                <input type="text" id="fullName" name="fullName" value={formData.fullName} onChange={handleChange} placeholder="John Doe" className="w-full px-4 py-3 bg-secondary border border-border rounded-lg text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-accent" disabled={isLoading} required />
              </div>

              <div className="space-y-2">
                <label htmlFor="whatsappNumber" className="block text-sm font-medium text-foreground">WhatsApp Number *</label>
                <input type="tel" id="whatsappNumber" name="whatsappNumber" value={formData.whatsappNumber} onChange={handleChange} placeholder="+91 98765 43210" className="w-full px-4 py-3 bg-secondary border border-border rounded-lg text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-accent" disabled={isLoading} required />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="facultyNumber" className="block text-sm font-medium text-foreground">Faculty No</label>
                  <input type="text" id="facultyNumber" name="facultyNumber" value={formData.facultyNumber} onChange={handleChange} placeholder="N/A if not" className="w-full px-4 py-3 bg-secondary border border-border rounded-lg text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-accent" disabled={isLoading} />
                </div>
                <div className="space-y-2">
                  <label htmlFor="enrollmentNumber" className="block text-sm font-medium text-foreground">Enrollment No</label>
                  <input type="text" id="enrollmentNumber" name="enrollmentNumber" value={formData.enrollmentNumber} onChange={handleChange} placeholder="N/A if not" className="w-full px-4 py-3 bg-secondary border border-border rounded-lg text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-accent" disabled={isLoading} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="courseOfStudy" className="block text-sm font-medium text-foreground">Course of Study *</label>
                  <input type="text" id="courseOfStudy" name="courseOfStudy" value={formData.courseOfStudy} onChange={handleChange} placeholder="e.g. B.Tech, B.Sc" className="w-full px-4 py-3 bg-secondary border border-border rounded-lg text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-accent" disabled={isLoading} required />
                </div>
                <div className="space-y-2">
                  <label htmlFor="department" className="block text-sm font-medium text-foreground">Department *</label>
                  <input type="text" id="department" name="department" value={formData.department} onChange={handleChange} placeholder="e.g. CSE, ECE" className="w-full px-4 py-3 bg-secondary border border-border rounded-lg text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-accent" disabled={isLoading} required />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="yearOfStudy" className="block text-sm font-medium text-foreground">Year of Study *</label>
                <select id="yearOfStudy" name="yearOfStudy" value={formData.yearOfStudy} onChange={handleChange} className="w-full px-4 py-3 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-accent" disabled={isLoading} required>
                  <option value="">Select year</option>
                  {YEARS.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="heardAbout" className="block text-sm font-medium text-foreground">Where did you hear about Vercera? *</label>
                <select id="heardAbout" name="heardAbout" value={formData.heardAbout} onChange={handleChange} className="w-full px-4 py-3 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-accent" disabled={isLoading} required>
                  <option value="">Select option</option>
                  {HEARD_ABOUT_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="collegeName" className="block text-sm font-medium text-foreground">University/College Name *</label>
                <input type="text" id="collegeName" name="collegeName" value={formData.collegeName} onChange={handleChange} placeholder="Your College" className="w-full px-4 py-3 bg-secondary border border-border rounded-lg text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-accent" disabled={isLoading} required />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground">Are you an AMURoboclub member? *</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="isAMURoboclubMember" value="yes" checked={formData.isAMURoboclubMember === 'yes'} onChange={handleChange} disabled={isLoading} className="accent-accent" />
                    <span className="text-foreground">Yes</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="isAMURoboclubMember" value="no" checked={formData.isAMURoboclubMember === 'no'} onChange={handleChange} disabled={isLoading} className="accent-accent" />
                    <span className="text-foreground">No</span>
                  </label>
                </div>
                {isMember && (
                  <p className="text-xs text-foreground/60 mt-2">Enter same email, WhatsApp number, faculty no, and enrollment no you used for purchasing the membership.</p>
                )}
              </div>

              <div className="border-t border-border pt-4 space-y-4">
                <div className="space-y-2">
                  <label htmlFor="email" className="block text-sm font-medium text-foreground">Email Address *</label>
                  <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} placeholder="you@example.com" className="w-full px-4 py-3 bg-secondary border border-border rounded-lg text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-accent" disabled={isLoading} required />
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="block text-sm font-medium text-foreground">Password *</label>
                  <div className="relative">
                    <input type={showPassword ? 'text' : 'password'} id="password" name="password" value={formData.password} onChange={handleChange} placeholder="••••••••" className="w-full px-4 py-3 bg-secondary border border-border rounded-lg text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-accent pr-10" disabled={isLoading} required minLength={6} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground/60">
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground">Confirm Password *</label>
                  <div className="relative">
                    <input type={showConfirmPassword ? 'text' : 'password'} id="confirmPassword" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="••••••••" className="w-full px-4 py-3 bg-secondary border border-border rounded-lg text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-accent pr-10" disabled={isLoading} required />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground/60">
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2 pt-2">
                <input type="checkbox" id="terms" checked={agreeTerms} onChange={(e) => setAgreeTerms(e.target.checked)} className="mt-1 accent-accent" disabled={isLoading} />
                <label htmlFor="terms" className="text-sm text-foreground/70">
                  I agree to the <Link href="/terms" className="text-accent hover:text-accent/80">Terms of Service</Link> and <Link href="/privacy" className="text-accent hover:text-accent/80">Privacy Policy</Link>
                </label>
              </div>

              <button type="submit" disabled={isLoading} className="w-full px-6 py-3 bg-accent text-accent-foreground rounded-full font-bold hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-6">
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
              <div className="relative flex justify-center text-sm"><span className="px-2 bg-card text-foreground/60">Already have an account?</span></div>
            </div>

            <Link href="/login" className="block w-full px-6 py-3 border border-border text-foreground rounded-full font-medium hover:bg-secondary transition-colors text-center">
              Sign In
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  )
}
