import { useState } from 'react'
import { Offcanvas } from 'react-bootstrap'
import AppNavbar from './Navbar'
import Sidebar from './Sidebar'
import { useAuth } from '../../context/AuthContext'
import { useLocation } from 'react-router-dom'

export default function Layout({ children, variant }) {
  const [show, setShow] = useState(false)
  const { user, isOnManager } = useAuth()
  const location = useLocation()

  const computedVariant = variant || (isOnManager ? 'manager' : 'staff')

  // Get role display name - same logic as in Sidebar
  const getRoleDisplayName = () => {
    if (computedVariant === 'manager') return 'Manager'
    
    const roleNames = {
      staff: 'Staff',
      admin: 'Admin',
      security: 'Security',
      ceo: 'Executive'
    }
    return roleNames[user?.role] || 'Menu'
  }

  return (
    <div className="app-shell">
      {/* Fixed Navbar spans full width */}
      <nav className="navbar-fixed">
        <AppNavbar onToggleMobile={() => setShow(true)} />
      </nav>

      <div className="main-container">
        {/* Fixed Sidebar - starts under navbar */}
        <aside className="sidebar-fixed">
          <Sidebar variant={computedVariant} />
        </aside>

        {/* Main content area */}
        <section className="main-col">
          <Offcanvas placement="end" show={show} onHide={() => setShow(false)} className="bg-dark text-white">
            <Offcanvas.Header closeButton closeVariant="white">
              {/* Use consistent role styling instead of Offcanvas.Title */}
              <div className="sidebar-role-mobile">{getRoleDisplayName()}</div>
            </Offcanvas.Header>
            <Offcanvas.Body>
              <Sidebar variant={computedVariant} />
            </Offcanvas.Body>
          </Offcanvas>

          <div className="content-scroll">
            {children}
          </div>
        </section>
      </div>
    </div>
  )
}