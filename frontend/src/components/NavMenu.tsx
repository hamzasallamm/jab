import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="4" />
      <line x1="12" y1="2" x2="12" y2="4" />
      <line x1="12" y1="20" x2="12" y2="22" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="2" y1="12" x2="4" y2="12" />
      <line x1="20" y1="12" x2="22" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z" />
    </svg>
  )
}

function MenuLink({ to, onClick, children }: { to: string; onClick: () => void; children: ReactNode }) {
  return (
    <Link to={to} onClick={onClick} className="px-4 py-2.5 text-sm hover:bg-jab/10 hover:text-jab">
      {children}
    </Link>
  )
}

export function NavMenu() {
  const { me, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const location = useLocation()

  useEffect(() => setOpen(false), [location.pathname])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function close() {
    setOpen(false)
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Menu"
        aria-expanded={open}
        className="flex flex-col justify-center gap-1.5 p-2"
      >
        <span
          className={`block h-0.5 w-6 bg-bone transition-transform duration-200 ${open ? 'translate-y-2 rotate-45' : ''}`}
        />
        <span className={`block h-0.5 w-6 bg-bone transition-opacity duration-200 ${open ? 'opacity-0' : ''}`} />
        <span
          className={`block h-0.5 w-6 bg-bone transition-transform duration-200 ${open ? '-translate-y-2 -rotate-45' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-3 w-56 overflow-hidden rounded border border-steel bg-surface shadow-lg">
          <nav className="flex flex-col py-2">
            {me ? (
              <>
                <MenuLink to="/gyms" onClick={close}>
                  Gyms
                </MenuLink>
                {me.account_type === 'fighter' && (
                  <>
                    <MenuLink to="/fighters" onClick={close}>
                      Fighters
                    </MenuLink>
                    <MenuLink to="/connections" onClick={close}>
                      Connections
                    </MenuLink>
                  </>
                )}
                <MenuLink to="/profile" onClick={close}>
                  Profile
                </MenuLink>
                <div className="my-2 border-t border-steel" />
                <button
                  onClick={() => {
                    logout()
                    close()
                  }}
                  className="px-4 py-2.5 text-left text-sm hover:bg-jab/10 hover:text-jab"
                >
                  Log Out
                </button>
              </>
            ) : (
              <>
                <MenuLink to="/login" onClick={close}>
                  Log In
                </MenuLink>
                <MenuLink to="/signup" onClick={close}>
                  Sign Up
                </MenuLink>
                <div className="my-2 border-t border-steel" />
              </>
            )}
            <button
              onClick={toggleTheme}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-jab/10 hover:text-jab"
            >
              {theme === 'light' ? <MoonIcon /> : <SunIcon />}
              {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
            </button>
          </nav>
        </div>
      )}
    </div>
  )
}
