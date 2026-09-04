import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Loading from '../components/Loading'
import { signOutUser, useAuthUser, useUserRole } from '../lib/auth'
import { useWebsiteDomains } from '../lib/domains'
import { useOwnedWebsites } from '../lib/websites'

export default function SitesListPage() {
  const { user } = useAuthUser()
  const { websites, loading, error } = useOwnedWebsites(user?.uid)
  const { role } = useUserRole(user?.uid)
  const [copiedId, setCopiedId] = useState(null)
  const [search, setSearch] = useState('')

  const websiteIds = useMemo(() => websites.map((site) => site.id), [websites])
  const { domainsById } = useWebsiteDomains(websiteIds)
  const connectedCount = websiteIds.filter((id) => domainsById[id]).length

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return websites
    return websites.filter(
      (site) =>
        site.id.toLowerCase().includes(term) ||
        site.templateId?.toLowerCase().includes(term) ||
        domainsById[site.id]?.domain?.toLowerCase().includes(term),
    )
  }, [websites, search, domainsById])

  // Dùng chung cho web id (trong thẻ, bấm chỉ copy không điều hướng — chặn
  // hành vi mặc định của <Link> bao ngoài bằng preventDefault/stopPropagation
  // trên chính span này) và UID tài khoản ở header.
  async function copyText(e, text) {
    e.preventDefault()
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(text)
      setTimeout(() => setCopiedId((current) => (current === text ? null : current)), 1500)
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
            Nayva
          </span>
          <h1>Website của bạn</h1>
          {user && (
            <p className="page-header-user">
              {user.displayName ?? user.email}
              {' · UID: '}
              <span
                className="page-header-user-id"
                role="button"
                tabIndex={0}
                onClick={(e) => copyText(e, user.uid)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') copyText(e, user.uid)
                }}
                title="Bấm để copy UID"
              >
                {user.uid}
              </span>
              {copiedId === user.uid && <span className="copied-badge">Đã copy!</span>}
            </p>
          )}
        </div>
        <div className="page-header-actions">
          {role === 'admin' && <Link to="/templates/new">+ Tạo template mới</Link>}
          <Link to="/change-password">Đổi mật khẩu</Link>
          <button type="button" onClick={signOutUser}>
            Đăng xuất
          </button>
        </div>
      </header>

      <div className="dashboard-body">
        {loading && <Loading />}
        {error && <p className="form-error">Không tải được danh sách website.</p>}

        {!loading && !error && websites.length === 0 && (
          <div className="empty-state">
            <span className="empty-state-icon">🌐</span>
            <p>Chưa có website nào được gán cho tài khoản này.</p>
            <p className="empty-state-hint">
              Liên hệ quản trị viên nayva.vn để được khởi tạo website đầu tiên.
            </p>
          </div>
        )}

        {!loading && !error && websites.length > 0 && (
          <>
            <div className="dashboard-stats">
              <div className="stat-card">
                <span className="stat-value">{websites.length}</span>
                <span className="stat-label">Website</span>
              </div>
              <div className="stat-card">
                <span className="stat-value">{connectedCount}</span>
                <span className="stat-label">Đã gắn tên miền</span>
              </div>
            </div>

            {websites.length > 5 && (
              <input
                type="search"
                className="sites-search"
                placeholder="Tìm theo id, template hoặc tên miền..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            )}

            {filtered.length === 0 ? (
              <p className="empty-state-hint">Không tìm thấy website phù hợp.</p>
            ) : (
              <ul className="sites-grid">
                {filtered.map((site) => {
                  const domain = domainsById[site.id]
                  return (
                    <li key={site.id}>
                      <Link to={`/edit/${site.id}`} className="site-card">
                        <span className="site-card-top">
                          <span className="site-card-icon" aria-hidden="true">
                            🌐
                          </span>
                          {domain ? (
                            <span className="domain-badge">{domain.domain}</span>
                          ) : (
                            <span className="domain-badge domain-badge-empty">
                              Chưa gắn tên miền
                            </span>
                          )}
                        </span>

                        <span className="site-link-info">
                          <span
                            className="site-link-id"
                            role="button"
                            tabIndex={0}
                            onClick={(e) => copyText(e, site.id)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') copyText(e, site.id)
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

                        <span className="site-card-cta">
                          Mở chỉnh sửa <span aria-hidden="true">&rarr;</span>
                        </span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </>
        )}
      </div>
    </main>
  )
}
