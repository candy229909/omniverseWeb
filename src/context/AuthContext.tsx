'use client'

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { api } from '@/lib/api-client'
import type { User } from '@/lib/types'

type AuthContextValue = {
  user: User | null
  loading: boolean
  isAuthenticated: boolean
  isAdmin: boolean
  login: (email: string, password: string) => Promise<User>
  register: (payload: { email: string; password: string; name: string }) => Promise<User>
  logout: () => Promise<void>
  refresh: () => Promise<void>
  updateProfile: (updates: { name?: string; email?: string }) => Promise<User>
  changePassword: (oldPwd: string, newPwd: string) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children, initialUser }: { children: ReactNode; initialUser?: User | null }) {
  const [user, setUser] = useState<User | null>(initialUser ?? null)
  const [loading, setLoading] = useState(initialUser === undefined)

  const refresh = useCallback(async () => {
    try {
      const u = await api.get<User>('/api/auth/me')
      setUser(u)
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (initialUser === undefined) refresh()
  }, [initialUser, refresh])

  const login = useCallback(async (email: string, password: string) => {
    const u = await api.post<User>('/api/auth/login', { email, password })
    setUser(u)
    return u
  }, [])

  const register = useCallback(async (payload: { email: string; password: string; name: string }) => {
    const u = await api.post<User>('/api/auth/register', payload)
    setUser(u)
    return u
  }, [])

  const logout = useCallback(async () => {
    await api.post('/api/auth/logout')
    setUser(null)
  }, [])

  const updateProfile = useCallback(async (updates: { name?: string; email?: string }) => {
    const updated = await api.patch<User>('/api/auth/me', updates)
    setUser(updated)
    return updated
  }, [])

  const changePassword = useCallback(async (oldPwd: string, newPwd: string) => {
    await api.post('/api/auth/change-password', { oldPassword: oldPwd, newPassword: newPwd })
  }, [])

  const value: AuthContextValue = {
    user,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    login,
    register,
    logout,
    refresh,
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
