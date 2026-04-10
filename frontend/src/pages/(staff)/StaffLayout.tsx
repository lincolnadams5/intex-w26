import { useState } from 'react'
import type { ReactNode } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { Breadcrumbs } from '../../components/admin/Breadcrumbs'
import { ProfileCard } from '../../components/ProfileCard'

// ── Sidebar icons ─────────────────────────────────────────────────────────────
const sw = { strokeWidth: 1.5, stroke: 'currentColor', fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
const Icon = ({ children }: { children: ReactNode }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-4 h-4 flex-shrink-0" {...sw}>{children}</svg>
)

const NAV_ICONS: Record<string, ReactNode> = {
  '/staff/dashboard':         <Icon><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></Icon>,
  '/staff/residents':         <Icon><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></Icon>,
  '/staff/process-recording': <Icon><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" /><path d="M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2z" /><path d="M9 12h6M9 16h4" /></Icon>,
  '/staff/home-visits':       <Icon><path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" /><path d="M9 21V12h6v9" /><circle cx="12" cy="10" r="1.5" /></Icon>,
}

const baseNavItems = [
  { to: '/staff/dashboard',         label: 'Overview' },
  { to: '/staff/residents',         label: 'Residents' },
  { to: '/staff/process-recording', label: 'Process Recording' },
  { to: '/staff/home-visits',       label: 'Home Visitation' },
]

export function StaffLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const navigate = useNavigate()
  const { isStaff, logout } = useAuth()

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
            {isStaff ? 'Staff Portal' : 'User Portal'}
          </p>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-1 p-3 flex-1 overflow-y-auto">
          {baseNavItems.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/staff/dashboard'}
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
        <div className="px-4 sm:px-6 py-2">
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
