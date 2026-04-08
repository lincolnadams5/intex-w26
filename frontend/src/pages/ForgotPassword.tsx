import { useState } from 'react'
import { Link } from 'react-router-dom'

const BASE_URL = import.meta.env.VITE_API_URL ?? ''

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const res = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data?.message ?? 'Something went wrong. Please try again.')
      } else {
        setSubmitted(true)
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--surface)] flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-[var(--surface-container-lowest)] rounded-xl p-10 shadow-[var(--shadow-elevated)]">
        {submitted ? (
          <>
            <h2 className="text-center mb-4">Check your email</h2>
            <p className="text-center text-[var(--on-surface-variant)] mb-8">
              If an account with that email exists, we've sent a password reset link. Check your inbox (and spam folder).
            </p>
            <Link to="/login" className="btn btn-primary w-full block text-center">
              Back to Login
            </Link>
          </>
        ) : (
          <>
            <h2 className="text-center mb-2">Forgot Password</h2>
            <p className="text-center text-[var(--on-surface-variant)] mb-8">
              Enter your email and we'll send you a reset link.
            </p>
            <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
              <div className="form-group mb-0">
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  autoFocus
                />
              </div>
              {error && <p className="text-[var(--error)] text-sm text-center">{error}</p>}
              <button
                type="submit"
                className="btn btn-primary w-full"
                disabled={isLoading}
              >
                {isLoading ? 'Sending...' : 'Send Reset Link'}
              </button>
              <p className="text-center text-sm text-[var(--on-surface-variant)]">
                Remember your password?{' '}
                <Link to="/login" className="text-[var(--primary)] font-semibold hover:underline">
                  Login
                </Link>
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
