import { Link } from 'react-router-dom'
import Loading from '../components/Loading'
import { signOutUser, useAuthUser } from '../lib/auth'
import { useOwnedWebsites } from '../lib/websites'

export default function SitesListPage() {
  const { user } = useAuthUser()
  const { websites, loading, error } = useOwnedWebsites(user?.uid)

  return (
    <main className="sites-list-page">
      <header className="page-header">
        <div className="page-header-title">
          <span className="brand-mark">
            <span className="brand-mark-icon">✦</span>
            Website Editor
          </span>
          <h1>Website của bạn</h1>
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
                <span className="site-link-id">{site.id}</span>
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
