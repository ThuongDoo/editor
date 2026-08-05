import { useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { signUp, useAuthUser } from '../lib/auth'

const ERROR_MESSAGES = {
  'auth/email-already-in-use': 'Email này đã được sử dụng.',
  'auth/invalid-email': 'Email không hợp lệ.',
  'auth/weak-password': 'Mật khẩu phải có ít nhất 6 ký tự.',
}

export default function SignupPage() {
  const { user, loading: authLoading } = useAuthUser()
  const location = useLocation()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  if (!authLoading && user) {
    if (!user.emailVerified) return <Navigate to="/verify-email" replace />
    const from = location.state?.from ?? '/'
    return <Navigate to={from} replace />
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      await signUp(email, password, name)
    } catch (err) {
      setError(ERROR_MESSAGES[err.code] ?? 'Không thể tạo tài khoản.')
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
          <h1>Tạo tài khoản</h1>
          <p className="login-subtitle">Bắt đầu quản lý nội dung website của bạn</p>
          <label>
            Họ và tên
            <input
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>
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
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />
          </label>
          <label>
            Xác nhận mật khẩu
            <input
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              minLength={6}
              required
            />
          </label>
          {error && <p className="form-error">{error}</p>}
          <button type="submit" disabled={submitting}>
            {submitting ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}
          </button>
          <p className="login-switch">
            Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
          </p>
        </form>
      </div>
    </main>
  )
}
