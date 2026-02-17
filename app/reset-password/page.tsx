'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { Navbar } from '@/components/animated-navbar'
import { Footer } from '@/components/footer'
import { motion } from 'framer-motion'
import { Eye, EyeOff, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react'
import { Suspense } from 'react'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const oobCode = searchParams.get('oobCode')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isVerifying, setIsVerifying] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [email, setEmail] = useState('')

  useEffect(() => {
    const verifyCode = async () => {
      if (!oobCode) {
        setError('Invalid or missing reset link. Please request a new password reset.')
        setIsVerifying(false)
        return
      }

      try {
        const email = await verifyPasswordResetCode(auth, oobCode)
        setEmail(email)
        setIsVerifying(false)
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Invalid reset link'
        if (message.includes('auth/expired-action-code')) {
          setError('This password reset link has expired. Please request a new one.')
        } else if (message.includes('auth/invalid-action-code')) {
          setError('Invalid reset link. Please request a new password reset.')
        } else {
          setError('Failed to verify reset link. Please try again.')
        }
        setIsVerifying(false)
      }
    }

    verifyCode()
  }, [oobCode])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    if (!password || !confirmPassword) {
      setError('Please fill in all fields')
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long')
      setIsLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setIsLoading(false)
      return
    }

    if (!oobCode) {
      setError('Invalid reset link')
      setIsLoading(false)
      return
    }

    try {
      await confirmPasswordReset(auth, oobCode, password)
      setSuccess(true)
      setTimeout(() => {
        router.push('/login')
      }, 3000)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to reset password'
      if (message.includes('auth/expired-action-code')) {
        setError('This reset link has expired. Please request a new password reset.')
      } else if (message.includes('auth/invalid-action-code')) {
        setError('Invalid reset link. Please request a new password reset.')
      } else if (message.includes('auth/weak-password')) {
        setError('Password is too weak. Please choose a stronger password.')
      } else {
        setError('Failed to reset password. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (isVerifying) {
    return (
      <div className="bg-card border border-border rounded-xl p-8">
        <div className="text-center space-y-4">
          <div className="animate-spin w-8 h-8 border-4 border-accent border-t-transparent rounded-full mx-auto" />
          <p className="text-foreground/70">Verifying reset link...</p>
        </div>
      </div>
    )
  }

  if (error && !oobCode) {
    return (
      <div className="bg-card border border-border rounded-xl p-8 space-y-6">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-destructive/20 rounded-full flex items-center justify-center">
              <AlertCircle size={32} className="text-destructive" />
            </div>
          </div>
          <div>
            <h2 className="font-display text-2xl font-bold text-foreground mb-2">Invalid Reset Link</h2>
            <p className="text-foreground/70">{error}</p>
          </div>
          <Link
            href="/forgot-password"
            className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-accent-foreground rounded-lg font-medium hover:bg-accent/90 transition-all"
          >
            Request New Reset Link
          </Link>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="bg-card border border-border rounded-xl p-8 space-y-6">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center">
              <CheckCircle size={32} className="text-accent" />
            </div>
          </div>
          <div>
            <h2 className="font-display text-2xl font-bold text-foreground mb-2">Password Reset Successful!</h2>
            <p className="text-foreground/70">Your password has been reset successfully.</p>
            <p className="text-foreground/60 text-sm mt-2">Redirecting to login page...</p>
          </div>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-accent-foreground rounded-lg font-medium hover:bg-accent/90 transition-all"
          >
            Go to Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-card border border-border rounded-xl p-8 space-y-6">
      <div className="text-center mb-6">
        <h2 className="font-display text-2xl font-bold text-foreground mb-2">Reset Your Password</h2>
        {email && <p className="text-foreground/70 text-sm">Resetting password for: {email}</p>}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-destructive/20 border border-destructive rounded-lg p-3 text-destructive text-sm"
          >
            {error}
          </motion.div>
        )}

        <div className="space-y-2">
          <label htmlFor="password" className="block text-sm font-medium text-foreground">
            New Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 pr-10 bg-secondary border border-border rounded-lg text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
              disabled={isLoading}
              required
              minLength={6}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground/60 transition-colors"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <p className="text-xs text-foreground/60">Must be at least 6 characters long</p>
        </div>

        <div className="space-y-2">
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground">
            Confirm New Password
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              id="confirmPassword"
              name="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 pr-10 bg-secondary border border-border rounded-lg text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
              disabled={isLoading}
              required
              minLength={6}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground/60 transition-colors"
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full px-6 py-3 bg-accent text-accent-foreground rounded-lg font-bold hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-6"
        >
          {isLoading ? 'Resetting Password...' : 'Reset Password'}
        </button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-card text-foreground/60">Remember your password?</span>
        </div>
      </div>

      <Link
        href="/login"
        className="block w-full px-6 py-3 border border-border text-foreground rounded-lg font-medium hover:bg-secondary transition-colors text-center"
      >
        Back to Login
      </Link>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-32 pb-20 flex items-center justify-center">
        <div className="w-full max-w-md mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8"
          >
            <h1 className="font-display text-4xl font-bold text-foreground mb-2">Reset Password</h1>
            <p className="text-foreground/70">Enter your new password below</p>
          </motion.div>

          <Suspense fallback={
            <div className="bg-card border border-border rounded-xl p-8">
              <div className="text-center space-y-4">
                <div className="animate-spin w-8 h-8 border-4 border-accent border-t-transparent rounded-full mx-auto" />
                <p className="text-foreground/70">Loading...</p>
              </div>
            </div>
          }>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>

      <Footer />
    </main>
  )
}
