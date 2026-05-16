import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthCard from '../components/AuthCard.jsx'
import { requestPasswordReset } from '../services/authService.js'

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [info, setInfo] = useState(null)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await requestPasswordReset(email.trim())
      setInfo(res)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthCard
      title="忘記密碼"
      subtitle="輸入註冊時使用的電子郵件，我們將寄送重設連結"
      footer={<Link to="/login">回到登入</Link>}
    >
      {!info ? (
        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="field">
            <span>電子郵件</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </label>
          {error && <div className="alert alert-error">{error}</div>}
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? '送出中…' : '寄送重設連結'}
          </button>
        </form>
      ) : (
        <div className="reset-confirm">
          <div className="alert alert-success">
            若該信箱已註冊，重設密碼指示已寄出，請至信箱查收。
          </div>
          {info.token && (
            <div className="demo-hint">
              <strong>Demo 模式：</strong>請使用此 token 至重設頁面繼續：
              <code>{info.token}</code>
              <button
                className="btn-secondary"
                style={{ marginTop: 12 }}
                onClick={() => navigate(`/reset-password?token=${info.token}`)}
              >
                立即重設密碼
              </button>
            </div>
          )}
        </div>
      )}
    </AuthCard>
  )
}
