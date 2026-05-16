import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { listProjects } from '../services/projectService.js'
import { listUsers } from '../services/authService.js'

export default function DashboardPage() {
  const { user, isAdmin } = useAuth()
  const [stats, setStats] = useState({ projects: 0, members: 0, active: 0 })
  const [recent, setRecent] = useState([])

  useEffect(() => {
    let alive = true
    ;(async () => {
      const projects = await listProjects(user.id, { isAdmin })
      const users = isAdmin ? await listUsers() : []
      if (!alive) return
      setStats({
        projects: projects.length,
        members: users.length,
        active: projects.filter((p) => p.status === 'active').length,
      })
      setRecent(projects.slice(0, 5))
    })()
    return () => {
      alive = false
    }
  }, [user.id, isAdmin])

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>儀表板</h1>
          <p className="page-subtitle">嗨 {user.name}，歡迎回到 OmniverseWeb。</p>
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-label">我的專案</div>
          <div className="stat-value">{stats.projects}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">進行中</div>
          <div className="stat-value">{stats.active}</div>
        </div>
        {isAdmin && (
          <div className="stat-card">
            <div className="stat-label">系統用戶</div>
            <div className="stat-value">{stats.members}</div>
          </div>
        )}
      </div>

      <section className="card">
        <div className="card-header">
          <h2>最近專案</h2>
          <Link to="/projects" className="link-muted">查看全部 →</Link>
        </div>
        {recent.length === 0 ? (
          <div className="empty-state">尚無專案，<Link to="/projects">建立第一個專案</Link>。</div>
        ) : (
          <ul className="list">
            {recent.map((p) => (
              <li key={p.id} className="list-item">
                <Link to={`/projects/${p.id}`} className="list-title">{p.name}</Link>
                <span className={`badge badge-${p.status}`}>{p.status}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
