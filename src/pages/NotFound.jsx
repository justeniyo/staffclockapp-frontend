import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="login-page login-staff">
      <div className="card login-card">
        <div className="card-header">
          <div className="login-logo">StaffClock</div>
        </div>
        <div className="card-body text-center">
          <div className="mb-4">
            <i className="fas fa-exclamation-triangle fa-3x text-warning mb-3"></i>
            <h3 className="mb-3">Page Not Found</h3>
            <p className="text-muted mb-4">
              The page you're looking for doesn't exist or has been moved.
            </p>
          </div>
          
          <div className="d-grid gap-2">
            <Link to="/staff" className="btn btn-warning">
              <i className="fas fa-home me-2"></i>
              Go to Staff Login
            </Link>
            <Link to="/admin" className="btn btn-outline-dark">
              <i className="fas fa-user-shield me-2"></i>
              Admin Portal
            </Link>
          </div>
          
          <div className="mt-4 pt-3 border-top">
            <small className="text-muted">
              Need help? Contact your system administrator.
            </small>
          </div>
        </div>
      </div>
    </div>
  )
}