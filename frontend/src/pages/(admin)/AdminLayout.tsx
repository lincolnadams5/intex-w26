import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { Breadcrumbs } from '../../components/admin/Breadcrumbs'
import { ProfileCard } from '../../components/ProfileCard'

// ── Sidebar icons ─────────────────────────────────────────────────────────────
const sw = { strokeWidth: 1.5, stroke: 'currentColor', fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
const Icon = ({ children }: { children: ReactNode }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-4 h-4 flex-shrink-0" {...sw}>{children}</svg>
)

const NAV_ICONS: Record<string, ReactNode> = {
  '/admin/dashboard': <Icon><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></Icon>,
  '/admin/donors':    <Icon><path d="M12 21C12 21 3 14.5 3 8.5a4.5 4.5 0 0 1 9-0.5 4.5 4.5 0 0 1 9 .5C21 14.5 12 21 12 21z" /></Icon>,
  '/admin/residents': <Icon><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></Icon>,
  '/admin/safehouses':<Icon><path d="M12 3 3 7v5c0 5 4 9.3 9 10.5C17 21.3 21 17 21 12V7L12 3z" /></Icon>,
  '/admin/social':    <Icon><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="m8.59 13.51 6.83 3.98M15.41 6.51l-6.82 3.98" /></Icon>,
  '/admin/ml':        <Icon><path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h2a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-1H1a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h2V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z" /><circle cx="8.5" cy="14.5" r="1.5" /><circle cx="15.5" cy="14.5" r="1.5" /></Icon>,
  '/admin/users':     <Icon><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M19 8v6M22 11h-6" /></Icon>,
}

// Nav items visible to both Admin and Staff
const baseNavItems = [
  { to: '/admin/dashboard', label: 'Overview' },
  { to: '/admin/donors',    label: 'Donor Activity' },
  { to: '/admin/residents', label: 'Residents' },
  { to: '/admin/safehouses', label: 'Safehouses' },
  { to: '/admin/social',    label: 'Social Media' },
  { to: '/admin/ml',        label: 'ML Insights' },
]

// Nav item visible only to Admin
const adminNavItems = [
  { to: '/admin/users', label: 'Manage Users' },
]

export function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const navigate = useNavigate()
  const { isAdmin, logout } = useAuth()

  const navItems = isAdmin ? [...baseNavItems, ...adminNavItems] : baseNavItems

  function handleLogout() {
    logout()
    navigate('/')
  }

  return (
    <div className="flex min-h-svh bg-[var(--color-surface-container-low)]">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`${sidebarOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full md:w-0 md:translate-x-0'} fixed md:sticky top-0 left-0 z-40 h-screen flex-shrink-0 bg-[var(--color-surface-container-lowest)] border-r border-[var(--color-outline-variant)] flex flex-col overflow-hidden transition-all duration-[300ms] ease-in-out`}
      >
        {/* Brand */}
        <div className="px-5 py-5 border-b border-[var(--color-outline-variant)]">
          <span className="text-[18px] font-bold text-[var(--color-on-surface)] tracking-tight leading-tight font-[family-name:var(--font-display)]">
            Pag-asa Sanctuary
          </span>
          <p className="text-xs text-[var(--color-on-surface-variant)] mt-0.5 font-[family-name:var(--font-body)]">
            {isAdmin ? 'Admin Portal' : 'Staff Portal'}
          </p>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-1 p-3 flex-1 overflow-y-auto">
          {navItems.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/admin/dashboard'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors no-underline ${
                  isActive
                    ? 'bg-[var(--color-primary)] text-white'
                    : 'text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-low)] hover:text-[var(--color-on-surface)]'
                }`
              }
            >
              {NAV_ICONS[to]}
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Sidebar footer */}
        <div className="p-3 border-t border-[var(--color-outline-variant)] flex flex-col gap-1">
          <Link
            to="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-low)] hover:text-[var(--color-on-surface)] transition-colors no-underline"
          >
            <Icon><path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" /><path d="M9 21V12h6v9" /></Icon>
            Return to Home
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[var(--color-on-surface-variant)] hover:bg-[var(--color-error-container)] hover:text-[var(--color-error)] transition-all duration-[300ms] ease-in-out"
          >
            <Icon><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></Icon>
            Log Out
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-[var(--color-surface-container-lowest)] border-b border-[var(--color-outline-variant)] px-6 py-3 flex items-center justify-between flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(o => !o)}
            className="p-2 rounded-lg text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-low)] transition-colors"
            aria-label="Toggle sidebar"
          >
            ☰
          </button>

          <ProfileCard />
        </header>

        {/* Breadcrumb bar */}
        <div className="bg-[var(--color-surface-container-lowest)] border-b border-[var(--color-outline-variant)] px-4 sm:px-6 py-2">
          <div className="flex flex-wrap gap-x-2">
            <Breadcrumbs />
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
