import { useNavigate } from 'react-router-dom'

export default function Unauthorized() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-surface-container-low)]">
      <div className="text-center space-y-4 p-8">
        <h1 className="text-6xl font-bold text-[var(--color-primary)]">403</h1>
        <h2 className="text-2xl font-semibold text-[var(--color-on-surface)]">Access Denied</h2>
        <p className="text-[var(--color-on-surface-variant)] max-w-sm">
          You don't have permission to view this page. Please contact an administrator
          if you believe this is a mistake.
        </p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 px-6 py-2 rounded-lg bg-[var(--color-primary)] text-white font-medium hover:opacity-90 transition-opacity"
        >
          Go Back
        </button>
      </div>
    </div>
  )
}
