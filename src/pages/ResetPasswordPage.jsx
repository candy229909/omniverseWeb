import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import AuthCard from '../components/AuthCard.jsx'
import { resetPassword } from '../services/authService.js'

export default function ResetPasswordPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [token, setToken] = useState(params.get('token') || '')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (password.length < 6) return setError('密碼長度至少需 6 個字元')
    if (password !== confirm) return setError('兩次輸入的密碼不一致')
    setLoading(true)
    try {
      await resetPassword(token.trim(), password)
      setSuccess(true)
      setTimeout(() => navigate('/login'), 1600)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthCard
      title="重設密碼"
      subtitle="請輸入您的重設 token 與新密碼"
      footer={<Link to="/login">回到登入</Link>}
    >
      {success ? (
        <div className="alert alert-success">密碼已重設，正在前往登入頁…</div>
      ) : (
        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="field">
            <span>重設 Token</span>
            <input
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="從信件取得的 token"
              required
            />
          </label>
          <label className="field">
            <span>新密碼</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="至少 6 個字元"
              required
            />
          </label>
          <label className="field">
            <span>確認新密碼</span>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
          </label>
          {error && <div className="alert alert-error">{error}</div>}
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? '處理中…' : '確認重設'}
          </button>
        </form>
      )}
    </AuthCard>
  )
}
