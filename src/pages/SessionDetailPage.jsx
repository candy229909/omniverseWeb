import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import {
  getSession,
  updateSession,
  deleteSession,
  touchSessionConnected,
} from '../services/sessionService.js'
import WebRTCViewer from '../components/WebRTCViewer.jsx'

export default function SessionDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isAdmin } = useAuth()
  const [session, setSession] = useState(null)
  const [form, setForm] = useState(null)
  const [error, setError] = useState('')
  const [msg, setMsg] = useState(null)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const s = await getSession(id)
        if (!alive) return
        setSession(s)
        setForm({
          name: s.name,
          host: s.host,
          port: s.port,
          signalingPath: s.signalingPath || '',
          secure: !!s.secure,
          description: s.description || '',
        })
      } catch (err) {
        setError(err.message)
      }
    })()
    return () => {
      alive = false
    }
  }, [id])

  if (error) return <div className="page"><div className="alert alert-error">{error}</div></div>
  if (!session || !form) return <div className="page"><div className="empty-state">載入中…</div></div>

  const canEdit = isAdmin || session.ownerId === user.id

  const save = async (e) => {
    e.preventDefault()
    setError('')
    setMsg(null)
    const port = Number(form.port)
    if (!Number.isInteger(port) || port <= 0 || port > 65535) {
      return setError('Port 必須為 1-65535 之間的整數')
    }
    try {
      const updated = await updateSession(id, { ...form, port })
      setSession(updated)
      setMsg('Session 已更新')
    } catch (err) {
      setError(err.message)
    }
  }

  const remove = async () => {
    if (!confirm(`確定要刪除 session「${session.name}」？`)) return
    await deleteSession(id)
    navigate('/sessions', { replace: true })
  }

  const handleConnected = async () => {
    const updated = await touchSessionConnected(id)
    setSession(updated)
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <Link to="/sessions" className="link-muted">← 回 Session 列表</Link>
          <h1>{session.name}</h1>
          <p className="page-subtitle">
            <code>{session.secure ? 'wss' : 'ws'}://{session.host}:{session.port}{session.signalingPath || ''}</code>
          </p>
        </div>
        {canEdit && (
          <button className="btn-link danger" onClick={remove}>刪除 Session</button>
        )}
      </div>

      <section className="card">
        <div className="card-header"><h2>WebRTC 即時串流</h2></div>
        <WebRTCViewer session={session} onConnected={handleConnected} />
      </section>

      <section className="card">
        <div className="card-header"><h2>連線設定</h2></div>
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
          <div className="grid-two">
            <label className="field">
              <span>Host</span>
              <input
                value={form.host}
                onChange={(e) => setForm({ ...form, host: e.target.value })}
                disabled={!canEdit}
                required
              />
            </label>
            <label className="field">
              <span>Port</span>
              <input
                type="number"
                value={form.port}
                onChange={(e) => setForm({ ...form, port: e.target.value })}
                disabled={!canEdit}
                required
              />
            </label>
          </div>
          <label className="field">
            <span>Signaling 路徑</span>
            <input
              value={form.signalingPath}
              onChange={(e) => setForm({ ...form, signalingPath: e.target.value })}
              disabled={!canEdit}
            />
          </label>
          <label className="checkbox-field">
            <input
              type="checkbox"
              checked={form.secure}
              onChange={(e) => setForm({ ...form, secure: e.target.checked })}
              disabled={!canEdit}
            />
            <span>使用 wss:// (TLS)</span>
          </label>
          <label className="field">
            <span>描述</span>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              disabled={!canEdit}
            />
          </label>
          {error && <div className="alert alert-error">{error}</div>}
          {msg && <div className="alert alert-success">{msg}</div>}
          {canEdit && <button type="submit" className="btn-primary">儲存變更</button>}
        </form>
      </section>
    </div>
  )
}
