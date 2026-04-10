import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { ProfileCard } from "./ProfileCard";

export function Header() {
  const { isAuthenticated } = useAuth()

  return (
    <header className="sticky top-0 z-[100] bg-[#faf9f6]/95 backdrop-blur-md shadow-md">
      <nav className="flex items-center justify-between py-4 px-6 md:px-10 max-w-[1400px] mx-auto">
        {/* Logo */}
        <Link to="/" className="text-xl font-bold font-[family-name:var(--font-display)] text-[#004c5a] tracking-tight">
          Pag-asa
        </Link>

        {/* Center Nav */}
        <div className="hidden md:flex items-center gap-10">
          {[
            { to: '/', label: 'Home', end: true },
            { to: '/about', label: 'About Us', end: false },
            { to: '/impact', label: 'Impact', end: false },
          ].map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-[#1a1c1a] underline underline-offset-4 decoration-[#004c5a]'
                    : 'text-[#3f484b] hover:text-[#004c5a]'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <ProfileCard />
          ) : (
            <div className="flex">
              <Link
                to="/login"
                className="px-6 py-2.5 text-sm font-semibold text-[#004c5a] hover:text-slate-500 transition-colors"
              >
                Log In
              </Link>
              <Link
                to="/donate"
                className="px-6 py-2.5 text-sm font-semibold rounded bg-[#004c5a] text-white hover:shadow-[0_12px_40px_rgba(0,76,90,0.15)] hover:translate-y-[-2px] hover:opacity-90 transition-all"
              >
                Donate
              </Link>
            </div>
          )}
        </div>
      </nav>
    </header>
  )
}
