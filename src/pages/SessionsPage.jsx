import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import {
  listSessions,
  createSession,
  deleteSession,
} from '../services/sessionService.js'

const emptyForm = {
  name: '',
  host: '127.0.0.1',
  port: 49100,
  signalingPath: '/signaling/client',
  secure: false,
  description: '',
}

export default function SessionsPage() {
  const { user, isAdmin } = useAuth()
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')

  const refresh = async () => {
    setLoading(true)
    setSessions(await listSessions(user.id, { isAdmin }))
    setLoading(false)
  }

  useEffect(() => {
    refresh()
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.name.trim()) return setError('Session 名稱不可為空')
    if (!form.host.trim()) return setError('Host 不可為空')
    const port = Number(form.port)
    if (!Number.isInteger(port) || port <= 0 || port > 65535) {
      return setError('Port 必須為 1-65535 之間的整數')
    }
    try {
      await createSession({ ...form, port }, user.id)
      setForm(emptyForm)
      setShowForm(false)
      refresh()
    } catch (err) {
      setError(err.message)
    }
  }

  const remove = async (s) => {
    if (!confirm(`確定要刪除 session「${s.name}」？`)) return
    await deleteSession(s.id)
    refresh()
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Session 管理</h1>
          <p className="page-subtitle">管理 Omniverse Kit App Streaming 的 WebRTC 連線設定。</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm((v) => !v)}>
          {showForm ? '取消' : '+ 新增 Session'}
        </button>
      </div>

      {showForm && (
        <section className="card">
          <div className="card-header"><h2>新增 Session</h2></div>
          <form className="form" onSubmit={submit}>
            <label className="field">
              <span>名稱</span>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="例：Kit Stream - 工廠模型"
                required
              />
            </label>
            <div className="grid-two">
              <label className="field">
                <span>Host</span>
                <input
                  value={form.host}
                  onChange={(e) => setForm({ ...form, host: e.target.value })}
                  placeholder="127.0.0.1"
                  required
                />
              </label>
              <label className="field">
                <span>Port</span>
                <input
                  type="number"
                  value={form.port}
                  onChange={(e) => setForm({ ...form, port: e.target.value })}
                  required
                />
              </label>
            </div>
            <label className="field">
              <span>Signaling 路徑</span>
              <input
                value={form.signalingPath}
                onChange={(e) => setForm({ ...form, signalingPath: e.target.value })}
                placeholder="/signaling/client"
              />
            </label>
            <label className="checkbox-field">
              <input
                type="checkbox"
                checked={form.secure}
                onChange={(e) => setForm({ ...form, secure: e.target.checked })}
              />
              <span>使用 wss:// (TLS)</span>
            </label>
            <label className="field">
              <span>描述</span>
              <textarea
                rows={2}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </label>
            {error && <div className="alert alert-error">{error}</div>}
            <button type="submit" className="btn-primary">建立</button>
          </form>
        </section>
      )}

      <section className="card">
        <div className="card-header"><h2>所有 Session</h2></div>
        {loading ? (
          <div className="empty-state">載入中…</div>
        ) : sessions.length === 0 ? (
          <div className="empty-state">尚無 session，點擊上方按鈕新增。</div>
        ) : (
          <div className="session-grid">
            {sessions.map((s) => (
              <div key={s.id} className="session-card">
                <div className="session-card-head">
                  <Link to={`/sessions/${s.id}`} className="session-name">{s.name}</Link>
                  <span className={`badge badge-${s.status || 'idle'}`}>{s.status || 'idle'}</span>
                </div>
                <div className="session-endpoint">
                  <code>{s.secure ? 'wss' : 'ws'}://{s.host}:{s.port}{s.signalingPath || ''}</code>
                </div>
                {s.description && <p className="project-desc">{s.description}</p>}
                <div className="project-meta">
                  <span>建立於 {new Date(s.createdAt).toLocaleDateString()}</span>
                  {s.lastConnectedAt && (
                    <span>最近連線 {new Date(s.lastConnectedAt).toLocaleString()}</span>
                  )}
                </div>
                <div className="project-actions">
                  <Link to={`/sessions/${s.id}`} className="btn-link">連線 / 編輯</Link>
                  <button className="btn-link danger" onClick={() => remove(s)}>刪除</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
