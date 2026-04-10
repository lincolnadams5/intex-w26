import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { GoogleLogin } from '@react-oauth/google'
import type { CredentialResponse } from '@react-oauth/google'

const BASE_URL = import.meta.env.VITE_API_URL ?? ''

interface Props {
  onSuccess: () => void
}

export function LoginForm({ onSuccess }: Props) {
  const { login } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [requires2FA, setRequires2FA] = useState(false)
  const [userId, setUserId] = useState('')
  const [code, setCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

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
    } else {
      onSuccess()
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
        setIsLoading(false)
      } else {
        localStorage.setItem('token', data.token)
        window.location.reload()
      }
    } catch {
      setError('Network error. Please try again.')
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
        setIsLoading(false)
      } else {
        localStorage.setItem('token', data.token)
        window.location.reload()
      }
    } catch {
      setError('Network error. Please try again.')
      setIsLoading(false)
    }
  }

  if (requires2FA) {
    return (
      <form className="flex flex-col gap-5" onSubmit={handleVerify2FA}>
        <p className="text-center text-[var(--color-on-surface-variant)] text-sm">
          Enter the 6-digit code sent to your email.
        </p>
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
        <button type="submit" className="btn btn-primary w-full" disabled={isLoading}>
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
    )
  }

  return (
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
      <button type="submit" className="btn btn-primary w-full" disabled={isLoading}>
        {isLoading ? 'Logging in...' : 'Login'}
      </button>
      <p className="text-center text-sm text-[var(--color-on-surface-variant)]">
        <Link to="/forgot-password" className="text-[var(--color-primary)] hover:underline">
          Forgot password?
        </Link>
      </p>

      <div className="flex items-center gap-3 my-1">
        <hr className="flex-1 border-[var(--color-outline-variant)]" />
        <span className="text-xs text-[var(--color-on-surface-variant)]">or</span>
        <hr className="flex-1 border-[var(--color-outline-variant)]" />
      </div>

      <div className="flex justify-center">
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={() => setError('Google sign-in was cancelled or failed.')}
          useOneTap={false}
          text="signin_with"
          shape="rectangular"
          theme="outline"
        />
      </div>
    </form>
  )
}
