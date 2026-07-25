import { Navigate, useLocation } from 'react-router-dom'
import { useAuthUser } from '../lib/auth'

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuthUser()
  const location = useLocation()

  if (loading) return null
  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }
  return children
}
