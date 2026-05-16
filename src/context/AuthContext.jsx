import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import * as authApi from '../services/authService.js'

const AuthContext = createContext(null)

const STORAGE_KEY = 'omniverseweb.session'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      try {
        setUser(JSON.parse(raw))
      } catch {
        localStorage.removeItem(STORAGE_KEY)
      }
    }
    setLoading(false)
  }, [])

  const persist = (next) => {
    setUser(next)
    if (next) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  }

  const login = useCallback(async (email, password) => {
    const session = await authApi.login(email, password)
    persist(session)
    return session
  }, [])

  const register = useCallback(async (payload) => {
    const session = await authApi.register(payload)
    persist(session)
    return session
  }, [])

  const logout = useCallback(() => {
    persist(null)
  }, [])

  const updateProfile = useCallback(async (updates) => {
    const next = await authApi.updateProfile(user?.id, updates)
    persist({ ...user, ...next })
    return next
  }, [user])

  const changePassword = useCallback(async (oldPwd, newPwd) => {
    return authApi.changePassword(user?.id, oldPwd, newPwd)
  }, [user])

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    login,
    register,
    logout,
    updateProfile,
    changePassword,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
