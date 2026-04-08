import { createContext, useContext, useEffect, useState } from 'react'

// ── Types ────────────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string
  email: string
  fullName: string
  role: 'Admin' | 'Staff' | 'Donor'
  safehouseId: number | null
  supporterId: number | null
  createdAt: string
}

export interface LoginResult {
  ok: boolean
  requires2FA?: boolean
  userId?: string    // returned when requires2FA = true
  error?: string
}

export interface RegisterResult {
  ok: boolean
  error?: string
}

export interface AuthContextType {
  user: UserProfile | null
  token: string | null
  role: 'Admin' | 'Staff' | 'Donor' | null
  isAuthenticated: boolean
  isAdmin: boolean
  isStaff: boolean
  isDonor: boolean
  isLoading: boolean   // true while checking stored token on mount
  login: (email: string, password: string) => Promise<LoginResult>
  register: (email: string, fullName: string, password: string, confirmPassword: string) => Promise<RegisterResult>
  logout: () => void
}

// ── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType>({
  user: null, token: null, role: null,
  isAuthenticated: false, isAdmin: false, isStaff: false, isDonor: false,
  isLoading: true,
  login: async () => ({ ok: false }),
  register: async () => ({ ok: false }),
  logout: () => {},
})

// ── Helpers ───────────────────────────────────────────────────────────────────

const BASE_URL = import.meta.env.VITE_API_URL ?? ''

/** Read the /api/auth/me endpoint to get the full profile from the server. */
async function fetchProfile(token: string): Promise<UserProfile | null> {
  try {
    const res = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser]   = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // On mount: restore session from localStorage and validate the stored token
  useEffect(() => {
    const init = async () => {
      const stored = localStorage.getItem('token')
      if (stored) {
        const profile = await fetchProfile(stored)
        if (profile) {
          setToken(stored)
          setUser(profile)
        } else {
          // Token is expired or invalid — clear it
          localStorage.removeItem('token')
        }
      }
      setIsLoading(false)
    }
    init()
  }, []) 

  const login = async (email: string, password: string): Promise<LoginResult> => {
    try {
      const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()

      if (!res.ok) return { ok: false, error: data?.message ?? 'Login failed' }

      // 2FA required — no token yet; caller must show the code input step
      if (data.requires2FA) {
        return { ok: true, requires2FA: true, userId: data.userId }
      }

      localStorage.setItem('token', data.token)
      setToken(data.token)
      setUser(data.user)
      return { ok: true }
    } catch {
      return { ok: false, error: 'Network error. Please try again.' }
    }
  }

  const register = async (
    email: string,
    fullName: string,
    password: string,
    confirmPassword: string,
  ): Promise<RegisterResult> => {
    try {
      const res = await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, fullName, password, confirmPassword }),
      })
      const data = await res.json()

      if (!res.ok) {
        const msg = data?.errors?.join(', ') ?? data?.message ?? 'Registration failed'
        return { ok: false, error: msg }
      }

      localStorage.setItem('token', data.token)
      setToken(data.token)
      setUser(data.user)
      return { ok: true }
    } catch {
      return { ok: false, error: 'Network error. Please try again.' }
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
  }

  const role = user?.role ?? null

  return (
    <AuthContext.Provider value={{
      user, token, role,
      isAuthenticated: !!user,
      isAdmin: role === 'Admin',
      isStaff: role === 'Staff',
      isDonor: role === 'Donor',
      isLoading,
      login, register, logout,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

// ── Hook (convenience) ────────────────────────────────────────────────────────

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextType {
  return useContext(AuthContext)
}
