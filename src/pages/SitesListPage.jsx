import { useState } from 'react'
import { Link } from 'react-router-dom'
import Loading from '../components/Loading'
import { signOutUser, useAuthUser } from '../lib/auth'
import { useOwnedWebsites } from '../lib/websites'

export default function SitesListPage() {
  const { user } = useAuthUser()
  const { websites, loading, error } = useOwnedWebsites(user?.uid)
  const [copiedId, setCopiedId] = useState(null)

  // Bấm vào web id chỉ copy, không điều hướng — chặn hành vi mặc định của
  // <Link> bao ngoài bằng preventDefault/stopPropagation trên chính span này.
  async function copyWebsiteId(e, id) {
    e.preventDefault()
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(id)
      setCopiedId(id)
      setTimeout(() => setCopiedId((current) => (current === id ? null : current)), 1500)
    } catch {
      // Clipboard API không khả dụng (context không an toàn, trình duyệt cũ...) — bỏ qua.
    }
  }

  return (
    <main className="sites-list-page">
      <header className="page-header">
        <div className="page-header-title">
          <span className="brand-mark">
            <span className="brand-mark-icon">✦</span>
            Website Editor
          </span>
          <h1>Website của bạn</h1>
          {user && (
            <p className="page-header-user">
              {user.displayName ?? user.email}
              <span className="page-header-user-id"> · UID: {user.uid}</span>
            </p>
          )}
        </div>
        <div className="page-header-actions">
          <Link to="/change-password">Đổi mật khẩu</Link>
          <button type="button" onClick={signOutUser}>
            Đăng xuất
          </button>
        </div>
      </header>

      {loading && <Loading />}
      {error && <p className="form-error">Không tải được danh sách website.</p>}
      {!loading && !error && websites.length === 0 && (
        <p>Chưa có website nào được gán cho tài khoản này.</p>
      )}

      <ul className="sites-list">
        {websites.map((site) => (
          <li key={site.id}>
            <Link to={`/edit/${site.id}`}>
              <span className="site-link-info">
                <span
                  className="site-link-id"
                  role="button"
                  tabIndex={0}
                  onClick={(e) => copyWebsiteId(e, site.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') copyWebsiteId(e, site.id)
                  }}
                  title="Bấm để copy website id"
                >
                  {site.id}
                  {copiedId === site.id && <span className="copied-badge">Đã copy!</span>}
                </span>
                {site.templateId && (
                  <span className="site-link-template">Template: {site.templateId}</span>
                )}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  )
}
