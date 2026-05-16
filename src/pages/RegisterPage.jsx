import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthCard from '../components/AuthCard.jsx'
import { useAuth } from '../context/AuthContext.jsx'

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const update = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password.length < 6) return setError('密碼長度至少需 6 個字元')
    if (form.password !== form.confirm) return setError('兩次輸入的密碼不一致')
    setLoading(true)
    try {
      await register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      })
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthCard
      title="建立帳號"
      subtitle="加入 OmniverseWeb，開始管理你的專案"
      footer={
        <span>
          已有帳號？ <Link to="/login">回到登入</Link>
        </span>
      }
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        <label className="field">
          <span>名稱</span>
          <input value={form.name} onChange={update('name')} placeholder="你的顯示名稱" required />
        </label>
        <label className="field">
          <span>電子郵件</span>
          <input type="email" value={form.email} onChange={update('email')} placeholder="you@example.com" required />
        </label>
        <label className="field">
          <span>密碼</span>
          <input type="password" value={form.password} onChange={update('password')} placeholder="至少 6 個字元" required />
        </label>
        <label className="field">
          <span>確認密碼</span>
          <input type="password" value={form.confirm} onChange={update('confirm')} placeholder="再次輸入密碼" required />
        </label>

        {error && <div className="alert alert-error">{error}</div>}

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? '註冊中…' : '建立帳號'}
        </button>
      </form>
    </AuthCard>
  )
}
