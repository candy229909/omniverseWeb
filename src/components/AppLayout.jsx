import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function AppLayout() {
  const { user, isAdmin, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">◎</span>
          <span>OmniverseWeb</span>
        </div>
        <nav className="nav">
          <NavLink to="/dashboard" className="nav-link">儀表板</NavLink>
          <NavLink to="/projects" className="nav-link">專案管理</NavLink>
          <NavLink to="/account" className="nav-link">帳號設定</NavLink>
          {isAdmin && (
            <NavLink to="/admin" className="nav-link nav-admin">系統管理</NavLink>
          )}
        </nav>
        <div className="sidebar-footer">
          <div className="user-card">
            <div className="avatar">{user?.name?.[0]?.toUpperCase() || 'U'}</div>
            <div className="user-info">
              <div className="user-name">{user?.name}</div>
              <div className="user-role">{user?.role === 'admin' ? '管理員' : '使用者'}</div>
            </div>
          </div>
          <button className="btn-ghost" onClick={handleLogout}>登出</button>
        </div>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}
