import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export function ProfileCard() {
  const { user, role, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  // Close dropdown on outside click
  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  if (!user) return null

  const initial = (user.fullName || user.email).charAt(0).toUpperCase()
  const portalHref =
    role === 'Admin' ? '/admin/dashboard' :
    role === 'Staff' ? '/staff/dashboard' :
    null

  function handleLogout() {
    setOpen(false)
    logout()
    navigate('/')
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger */}
      <button
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-haspopup="true"
        className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 cursor-pointer hover:bg-[#004c5a]/10 transition-colors"
      >
        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-[#004c5a] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
          {initial}
        </div>

        {/* Name + email — hidden on small screens */}
        <div className="hidden sm:block text-left">
          <p className="text-sm font-medium text-[#1a1c1a] leading-tight">{user.fullName || user.email}</p>
          <p className="text-xs text-[#6b7580] leading-tight">{user.email}</p>
        </div>

        {/* Caret */}
        <svg
          className={`w-3.5 h-3.5 text-[#6b7580] transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-[#e5e7e9] rounded-xl shadow-lg py-1.5 z-50">
          <Link
            to="/donate"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#3f484b] hover:bg-[#f5f5f0] transition-colors no-underline"
          >
            Donate
          </Link>

          <Link
            to="/my-donations"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#3f484b] hover:bg-[#f5f5f0] transition-colors no-underline"
          >
            My Donations
          </Link>

          {portalHref && (
            <Link
              to={portalHref}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#3f484b] hover:bg-[#f5f5f0] transition-colors no-underline"
            >
              View Portal
            </Link>
          )}

          <div className="my-1 border-t border-[#e5e7e9]" />

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#c0392b] cursor-pointer hover:bg-[#fef2f2] transition-colors"
          >
            Log Out
          </button>
        </div>
      )}
    </div>
  )
}
