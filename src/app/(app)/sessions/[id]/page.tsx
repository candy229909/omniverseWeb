'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api-client'
import WebRTCViewer from '@/components/WebRTCViewer'
import type { StreamSession } from '@/lib/types'

export default function SessionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { user, isAdmin } = useAuth()
  const [session, setSession] = useState<StreamSession | null>(null)
  const [form, setForm] = useState<{ name: string; host: string; port: number; signalingPath: string; secure: boolean; description: string } | null>(null)
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
          host: s.host,
          port: s.port,
          signalingPath: s.signalingPath || '',
          secure: !!s.secure,
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
      const updated = await api.patch<StreamSession>(`/api/sessions/${id}`, { ...form, port: Number(form.port) })
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
            <code>{session.secure ? 'wss' : 'ws'}://{session.host}:{session.port}{session.signalingPath || ''}</code>
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
          <div className="grid-two">
            <label className="field">
              <span>Host</span>
              <input value={form.host} onChange={(e) => setForm({ ...form, host: e.target.value })} disabled={!canEdit} required />
            </label>
            <label className="field">
              <span>Port</span>
              <input type="number" value={form.port} onChange={(e) => setForm({ ...form, port: Number(e.target.value) })} disabled={!canEdit} required />
            </label>
          </div>
          <label className="field">
            <span>Signaling 路徑</span>
            <input value={form.signalingPath} onChange={(e) => setForm({ ...form, signalingPath: e.target.value })} disabled={!canEdit} />
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
