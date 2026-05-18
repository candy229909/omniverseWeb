'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ReactNode } from 'react'
import { useAuth } from '@/context/AuthContext'

const navItems = [
  { href: '/dashboard', label: '儀表板' },
  { href: '/projects', label: '專案管理' },
  { href: '/sessions', label: 'Session 串流' },
  { href: '/account', label: '帳號設定' },
]

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, isAdmin, logout } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    await logout()
    router.replace('/login')
  }

  if (!user) return null

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`)

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">◎</span>
          <span>OmniverseWeb</span>
        </div>
        <nav className="nav">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-link ${isActive(item.href) ? 'active' : ''}`}
            >
              {item.label}
            </Link>
          ))}
          {isAdmin && (
            <Link
              href="/admin"
              className={`nav-link nav-admin ${isActive('/admin') ? 'active' : ''}`}
            >
              系統管理
            </Link>
          )}
        </nav>
        <div className="sidebar-footer">
          <div className="user-card">
            <div className="avatar">{user.name?.[0]?.toUpperCase() || 'U'}</div>
            <div className="user-info">
              <div className="user-name">{user.name}</div>
              <div className="user-role">{user.role === 'admin' ? '管理員' : '使用者'}</div>
            </div>
          </div>
          <button className="btn-ghost" onClick={handleLogout}>登出</button>
        </div>
      </aside>
      <main className="main-content">{children}</main>
    </div>
  )
}
