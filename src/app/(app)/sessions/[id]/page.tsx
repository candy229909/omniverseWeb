'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api-client'
import WebRTCViewer from '@/components/WebRTCViewer'
import type { StreamSession } from '@/lib/types'

type FormState = {
  name: string
  signalingServer: string
  signalingPort: number
  mediaServer: string
  mediaPort: number
  width: number
  height: number
  fps: number
  streamType: 'local' | 'stream'
  description: string
}

export default function SessionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { user, isAdmin } = useAuth()
  const [session, setSession] = useState<StreamSession | null>(null)
  const [form, setForm] = useState<FormState | null>(null)
  const [error, setError] = useState('')
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const s = await api.get<StreamSession>(`/api/sessions/${id}`)
        if (!alive) return
        setSession(s)
        setForm({
          name: s.name,
          signalingServer: s.signalingServer,
          signalingPort: s.signalingPort,
          mediaServer: s.mediaServer || '',
          mediaPort: s.mediaPort,
          width: s.width,
          height: s.height,
          fps: s.fps,
          streamType: s.streamType,
          description: s.description || '',
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : '載入失敗')
      }
    })()
    return () => { alive = false }
  }, [id])

  if (error) return <div className="page"><div className="alert alert-error">{error}</div></div>
  if (!session || !form || !user) return <div className="page"><div className="empty-state">載入中…</div></div>

  const canEdit = isAdmin || session.ownerId === user.id

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMsg(null)
    try {
      const updated = await api.patch<StreamSession>(`/api/sessions/${id}`, {
        ...form,
        signalingPort: Number(form.signalingPort),
        mediaPort: Number(form.mediaPort),
        width: Number(form.width),
        height: Number(form.height),
        fps: Number(form.fps),
      })
      setSession(updated)
      setMsg('Session 已更新')
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新失敗')
    }
  }

  const remove = async () => {
    if (!confirm(`確定要刪除 session「${session.name}」？`)) return
    await api.delete(`/api/sessions/${id}`)
    router.replace('/sessions')
  }

  const handleConnected = async () => {
    const updated = await api.patch<StreamSession>(`/api/sessions/${id}`, { lastConnectedAt: 'now' })
    setSession(updated)
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <Link href="/sessions" className="link-muted">← 回 Session 列表</Link>
          <h1>{session.name}</h1>
          <p className="page-subtitle">
            <code>
              {session.streamType} · signaling {session.signalingServer}:{session.signalingPort} · media {session.mediaServer || session.signalingServer}:{session.mediaPort}
            </code>
          </p>
        </div>
        {canEdit && <button className="btn-link danger" onClick={remove}>刪除 Session</button>}
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
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} disabled={!canEdit} required />
          </label>
          <label className="field">
            <span>串流模式</span>
            <select
              value={form.streamType}
              onChange={(e) => setForm({ ...form, streamType: e.target.value as 'local' | 'stream' })}
              disabled={!canEdit}
            >
              <option value="local">local — 本機 Kit / Isaac Sim livestream</option>
              <option value="stream">stream — 容器化 Kit App Streaming</option>
            </select>
          </label>
          <div className="grid-two">
            <label className="field">
              <span>Signaling Server</span>
              <input value={form.signalingServer} onChange={(e) => setForm({ ...form, signalingServer: e.target.value })} disabled={!canEdit} required />
            </label>
            <label className="field">
              <span>Signaling Port</span>
              <input type="number" value={form.signalingPort} onChange={(e) => setForm({ ...form, signalingPort: Number(e.target.value) })} disabled={!canEdit} required />
            </label>
          </div>
          <div className="grid-two">
            <label className="field">
              <span>Media Server</span>
              <input value={form.mediaServer} onChange={(e) => setForm({ ...form, mediaServer: e.target.value })} disabled={!canEdit} placeholder={form.signalingServer} />
            </label>
            <label className="field">
              <span>Media Port</span>
              <input type="number" value={form.mediaPort} onChange={(e) => setForm({ ...form, mediaPort: Number(e.target.value) })} disabled={!canEdit} />
            </label>
          </div>
          <div className="grid-two">
            <label className="field">
              <span>解析度寬</span>
              <input type="number" value={form.width} onChange={(e) => setForm({ ...form, width: Number(e.target.value) })} disabled={!canEdit} />
            </label>
            <label className="field">
              <span>解析度高</span>
              <input type="number" value={form.height} onChange={(e) => setForm({ ...form, height: Number(e.target.value) })} disabled={!canEdit} />
            </label>
          </div>
          <label className="field">
            <span>FPS</span>
            <input type="number" value={form.fps} onChange={(e) => setForm({ ...form, fps: Number(e.target.value) })} disabled={!canEdit} />
          </label>
          <label className="field">
            <span>描述</span>
            <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} disabled={!canEdit} />
          </label>
          {error && <div className="alert alert-error">{error}</div>}
          {msg && <div className="alert alert-success">{msg}</div>}
          {canEdit && <button type="submit" className="btn-primary">儲存變更</button>}
        </form>
      </section>
    </div>
  )
}
