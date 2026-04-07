import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export function Header() {
  const { isAuthenticated, role, user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/')
  }

  const portalHref = role === 'Admin' ? '/admin/dashboard' : role === 'Staff' ? '/staff/dashboard' : null

  return (
    <header className="sticky top-0 z-[100] bg-[var(--bg)]/80 backdrop-blur-md border-b border-[var(--border)]">
      <nav className="flex items-center justify-between py-3 px-4 md:py-4 md:px-8 max-w-[1200px] mx-auto flex-wrap gap-3">
        <div className="flex items-center gap-2.5">
          <span className="text-[22px] font-bold text-[var(--text-h)] tracking-tight font-[family-name:var(--heading)]">
            Pag-asa Sanctuary
          </span>
        </div>
        <div className="hidden md:flex gap-8">
          {(['Mission', 'Services', 'Impact', 'Contact'] as const).map((label) => (
            <a
              key={label}
              href={`#${label.toLowerCase()}`}
              className="text-[var(--text)] text-[15px] font-medium hover:text-[var(--accent)] transition-colors no-underline"
            >
              {label}
            </a>
          ))}
        </div>
        <div className="flex gap-3 w-full md:w-auto justify-center md:justify-end items-center">
          {isAuthenticated ? (
            <>
              <span className="text-sm text-[var(--text)] hidden sm:block">
                {user?.fullName ?? user?.email}
              </span>
              {portalHref && (
                <Link to={portalHref} className="btn btn-secondary">
                  Portal
                </Link>
              )}
              <button onClick={handleLogout} className="btn btn-secondary">
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-secondary">
                Sign In
              </Link>
              <Link to="/donor" className="btn btn-primary">
                Donate
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  )
}
