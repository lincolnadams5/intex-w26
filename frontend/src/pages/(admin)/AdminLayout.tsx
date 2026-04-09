import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { Breadcrumbs } from '../../components/admin/Breadcrumbs'
import { ProfileCard } from '../../components/admin/ProfileCard'

// Nav items visible to both Admin and Staff
const baseNavItems = [
  { to: '/admin/dashboard', label: 'Overview',      icon: '⊞' },
  { to: '/admin/donors',    label: 'Donor Activity', icon: '💰' },
  { to: '/admin/residents',  label: 'Residents',      icon: '🏠' },
  { to: '/admin/safehouses', label: 'Safehouses',     icon: '🏡' },
  { to: '/admin/social',    label: 'Social Media',   icon: '📱' },
  { to: '/admin/ml',        label: 'ML Insights',    icon: '🤖' },
]

// Nav item visible only to Admin
const adminNavItems = [
  { to: '/admin/users', label: 'Manage Users', icon: '👥' },
]

export function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const navigate = useNavigate()
  const { user, isAdmin, logout } = useAuth()

  const navItems = isAdmin ? [...baseNavItems, ...adminNavItems] : baseNavItems

  function handleLogout() {
    logout()
    navigate('/')
  }

  return (
    <div className="flex min-h-svh bg-[var(--color-surface-container-low)]">
      {/* Sidebar */}
      <aside
        className={`${sidebarOpen ? 'w-45' : 'w-0 overflow-hidden'} flex-shrink-0 bg-[var(--color-surface-container-lowest)] border-r border-[var(--color-outline-variant)] flex flex-col h-screen sticky top-0 transition-all duration-[300ms] ease-in-out`}
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
          {navItems.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/admin/dashboard'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors no-underline ${
                  isActive
                    ? 'bg-[rgba(0, 76, 90, 0.08)] text-[var(--color-primary)]'
                    : 'text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-low)] hover:text-[var(--color-on-surface)]'
                }`
              }
            >
              <span className="text-base leading-none">{icon}</span>
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
            <span className="text-base leading-none">🏠</span>
            Return to Home
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[var(--color-on-surface-variant)] hover:bg-[var(--color-error-container)] hover:text-[var(--color-error)] transition-all duration-[300ms] ease-in-out"
          >
            <span className="text-base leading-none">🚪</span>
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

          <ProfileCard
            name={user?.fullName ?? 'User'}
            email={user?.email ?? ''}
          />
        </header>

        {/* Breadcrumb bar */}
        <div className="bg-[var(--color-surface-container-lowest)] border-b border-[var(--color-outline-variant)] px-6 py-2">
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
