import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ForgotPassword() {
  const [searchParams] = useSearchParams()
  const { forgotPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  
  const portal = searchParams.get('portal') || 'staff'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await forgotPassword(email)
      setSuccess(`Password reset link sent to ${email}. Please check your email.`)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const getPortalClass = () => {
    const classes = {
      staff: 'login-staff',
      admin: 'login-admin', 
      security: 'login-security',
      ceo: 'login-ceo'
    }
    return classes[portal] || 'login-staff'
  }

  const getBackLink = () => {
    const links = {
      staff: '/staff',
      admin: '/admin',
      security: '/security', 
      ceo: '/ceo'
    }
    return links[portal] || '/staff'
  }

  return (
    <div className={`login-page ${getPortalClass()}`}>
      <div className="card login-card">
        <div className="card-header">
          <div className="login-logo">StaffClock</div>
        </div>
        <div className="card-body">
          <div className="login-title">Reset Password</div>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Email Address</label>
              <input 
                className="form-control" 
                type="email" 
                value={email} 
                onChange={e=>setEmail(e.target.value)} 
                required 
                placeholder="Enter your email address"
              />
            </div>
            
            {error && <div className="alert alert-danger py-2">{error}</div>}
            {success && <div className="alert alert-success py-2">{success}</div>}
            
            <button 
              className="btn btn-warning w-100 mb-3" 
              type="submit"
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
          
          <div className="text-center">
            <Link to={getBackLink()} className="text-decoration-none">
              ← Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}