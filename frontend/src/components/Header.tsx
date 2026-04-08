import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

interface HeaderProps {
  transparent?: boolean;
}

export function Header({ transparent = false }: HeaderProps) {
  const { isAuthenticated, role, user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/')
  }

  const portalHref = role === 'Admin' ? '/admin/dashboard' : role === 'Staff' ? '/staff/dashboard' : null
  const isDonor = role === 'Donor'

  return (
    <header className="sticky top-0 z-[100] bg-[#faf9f6]/95 backdrop-blur-md">
      <nav className="flex items-center justify-between py-4 px-6 md:px-10 max-w-[1400px] mx-auto">
        {/* Logo */}
        <Link to="/" className="text-xl font-bold font-[family-name:var(--font-display)] text-[#004c5a] tracking-tight">
          Pag-asa
        </Link>

        {/* Center Nav */}
        <div className="hidden md:flex items-center gap-10">
          <Link 
            to="/" 
            className="text-sm font-medium text-[#1a1c1a] hover:text-[#004c5a] transition-colors underline underline-offset-4"
          >
            Home
          </Link>
          <Link 
            to="/impact" 
            className="text-sm font-medium text-[#3f484b] hover:text-[#004c5a] transition-colors"
          >
            Impact
          </Link>
          <Link 
            to="/donate" 
            className="text-sm font-medium text-[#3f484b] hover:text-[#004c5a] transition-colors"
          >
            Donate
          </Link>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <span className="text-sm hidden sm:block text-[#3f484b]">
                {user?.fullName ?? user?.email}
              </span>
              {portalHref && (
                <Link to={portalHref} className="btn btn-small">
                  Portal
                </Link>
              )}
              {isDonor && (
                <Link to="/my-donations" className="btn btn-primary btn-small">
                  My Donations
                </Link>
              )}
              <button onClick={handleLogout} className="btn btn-ghost btn-small">
                Sign Out
              </button>
            </>
          ) : (
            <Link 
              to="/login" 
              className="px-6 py-2.5 text-sm font-semibold rounded bg-[#004c5a] !text-white hover:shadow-[0_12px_40px_rgba(0,76,90,0.15)] transition-all"
            >
              LOGIN
            </Link>
          )}
        </div>
      </nav>
    </header>
  )
}
