import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function Sidebar({ onLogout, variant='staff' }) {
  const { user, leaveRequests } = useAuth()
  const navCls = ({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`

  // Count pending leave requests for managers
  const pendingCount = variant === 'manager' 
    ? leaveRequests.filter(req => req.status === 'pending' && req.manager === user?.email).length
    : 0

  // Get role display name
  const getRoleDisplayName = () => {
    if (variant === 'manager') return 'Manager'
    
    const roleNames = {
      staff: 'Staff',
      admin: 'Admin',
      security: 'Security',
      ceo: 'Executive'
    }
    return roleNames[user?.role] || 'Menu'
  }

  // Get relevant navigation items based on role and variant
  const getNavigationItems = () => {
    if (variant === 'manager') {
      return (
        <>
          <NavLink to="/manager-dashboard" className={navCls}>Dashboard</NavLink>
          <NavLink to="/manager/leave-requests" className={navCls}>
            Leave Requests
            {pendingCount > 0 && (
              <span className="badge bg-warning text-dark ms-2">{pendingCount}</span>
            )}
          </NavLink>
        </>
      )
    }

    switch (user?.role) {
      case 'staff':
        return (
          <>
            <NavLink to="/clock" className={navCls}>Clock In/Out</NavLink>
            <NavLink to="/staff-dashboard" className={navCls}>Dashboard</NavLink>
            <NavLink to="/staff/request-leave" className={navCls}>Request Leave</NavLink>
          </>
        )
      
      case 'admin':
        return (
          <>
            <NavLink to="/admin-dashboard" className={navCls}>Dashboard</NavLink>
            <NavLink to="/admin/register-staff" className={navCls}>Register Staff</NavLink>
            <NavLink to="/admin/manage-staff" className={navCls}>Manage Staff</NavLink>
            <NavLink to="/admin/clock-activities" className={navCls}>Clock Activities</NavLink>
          </>
        )
      
      case 'security':
        return (
          <>
            <NavLink to="/security-dashboard" className={navCls}>Dashboard</NavLink>
          </>
        )
      
      case 'ceo':
        return (
          <>
            <NavLink to="/ceo-dashboard" className={navCls}>Dashboard</NavLink>
          </>
        )
      
      default:
        return null
    }
  }

  return (
    <div className="d-flex flex-column h-100">
      <div className="flex-grow-1">
        {/* Role Header */}
        <div className="sidebar-brand">{getRoleDisplayName()}</div>
        
        {/* Navigation Section */}
        <div className="sidebar-section-title">Navigation</div>
        {getNavigationItems()}
      </div>

      {/* Logout Footer */}
      <div className="sidebar-footer">
        <button className="w-100 sidebar-logout btn mt-2" onClick={onLogout}>Logout</button>
      </div>
    </div>
  )
}
