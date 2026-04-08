import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export default function Register() {
  const { isAuthenticated, register } = useAuth()
  const navigate = useNavigate()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  if (isAuthenticated) {
    return <Navigate to="/my-donations" replace />
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

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

    const result = await register(email, fullName, password, confirmPassword)

    if (!result.ok) {
      setError(result.error ?? 'Registration failed')
      setIsLoading(false)
      return
    }

    navigate('/my-donations')
  }

  return (
    <div className="min-h-screen bg-[var(--color-surface)] flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-[var(--surface-container-lowest)] rounded-xl p-10 shadow-[var(--shadow-elevated)]">
        <h2 className="text-center mb-8">Create Account</h2>
        <form className="flex flex-col gap-5" onSubmit={handleRegister}>
          <div className="form-group mb-0">
            <input
              type="text"
              placeholder="Full Name"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
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
              placeholder="Password (min 14 characters)"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              disabled={isLoading}
              minLength={14}
            />
          </div>
          <div className="form-group mb-0">
            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
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
            {isLoading ? 'Creating Account...' : 'Register'}
          </button>

          <p className="text-center text-sm text-[var(--color-on-surface-variant)]">
            Already have an account?{' '}
            <Link to="/login" className="text-[var(--color-primary)] font-semibold hover:underline">
              Login
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
