import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import './Login.css'

const BASE_URL = import.meta.env.VITE_API_URL ?? ''

export default function Register() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<string[]>([])

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setFieldErrors([])

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setIsLoading(false)
      return
    }

    if (password.length < 14) {
      setError('Password must be at least 14 characters')
      setIsLoading(false)
      return
    }

    try {
      const res = await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          fullName,
          password,
          confirmPassword,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (res.status === 409) {
          setError('This email is already registered')
        } else if (data.errors && Array.isArray(data.errors)) {
          setFieldErrors(data.errors)
        } else {
          setError(data.message ?? 'Registration failed')
        }
        return
      }

      localStorage.setItem('token', data.token)
      window.location.href = '/my-donations'
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h2 className="login-title">Create Account</h2>
        <form className="login-form" onSubmit={handleRegister}>
          <div className="input-group">
            <input
              type="text"
              placeholder="Full Name"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              className="login-input"
              required
              disabled={isLoading}
            />
          </div>
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
              placeholder="Password (min 14 characters)"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="login-input"
              required
              disabled={isLoading}
              minLength={14}
            />
          </div>
          <div className="input-group">
            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="login-input"
              required
              disabled={isLoading}
            />
          </div>

          {error && <div className="error-message">{error}</div>}
          {fieldErrors.length > 0 && (
            <div className="error-message">
              {fieldErrors.map((err, i) => (
                <div key={i}>{err}</div>
              ))}
            </div>
          )}

          <button
            type="submit"
            className={`login-button ${isLoading ? 'loading' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? 'Creating Account...' : 'Register'}
          </button>

          <p style={{ textAlign: 'center', marginTop: '1rem', color: '#6b7280', fontSize: '0.875rem' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#4f46e5', textDecoration: 'none', fontWeight: 500 }}>
              Login
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
