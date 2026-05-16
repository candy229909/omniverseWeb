import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import AuthCard from '../components/AuthCard.jsx'
import { useAuth } from '../context/AuthContext.jsx'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const redirectTo = location.state?.from?.pathname || '/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email.trim(), password)
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthCard
      title="登入"
      subtitle="歡迎回來，請輸入您的帳號資訊"
      footer={
        <span>
          還沒有帳號？ <Link to="/register">立即註冊</Link>
        </span>
      }
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
            <button
              type="button"
              className="input-action"
              onClick={() => setShowPwd((v) => !v)}
            >
              {showPwd ? '隱藏' : '顯示'}
            </button>
          </div>
        </label>

        <div className="row-between">
          <Link to="/forgot-password" className="link-muted">忘記密碼？</Link>
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
