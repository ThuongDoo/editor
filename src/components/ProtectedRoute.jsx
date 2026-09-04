import { Navigate, useLocation } from 'react-router-dom'
import { useAuthUser, useUserRole } from '../lib/auth'

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuthUser()
  const location = useLocation()
  // Passing `null` when `adminOnly` is false skips the Firestore
  // subscription inside the hook — it still needs to be called
  // unconditionally to satisfy the rules of hooks.
  const { role, loading: roleLoading } = useUserRole(adminOnly ? user?.uid : null)

  if (loading) return null
  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }
  if (!user.emailVerified) {
    return <Navigate to="/verify-email" replace />
  }
  if (adminOnly) {
    if (roleLoading) return null
    if (role !== 'admin') return <Navigate to="/" replace />
  }
  return children
}
