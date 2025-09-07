import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { isCEO, isExecutive } from '../config/seedUsers'

export function RequireAuth({ roles, permissions, requireVerification = true, requireActive = true }) {
  const { user, locations, departments } = useAuth()
  const location = useLocation()
  
  // Check if user is logged in
  if (!user) {
    // Store the attempted location for redirect after login
    return <Navigate to="/" state={{ from: location }} replace />
  }

  // Check if account verification is required
  if (requireVerification && !user.verified) {
    return <Navigate to={`/verify-account?email=${user.email}`} replace />
  }

  // Check if active account is required
  if (requireActive && !user.isActive) {
    // Could redirect to a "deactivated account" page
    return <Navigate to="/" replace />
  }

  // Enhanced role checking with hierarchy support
  if (roles && roles.length > 0) {
    const userRole = getUserEffectiveRole(user)
    const hasRequiredRole = roles.some(role => {
      switch (role) {
        case 'staff':
          // Staff includes regular staff, managers, executives, and CEO
          return user.role === 'staff' || userRole === 'staff'
        case 'manager':
          // Manager includes staff with isManager=true, executives, and CEO
          return user.isManager || isExecutive(user) || isCEO(user)
        case 'executive':
          // Executive includes sub-role executives and CEO
          return isExecutive(user) || isCEO(user)
        case 'ceo':
          // CEO specific access
          return isCEO(user)
        case 'admin':
          return user.role === 'admin'
        case 'security':
          return user.role === 'security'
        default:
          return user.role === role
      }
    })

    if (!hasRequiredRole) {
      return <Navigate to="/unauthorized" replace />
    }
  }

  // Enhanced permission checking
  if (permissions && permissions.length > 0) {
    const userPermissions = getUserPermissions(user, locations, departments)
    const hasRequiredPermissions = permissions.every(permission => 
      userPermissions.includes(permission)
    )

    if (!hasRequiredPermissions) {
      return <Navigate to="/unauthorized" replace />
    }
  }

  // Route-specific access control
  const routeAccess = checkRouteAccess(user, location.pathname)
  if (!routeAccess.allowed) {
    return <Navigate to={routeAccess.redirect || "/"} replace />
  }

  return <Outlet />
}

// Helper function to get user's effective role considering hierarchy
function getUserEffectiveRole(user) {
  if (isCEO(user)) return 'ceo'
  if (isExecutive(user)) return 'executive'
  if (user.isManager) return 'manager'
  return user.role
}

// Enhanced permission system based on user role and organizational structure
function getUserPermissions(user, locations, departments) {
  const permissions = []
  
  // Base permissions by role
  switch (user.role) {
    case 'admin':
      permissions.push(
        'user:create', 'user:read', 'user:update', 'user:deactivate',
        'department:create', 'department:read', 'department:update',
        'location:create', 'location:read', 'location:update',
        'activity:read_all', 'reports:generate',
        'system:configure'
      )
      break
      
    case 'security':
      permissions.push(
        'activity:read_site', 'user:read_site', 'monitoring:site',
        'security:alerts', 'access:control'
      )
      break
      
    case 'staff':
      permissions.push(
        'clock:manage', 'leave:request', 'profile:read',
        'activity:read_own', 'leave:read_own'
      )
      
      // Manager additional permissions
      if (user.isManager) {
        permissions.push(
          'leave:approve_team', 'user:read_team', 'activity:read_team',
          'reports:team'
        )
      }
      
      // Executive additional permissions
      if (isExecutive(user)) {
        permissions.push(
          'leave:approve_executive', 'user:read_department',
          'reports:department', 'strategy:view'
        )
      }
      
      // CEO additional permissions
      if (isCEO(user)) {
        permissions.push(
          'leave:approve_all', 'user:read_all', 'activity:read_all',
          'reports:organization', 'strategy:manage', 'executive:access'
        )
      }
      break
  }
  
  // Location-based permissions
  if (user.allowedLocationIds && user.allowedLocationIds.length > 1) {
    permissions.push('location:multi_access')
  }
  
  // Department-based permissions
  const department = user.departmentId ? departments[user.departmentId] : null
  if (department) {
    permissions.push(`department:${department.name.toLowerCase()}:access`)
  }
  
  return permissions
}

// Route-specific access control logic
function checkRouteAccess(user, pathname) {
  // Manager portal access - only for users with manager privileges
  if (pathname.startsWith('/manager')) {
    if (!user.isManager && !isExecutive(user) && !isCEO(user)) {
      return {
        allowed: false,
        redirect: '/staff-dashboard',
        reason: 'Manager privileges required'
      }
    }
  }
  
  // CEO portal access - only for CEO
  if (pathname.startsWith('/ceo')) {
    if (!isCEO(user)) {
      return {
        allowed: false,
        redirect: '/staff-dashboard',
        reason: 'CEO access required'
      }
    }
  }
  
  // Admin portal access - only for admin role
  if (pathname.startsWith('/admin')) {
    if (user.role !== 'admin') {
      return {
        allowed: false,
        redirect: '/staff-dashboard',
        reason: 'Admin role required'
      }
    }
  }
  
  // Security portal access - only for security role
  if (pathname.startsWith('/security')) {
    if (user.role !== 'security') {
      return {
        allowed: false,
        redirect: '/staff-dashboard', 
        reason: 'Security role required'
      }
    }
  }
  
  // Staff routes - require staff role (includes managers, executives, CEO)
  if (pathname.startsWith('/staff') || pathname === '/clock') {
    if (user.role !== 'staff') {
      return {
        allowed: false,
        redirect: `/${user.role}-dashboard`,
        reason: 'Staff access required'
      }
    }
  }
  
  return { allowed: true }
}

// Enhanced component for permission-based rendering
export function PermissionGate({ 
  children, 
  permissions = [], 
  roles = [], 
  fallback = null,
  requireAll = true 
}) {
  const { user, locations, departments } = useAuth()
  
  if (!user) return fallback
  
  // Check roles
  if (roles.length > 0) {
    const userRole = getUserEffectiveRole(user)
    const hasRole = requireAll 
      ? roles.every(role => checkUserRole(user, userRole, role))
      : roles.some(role => checkUserRole(user, userRole, role))
    
    if (!hasRole) return fallback
  }
  
  // Check permissions
  if (permissions.length > 0) {
    const userPermissions = getUserPermissions(user, locations, departments)
    const hasPermissions = requireAll
      ? permissions.every(permission => userPermissions.includes(permission))
      : permissions.some(permission => userPermissions.includes(permission))
    
    if (!hasPermissions) return fallback
  }
  
  return children
}

function checkUserRole(user, userRole, requiredRole) {
  switch (requiredRole) {
    case 'staff':
      return user.role === 'staff' || userRole === 'staff'
    case 'manager':
      return user.isManager || isExecutive(user) || isCEO(user)
    case 'executive':
      return isExecutive(user) || isCEO(user)
    case 'ceo':
      return isCEO(user)
    case 'admin':
      return user.role === 'admin'
    case 'security':
      return user.role === 'security'
    default:
      return user.role === requiredRole
  }
}

// Hook for checking permissions in components
export function usePermissions() {
  const { user, locations, departments } = useAuth()
  
  const hasPermission = (permission) => {
    if (!user) return false
    const permissions = getUserPermissions(user, locations, departments)
    return permissions.includes(permission)
  }
  
  const hasRole = (role) => {
    if (!user) return false
    const userRole = getUserEffectiveRole(user)
    return checkUserRole(user, userRole, role)
  }
  
  const hasAnyRole = (roles) => {
    return roles.some(role => hasRole(role))
  }
  
  const hasAnyPermission = (permissions) => {
    return permissions.some(permission => hasPermission(permission))
  }
  
  return {
    hasPermission,
    hasRole,
    hasAnyRole,
    hasAnyPermission,
    userRole: user ? getUserEffectiveRole(user) : null,
    permissions: user ? getUserPermissions(user, locations, departments) : []
  }
}