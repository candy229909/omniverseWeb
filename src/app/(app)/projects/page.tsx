'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api-client'
import type { Project } from '@/lib/types'

export default function ProjectsPage() {
  const { user, isAdmin } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', status: 'planning' })
  const [error, setError] = useState('')

  const refresh = async () => {
    setLoading(true)
    setProjects(await api.get<Project[]>('/api/projects'))
    setLoading(false)
  }

  useEffect(() => { refresh() }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!form.name.trim()) return setError('專案名稱不可為空')
    try {
      await api.post('/api/projects', form)
      setForm({ name: '', description: '', status: 'planning' })
      setShowForm(false)
      refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : '建立失敗')
    }
  }

  const remove = async (p: Project) => {
    if (!confirm(`確定要刪除專案「${p.name}」？`)) return
    await api.delete(`/api/projects/${p.id}`)
    refresh()
  }

  if (!user) return null

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>專案管理</h1>
          <p className="page-subtitle">建立、追蹤並管理你的 Omniverse 專案。</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm((v) => !v)}>
          {showForm ? '取消' : '+ 建立專案'}
        </button>
      </div>

      {showForm && (
        <section className="card">
          <div className="card-header"><h2>新增專案</h2></div>
          <form className="form" onSubmit={submit}>
            <label className="field">
              <span>名稱</span>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </label>
            <label className="field">
              <span>描述</span>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </label>
            <label className="field">
              <span>狀態</span>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="planning">規劃中</option>
                <option value="active">進行中</option>
                <option value="paused">暫停</option>
                <option value="completed">已完成</option>
              </select>
            </label>
            {error && <div className="alert alert-error">{error}</div>}
            <button type="submit" className="btn-primary">建立</button>
          </form>
        </section>
      )}

      <section className="card">
        <div className="card-header"><h2>所有專案</h2></div>
        {loading ? (
          <div className="empty-state">載入中…</div>
        ) : projects.length === 0 ? (
          <div className="empty-state">尚無專案，點擊上方按鈕建立第一個。</div>
        ) : (
          <div className="project-grid">
            {projects.map((p) => (
              <div key={p.id} className="project-card">
                <div className="project-card-head">
                  <Link href={`/projects/${p.id}`} className="project-name">{p.name}</Link>
                  <span className={`badge badge-${p.status}`}>{p.status}</span>
                </div>
                <p className="project-desc">{p.description || '（無描述）'}</p>
                <div className="project-meta">
                  <span>成員 {p.members.length}</span>
                  <span>建立於 {new Date(p.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="project-actions">
                  <Link href={`/projects/${p.id}`} className="btn-link">查看 / 編輯</Link>
                  {(isAdmin || p.ownerId === user.id) && (
                    <button className="btn-link danger" onClick={() => remove(p)}>刪除</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
