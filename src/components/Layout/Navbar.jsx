import { useState, useRef, useEffect } from 'react'
import { Navbar, Container, Button } from 'react-bootstrap'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getFullName, getUserInitials, isCEO, canAccessManagerPortal } from '../../config/seedUsers'

export default function AppNavbar({ onToggleMobile }) {
  const { user, isOnManager, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const dropdownRef = useRef(null)

  // UPDATED: Enhanced portal access logic for CEO dual role
  const getPortalAccess = () => {
    const access = {
      showManagerPortal: false,
      showStaffPortal: false,
      showCeoPortal: false,
      currentPortal: 'unknown'
    }

    if (!user) return access

    // Determine current portal
    if (location.pathname.startsWith('/ceo')) {
      access.currentPortal = 'ceo'
    } else if (location.pathname.startsWith('/manager')) {
      access.currentPortal = 'manager'
    } else if (location.pathname.startsWith('/staff') || location.pathname === '/clock' || location.pathname.startsWith('/staff/')) {
      access.currentPortal = 'staff'
    } else if (location.pathname.startsWith('/admin')) {
      access.currentPortal = 'admin'
    } else if (location.pathname.startsWith('/security')) {
      access.currentPortal = 'security'
    }

    // CEO has access to all three portals
    if (isCEO(user)) {
      access.showCeoPortal = access.currentPortal !== 'ceo'
      access.showManagerPortal = access.currentPortal !== 'manager'
      access.showStaffPortal = access.currentPortal !== 'staff'
    }
    // Regular staff managers can access manager portal
    else if (canAccessManagerPortal(user)) {
      access.showManagerPortal = access.currentPortal !== 'manager'
      access.showStaffPortal = access.currentPortal !== 'staff'
    }
    // Regular staff can only access staff portal
    else if (user.role === 'staff') {
      access.showStaffPortal = access.currentPortal !== 'staff'
    }

    return access
  }

  const portalAccess = getPortalAccess()

  const goToPortal = (portal) => {
    switch (portal) {
      case 'ceo':
        navigate('/ceo-dashboard')
        break
      case 'manager':
        navigate('/manager-dashboard')
        break
      case 'staff':
        navigate('/staff-dashboard')
        break
      default:
        break
    }
  }

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

  const getPortalButtonStyle = (portal) => {
    const baseStyle = "portal-btn"
    const currentPortal = portalAccess.currentPortal
    
    if (portal === currentPortal) {
      return `${baseStyle} active`
    }
    return baseStyle
  }

  const getPortalLabel = (portal) => {
    const labels = {
      ceo: 'CEO Portal',
      manager: 'Manager Portal', 
      staff: 'Staff Portal'
    }
    return labels[portal] || portal
  }

  const getUserDisplayRole = () => {
    if (isCEO(user)) return 'CEO'
    if (user.isManager) return 'Manager'
    return user.role.charAt(0).toUpperCase() + user.role.slice(1)
  }

  return (
    <Navbar bg="warning" expand="lg" className="app-navbar px-3">
      <Container fluid className="p-0 d-flex align-items-center justify-content-between gap-2">
        {/* Brand on the left */}
        <Navbar.Brand href="/" className="brand-big">StaffClock</Navbar.Brand>

        {/* Right side elements */}
        <div className="d-flex align-items-center gap-2 ms-auto">
          {/* UPDATED: CEO Portal Access - Desktop */}
          {portalAccess.showCeoPortal && (
            <Button 
              className={`${getPortalButtonStyle('ceo')} d-none d-lg-inline`}
              onClick={() => goToPortal('ceo')}
              title="Access CEO Dashboard"
            >
              <i className="fas fa-crown me-1"></i>
              {getPortalLabel('ceo')}
            </Button>
          )}
          
          {/* Manager Portal Button - Desktop */}
          {portalAccess.showManagerPortal && (
            <Button 
              className={`${getPortalButtonStyle('manager')} d-none d-lg-inline`}
              onClick={() => goToPortal('manager')}
              title="Access Manager Portal"
            >
              <i className="fas fa-users-cog me-1"></i>
              {getPortalLabel('manager')}
            </Button>
          )}

          {/* Staff Portal Button - Desktop */}
          {portalAccess.showStaffPortal && (
            <Button 
              className={`${getPortalButtonStyle('staff')} d-none d-lg-inline`}
              onClick={() => goToPortal('staff')}
              title="Access Staff Portal"
            >
              <i className="fas fa-user me-1"></i>
              {getPortalLabel('staff')}
            </Button>
          )}
          
          {/* UPDATED: Mobile Portal Buttons */}
          {(portalAccess.showCeoPortal || portalAccess.showManagerPortal || portalAccess.showStaffPortal) && (
            <div className="d-lg-none">
              {portalAccess.showCeoPortal && (
                <Button 
                  className={`${getPortalButtonStyle('ceo')} me-1`}
                  size="sm"
                  onClick={() => goToPortal('ceo')}
                  title="CEO Portal"
                >
                  <i className="fas fa-crown"></i>
                </Button>
              )}
              {portalAccess.showManagerPortal && (
                <Button 
                  className={`${getPortalButtonStyle('manager')} me-1`}
                  size="sm"
                  onClick={() => goToPortal('manager')}
                  title="Manager Portal"
                >
                  <i className="fas fa-users-cog"></i>
                </Button>
              )}
              {portalAccess.showStaffPortal && (
                <Button 
                  className={`${getPortalButtonStyle('staff')} me-1`}
                  size="sm"
                  onClick={() => goToPortal('staff')}
                  title="Staff Portal"
                >
                  <i className="fas fa-user"></i>
                </Button>
              )}
            </div>
          )}
          
          {/* User Name Tag with Dropdown */}
          {user && (
            <div className="position-relative" ref={dropdownRef}>
              <div 
                className="navbar-user-tag"
                onClick={() => setShowUserDropdown(!showUserDropdown)}
              >
                <div className="user-icon">
                  {isCEO(user) ? (
                    <i className="fas fa-crown"></i>
                  ) : user.isManager ? (
                    <i className="fas fa-user-tie"></i>
                  ) : (
                    <i className="fas fa-user"></i>
                  )}
                </div>
                <span className="user-name d-none d-lg-inline">{getFullName(user)}</span>
                <span className="user-initials d-lg-none">{getUserInitials(user)}</span>
                <span className="user-role d-none d-xl-inline badge bg-secondary ms-2">
                  {getUserDisplayRole()}
                </span>
                <i className={`fas fa-chevron-${showUserDropdown ? 'up' : 'down'} ms-2`}></i>
              </div>
              
              {showUserDropdown && (
                <div className="user-dropdown">
                  {/* Portal Access Menu Items */}
                  {portalAccess.showCeoPortal && (
                    <button 
                      className="user-dropdown-item"
                      onClick={() => {
                        goToPortal('ceo')
                        setShowUserDropdown(false)
                      }}
                    >
                      <i className="fas fa-crown"></i>
                      CEO Dashboard
                    </button>
                  )}
                  {portalAccess.showManagerPortal && (
                    <button 
                      className="user-dropdown-item"
                      onClick={() => {
                        goToPortal('manager')
                        setShowUserDropdown(false)
                      }}
                    >
                      <i className="fas fa-users-cog"></i>
                      Manager Portal
                    </button>
                  )}
                  {portalAccess.showStaffPortal && (
                    <button 
                      className="user-dropdown-item"
                      onClick={() => {
                        goToPortal('staff')
                        setShowUserDropdown(false)
                      }}
                    >
                      <i className="fas fa-user"></i>
                      Staff Portal
                    </button>
                  )}
                  
                  {/* Separator if portal options exist */}
                  {(portalAccess.showCeoPortal || portalAccess.showManagerPortal || portalAccess.showStaffPortal) && (
                    <div className="dropdown-divider"></div>
                  )}
                  
                  <button className="user-dropdown-item" onClick={handleLogout}>
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