import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import EditorPage from './pages/EditorPage'
import LoginPage from './pages/LoginPage'
import SitesListPage from './pages/SitesListPage'
import './App.css'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <SitesListPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/edit/:websiteId"
        element={
          <ProtectedRoute>
            <EditorPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
