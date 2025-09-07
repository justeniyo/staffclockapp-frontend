import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from '../components/Layout/Layout'
import { useAuth } from '../context/AuthContext'

// Auth
import LoginStaff from '../pages/LoginStaff'
import LoginAdmin from '../pages/LoginAdmin'
import LoginSecurity from '../pages/LoginSecurity'
import LoginCEO from '../pages/LoginCEO'
import ForgotPassword from '../pages/ForgotPassword'
import VerifyResetOTP from '../pages/VerifyResetOTP'
import ResetPassword from '../pages/ResetPassword'
import VerifyAccount from '../pages/VerifyAccount'
import NotFound from '../pages/NotFound'
import IndexPage from '../pages/Index'

// Protected
import { RequireAuth, PermissionGate } from './RequireAuth'
import Clock from '../pages/Staff/Clock'
import StaffDashboard from '../pages/Staff/Dashboard'
import RequestLeave from '../pages/Staff/RequestLeave'
import ManagerDashboard from '../pages/Manager/Dashboard'
import LeaveRequests from '../pages/Manager/LeaveRequests'
import AdminDashboard from '../pages/Admin/Dashboard'
import RegisterStaff from '../pages/Admin/RegisterStaff'
import ManageStaff from '../pages/Admin/ManageStaff'
import ClockActivities from '../pages/Admin/ClockActivities'
import SecurityDashboard from '../pages/Security/Dashboard'
import CEODashboard from '../pages/CEO/Dashboard'

// Unauthorized access page
function UnauthorizedPage() {
  return (
    <div className="login-page login-staff">
      <div className="card login-card">
        <div className="card-header">
          <div className="login-logo">StaffClock</div>
        </div>
        <div className="card-body text-center">
          <div className="mb-4">
            <i className="fas fa-ban fa-3x text-danger mb-3"></i>
            <h3 className="mb-3">Access Denied</h3>
            <p className="text-muted mb-4">
              You don't have permission to access this resource.
            </p>
          </div>
          
          <div className="d-grid gap-2">
            <a href="/" className="btn btn-warning">
              <i className="fas fa-home me-2"></i>
              Return to Dashboard
            </a>
          </div>
          
          <div className="mt-4 pt-3 border-top">
            <small className="text-muted">
              Need access? Contact your system administrator.
            </small>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AppRouter() {
  return (
    <Routes>
      {/* Enhanced Index Page */}
      <Route path="/portal-select" element={<IndexPage />} />

      {/* Public Auth Routes */}
      <Route path="/" element={<LoginStaff />} />
      <Route path="/admin" element={<LoginAdmin />} />
      <Route path="/security" element={<LoginSecurity />} />
      <Route path="/ceo" element={<LoginCEO />} />
      
      {/* Password & Account Management */}
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/verify-reset-otp" element={<VerifyResetOTP />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/verify-account" element={<VerifyAccount />} />
      
      {/* Unauthorized Access */}
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      {/* Staff Routes - Enhanced with permissions */}
      <Route element={<RequireAuth roles={['staff']} />}>
        {/* Core Staff Functionality */}
        <Route path="/clock" element={
          <Layout>
            <PermissionGate permissions={['clock:manage']}>
              <Clock />
            </PermissionGate>
          </Layout>
        } />
        
        <Route path="/staff-dashboard" element={
          <Layout>
            <PermissionGate permissions={['profile:read']}>
              <StaffDashboard />
            </PermissionGate>
          </Layout>
        } />
        
        <Route path="/staff/request-leave" element={
          <Layout>
            <PermissionGate permissions={['leave:request']}>
              <RequestLeave />
            </PermissionGate>
          </Layout>
        } />

        {/* Manager Routes - Enhanced with manager permissions */}
        <Route path="/manager-dashboard" element={
          <RequireAuth roles={['manager']}>
            <Layout variant="manager">
              <PermissionGate permissions={['user:read_team']}>
                <ManagerDashboard />
              </PermissionGate>
            </Layout>
          </RequireAuth>
        } />
        
        <Route path="/manager/leave-requests" element={
          <RequireAuth roles={['manager']}>
            <Layout variant="manager">
              <PermissionGate permissions={['leave:approve_team']}>
                <LeaveRequests />
              </PermissionGate>
            </Layout>
          </RequireAuth>
        } />
      </Route>

      {/* Admin Routes - Enhanced with specific permissions */}
      <Route element={<RequireAuth roles={['admin']} />}>
        <Route path="/admin-dashboard" element={
          <Layout>
            <PermissionGate permissions={['system:configure']}>
              <AdminDashboard />
            </PermissionGate>
          </Layout>
        } />
        
        <Route path="/admin/register-staff" element={
          <Layout>
            <PermissionGate permissions={['user:create']}>
              <RegisterStaff />
            </PermissionGate>
          </Layout>
        } />
        
        <Route path="/admin/manage-staff" element={
          <Layout>
            <PermissionGate permissions={['user:read', 'user:update']}>
              <ManageStaff />
            </PermissionGate>
          </Layout>
        } />
        
        <Route path="/admin/clock-activities" element={
          <Layout>
            <PermissionGate permissions={['activity:read_all']}>
              <ClockActivities />
            </PermissionGate>
          </Layout>
        } />
      </Route>

      {/* Security Routes - Enhanced with location-based permissions */}
      <Route element={<RequireAuth roles={['security']} />}>
        <Route path="/security-dashboard" element={
          <Layout>
            <PermissionGate permissions={['monitoring:site']}>
              <SecurityDashboard />
            </PermissionGate>
          </Layout>
        } />
      </Route>

      {/* CEO Routes - Enhanced with executive permissions */}
      <Route element={<RequireAuth roles={['ceo']} />}>
        <Route path="/ceo-dashboard" element={
          <Layout>
            <PermissionGate permissions={['executive:access']}>
              <CEODashboard />
            </PermissionGate>
          </Layout>
        } />
      </Route>

      {/* Dynamic Redirects Based on User Role */}
      <Route path="/dashboard" element={<DynamicDashboardRedirect />} />

      {/* Legacy redirects */}
      <Route path="/staff" element={<Navigate to="/" replace />} />

      {/* 404 Not Found - must be last */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

// Component for dynamic dashboard redirects based on user role
function DynamicDashboardRedirect() {
  const { user } = useAuth()
  
  if (!user) {
    return <Navigate to="/" replace />
  }
  
  // Redirect based on user's primary role and capabilities
  if (user.role === 'admin') {
    return <Navigate to="/admin-dashboard" replace />
  }
  
  if (user.role === 'security') {
    return <Navigate to="/security-dashboard" replace />
  }
  
  if (user.role === 'staff') {
    // Check for CEO status first
    if (user.subRole === 'ceo') {
      return <Navigate to="/ceo-dashboard" replace />
    }
    
    // Check for manager status
    if (user.isManager) {
      // Executives and high-level managers might prefer manager dashboard
      if (user.subRole === 'executive' || user.subRole === 'manager') {
        return <Navigate to="/manager-dashboard" replace />
      }
    }
    
    // Default to staff dashboard
    return <Navigate to="/staff-dashboard" replace />
  }
  
  // Fallback to main login
  return <Navigate to="/" replace />
}

// Enhanced Hook for navigation helpers
export function useNavigation() {
  const { user } = useAuth()
  
  const getDefaultDashboard = () => {
    if (!user) return '/'
    
    switch (user.role) {
      case 'admin':
        return '/admin-dashboard'
      case 'security':
        return '/security-dashboard'
      case 'staff':
        if (user.subRole === 'ceo') return '/ceo-dashboard'
        if (user.isManager) return '/manager-dashboard'
        return '/staff-dashboard'
      default:
        return '/'
    }
  }
  
  const getAvailableRoutes = () => {
    if (!user) return []
    
    const routes = []
    
    // Common staff routes
    if (user.role === 'staff') {
      routes.push(
        { path: '/clock', label: 'Clock In/Out', icon: 'fa-clock' },
        { path: '/staff-dashboard', label: 'My Dashboard', icon: 'fa-user' },
        { path: '/staff/request-leave', label: 'Request Leave', icon: 'fa-calendar-plus' }
      )
      
      // Manager routes
      if (user.isManager) {
        routes.push(
          { path: '/manager-dashboard', label: 'Team Management', icon: 'fa-users' },
          { path: '/manager/leave-requests', label: 'Leave Approvals', icon: 'fa-calendar-check' }
        )
      }
      
      // CEO routes
      if (user.subRole === 'ceo') {
        routes.push(
          { path: '/ceo-dashboard', label: 'Executive Dashboard', icon: 'fa-crown' }
        )
      }
    }
    
    // Admin routes
    if (user.role === 'admin') {
      routes.push(
        { path: '/admin-dashboard', label: 'Admin Dashboard', icon: 'fa-tachometer-alt' },
        { path: '/admin/register-staff', label: 'Register Staff', icon: 'fa-user-plus' },
        { path: '/admin/manage-staff', label: 'Manage Staff', icon: 'fa-users-cog' },
        { path: '/admin/clock-activities', label: 'Clock Activities', icon: 'fa-clock' }
      )
    }
    
    // Security routes
    if (user.role === 'security') {
      routes.push(
        { path: '/security-dashboard', label: 'Security Dashboard', icon: 'fa-shield-alt' }
      )
    }
    
    return routes
  }
  
  return {
    getDefaultDashboard,
    getAvailableRoutes,
    currentRole: user?.role,
    currentSubRole: user?.subRole,
    isManager: user?.isManager,
    isCEO: user?.subRole === 'ceo'
  }
}