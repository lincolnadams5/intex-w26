import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { GoogleLogin } from '@react-oauth/google'
import type { CredentialResponse } from '@react-oauth/google'

const BASE_URL = import.meta.env.VITE_API_URL ?? ''

export default function Login() {
  const { isAuthenticated, login, role } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [requires2FA, setRequires2FA] = useState(false)
  const [userId, setUserId] = useState('')
  const [code, setCode] = useState('')

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  if (isAuthenticated) {
    const dest = role === 'Admin' ? '/admin/dashboard' : role === 'Staff' ? '/staff/dashboard' : role === 'Donor' ? '/my-donations' : '/'
    return <Navigate to={dest} replace />
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    const result = await login(email, password)

    if (!result.ok) {
      setError(result.error ?? 'Login failed')
    } else if (result.requires2FA) {
      setUserId(result.userId ?? '')
      setRequires2FA(true)
    }

    setIsLoading(false)
  }

  const handleResendCode = async () => {
    setIsLoading(true)
    setError('')
    const result = await login(email, password)
    if (!result.ok) setError(result.error ?? 'Failed to resend code')
    setIsLoading(false)
  }

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const res = await fetch(`${BASE_URL}/api/auth/verify-2fa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, code }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data?.message ?? 'Invalid code')
      } else {
        localStorage.setItem('token', data.token)
        const r = data.user?.role
        const dest = r === 'Admin' ? '/admin/dashboard' : r === 'Staff' ? '/staff/dashboard' : r === 'Donor' ? '/my-donations' : '/'
        window.location.href = dest
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) {
      setError('Google sign-in failed. Please try again.')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const res = await fetch(`${BASE_URL}/api/auth/google-signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: credentialResponse.credential }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data?.message ?? 'Google sign-in failed')
      } else {
        localStorage.setItem('token', data.token)
        const r = data.user?.role
        const dest =
          r === 'Admin' ? '/admin/dashboard' :
          r === 'Staff' ? '/staff/dashboard' :
          r === 'Donor' ? '/my-donations' : '/'
        window.location.href = dest
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleError = () => {
    setError('Google sign-in was cancelled or failed.')
  }

  if (requires2FA) {
    return (
      <div className="min-h-screen bg-[var(--color-surface)] flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-[var(--color-surface-container-lowest)] rounded-xl p-10 shadow-[var(--shadow-elevated)]">
          <h2 className="text-center mb-2">Two-Factor Authentication</h2>
          <p className="text-center text-[var(--color-on-surface-variant)] mb-8">
            Enter the 6-digit code sent to your email.
          </p>
          <form className="flex flex-col gap-5" onSubmit={handleVerify2FA}>
            <div className="form-group mb-0">
              <input
                type="text"
                placeholder="6-digit code"
                value={code}
                onChange={e => setCode(e.target.value)}
                maxLength={6}
                required
                disabled={isLoading}
                autoFocus
                className="text-center text-2xl tracking-[0.5em] font-semibold"
              />
            </div>
            {error && <p className="text-[var(--color-error)] text-sm text-center">{error}</p>}
            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Verifying...' : 'Verify Code'}
            </button>
            <button
              type="button"
              className="btn btn-ghost w-full"
              onClick={handleResendCode}
              disabled={isLoading}
            >
              Resend Code
            </button>
            <button
              type="button"
              className="btn btn-ghost w-full"
              onClick={() => { setRequires2FA(false); setCode(''); setError('') }}
            >
              Back to Login
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--color-surface)] flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-[var(--color-surface-container-lowest)] rounded-xl p-10 shadow-[var(--shadow-elevated)]">
        <h2 className="text-center mb-8">Welcome Back</h2>
        <form className="flex flex-col gap-5" onSubmit={handleLogin}>
          <div className="form-group mb-0">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          <div className="form-group mb-0">
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          {error && <p className="text-[var(--color-error)] text-sm text-center">{error}</p>}
          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={isLoading}
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>

          <p className="text-center text-sm text-[var(--color-on-surface-variant)]">
            <Link to="/forgot-password" className="text-[var(--color-primary)] hover:underline">
              Forgot password?
            </Link>
          </p>

          <p className="text-center text-sm text-[var(--color-on-surface-variant)]">
            Don't have an account?{' '}
            <Link to="/register" className="text-[var(--color-primary)] font-semibold hover:underline">
              Register
            </Link>
          </p>

          {/* ── Google OAuth ── */}
          <div className="flex items-center gap-3 my-1">
            <hr className="flex-1 border-[var(--color-outline-variant)]" />
            <span className="text-xs text-[var(--color-on-surface-variant)]">or</span>
            <hr className="flex-1 border-[var(--color-outline-variant)]" />
          </div>

          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              useOneTap={false}
              text="signin_with"
              shape="rectangular"
              theme="outline"
            />
          </div>
        </form>
      </div>
    </div>
  )
}
