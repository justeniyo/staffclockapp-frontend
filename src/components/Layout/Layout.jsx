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

  return (
    <div className="app-shell">
      <aside className="sidebar-fixed">
        <Sidebar variant={computedVariant} />
      </aside>

      <section className="main-col">
        <AppNavbar onToggleMobile={() => setShow(true)} />

        <Offcanvas placement="end" show={show} onHide={() => setShow(false)} className="bg-dark text-white">
          <Offcanvas.Header closeButton closeVariant="white">
            <Offcanvas.Title>{computedVariant === 'manager' ? 'Manager' : user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1) || 'Menu'}</Offcanvas.Title>
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
  )
}