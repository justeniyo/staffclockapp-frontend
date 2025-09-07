import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { isCEO } from '../config/seedUsers'

export function RequireAuth({ roles, requireCEO = false }) {
  const { user } = useAuth()
  
  if (!user) return <Navigate to="/" replace />
  
  // Handle CEO-specific routes
  if (requireCEO) {
    if (!isCEO(user)) {
      return <Navigate to="/" replace />
    }
    return <Outlet />
  }
  
  // Handle regular role-based access
  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />
  }
  
  return <Outlet />
}