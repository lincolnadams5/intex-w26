import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { Breadcrumbs } from '../../components/admin/Breadcrumbs'
import { ProfileCard } from '../../components/admin/ProfileCard'

// Nav items visible to both Admin and Staff
const baseNavItems = [
  { to: '/staff/dashboard', label: 'Overview',      icon: '⊞' },
  { to: '/staff/residents', label: 'Residents',      icon: '🏠' },
  { to: '/staff/ml',        label: 'ML Insights',    icon: '🤖' },
]

export function StaffLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const navigate = useNavigate()
  const { user, isStaff, logout } = useAuth()

  const navItems = isStaff ? [...baseNavItems] : baseNavItems

  function handleLogout() {
    logout()
    navigate('/')
  }

  return (
    <div className="flex min-h-svh bg-[var(--bg-alt)]">
      {/* Sidebar */}
      <aside
        className={`${sidebarOpen ? 'w-72' : 'w-0 overflow-hidden'} flex-shrink-0 bg-[var(--bg)] border-r border-[var(--border)] flex flex-col h-screen sticky top-0 transition-all duration-[300ms] ease-in-out`}
      >
        {/* Brand */}
        <div className="px-5 py-5 border-b border-[var(--border)]">
          <span className="text-[18px] font-bold text-[var(--text-h)] tracking-tight leading-tight font-[family-name:var(--heading)]">
            Pag-asa Sanctuary
          </span>
          <p className="text-xs text-[var(--text)] mt-0.5 font-[family-name:var(--sans)]">
            {isStaff ? 'Staff Portal' : 'User Portal'}
          </p>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-1 p-3 flex-1 overflow-y-auto">
          {navItems.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/staff/dashboard'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors no-underline ${
                  isActive
                    ? 'bg-[var(--accent-bg)] text-[var(--accent)]'
                    : 'text-[var(--text)] hover:bg-[var(--bg-alt)] hover:text-[var(--text-h)]'
                }`
              }
            >
              <span className="text-base leading-none">{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Sidebar footer */}
        <div className="p-3 border-t border-[var(--border)] flex flex-col gap-1">
          <Link
            to="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[var(--text)] hover:bg-[var(--bg-alt)] hover:text-[var(--text-h)] transition-colors no-underline"
          >
            <span className="text-base leading-none">🏠</span>
            Return to Home
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[var(--text)] hover:bg-[var(--alert-bg)] hover:text-[var(--alert)] transition-all duration-[300ms] ease-in-out"
          >
            <span className="text-base leading-none">🚪</span>
            Log Out
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-[var(--bg)] border-b border-[var(--border)] px-6 py-3 flex items-center justify-between flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(o => !o)}
            className="p-2 rounded-lg text-[var(--text)] hover:bg-[var(--bg-alt)] transition-colors"
            aria-label="Toggle sidebar"
          >
            ☰
          </button>

          <ProfileCard
            name={user?.fullName ?? 'User'}
            email={user?.email ?? ''}
          />
        </header>

        {/* Breadcrumb bar */}
        <div className="bg-[var(--bg)] border-b border-[var(--border)] px-6 py-2">
          <Breadcrumbs />
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
