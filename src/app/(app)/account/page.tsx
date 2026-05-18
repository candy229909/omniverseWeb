'use client'

import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'

export default function AccountPage() {
  const { user, updateProfile, changePassword } = useAuth()
  const [profile, setProfile] = useState({ name: user?.name || '', email: user?.email || '' })
  const [profileMsg, setProfileMsg] = useState<string | null>(null)
  const [profileErr, setProfileErr] = useState('')

  const [pwd, setPwd] = useState({ current: '', next: '', confirm: '' })
  const [pwdMsg, setPwdMsg] = useState<string | null>(null)
  const [pwdErr, setPwdErr] = useState('')

  if (!user) return null

  const handleProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setProfileMsg(null)
    setProfileErr('')
    try {
      await updateProfile({ name: profile.name, email: profile.email })
      setProfileMsg('個人資料已更新')
    } catch (err) {
      setProfileErr(err instanceof Error ? err.message : '更新失敗')
    }
  }

  const handlePwd = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwdMsg(null)
    setPwdErr('')
    if (pwd.next.length < 6) return setPwdErr('新密碼至少需 6 個字元')
    if (pwd.next !== pwd.confirm) return setPwdErr('兩次輸入的新密碼不一致')
    try {
      await changePassword(pwd.current, pwd.next)
      setPwdMsg('密碼已更新')
      setPwd({ current: '', next: '', confirm: '' })
    } catch (err) {
      setPwdErr(err instanceof Error ? err.message : '變更失敗')
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>帳號設定</h1>
        <p className="page-subtitle">管理你的個人資料與安全性設定。</p>
      </div>

      <div className="grid-two">
        <section className="card">
          <div className="card-header"><h2>個人資料</h2></div>
          <form className="form" onSubmit={handleProfile}>
            <label className="field">
              <span>名稱</span>
              <input
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                required
              />
            </label>
            <label className="field">
              <span>電子郵件</span>
              <input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                required
              />
            </label>
            <label className="field">
              <span>角色</span>
              <input value={user.role === 'admin' ? '管理員' : '使用者'} disabled />
            </label>
            {profileErr && <div className="alert alert-error">{profileErr}</div>}
            {profileMsg && <div className="alert alert-success">{profileMsg}</div>}
            <button type="submit" className="btn-primary">儲存變更</button>
          </form>
        </section>

        <section className="card">
          <div className="card-header"><h2>變更密碼</h2></div>
          <form className="form" onSubmit={handlePwd}>
            <label className="field">
              <span>目前密碼</span>
              <input
                type="password"
                value={pwd.current}
                onChange={(e) => setPwd({ ...pwd, current: e.target.value })}
                required
              />
            </label>
            <label className="field">
              <span>新密碼</span>
              <input
                type="password"
                value={pwd.next}
                onChange={(e) => setPwd({ ...pwd, next: e.target.value })}
                required
              />
            </label>
            <label className="field">
              <span>確認新密碼</span>
              <input
                type="password"
                value={pwd.confirm}
                onChange={(e) => setPwd({ ...pwd, confirm: e.target.value })}
                required
              />
            </label>
            {pwdErr && <div className="alert alert-error">{pwdErr}</div>}
            {pwdMsg && <div className="alert alert-success">{pwdMsg}</div>}
            <button type="submit" className="btn-primary">更新密碼</button>
          </form>
        </section>
      </div>
    </div>
  )
}
