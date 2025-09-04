import { useState, useRef, useEffect } from 'react'
import { Navbar, Container, Button } from 'react-bootstrap'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getFullName, getUserInitials } from '../../config/seedUsers'

export default function AppNavbar({ onToggleMobile }) {
  const { user, isOnManager, logout } = useAuth()
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

  return (
    <Navbar bg="warning" expand="lg" className="app-navbar px-3">
      <Container fluid className="p-0 d-flex align-items-center justify-content-between gap-2">
        <Navbar.Brand href="/" className="brand-big">StaffClock</Navbar.Brand>

        <div className="d-flex align-items-center gap-2 ms-auto">
          {/* Portal Button */}
          {showPortal && (
            <Button className="portal-btn d-none d-lg-inline" onClick={goPortal}>{portalLabel}</Button>
          )}
          
          {/* User Name Tag with Dropdown */}
          {user && (
            <div className="position-relative" ref={dropdownRef}>
              <div 
                className="navbar-user-tag"
                onClick={() => setShowUserDropdown(!showUserDropdown)}
              >
                <div className="user-icon">
                  <i className="fas fa-user"></i>
                </div>
                <span className="user-name d-none d-lg-inline">{getFullName(user)}</span>
                <span className="user-initials d-lg-none">{getUserInitials(user)}</span>
                <i className={`fas fa-chevron-${showUserDropdown ? 'up' : 'down'} ms-2`}></i>
              </div>
              
              {showUserDropdown && (
                <div className="user-dropdown">
                  <button className="user-dropdown-item" onClick={handleLogout}>
                    <i className="fas fa-sign-out-alt"></i>
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}
          
          {/* Mobile Menu Toggle */}
          <Button
            className="d-lg-none"
            variant="outline-dark"
            onClick={onToggleMobile}
            aria-label="Toggle sidebar"
          >
            ☰
          </Button>
          
          {/* Mobile Portal Button */}
          {showPortal && (
            <Button className="portal-btn d-lg-none" onClick={goPortal}>{portalLabel}</Button>
          )}
        </div>
      </Container>
    </Navbar>
  )
}