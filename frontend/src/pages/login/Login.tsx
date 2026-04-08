import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import './Login.css'

const BASE_URL = import.meta.env.VITE_API_URL ?? ''

export default function Login() {
  const { isAuthenticated, login, role } = useAuth()

  // Step 1 fields
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')

  // Step 2 — 2FA
  const [requires2FA, setRequires2FA] = useState(false)
  const [userId, setUserId]           = useState('')
  const [code, setCode]               = useState('')

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError]         = useState('')

  // Already logged in — redirect to the appropriate home for their role
  if (isAuthenticated) {
    const dest = role === 'Admin' ? '/admin/dashboard' : role === 'Staff' ? '/staff/dashboard' : role === 'Donor' ? '/my-donations' : '/'
    return <Navigate to={dest} replace />
  }

  // ── Step 1: Email + password ────────────────────────────────────────────────

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    const result = await login(email, password)

    if (!result.ok) {
      setError(result.error ?? 'Login failed')
    } else if (result.requires2FA) {
      // Switch to the 2FA code input step
      setUserId(result.userId ?? '')
      setRequires2FA(true)
    }
    // On successful login the AuthContext sets isAuthenticated=true, which triggers
    // the <Navigate> guard at the top of this component to redirect by role.

    setIsLoading(false)
  }

  // ── Step 2: 2FA code verification ──────────────────────────────────────────

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
        // Reload to let AuthProvider re-hydrate from localStorage
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

  // ── Render ─────────────────────────────────────────────────────────────────

  if (requires2FA) {
    return (
      <div className="login-container">
        <div className="login-card">
          <h2 className="login-title">Two-Factor Authentication</h2>
          <p className="text-sm text-center mb-4" style={{ color: 'var(--text)' }}>
            Enter the 6-digit code sent to your email.
          </p>
          <form className="login-form" onSubmit={handleVerify2FA}>
            <div className="input-group">
              <input
                type="text"
                placeholder="6-digit code"
                value={code}
                onChange={e => setCode(e.target.value)}
                className="login-input"
                maxLength={6}
                required
                disabled={isLoading}
                autoFocus
              />
            </div>
            {error && <div className="error-message">{error}</div>}
            <button
              type="submit"
              className={`login-button ${isLoading ? 'loading' : ''}`}
              disabled={isLoading}
            >
              {isLoading ? 'Verifying...' : 'Verify Code'}
            </button>
            <button
              type="button"
              className="login-button"
              style={{ marginTop: 8, background: 'transparent', color: 'var(--text)', border: '1px solid var(--border)' }}
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
    <div className="login-container">
      <div className="login-card">
        <h2 className="login-title">Welcome Back</h2>
        <form className="login-form" onSubmit={handleLogin}>
          <div className="input-group">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="login-input"
              required
              disabled={isLoading}
            />
          </div>
          <div className="input-group">
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="login-input"
              required
              disabled={isLoading}
            />
          </div>
          {error && <div className="error-message">{error}</div>}
          <button
            type="submit"
            className={`login-button ${isLoading ? 'loading' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>

          <p style={{ textAlign: 'center', marginTop: '1rem', color: '#6b7280', fontSize: '0.875rem' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: '#4f46e5', textDecoration: 'none', fontWeight: 500 }}>
              Register
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
