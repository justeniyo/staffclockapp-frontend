import { Navbar, Container, Button } from 'react-bootstrap'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function AppNavbar({ onToggleMobile }) {
  const { user, isOnManager } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const showPortal = user?.role === 'staff' && user?.isManager
  const goPortal = () => {
    if (isOnManager) navigate('/staff-dashboard')
    else navigate('/manager-dashboard')
  }

  const portalLabel = isOnManager ? 'Staff Portal' : 'Manager Portal'

  // Get user initials
  const getUserInitials = (name) => {
    if (!name) return 'U'
    const words = name.split(' ')
    if (words.length === 1) return words[0].charAt(0).toUpperCase()
    return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase()
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
          
          {/* User Name Tag */}
          {user && (
            <div className="navbar-user-tag">
              <div className="user-icon">
                <i className="fas fa-user"></i>
              </div>
              <span className="user-name d-none d-lg-inline">{user.name}</span>
              <span className="user-initials d-lg-none">{getUserInitials(user.name)}</span>
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