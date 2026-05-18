'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api-client'
import type { StreamSession } from '@/lib/types'

const emptyForm = {
  name: '',
  host: '127.0.0.1',
  port: 49100,
  signalingPath: '/signaling/client',
  secure: false,
  description: '',
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<StreamSession[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')

  const refresh = async () => {
    setLoading(true)
    setSessions(await api.get<StreamSession[]>('/api/sessions'))
    setLoading(false)
  }

  useEffect(() => { refresh() }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      await api.post('/api/sessions', { ...form, port: Number(form.port) })
      setForm(emptyForm)
      setShowForm(false)
      refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : '建立失敗')
    }
  }

  const remove = async (s: StreamSession) => {
    if (!confirm(`確定要刪除 session「${s.name}」？`)) return
    await api.delete(`/api/sessions/${s.id}`)
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
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </label>
            <div className="grid-two">
              <label className="field">
                <span>Host</span>
                <input value={form.host} onChange={(e) => setForm({ ...form, host: e.target.value })} required />
              </label>
              <label className="field">
                <span>Port</span>
                <input type="number" value={form.port} onChange={(e) => setForm({ ...form, port: Number(e.target.value) })} required />
              </label>
            </div>
            <label className="field">
              <span>Signaling 路徑</span>
              <input value={form.signalingPath} onChange={(e) => setForm({ ...form, signalingPath: e.target.value })} />
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
              <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
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
                  <Link href={`/sessions/${s.id}`} className="session-name">{s.name}</Link>
                  <span className={`badge badge-${s.status || 'idle'}`}>{s.status || 'idle'}</span>
                </div>
                <div className="session-endpoint">
                  <code>{s.secure ? 'wss' : 'ws'}://{s.host}:{s.port}{s.signalingPath || ''}</code>
                </div>
                {s.description && <p className="project-desc">{s.description}</p>}
                <div className="project-meta">
                  <span>建立於 {new Date(s.createdAt).toLocaleDateString()}</span>
                  {s.lastConnectedAt && <span>最近連線 {new Date(s.lastConnectedAt).toLocaleString()}</span>}
                </div>
                <div className="project-actions">
                  <Link href={`/sessions/${s.id}`} className="btn-link">連線 / 編輯</Link>
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
