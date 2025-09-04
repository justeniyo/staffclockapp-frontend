import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function LoginSecurity() {
  const { login } = useAuth()
  const [email, setEmail] = useState('security@company.com')
  const [password, setPassword] = useState('password123')
  const [error, setError] = useState('')

  const onSubmit = (e) => {
    e.preventDefault()
    setError('')
    try { login({ email, password, roleHint: 'security' }) }
    catch (err) { setError(err.message) }
  }

  const isVerificationError = error.includes('verify your account')

  return (
    <div className="login-page login-security">
      <div className="card login-card">
        <div className="card-header">
          <div className="login-logo">StaffClock</div>
        </div>
        <div className="card-body">
          <div className="login-title">Sign In</div>
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
              <div className="alert alert-danger py-2">
                {isVerificationError ? (
                  <div>
                    <div>{error}</div>
                    <Link to="/verify-account" className="btn btn-sm btn-outline-primary mt-2">
                      Verify Account
                    </Link>
                  </div>
                ) : (
                  error
                )}
              </div>
            )}
            
            <button className="btn btn-warning w-100" type="submit">Login</button>
          </form>
          
          <div className="text-center mt-3">
            <Link to="/forgot-password?portal=security" className="text-decoration-none">
              Forgot your password?
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}