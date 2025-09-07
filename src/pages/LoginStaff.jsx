import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { isCEO } from '../config/seedUsers'

export default function LoginStaff() {
  const { login, user } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('dev1@company.com')
  const [password, setPassword] = useState('password')
  const [error, setError] = useState('')

  // FIXED: Redirect if already logged in with proper role routing
  useEffect(() => {
    if (user) {
      if (isCEO(user)) {
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
      login({ email, password, roleHint: 'staff' }) 
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
    <div className="login-page login-staff">
      <div className="card login-card">
        <div className="card-header">
          <div className="login-logo">StaffClock</div>
        </div>
        <div className="card-body">
          <div className="login-title">Sign In</div>
          
          {/* Demo Credentials Info */}
          <div className="alert alert-info mb-3">
            <div className="small">
              <strong>Demo Accounts:</strong>
              <ul className="mb-0 mt-1">
                <li>CEO: ceo@company.com / password</li>
                <li>Manager: it.manager@company.com / password</li>
                <li>Staff: dev1@company.com / password</li>
              </ul>
            </div>
          </div>
          
          <form onSubmit={onSubmit}>
            <div className="mb-3">
              <label className="form-label">Email</label>
              <input className="form-control" type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
            </div>
            <div className="mb-3">
              <label className="form-label">Password</label>
              <input className="form-control" type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
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
            
            <button className="btn btn-warning w-100" type="submit">Login</button>
          </form>
          
          <div className="text-center mt-3">
            <Link to="/forgot-password?portal=staff" className="text-decoration-none">
              Forgot your password?
            </Link>
          </div>
          
          <div className="text-center mt-3">
            <small className="text-muted">
              Other portals: 
              <Link to="/admin" className="text-decoration-none ms-1">Admin</Link> | 
              <Link to="/security" className="text-decoration-none ms-1">Security</Link> | 
              <Link to="/ceo" className="text-decoration-none ms-1">CEO</Link>
            </small>
          </div>
        </div>
      </div>
    </div>
  )
}