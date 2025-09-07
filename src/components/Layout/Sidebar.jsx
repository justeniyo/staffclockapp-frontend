import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { isCEO } from '../../config/seedUsers'

export default function Sidebar({ variant='staff' }) {
  const { user, leaveRequests } = useAuth()
  const navCls = ({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`

  // Count pending leave requests for managers
  const pendingCount = variant === 'manager' 
    ? leaveRequests.filter(req => req.status === 'pending' && req.manager === user?.email).length
    : 0

  // UPDATED: Get role display name with CEO support
  const getRoleDisplayName = () => {
    if (variant === 'manager') {
      return isCEO(user) ? 'CEO • Manager Mode' : 'Manager'
    }
    
    if (isCEO(user)) {
      return 'CEO'
    }
    
    const roleNames = {
      staff: 'Staff',
      admin: 'Admin',
      security: 'Security'
    }
    return roleNames[user?.role] || 'Menu'
  }

  // UPDATED: Get relevant navigation items based on role and variant
  const getNavigationItems = () => {
    if (variant === 'manager') {
      return (
        <>
          <NavLink to="/manager-dashboard" className={navCls}>
            <i className="fas fa-tachometer-alt me-2"></i>
            Dashboard
          </NavLink>
          <NavLink to="/manager/leave-requests" className={navCls}>
            <i className="fas fa-calendar-check me-2"></i>
            Leave Requests
            {pendingCount > 0 && (
              <span className="badge bg-warning text-dark ms-2">{pendingCount}</span>
            )}
          </NavLink>
          
          {/* CEO can access additional portals from manager view */}
          {isCEO(user) && (
            <>
              <div className="sidebar-section-title mt-3">Executive Access</div>
              <NavLink to="/ceo-dashboard" className={navCls}>
                <i className="fas fa-crown me-2"></i>
                CEO Dashboard
              </NavLink>
              <NavLink to="/staff-dashboard" className={navCls}>
                <i className="fas fa-user me-2"></i>
                Staff Portal
              </NavLink>
            </>
          )}
        </>
      )
    }

    switch (user?.role) {
      case 'staff':
        return (
          <>
            <NavLink to="/staff-dashboard" className={navCls}>
              <i className="fas fa-tachometer-alt me-2"></i>
              Dashboard
            </NavLink>
            <NavLink to="/clock" className={navCls}>
              <i className="fas fa-clock me-2"></i>
              Clock In/Out
            </NavLink>
            <NavLink to="/staff/request-leave" className={navCls}>
              <i className="fas fa-calendar-plus me-2"></i>
              Request Leave
            </NavLink>
            
            {/* Manager portal access for staff managers */}
            {user.isManager && (
              <>
                <div className="sidebar-section-title mt-3">Manager Access</div>
                <NavLink to="/manager-dashboard" className={navCls}>
                  <i className="fas fa-users-cog me-2"></i>
                  Manager Portal
                </NavLink>
              </>
            )}
            
            {/* CEO gets additional executive access */}
            {isCEO(user) && (
              <>
                <div className="sidebar-section-title mt-3">Executive Access</div>
                <NavLink to="/ceo-dashboard" className={navCls}>
                  <i className="fas fa-crown me-2"></i>
                  CEO Dashboard
                </NavLink>
              </>
            )}
          </>
        )
      
      case 'admin':
        return (
          <>
            <NavLink to="/admin-dashboard" className={navCls}>
              <i className="fas fa-tachometer-alt me-2"></i>
              Dashboard
            </NavLink>
            <NavLink to="/admin/register-staff" className={navCls}>
              <i className="fas fa-user-plus me-2"></i>
              Register Staff
            </NavLink>
            <NavLink to="/admin/manage-staff" className={navCls}>
              <i className="fas fa-users-cog me-2"></i>
              Manage Staff
            </NavLink>
            <NavLink to="/admin/clock-activities" className={navCls}>
              <i className="fas fa-clock me-2"></i>
              Clock Activities
            </NavLink>
          </>
        )
      
      case 'security':
        return (
          <>
            <NavLink to="/security-dashboard" className={navCls}>
              <i className="fas fa-tachometer-alt me-2"></i>
              Dashboard
            </NavLink>
          </>
        )
      
      default:
        return null
    }
  }

  return (
    <div className="d-flex flex-column h-100">
      <div className="flex-grow-1">
        {/* UPDATED: Role Header with CEO indicator */}
        <div className="sidebar-role">
          {getRoleDisplayName()}
          {isCEO(user) && (
            <div className="badge bg-warning text-dark ms-2">
              <i className="fas fa-crown me-1"></i>
              Executive
            </div>
          )}
        </div>
        
        {/* Navigation Section */}
        <div className="sidebar-section-title">Navigation</div>
        {getNavigationItems()}
        
        {/* UPDATED: Portal switching for CEO */}
        {isCEO(user) && variant !== 'manager' && (
          <>
            <div className="sidebar-section-title mt-3">Portal Access</div>
            <small className="text-muted px-3 d-block mb-2">
              Switch between different access levels
            </small>
            <NavLink to="/ceo-dashboard" className={navCls}>
              <i className="fas fa-crown me-2"></i>
              CEO Dashboard
            </NavLink>
            {user.isManager && (
              <NavLink to="/manager-dashboard" className={navCls}>
                <i className="fas fa-users-cog me-2"></i>
                Manager Portal
              </NavLink>
            )}
            <NavLink to="/staff-dashboard" className={navCls}>
              <i className="fas fa-user me-2"></i>
              Staff Portal
            </NavLink>
          </>
        )}
      </div>
    </div>
  )
}