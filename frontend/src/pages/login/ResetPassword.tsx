import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'

const BASE_URL = import.meta.env.VITE_API_URL ?? ''

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const email = searchParams.get('email') ?? ''
  const token = searchParams.get('token') ?? ''

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  if (!email || !token) {
    return (
      <div className="min-h-screen bg-[var(--surface)] flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-[var(--surface-container-lowest)] rounded-xl p-10 shadow-[var(--shadow-elevated)] text-center">
          <h2 className="mb-4">Invalid Link</h2>
          <p className="text-[var(--on-surface-variant)] mb-8">
            This password reset link is invalid or has expired.
          </p>
          <Link to="/forgot-password" className="btn btn-primary">
            Request a new link
          </Link>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (newPassword.length < 14) {
      setError('Password must be at least 14 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch(`${BASE_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token, newPassword }),
      })
      const data = await res.json()

      if (!res.ok) {
        const detail = data?.errors?.join(' ') ?? data?.message ?? 'Reset failed. The link may have expired.'
        setError(detail)
      } else {
        navigate('/login', { state: { message: 'Password reset successfully. You can now log in.' } })
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
        <h2 className="text-center mb-2">Reset Password</h2>
        <p className="text-center text-[var(--on-surface-variant)] mb-8">
          Enter your new password below.
        </p>
        <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
          <div className="form-group mb-0">
            <input
              type="password"
              placeholder="New password (min 14 characters)"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              required
              disabled={isLoading}
              autoFocus
            />
          </div>
          <div className="form-group mb-0">
            <input
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          {error && <p className="text-[var(--error)] text-sm text-center">{error}</p>}
          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={isLoading}
          >
            {isLoading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  )
}
