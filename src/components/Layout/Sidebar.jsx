import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getFullName, isCEO, isExecutive } from '../../config/seedUsers'

export default function Sidebar({ variant='staff' }) {
  const { user, leaveRequests, departments, locations, allUsers } = useAuth()
  const navCls = ({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`

  // Enhanced user context
  const userContext = user ? {
    fullName: getFullName(user),
    department: user.departmentId ? departments[user.departmentId] : null,
    assignedLocation: user.assignedLocationId ? locations[user.assignedLocationId] : null,
    isCEO: isCEO(user),
    isExecutive: isExecutive(user)
  } : null

  // Count pending leave requests for managers
  const pendingCount = variant === 'manager' 
    ? leaveRequests.filter(req => req.status === 'pending' && req.manager === user?.email).length
    : 0

  // Team size for managers
  const teamSize = user?.isManager 
    ? Object.values(allUsers).filter(member => member.managerId === user.id).length
    : 0

  // Get role display name with enhanced context
  const getRoleDisplayName = () => {
    if (variant === 'manager') {
      const baseTitle = 'Manager Portal'
      if (teamSize > 0) {
        return `${baseTitle} (${teamSize} reports)`
      }
      return baseTitle
    }
    
    const roleNames = {
      staff: userContext?.isCEO ? 'CEO Portal' : 
              userContext?.isExecutive ? 'Executive Portal' :
              user?.isManager ? 'Staff Manager' : 'Staff Portal',
      admin: 'System Admin',
      security: 'Security Control',
      ceo: 'Executive Portal'
    }
    return roleNames[user?.role] || 'Menu'
  }

  // Get department context for display
  const getDepartmentContext = () => {
    if (!userContext?.department) return null
    
    // Count department members for context
    const deptMembers = Object.values(allUsers).filter(member => 
      member.departmentId === userContext.department.id && member.isActive
    ).length

    return {
      name: userContext.department.name,
      description: userContext.department.description,
      memberCount: deptMembers
    }
  }

  const departmentContext = getDepartmentContext()

  // Get relevant navigation items based on role and variant
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
          
          {/* Team management section */}
          {teamSize > 0 && (
            <>
              <div className="sidebar-section-title">Team Management</div>
              <div className="sidebar-info">
                <i className="fas fa-users me-2 text-info"></i>
                <span className="small">{teamSize} team member{teamSize !== 1 ? 's' : ''}</span>
              </div>
            </>
          )}
        </>
      )
    }

    switch (user?.role) {
      case 'staff':
        return (
          <>
            <NavLink to="/clock" className={navCls}>
              <i className="fas fa-clock me-2"></i>
              Clock In/Out
              {user.isClockedIn && (
                <span className="badge bg-success ms-2">
                  <i className="fas fa-circle fa-xs"></i>
                </span>
              )}
            </NavLink>
            <NavLink to="/staff-dashboard" className={navCls}>
              <i className="fas fa-tachometer-alt me-2"></i>
              Dashboard
            </NavLink>
            <NavLink to="/staff/request-leave" className={navCls}>
              <i className="fas fa-calendar-plus me-2"></i>
              Request Leave
            </NavLink>
            
            {/* Manager portal access */}
            {user.isManager && (
              <>
                <div className="sidebar-section-title">Management</div>
                <NavLink to="/manager-dashboard" className={navCls}>
                  <i className="fas fa-users-cog me-2"></i>
                  Manager Portal
                  {teamSize > 0 && (
                    <span className="badge bg-info ms-2">{teamSize}</span>
                  )}
                </NavLink>
              </>
            )}
            
            {/* CEO specific access */}
            {userContext?.isCEO && (
              <>
                <div className="sidebar-section-title">Executive</div>
                <NavLink to="/ceo-dashboard" className={navCls}>
                  <i className="fas fa-crown me-2"></i>
                  Executive Dashboard
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
              <i className="fas fa-shield-alt me-2"></i>
              Security Dashboard
            </NavLink>
            
            {/* Location context for security */}
            {userContext?.assignedLocation && (
              <>
                <div className="sidebar-section-title">Site Information</div>
                <div className="sidebar-info">
                  <i className="fas fa-map-marker-alt me-2 text-info"></i>
                  <div>
                    <div className="small fw-semibold">{userContext.assignedLocation.name}</div>
                    <div className="text-muted" style={{fontSize: '0.7rem'}}>
                      {userContext.assignedLocation.type} • Monitoring
                    </div>
                  </div>
                </div>
              </>
            )}
          </>
        )
      
      case 'ceo':
        return (
          <>
            <NavLink to="/ceo-dashboard" className={navCls}>
              <i className="fas fa-crown me-2"></i>
              Executive Dashboard
            </NavLink>
            
            {/* CEO also has staff access */}
            <div className="sidebar-section-title">Personal</div>
            <NavLink to="/staff-dashboard" className={navCls}>
              <i className="fas fa-user me-2"></i>
              My Staff Portal
            </NavLink>
            <NavLink to="/clock" className={navCls}>
              <i className="fas fa-clock me-2"></i>
              Clock In/Out
            </NavLink>
            <NavLink to="/staff/request-leave" className={navCls}>
              <i className="fas fa-calendar-plus me-2"></i>
              Request Leave
            </NavLink>
            
            {/* CEO manager access */}
            <div className="sidebar-section-title">Leadership</div>
            <NavLink to="/manager/leave-requests" className={navCls}>
              <i className="fas fa-gavel me-2"></i>
              Executive Approvals
              {pendingCount > 0 && (
                <span className="badge bg-warning text-dark ms-2">{pendingCount}</span>
              )}
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
        {/* Enhanced Role Header */}
        <div className="sidebar-role">{getRoleDisplayName()}</div>
        
        {/* Department Context */}
        {departmentContext && (
          <div className="mb-3 p-2 rounded" style={{backgroundColor: 'rgba(255, 213, 77, 0.1)'}}>
            <div className="small fw-semibold text-warning">
              <i className="fas fa-building me-1"></i>
              {departmentContext.name}
            </div>
            {departmentContext.description && (
              <div className="text-muted" style={{fontSize: '0.7rem'}}>
                {departmentContext.description}
              </div>
            )}
            <div className="text-muted" style={{fontSize: '0.7rem'}}>
              {departmentContext.memberCount} member{departmentContext.memberCount !== 1 ? 's' : ''}
            </div>
          </div>
        )}
        
        {/* User Status Indicator */}
        {user && (
          <div className="mb-3 p-2 rounded" style={{backgroundColor: 'rgba(255, 255, 255, 0.05)'}}>
            <div className="d-flex align-items-center">
              <i className={`fas ${user.isClockedIn ? 'fa-check-circle text-success' : 'fa-clock text-muted'} me-2`}></i>
              <div>
                <div className="small fw-semibold">
                  {user.isClockedIn ? 'On Duty' : 'Off Duty'}
                </div>
                {user.isClockedIn && user.currentLocationIds?.length > 0 && (
                  <div className="text-muted" style={{fontSize: '0.7rem'}}>
                    {user.currentLocationIds.length} location{user.currentLocationIds.length !== 1 ? 's' : ''} active
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Navigation Section */}
        <div className="sidebar-section-title">Navigation</div>
        {getNavigationItems()}
        
        {/* Additional Information Sections */}
        {variant === 'manager' && teamSize > 0 && (
          <>
            <div className="sidebar-section-title">Team Stats</div>
            <div className="sidebar-info">
              <div className="small">
                <div className="d-flex justify-content-between mb-1">
                  <span>Team Size:</span>
                  <span className="fw-semibold">{teamSize}</span>
                </div>
                {pendingCount > 0 && (
                  <div className="d-flex justify-content-between mb-1">
                    <span>Pending Requests:</span>
                    <span className="badge bg-warning text-dark">{pendingCount}</span>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
        
        {/* Location Access Info for Staff */}
        {user?.role === 'staff' && user.allowedLocationIds?.length > 1 && (
          <>
            <div className="sidebar-section-title">Location Access</div>
            <div className="sidebar-info">
              <i className="fas fa-map-marked-alt me-2 text-info"></i>
              <div>
                <div className="small fw-semibold">Multi-Location Access</div>
                <div className="text-muted" style={{fontSize: '0.7rem'}}>
                  {user.allowedLocationIds.length} locations available
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      
      {/* Enhanced Footer with User Context */}
      <div className="sidebar-footer mt-auto pt-3 border-top border-secondary">
        {userContext && (
          <div className="mb-2">
            <div className="small fw-semibold text-light">{userContext.fullName}</div>
            <div className="text-muted" style={{fontSize: '0.7rem'}}>
              {user.jobTitle || 'Staff Member'}
            </div>
            {userContext.assignedLocation && (
              <div className="text-muted" style={{fontSize: '0.7rem'}}>
                <i className="fas fa-map-marker-alt me-1"></i>
                {userContext.assignedLocation.name}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}