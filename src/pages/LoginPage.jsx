import { useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { signIn, useAuthUser } from '../lib/auth'

export default function LoginPage() {
  const { user, loading: authLoading } = useAuthUser()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  if (!authLoading && user) {
    const from = location.state?.from ?? '/'
    return <Navigate to={from} replace />
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await signIn(email, password)
    } catch {
      setError('Sai email hoặc mật khẩu.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="login-page">
      <div className="login-card">
        <span className="brand-mark">
          <span className="brand-mark-icon">✦</span>
          Website Editor
        </span>
        <form className="login-form" onSubmit={handleSubmit}>
          <h1>Đăng nhập</h1>
          <p className="login-subtitle">Quản lý nội dung website của bạn</p>
          <label>
            Email
            <input
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label>
            Mật khẩu
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          {error && <p className="form-error">{error}</p>}
          <button type="submit" disabled={submitting}>
            {submitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>
      </div>
    </main>
  )
}
