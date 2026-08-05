import { useState } from 'react'
import { Link } from 'react-router-dom'
import { resetPassword } from '../lib/auth'

const ERROR_MESSAGES = {
  'auth/invalid-email': 'Email không hợp lệ.',
  'auth/user-not-found': 'Không tìm thấy tài khoản với email này.',
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await resetPassword(email)
      setSent(true)
    } catch (err) {
      setError(ERROR_MESSAGES[err.code] ?? 'Không thể gửi email đặt lại mật khẩu.')
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
        {sent ? (
          <div className="login-form">
            <h1>Kiểm tra email của bạn</h1>
            <p className="login-subtitle">
              Chúng tôi đã gửi liên kết đặt lại mật khẩu đến <strong>{email}</strong>.
            </p>
            <p className="login-switch">
              <Link to="/login">Quay lại đăng nhập</Link>
            </p>
          </div>
        ) : (
          <form className="login-form" onSubmit={handleSubmit}>
            <h1>Quên mật khẩu</h1>
            <p className="login-subtitle">
              Nhập email để nhận liên kết đặt lại mật khẩu
            </p>
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
            {error && <p className="form-error">{error}</p>}
            <button type="submit" disabled={submitting}>
              {submitting ? 'Đang gửi...' : 'Gửi liên kết đặt lại mật khẩu'}
            </button>
            <p className="login-switch">
              <Link to="/login">Quay lại đăng nhập</Link>
            </p>
          </form>
        )}
      </div>
    </main>
  )
}
