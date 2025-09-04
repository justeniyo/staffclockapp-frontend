import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function LoginCEO() {
  const { login } = useAuth()
  const [email, setEmail] = useState('ceo@company.com')
  const [password, setPassword] = useState('password123')
  const [error, setError] = useState('')

  const onSubmit = (e) => {
    e.preventDefault()
    setError('')
    try { login({ email, password, roleHint: 'ceo' }) }
    catch (err) { setError(err.message) }
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
          <div className="login-title">Sign In as CEO</div>
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
            <Link to="/forgot-password?portal=ceo" className="text-decoration-none">
              Forgot your password?
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}