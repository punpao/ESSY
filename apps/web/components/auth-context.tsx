'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'

type AuthUser = {
  id: string
  role: 'buyer' | 'seller' | 'admin'
  email: string
  displayName?: string
}

type AuthContextValue = {
  user: AuthUser | null
  token: string | null
  login: (payload: { token: string; user: AuthUser }) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const STORAGE_KEY = 'promptsafe.auth'

const loadStored = (): { token: string; user: AuthUser } | null => {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<AuthUser | null>(null)

  useEffect(() => {
    const persisted = loadStored()
    if (persisted) {
      setToken(persisted.token)
      setUser(persisted.user)
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      login: ({ token: newToken, user: newUser }) => {
        setToken(newToken)
        setUser(newUser)
        window.localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ token: newToken, user: newUser })
        )
      },
      logout: () => {
        setToken(null)
        setUser(null)
        window.localStorage.removeItem(STORAGE_KEY)
      }
    }),
    [token, user]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider')
  }
  return ctx
}
