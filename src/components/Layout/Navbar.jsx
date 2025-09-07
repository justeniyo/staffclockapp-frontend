import { useState, useRef, useEffect } from 'react'
import { Navbar, Container, Button } from 'react-bootstrap'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getFullName, getUserInitials, isCEO, isExecutive } from '../../config/seedUsers'

export default function AppNavbar({ onToggleMobile }) {
  const { user, isOnManager, logout, locations, departments } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const dropdownRef = useRef(null)

  const showPortal = user?.role === 'staff' && user?.isManager
  const goPortal = () => {
    if (isOnManager) navigate('/staff-dashboard')
    else navigate('/manager-dashboard')
  }

  const portalLabel = isOnManager ? 'Staff Portal' : 'Manager Portal'

  // Enhanced user context information
  const userContext = user ? {
    fullName: getFullName(user),
    initials: getUserInitials(user),
    jobTitle: user.jobTitle,
    department: user.departmentId ? departments[user.departmentId] : null,
    role: user.role,
    subRole: user.subRole,
    isManager: user.isManager,
    isCEO: isCEO(user),
    isExecutive: isExecutive(user),
    currentLocation: user.assignedLocationId ? locations[user.assignedLocationId] : null,
    activeLocations: user.currentLocationIds?.map(id => locations[id]).filter(Boolean) || [],
    totalLocations: user.allowedLocationIds?.length || 1
  } : null

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowUserDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleLogout = () => {
    setShowUserDropdown(false)
    logout()
  }

  const getStatusIndicator = () => {
    if (!user) return null
    
    if (!user.isClockedIn) {
      return { icon: 'fa-clock', color: 'text-muted', text: 'Off Duty' }
    }
    
    if (userContext.activeLocations.length > 1) {
      return { 
        icon: 'fa-map-marked-alt', 
        color: 'text-info', 
        text: `Active at ${userContext.activeLocations.length} locations` 
      }
    }
    
    return { 
      icon: 'fa-check-circle', 
      color: 'text-success', 
      text: `On duty at ${userContext.currentLocation?.name || 'Unknown'}` 
    }
  }

  const statusIndicator = getStatusIndicator()

  const getRoleBadge = () => {
    if (!userContext) return null
    
    if (userContext.isCEO) {
      return { text: 'CEO', class: 'bg-warning text-dark' }
    }
    
    if (userContext.isExecutive) {
      return { text: 'Executive', class: 'bg-success' }
    }
    
    if (userContext.isManager) {
      return { text: 'Manager', class: 'bg-info' }
    }
    
    const roleBadges = {
      admin: { text: 'Admin', class: 'bg-danger' },
      security: { text: 'Security', class: 'bg-warning text-dark' },
      staff: { text: 'Staff', class: 'bg-primary' }
    }
    
    return roleBadges[userContext.role] || { text: 'User', class: 'bg-secondary' }
  }

  const roleBadge = getRoleBadge()

  return (
    <Navbar bg="warning" expand="lg" className="app-navbar px-3">
      <Container fluid className="p-0 d-flex align-items-center justify-content-between gap-2">
        {/* Enhanced Brand with context */}
        <div className="d-flex align-items-center">
          <Navbar.Brand href="/" className="brand-big me-3">StaffClock</Navbar.Brand>
          
          {/* Context indicators for larger screens */}
          {userContext && (
            <div className="d-none d-lg-flex align-items-center gap-2">
              {roleBadge && (
                <span className={`badge ${roleBadge.class}`}>
                  {roleBadge.text}
                </span>
              )}
              {statusIndicator && (
                <span className={`small ${statusIndicator.color}`}>
                  <i className={`fas ${statusIndicator.icon} me-1`}></i>
                  {statusIndicator.text}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Right side elements */}
        <div className="d-flex align-items-center gap-2 ms-auto">
          {/* Portal Button */}
          {showPortal && (
            <Button className="portal-btn d-none d-lg-inline" onClick={goPortal}>
              {portalLabel}
            </Button>
          )}
          
          {/* Mobile Portal Button */}
          {showPortal && (
            <Button className="portal-btn d-lg-none" onClick={goPortal}>
              {isOnManager ? (
                <i className="fas fa-user"></i>
              ) : (
                <i className="fas fa-users"></i>
              )}
            </Button>
          )}
          
          {/* Enhanced User Tag with Dropdown */}
          {user && (
            <div className="position-relative" ref={dropdownRef}>
              <div 
                className="navbar-user-tag"
                onClick={() => setShowUserDropdown(!showUserDropdown)}
              >
                <div className="user-icon">
                  <i className="fas fa-user"></i>
                </div>
                
                {/* Desktop: Full name and context */}
                <div className="d-none d-lg-block">
                  <div className="user-name">{userContext.fullName}</div>
                  {userContext.jobTitle && (
                    <div className="text-muted small" style={{fontSize: '0.7rem', lineHeight: 1}}>
                      {userContext.jobTitle}
                    </div>
                  )}
                </div>
                
                {/* Mobile: Initials only */}
                <span className="user-initials d-lg-none">{userContext.initials}</span>
                
                <i className={`fas fa-chevron-${showUserDropdown ? 'up' : 'down'} ms-2`}></i>
              </div>
              
              {/* Enhanced Dropdown */}
              {showUserDropdown && (
                <div className="user-dropdown" style={{minWidth: '280px'}}>
                  {/* User Info Header */}
                  <div className="p-3 border-bottom bg-light">
                    <div className="fw-bold">{userContext.fullName}</div>
                    <div className="text-muted small">{userContext.jobTitle}</div>
                    <div className="text-muted small">
                      {userContext.department?.name || 'Unknown Department'}
                    </div>
                    {roleBadge && (
                      <div className="mt-1">
                        <span className={`badge ${roleBadge.class}`}>
                          {roleBadge.text}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Status Information */}
                  {statusIndicator && (
                    <div className="px-3 py-2 border-bottom">
                      <div className={`small ${statusIndicator.color}`}>
                        <i className={`fas ${statusIndicator.icon} me-2`}></i>
                        {statusIndicator.text}
                      </div>
                      
                      {/* Multi-location status */}
                      {userContext.activeLocations.length > 0 && (
                        <div className="mt-1">
                          {userContext.activeLocations.map((loc, index) => (
                            <div key={loc.id} className="text-muted" style={{fontSize: '0.75rem'}}>
                              <i className="fas fa-map-marker-alt me-1"></i>
                              {loc.name}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Quick Actions */}
                  <div className="p-2 border-bottom">
                    <div className="small text-muted mb-1">QUICK ACTIONS</div>
                    <button 
                      className="user-dropdown-item"
                      onClick={() => {
                        navigate('/clock')
                        setShowUserDropdown(false)
                      }}
                    >
                      <i className="fas fa-clock"></i>
                      Clock Management
                    </button>
                    
                    {user.role === 'staff' && (
                      <button 
                        className="user-dropdown-item"
                        onClick={() => {
                          navigate('/staff/request-leave')
                          setShowUserDropdown(false)
                        }}
                      >
                        <i className="fas fa-calendar-plus"></i>
                        Request Leave
                      </button>
                    )}
                    
                    {userContext.isManager && (
                      <button 
                        className="user-dropdown-item"
                        onClick={() => {
                          navigate('/manager/leave-requests')
                          setShowUserDropdown(false)
                        }}
                      >
                        <i className="fas fa-calendar-check"></i>
                        Leave Approvals
                      </button>
                    )}
                  </div>
                  
                  {/* Account Info */}
                  <div className="p-2 border-bottom">
                    <div className="small text-muted mb-1">ACCOUNT INFO</div>
                    <div className="small">
                      <div><strong>Email:</strong> {user.email}</div>
                      {user.phone && <div><strong>Phone:</strong> {user.phone}</div>}
                      <div><strong>Location Access:</strong> {userContext.totalLocations} location{userContext.totalLocations !== 1 ? 's' : ''}</div>
                    </div>
                  </div>
                  
                  {/* Logout */}
                  <button className="user-dropdown-item text-danger" onClick={handleLogout}>
                    <i className="fas fa-sign-out-alt"></i>
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}
          
          {/* Mobile Menu Toggle - LAST ELEMENT */}
          <Button
            className="d-lg-none"
            variant="outline-dark"
            onClick={onToggleMobile}
            aria-label="Toggle sidebar"
          >
            ☰
          </Button>
        </div>
      </Container>
    </Navbar>
  )
}