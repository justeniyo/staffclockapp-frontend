import { useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ForgotPassword() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
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
      await forgotPassword(email)
      setSuccess(`Code sent to ${email}`)
      
      // Redirect to verify reset OTP page
      setTimeout(() => {
        navigate(`/verify-reset-otp?email=${email}`)
      }, 2000)
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
          <div className="login-title">
            <i className="fas fa-key me-2"></i>
            Reset Password
          </div>
          
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
                disabled={loading}
              />
            </div>
            
            {error && (
              <div className="alert alert-danger py-2">
                <i className="fas fa-exclamation-triangle me-2"></i>
                {error}
              </div>
            )}
            
            {success && (
              <div className="alert alert-success py-2">
                <i className="fas fa-check me-2"></i>
                {success}
              </div>
            )}
            
            <button 
              className="btn btn-warning w-100 mb-3" 
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin me-2"></i>
                  Sending...
                </>
              ) : (
                <>
                  <i className="fas fa-paper-plane me-2"></i>
                  Send Reset Code
                </>
              )}
            </button>
          </form>
          
          <div className="text-center">
            <Link to={getBackLink()} className="text-decoration-none">
              <i className="fas fa-arrow-left me-2"></i>
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}