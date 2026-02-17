'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { Navbar } from '@/components/animated-navbar'
import { Footer } from '@/components/footer'
import { Eye, EyeOff } from 'lucide-react'
import { Suspense } from 'react'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/dashboard'
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    if (!formData.email || !formData.password) {
      setError('Please fill in all fields')
      setIsLoading(false)
      return
    }

    try {
      await signInWithEmailAndPassword(auth, formData.email.trim(), formData.password)
      router.push(redirect)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed'
      if (message.includes('auth/invalid-credential') || message.includes('auth/wrong-password') || message.includes('auth/user-not-found')) {
        setError('Invalid email or password. Please try again.')
      } else if (message.includes('auth/invalid-email')) {
        setError('Please enter a valid email address.')
      } else if (message.includes('auth/too-many-requests')) {
        setError('Too many failed attempts. Please try again later.')
      } else {
        setError('Login failed. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-card border border-border rounded-xl p-8 space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-destructive/20 border border-destructive rounded-lg p-3 text-destructive text-sm">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-medium text-foreground">Email Address</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="you@example.com"
            className="w-full px-4 py-3 bg-secondary border border-border rounded-lg text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="block text-sm font-medium text-foreground">Password</label>
            <Link href="/forgot-password" className="text-xs text-accent hover:text-accent/80 transition-colors">Forgot?</Link>
          </div>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="w-full px-4 py-3 bg-secondary border border-border rounded-lg text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground/60 transition-colors"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full px-6 py-3 bg-accent text-accent-foreground rounded-lg font-bold hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-6"
        >
          {isLoading ? 'Signing In...' : 'Sign In'}
        </button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
        <div className="relative flex justify-center text-sm"><span className="px-2 bg-card text-foreground/60">New to Vercera?</span></div>
      </div>

      <Link href="/signup" className="block w-full px-6 py-3 border border-border text-foreground rounded-lg font-medium hover:bg-secondary transition-colors text-center">
        Create an Account
      </Link>
    </div>
  )
}

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-32 pb-20 flex items-center justify-center">
        <div className="w-full max-w-md mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="font-display text-4xl font-bold text-foreground mb-2">Welcome Back</h1>
            <p className="text-foreground/70">Sign in to your Vercera account</p>
          </div>

          <Suspense fallback={<div className="bg-card border border-border rounded-xl p-8 text-center text-foreground/60">Loading...</div>}>
            <LoginForm />
          </Suspense>

          <div className="text-center mt-6">
            <p className="text-foreground/60 text-sm">
              By signing in, you agree to our <Link href="/terms" className="text-accent hover:text-accent/80">Terms of Service</Link>
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  )
}
