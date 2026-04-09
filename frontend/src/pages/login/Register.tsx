import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { RegisterForm } from '../../components/RegisterForm'

export default function Register() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()

  if (isAuthenticated) {
    return <Navigate to="/my-donations" replace />
  }

  return (
    <div className="min-h-screen bg-[var(--color-surface)] flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-[var(--surface-container-lowest)] rounded-xl p-10 shadow-[var(--shadow-elevated)]">
        <h2 className="text-center mb-8">Create Account</h2>
        <RegisterForm onSuccess={() => navigate('/my-donations')} />
        <p className="text-center text-sm text-[var(--color-on-surface-variant)] mt-5">
          Already have an account?{' '}
          <Link to="/login" className="text-[var(--color-primary)] font-semibold hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  )
}
