import { useEffect, useState, type ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
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
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z" />
    </svg>
  )
}

function MenuLink({ to, onClick, children }: { to: string; onClick: () => void; children: ReactNode }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="font-display px-6 py-4 text-2xl tracking-wide hover:bg-jab/10 hover:text-jab"
    >
      {children}
    </Link>
  )
}

export function NavMenu() {
  const { me, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [open, setOpen] = useState(false)
  const location = useLocation()

  useEffect(() => setOpen(false), [location.pathname])

  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  function close() {
    setOpen(false)
  }

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Menu"
        aria-expanded={open}
        className="relative z-50 flex flex-col justify-center gap-1.5 p-2"
      >
        <span
          className={`block h-0.5 w-6 bg-bone transition-transform duration-300 ease-in-out ${open ? 'translate-y-2 rotate-45' : ''}`}
        />
        <span
          className={`block h-0.5 w-6 bg-bone transition-opacity duration-200 ease-in-out ${open ? 'opacity-0' : ''}`}
        />
        <span
          className={`block h-0.5 w-6 bg-bone transition-transform duration-300 ease-in-out ${open ? '-translate-y-2 -rotate-45' : ''}`}
        />
      </button>

      {/* backdrop */}
      <div
        onClick={close}
        aria-hidden
        className={`fixed inset-0 z-40 bg-ink/60 transition-opacity duration-300 ease-in-out ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      {/* full-height drawer */}
      <div
        className={`fixed inset-y-0 right-0 z-40 flex w-72 flex-col border-l border-steel bg-surface shadow-2xl transition-transform duration-300 ease-in-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <nav className="mt-20 flex flex-1 flex-col overflow-y-auto">
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
            </>
          ) : (
            <>
              <MenuLink to="/login" onClick={close}>
                Log In
              </MenuLink>
              <MenuLink to="/signup" onClick={close}>
                Sign Up
              </MenuLink>
            </>
          )}
        </nav>

        <div className="border-t border-steel">
          {me && (
            <button
              onClick={() => {
                logout()
                close()
              }}
              className="font-display block w-full px-6 py-4 text-left text-2xl tracking-wide hover:bg-jab/10 hover:text-jab"
            >
              Log Out
            </button>
          )}
          <button
            onClick={toggleTheme}
            className="flex w-full items-center gap-3 px-6 py-4 text-sm uppercase tracking-wide text-steel-light hover:text-jab"
          >
            {theme === 'light' ? <MoonIcon /> : <SunIcon />}
            {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
          </button>
        </div>
      </div>
    </>
  )
}
