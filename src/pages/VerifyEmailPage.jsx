import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import {
  refreshUser,
  resendVerificationEmail,
  signOutUser,
  useAuthUser,
} from '../lib/auth'

export default function VerifyEmailPage() {
  const { user, loading: authLoading } = useAuthUser()
  const navigate = useNavigate()
  const [checking, setChecking] = useState(false)
  const [resent, setResent] = useState(false)
  const [error, setError] = useState(null)

  if (!authLoading && !user) {
    return <Navigate to="/login" replace />
  }
  if (!authLoading && user?.emailVerified) {
    return <Navigate to="/" replace />
  }

  async function handleCheck() {
    setChecking(true)
    setError(null)
    try {
      const refreshed = await refreshUser()
      if (refreshed?.emailVerified) {
        navigate('/', { replace: true })
      } else {
        setError('Email vẫn chưa được xác thực. Hãy kiểm tra hộp thư của bạn.')
      }
    } catch {
      setError('Không thể kiểm tra trạng thái xác thực.')
    } finally {
      setChecking(false)
    }
  }

  async function handleResend() {
    setError(null)
    setResent(false)
    try {
      await resendVerificationEmail()
      setResent(true)
    } catch {
      setError('Không thể gửi lại email xác thực.')
    }
  }

  return (
    <main className="login-page">
      <div className="login-card">
        <span className="brand-mark">
          <span className="brand-mark-icon">✦</span>
          Website Editor
        </span>
        <div className="login-form">
          <h1>Xác thực email</h1>
          <p className="login-subtitle">
            Chúng tôi đã gửi một email xác thực đến{' '}
            <strong>{user?.email}</strong>. Vui lòng mở email và bấm vào liên
            kết xác thực, sau đó quay lại đây.
          </p>
          {resent && <p className="form-success">Đã gửi lại email xác thực.</p>}
          {error && <p className="form-error">{error}</p>}
          <button type="button" onClick={handleCheck} disabled={checking}>
            {checking ? 'Đang kiểm tra...' : 'Tôi đã xác thực'}
          </button>
          <button type="button" onClick={handleResend}>
            Gửi lại email xác thực
          </button>
          <button type="button" onClick={() => signOutUser()}>
            Đăng xuất
          </button>
        </div>
      </div>
    </main>
  )
}
