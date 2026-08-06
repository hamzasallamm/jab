import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { api } from '../api/client'
import type { Me } from '../types'

interface AuthContextValue {
  me: Me | null
  loading: boolean
  setToken: (token: string) => Promise<void>
  logout: () => void
  refreshMe: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<Me | null>(null)
  const [loading, setLoading] = useState(true)

  async function refreshMe() {
    if (!localStorage.getItem('jab_token')) {
      setMe(null)
      setLoading(false)
      return
    }
    try {
      const result = await api.get<Me>('/profiles/me')
      setMe(result)
    } catch {
      localStorage.removeItem('jab_token')
      setMe(null)
    } finally {
      setLoading(false)
    }
  }

  async function setToken(token: string) {
    localStorage.setItem('jab_token', token)
    await refreshMe()
  }

  function logout() {
    localStorage.removeItem('jab_token')
    setMe(null)
  }

  useEffect(() => {
    refreshMe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <AuthContext.Provider value={{ me, loading, setToken, logout, refreshMe }}>{children}</AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
