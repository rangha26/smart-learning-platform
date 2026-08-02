import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

export function getRoleHomePath(role) {
  const normalized = (role || '').toUpperCase()
  if (normalized === 'ADMIN') {
    return '/admin'
  }
  if (normalized === 'INSTRUCTOR' || normalized === 'TEACHER') {
    return '/teacher'
  }
  return '/student'
}

export function ProtectedRoute({ allowedRoles }) {
  const { user, isAuthenticated } = useAuth()

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = (user.role || '').toUpperCase()
    const isAllowed = allowedRoles.some(
      (role) => role.toUpperCase() === userRole || (role.toUpperCase() === 'TEACHER' && userRole === 'INSTRUCTOR'),
    )

    if (!isAllowed) {
      const fallbackPath = getRoleHomePath(user.role)
      return <Navigate to={fallbackPath} replace />
    }
  }

  return <Outlet />
}
