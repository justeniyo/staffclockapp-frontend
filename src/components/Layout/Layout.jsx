import { useState } from 'react'
import { Offcanvas } from 'react-bootstrap'
import AppNavbar from './Navbar'
import Sidebar from './Sidebar'
import { useAuth } from '../../context/AuthContext'
import { useLocation } from 'react-router-dom'

export default function Layout({ children, variant }) {
  const [show, setShow] = useState(false)
  const { logout, isOnManager } = useAuth()
  const location = useLocation()

  const computedVariant = variant || (isOnManager ? 'manager' : 'staff')

  const handleLogout = () => {
    logout()
    setShow(false)
  }

  return (
    <div className="app-shell">
      <aside className="sidebar-fixed">
        <div className="sidebar-brand">Menu</div>
        <Sidebar onLogout={handleLogout} variant={computedVariant} />
      </aside>

      <section className="main-col">
        <AppNavbar onToggleMobile={() => setShow(true)} />

        <Offcanvas placement="end" show={show} onHide={() => setShow(false)} className="bg-dark text-white">
          <Offcanvas.Header closeButton closeVariant="white">
            <Offcanvas.Title>Menu</Offcanvas.Title>
          </Offcanvas.Header>
          <Offcanvas.Body>
            <Sidebar onLogout={handleLogout} variant={computedVariant} />
          </Offcanvas.Body>
        </Offcanvas>

        <div className="content-scroll">
          {children}
        </div>
      </section>
    </div>
  )
}
