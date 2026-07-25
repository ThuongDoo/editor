import { Link } from 'react-router-dom'
import { signOutUser, useAuthUser } from '../lib/auth'
import { useOwnedWebsites } from '../lib/websites'

export default function SitesListPage() {
  const { user } = useAuthUser()
  const { websites, loading, error } = useOwnedWebsites(user?.uid)

  return (
    <main className="sites-list-page">
      <header className="page-header">
        <h1>Website của bạn</h1>
        <button type="button" onClick={signOutUser}>
          Đăng xuất
        </button>
      </header>

      {loading && <p>Đang tải...</p>}
      {error && <p className="form-error">Không tải được danh sách website.</p>}
      {!loading && !error && websites.length === 0 && (
        <p>Chưa có website nào được gán cho tài khoản này.</p>
      )}

      <ul className="sites-list">
        {websites.map((site) => (
          <li key={site.id}>
            <Link to={`/edit/${site.id}`}>{site.id}</Link>
          </li>
        ))}
      </ul>
    </main>
  )
}
