import { useState } from 'react'
import { Link } from 'react-router-dom'
import { changePassword } from '../lib/auth'

const ERROR_MESSAGES = {
  'auth/wrong-password': 'Mật khẩu hiện tại không đúng.',
  'auth/invalid-credential': 'Mật khẩu hiện tại không đúng.',
  'auth/weak-password': 'Mật khẩu mới phải có ít nhất 6 ký tự.',
  'auth/too-many-requests': 'Quá nhiều lần thử. Vui lòng thử lại sau.',
}

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.')
      return
    }
    setSubmitting(true)
    setError(null)
    setSuccess(false)
    try {
      await changePassword(currentPassword, newPassword)
      setSuccess(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setError(ERROR_MESSAGES[err.code] ?? 'Không thể đổi mật khẩu.')
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
          <h1>Đổi mật khẩu</h1>
          <label>
            Mật khẩu hiện tại
            <input
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </label>
          <label>
            Mật khẩu mới
            <input
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={6}
              required
            />
          </label>
          <label>
            Xác nhận mật khẩu mới
            <input
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              minLength={6}
              required
            />
          </label>
          {success && <p className="form-success">Đổi mật khẩu thành công.</p>}
          {error && <p className="form-error">{error}</p>}
          <button type="submit" disabled={submitting}>
            {submitting ? 'Đang lưu...' : 'Đổi mật khẩu'}
          </button>
          <p className="login-switch">
            <Link to="/">Quay lại</Link>
          </p>
        </form>
      </div>
    </main>
  )
}
