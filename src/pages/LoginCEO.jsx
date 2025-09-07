import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function LoginCEO() {
  const { login, user } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('ceo@company.com')
  const [password, setPassword] = useState('password')
  const [error, setError] = useState('')

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      // CEO can access different portals based on their role
      if (user.subRole === 'ceo' || user.accessLevel === 'ceo') {
        navigate('/ceo-dashboard', { replace: true })
      } else if (user.role === 'staff') {
        navigate('/clock', { replace: true })
      } else if (user.role === 'admin') {
        navigate('/admin-dashboard', { replace: true })
      } else if (user.role === 'security') {
        navigate('/security-dashboard', { replace: true })
      }
    }
  }, [user, navigate])

  const onSubmit = (e) => {
    e.preventDefault()
    setError('')
    try { 
      // UPDATED: Use 'ceo' role hint for CEO login validation
      login({ email, password, roleHint: 'ceo' }) 
    }
    catch (err) { 
      setError(err.message) 
    }
  }

  // Parse error message for verification link
  const parseErrorMessage = (errorMsg) => {
    if (errorMsg.includes('||')) {
      const [message, linkPath] = errorMsg.split('||')
      return { message, linkPath }
    }
    return { message: errorMsg, linkPath: null }
  }

  const { message: errorMessage, linkPath } = parseErrorMessage(error)
  const isVerificationError = error.includes('not verified')

  return (
    <div className="login-page login-ceo">
      <div className="card login-card">
        <div className="card-header">
          <div className="login-logo">StaffClock</div>
        </div>
        <div className="card-body">
          <div className="login-title">
            <i className="fas fa-crown me-2"></i>
            CEO Portal
          </div>
          
          {/* CEO Portal Information */}
          <div className="alert alert-info mb-4">
            <div className="small">
              <strong>CEO Access:</strong> As CEO, you have access to:
              <ul className="mb-0 mt-1">
                <li>Executive Dashboard & Reports</li>
                <li>Staff Portal (Clock In/Out, Leave Requests)</li>
                <li>Manager Portal (Team Management)</li>
              </ul>
            </div>
          </div>
          
          <form onSubmit={onSubmit}>
            <div className="mb-3">
              <label className="form-label">Email</label>
              <input 
                className="form-control" 
                type="email" 
                value={email} 
                onChange={e=>setEmail(e.target.value)} 
                required 
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Password</label>
              <input 
                className="form-control" 
                type="password" 
                value={password} 
                onChange={e=>setPassword(e.target.value)} 
                required 
              />
            </div>
            
            {error && (
              <div className="alert alert-warning py-2">
                <div className="mb-2">{errorMessage}</div>
                {isVerificationError && linkPath && (
                  <Link to={`/${linkPath}`} className="btn btn-sm btn-dark">
                    <i className="fas fa-shield-alt me-1"></i>
                    Verify Now
                  </Link>
                )}
              </div>
            )}
            
            <button className="btn btn-warning w-100" type="submit">
              <i className="fas fa-sign-in-alt me-2"></i>
              Sign In as CEO
            </button>
          </form>
          
          <div className="text-center mt-3">
            <Link to="/forgot-password?portal=ceo" className="text-decoration-none">
              <i className="fas fa-key me-1"></i>
              Forgot your password?
            </Link>
          </div>
          
          <div className="text-center mt-3">
            <small className="text-muted">
              Other portals: 
              <Link to="/staff" className="text-decoration-none ms-1">Staff</Link> | 
              <Link to="/admin" className="text-decoration-none ms-1">Admin</Link> | 
              <Link to="/security" className="text-decoration-none ms-1">Security</Link>
            </small>
          </div>
        </div>
      </div>
    </div>
  )
}