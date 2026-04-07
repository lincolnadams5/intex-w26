import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

interface ProtectedRouteProps {
  children: React.ReactNode
  // If provided, only users with one of these roles can access the route.
  // If omitted, any authenticated user is allowed.
  allowedRoles?: string[]
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, role, isLoading } = useAuth()

  // While checking the stored token on first load, render nothing to avoid flash
  if (isLoading) return null

  if (!isAuthenticated) return <Navigate to="/login" replace />

  if (allowedRoles && !allowedRoles.includes(role!))
    return <Navigate to="/unauthorized" replace />

  return <>{children}</>
}
