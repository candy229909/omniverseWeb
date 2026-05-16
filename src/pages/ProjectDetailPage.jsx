import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { getProject, updateProject, deleteProject } from '../services/projectService.js'
import { listUsers } from '../services/authService.js'

export default function ProjectDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isAdmin } = useAuth()
  const [project, setProject] = useState(null)
  const [users, setUsers] = useState([])
  const [form, setForm] = useState(null)
  const [msg, setMsg] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const [p, us] = await Promise.all([getProject(id), listUsers()])
        if (!alive) return
        setProject(p)
        setForm({
          name: p.name,
          description: p.description,
          status: p.status,
          members: p.members,
        })
        setUsers(us)
      } catch (err) {
        setError(err.message)
      }
    })()
    return () => {
      alive = false
    }
  }, [id])

  if (error) return <div className="page"><div className="alert alert-error">{error}</div></div>
  if (!project || !form) return <div className="page"><div className="empty-state">載入中…</div></div>

  const canEdit = isAdmin || project.ownerId === user.id

  const toggleMember = (uid) => {
    setForm((f) => ({
      ...f,
      members: f.members.includes(uid) ? f.members.filter((m) => m !== uid) : [...f.members, uid],
    }))
  }

  const save = async (e) => {
    e.preventDefault()
    setError('')
    setMsg(null)
    try {
      const updated = await updateProject(id, form)
      setProject(updated)
      setMsg('專案已更新')
    } catch (err) {
      setError(err.message)
    }
  }

  const remove = async () => {
    if (!confirm(`確定要刪除專案「${project.name}」？`)) return
    await deleteProject(id)
    navigate('/projects', { replace: true })
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <Link to="/projects" className="link-muted">← 回專案列表</Link>
          <h1>{project.name}</h1>
          <p className="page-subtitle">專案 ID：{project.id}</p>
        </div>
        {canEdit && (
          <button className="btn-link danger" onClick={remove}>刪除專案</button>
        )}
      </div>

      <div className="grid-two">
        <section className="card">
          <div className="card-header"><h2>基本資訊</h2></div>
          <form className="form" onSubmit={save}>
            <label className="field">
              <span>名稱</span>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                disabled={!canEdit}
                required
              />
            </label>
            <label className="field">
              <span>描述</span>
              <textarea
                rows={4}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                disabled={!canEdit}
              />
            </label>
            <label className="field">
              <span>狀態</span>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                disabled={!canEdit}
              >
                <option value="planning">規劃中</option>
                <option value="active">進行中</option>
                <option value="paused">暫停</option>
                <option value="completed">已完成</option>
              </select>
            </label>
            {error && <div className="alert alert-error">{error}</div>}
            {msg && <div className="alert alert-success">{msg}</div>}
            {canEdit && <button type="submit" className="btn-primary">儲存變更</button>}
          </form>
        </section>

        <section className="card">
          <div className="card-header"><h2>專案成員</h2></div>
          {!canEdit && <p className="empty-state-inline">您僅有檢視權限。</p>}
          <ul className="member-list">
            {users.map((u) => {
              const active = form.members.includes(u.id)
              return (
                <li key={u.id} className={`member-item ${active ? 'is-member' : ''}`}>
                  <div>
                    <div className="member-name">{u.name}</div>
                    <div className="member-email">{u.email}</div>
                  </div>
                  {canEdit ? (
                    <button
                      type="button"
                      className={active ? 'btn-link danger' : 'btn-link'}
                      onClick={() => toggleMember(u.id)}
                    >
                      {active ? '移除' : '加入'}
                    </button>
                  ) : (
                    active && <span className="badge badge-active">成員</span>
                  )}
                </li>
              )
            })}
          </ul>
        </section>
      </div>
    </div>
  )
}
