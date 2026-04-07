const BASE_URL = import.meta.env.VITE_API_URL ?? ''

// ── Authenticated fetch wrapper ───────────────────────────────────────────────
// Attaches the JWT from localStorage to every request.
// Automatically redirects to /login on 401 (expired or invalid token).

export async function authFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = localStorage.getItem('token')

  const headers = new Headers(init.headers)
  headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const res = await fetch(`${BASE_URL}${path}`, { ...init, headers })

  if (res.status === 401) {
    // Token is expired or invalid — clear session and send to login
    localStorage.removeItem('token')
    window.location.href = '/login'
  }

  return res
}

// ── Public (unauthenticated) helpers ─────────────────────────────────────────

export async function getSafehouses() {
  const res = await fetch(`${BASE_URL}/api/safehouses`)
  if (!res.ok) throw new Error('Failed to fetch safehouses')
  return res.json()
}
