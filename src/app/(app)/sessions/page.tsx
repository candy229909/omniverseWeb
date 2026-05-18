'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api-client'
import type { StreamSession } from '@/lib/types'

const emptyForm = {
  name: '',
  signalingServer: '127.0.0.1',
  signalingPort: 49100,
  mediaServer: '',
  mediaPort: 1024,
  width: 1920,
  height: 1080,
  fps: 60,
  streamType: 'local' as 'local' | 'stream',
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
      await api.post('/api/sessions', {
        ...form,
        signalingPort: Number(form.signalingPort),
        mediaPort: Number(form.mediaPort),
        width: Number(form.width),
        height: Number(form.height),
        fps: Number(form.fps),
      })
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
          <p className="page-subtitle">
            管理 Omniverse Kit App Streaming / Isaac Sim 的 WebRTC 連線設定（使用 @nvidia/omniverse-webrtc-streaming-library）。
          </p>
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

            <label className="field">
              <span>串流模式</span>
              <select
                value={form.streamType}
                onChange={(e) => setForm({ ...form, streamType: e.target.value as 'local' | 'stream' })}
              >
                <option value="local">local — 本機 Kit / Isaac Sim livestream</option>
                <option value="stream">stream — 容器化 Kit App Streaming</option>
              </select>
            </label>

            <div className="grid-two">
              <label className="field">
                <span>Signaling Server</span>
                <input value={form.signalingServer} onChange={(e) => setForm({ ...form, signalingServer: e.target.value })} required />
              </label>
              <label className="field">
                <span>Signaling Port</span>
                <input type="number" value={form.signalingPort} onChange={(e) => setForm({ ...form, signalingPort: Number(e.target.value) })} required />
              </label>
            </div>

            <div className="grid-two">
              <label className="field">
                <span>Media Server <em>(留空 = 同 signaling)</em></span>
                <input value={form.mediaServer} onChange={(e) => setForm({ ...form, mediaServer: e.target.value })} placeholder={form.signalingServer} />
              </label>
              <label className="field">
                <span>Media Port</span>
                <input type="number" value={form.mediaPort} onChange={(e) => setForm({ ...form, mediaPort: Number(e.target.value) })} />
              </label>
            </div>

            <div className="grid-two">
              <label className="field">
                <span>解析度寬</span>
                <input type="number" value={form.width} onChange={(e) => setForm({ ...form, width: Number(e.target.value) })} />
              </label>
              <label className="field">
                <span>解析度高</span>
                <input type="number" value={form.height} onChange={(e) => setForm({ ...form, height: Number(e.target.value) })} />
              </label>
            </div>
            <label className="field">
              <span>FPS</span>
              <input type="number" value={form.fps} onChange={(e) => setForm({ ...form, fps: Number(e.target.value) })} />
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
                  <code>
                    {s.streamType} · {s.signalingServer}:{s.signalingPort}
                    {(s.mediaServer && s.mediaServer !== s.signalingServer) || (s.mediaPort && s.mediaPort !== s.signalingPort)
                      ? ` ⇢ ${s.mediaServer}:${s.mediaPort}` : ''}
                  </code>
                </div>
                {s.description && <p className="project-desc">{s.description}</p>}
                <div className="project-meta">
                  <span>{s.width}×{s.height}@{s.fps}fps</span>
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
