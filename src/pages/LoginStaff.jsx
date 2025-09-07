import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function LoginStaff() {
  const { login, user, allUsers } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('dev1@company.com')
  const [password, setPassword] = useState('password123')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [userHint, setUserHint] = useState(null)

  // Get the intended destination after login
  const from = location.state?.from?.pathname || '/clock'

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      if (user.role === 'staff') {
        navigate(from, { replace: true })
      } else if (user.role === 'admin') {
        navigate('/admin-dashboard', { replace: true })
      } else if (user.role === 'security') {
        navigate('/security-dashboard', { replace: true })
      } else if (user.role === 'ceo') {
        navigate('/ceo-dashboard', { replace: true })
      }
    }
  }, [user, navigate, from])

  // Enhanced user lookup for better UX
  useEffect(() => {
    if (email && allUsers[email]) {
      const userData = allUsers[email]
      setUserHint({
        name: `${userData.firstName} ${userData.lastName}`,
        jobTitle: userData.jobTitle,
        department: userData.department,
        isActive: userData.isActive,
        verified: userData.verified,
        role: userData.role,
        subRole: userData.subRole
      })
    } else {
      setUserHint(null)
    }
  }, [email, allUsers])

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    
    try { 
      await login({ email, password, roleHint: 'staff' })
    } catch (err) { 
      setError(err.message)
    } finally {
      setLoading(false)
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
  const isDeactivatedError = error.includes('deactivated')
  const isRoleError = error.includes('Wrong portal')

  // Demo accounts for easy testing
  const demoAccounts = [
    { email: 'dev1@company.com', role: 'Staff', name: 'Alex Rodriguez', status: 'active' },
    { email: 'it.manager@company.com', role: 'Manager', name: 'Mike Johnson', status: 'active' },
    { email: 'ceo@company.com', role: 'CEO', name: 'Sarah Chen', status: 'active' }
  ]

  return (
    <div className="login-page login-staff">
      <div className="card login-card">
        <div className="card-header">
          <div className="login-logo">StaffClock</div>
        </div>
        <div className="card-body">
          <div className="login-title">Staff Portal Login</div>
          
          {/* Enhanced user hint display */}
          {userHint && (
            <div className={`alert ${
              !userHint.isActive ? 'alert-danger' : 
              !userHint.verified ? 'alert-warning' : 
              'alert-info'
            } mb-3`}>
              <div className="d-flex align-items-start">
                <i className={`fas ${
                  !userHint.isActive ? 'fa-ban' :
                  !userHint.verified ? 'fa-exclamation-triangle' :
                  'fa-user'
                } me-2 mt-1`}></i>
                <div>
                  <div className="fw-semibold">{userHint.name}</div>
                  <small>
                    {userHint.jobTitle && `${userHint.jobTitle} • `}
                    {userHint.department}
                    {userHint.subRole && ` • ${userHint.subRole.charAt(0).toUpperCase() + userHint.subRole.slice(1)}`}
                  </small>
                  {!userHint.isActive && (
                    <div className="mt-1 small text-danger">
                      <strong>Account Deactivated</strong> - Contact administrator
                    </div>
                  )}
                  {!userHint.verified && userHint.isActive && (
                    <div className="mt-1 small text-warning">
                      <strong>Account Unverified</strong> - Complete setup required
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          <form onSubmit={onSubmit}>
            <div className="mb-3">
              <label className="form-label">Email Address</label>
              <div className="input-group">
                <span className="input-group-text">
                  <i className="fas fa-envelope"></i>
                </span>
                <input 
                  className="form-control" 
                  type="email" 
                  value={email} 
                  onChange={e=>setEmail(e.target.value)} 
                  required 
                  disabled={loading}
                  placeholder="Enter your email address"
                />
              </div>
            </div>
            
            <div className="mb-3">
              <label className="form-label">Password</label>
              <div className="input-group">
                <span className="input-group-text">
                  <i className="fas fa-lock"></i>
                </span>
                <input 
                  className="form-control" 
                  type={showPassword ? "text" : "password"} 
                  value={password} 
                  onChange={e=>setPassword(e.target.value)} 
                  required 
                  disabled={loading}
                  placeholder="Enter your password"
                />
                <button 
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                  tabIndex={-1}
                >
                  <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
            </div>
            
            {/* Enhanced error handling */}
            {error && (
              <div className={`alert ${
                isVerificationError ? 'alert-warning' :
                isDeactivatedError ? 'alert-danger' :
                isRoleError ? 'alert-info' :
                'alert-danger'
              } py-2`}>
                <div className="d-flex align-items-start">
                  <i className={`fas ${
                    isVerificationError ? 'fa-exclamation-triangle' :
                    isDeactivatedError ? 'fa-ban' :
                    isRoleError ? 'fa-info-circle' :
                    'fa-times-circle'
                  } me-2 mt-1`}></i>
                  <div className="flex-grow-1">
                    <div>{errorMessage}</div>
                    {isVerificationError && linkPath && (
                      <div className="mt-2">
                        <Link to={`/${linkPath}`} className="btn btn-sm btn-dark">
                          <i className="fas fa-shield-alt me-1"></i>
                          Verify Account Now
                        </Link>
                      </div>
                    )}
                    {isRoleError && (
                      <div className="mt-2">
                        <small>Try the correct portal: 
                          <Link to="/admin" className="ms-1">Admin</Link> | 
                          <Link to="/security" className="ms-1">Security</Link> | 
                          <Link to="/ceo" className="ms-1">Executive</Link>
                        </small>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            <button 
              className="btn btn-warning w-100 mb-3" 
              type="submit"
              disabled={loading || (userHint && !userHint.isActive)}
            >
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin me-2"></i>
                  Signing In...
                </>
              ) : (
                <>
                  <i className="fas fa-sign-in-alt me-2"></i>
                  Sign In
                </>
              )}
            </button>
          </form>
          
          <div className="text-center mb-3">
            <Link to="/forgot-password?portal=staff" className="text-decoration-none">
              <i className="fas fa-key me-1"></i>
              Forgot your password?
            </Link>
          </div>

          {/* Demo accounts section */}
          <div className="mt-4 pt-3 border-top">
            <h6 className="small text-muted mb-2">DEMO ACCOUNTS</h6>
            <div className="d-grid gap-1">
              {demoAccounts.map((account, index) => (
                <button 
                  key={index}
                  type="button"
                  className="btn btn-outline-secondary btn-sm text-start"
                  onClick={() => {
                    setEmail(account.email)
                    setPassword('password123')
                  }}
                  disabled={loading}
                >
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <div className="fw-semibold small">{account.name}</div>
                      <small className="text-muted">{account.role}</small>
                    </div>
                    <small className="text-muted">{account.email}</small>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Other portals */}
          <div className="mt-4 pt-3 border-top">
            <div className="text-center">
              <small className="text-muted d-block mb-2">Access other portals:</small>
              <div className="d-flex justify-content-center gap-2 flex-wrap">
                <Link to="/admin" className="btn btn-outline-dark btn-sm">
                  <i className="fas fa-user-shield me-1"></i>
                  Admin
                </Link>
                <Link to="/security" className="btn btn-outline-dark btn-sm">
                  <i className="fas fa-shield-alt me-1"></i>
                  Security
                </Link>
                <Link to="/ceo" className="btn btn-outline-dark btn-sm">
                  <i className="fas fa-crown me-1"></i>
                  Executive
                </Link>
              </div>
            </div>
          </div>

          {/* Help section */}
          <div className="mt-3">
            <div className="text-center">
              <Link to="/portal-select" className="text-decoration-none small text-muted">
                <i className="fas fa-info-circle me-1"></i>
                View all portals & features
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}