'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import AuthCard from '@/components/AuthCard'
import { useAuth } from '@/context/AuthContext'

export default function LoginPage() {
  const { login } = useAuth()
  const router = useRouter()
  const params = useSearchParams()
  const next = params.get('next') || '/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email.trim(), password)
      router.replace(next)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : '登入失敗')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthCard
      title="登入"
      subtitle="歡迎回來，請輸入您的帳號資訊"
      footer={<span>還沒有帳號？ <Link href="/register">立即註冊</Link></span>}
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        <label className="field">
          <span>電子郵件</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            required
          />
        </label>
        <label className="field">
          <span>密碼</span>
          <div className="input-with-action">
            <input
              type={showPwd ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="輸入密碼"
              autoComplete="current-password"
              required
            />
            <button type="button" className="input-action" onClick={() => setShowPwd((v) => !v)}>
              {showPwd ? '隱藏' : '顯示'}
            </button>
          </div>
        </label>
        <div className="row-between">
          <Link href="/forgot-password" className="link-muted">忘記密碼？</Link>
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? '登入中…' : '登入'}
        </button>
        <div className="demo-hint">
          測試帳號：<code>admin@omniverse.web / admin123</code>
        </div>
      </form>
    </AuthCard>
  )
}
