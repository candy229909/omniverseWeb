'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api-client'
import type { User } from '@/lib/types'

type FormState = {
  name: string
  email: string
  password: string
  role: 'user' | 'admin'
  status: 'active' | 'disabled'
}

const emptyForm: FormState = { name: '', email: '', password: '', role: 'user', status: 'active' }

export default function AdminPage() {
  const { user: me } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<User | 'new' | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')

  const refresh = async () => {
    setLoading(true)
    setUsers(await api.get<User[]>('/api/users'))
    setLoading(false)
  }

  useEffect(() => { refresh() }, [])

  const startNew = () => {
    setEditing('new')
    setForm(emptyForm)
    setError('')
  }

  const startEdit = (u: User) => {
    setEditing(u)
    setForm({
      name: u.name,
      email: u.email,
      role: u.role as 'user' | 'admin',
      status: u.status as 'active' | 'disabled',
      password: '',
    })
    setError('')
  }

  const closeEdit = () => {
    setEditing(null)
    setError('')
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      if (editing === 'new') {
        if (!form.password || form.password.length < 6) {
          setError('密碼至少需 6 個字元')
          return
        }
        await api.post('/api/users', form)
      } else if (editing) {
        const updates: Partial<FormState> = {
          name: form.name,
          email: form.email,
          role: form.role,
          status: form.status,
        }
        if (form.password) updates.password = form.password
        await api.patch(`/api/users/${editing.id}`, updates)
      }
      await refresh()
      closeEdit()
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失敗')
    }
  }

  const remove = async (u: User) => {
    if (u.id === me?.id) return alert('無法刪除自己的帳號')
    if (!confirm(`確定要刪除使用者「${u.name}」？`)) return
    await api.delete(`/api/users/${u.id}`)
    refresh()
  }

  const toggleStatus = async (u: User) => {
    await api.patch(`/api/users/${u.id}`, { status: u.status === 'active' ? 'disabled' : 'active' })
    refresh()
  }

  const filtered = users.filter((u) => {
    if (!query) return true
    const q = query.toLowerCase()
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
  })

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>系統管理</h1>
          <p className="page-subtitle">管理 OmniverseWeb 全部使用者帳號與權限。</p>
        </div>
        <button className="btn-primary" onClick={startNew}>+ 新增使用者</button>
      </div>

      <section className="card">
        <div className="card-header">
          <h2>使用者列表</h2>
          <input
            className="search-input"
            placeholder="搜尋名稱或 Email…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="empty-state">載入中…</div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>名稱</th>
                  <th>Email</th>
                  <th>角色</th>
                  <th>狀態</th>
                  <th>建立時間</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id}>
                    <td>{u.name} {u.id === me?.id && <span className="tag-self">(您)</span>}</td>
                    <td>{u.email}</td>
                    <td><span className={`badge badge-${u.role}`}>{u.role === 'admin' ? '管理員' : '使用者'}</span></td>
                    <td><span className={`badge badge-${u.status}`}>{u.status === 'active' ? '啟用' : '停用'}</span></td>
                    <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="row-actions">
                      <button className="btn-link" onClick={() => startEdit(u)}>編輯</button>
                      <button className="btn-link" onClick={() => toggleStatus(u)}>
                        {u.status === 'active' ? '停用' : '啟用'}
                      </button>
                      <button className="btn-link danger" onClick={() => remove(u)}>刪除</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {editing && (
        <div className="modal-backdrop" onClick={closeEdit}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editing === 'new' ? '新增使用者' : `編輯：${editing.name}`}</h2>
            <form className="form" onSubmit={submit}>
              <label className="field">
                <span>名稱</span>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </label>
              <label className="field">
                <span>電子郵件</span>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </label>
              <label className="field">
                <span>密碼 {editing !== 'new' && <em>(留空表示不變更)</em>}</span>
                <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              </label>
              <div className="grid-two">
                <label className="field">
                  <span>角色</span>
                  <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as 'user' | 'admin' })}>
                    <option value="user">使用者</option>
                    <option value="admin">管理員</option>
                  </select>
                </label>
                <label className="field">
                  <span>狀態</span>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as 'active' | 'disabled' })}>
                    <option value="active">啟用</option>
                    <option value="disabled">停用</option>
                  </select>
                </label>
              </div>
              {error && <div className="alert alert-error">{error}</div>}
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={closeEdit}>取消</button>
                <button type="submit" className="btn-primary">儲存</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
