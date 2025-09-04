import { useState, useEffect } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function VerifyAccount() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { verifyOTP, resendOTP } = useAuth()
  const [email, setEmail] = useState(searchParams.get('email') || '')
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)

  const handleVerify = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await verifyOTP(email, otp)
      setSuccess('Account verified! Redirecting to login...')
      setTimeout(() => {
        navigate('/staff')
      }, 2000)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleResendOTP = async () => {
    if (!email) {
      setError('Please enter your email address')
      return
    }

    setError('')
    setResendLoading(true)

    try {
      await resendOTP(email, 'verification')
      setSuccess('New code sent!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.message)
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <div className="login-page login-staff">
      <div className="card login-card">
        <div className="card-header">
          <div className="login-logo">StaffClock</div>
        </div>
        <div className="card-body">
          <div className="login-title">
            <i className="fas fa-user-check me-2"></i>
            Verify Your Account
          </div>
          
          <form onSubmit={handleVerify}>
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
            
            <div className="mb-3">
              <label className="form-label">Verification Code</label>
              <div className="input-group">
                <input 
                  className="form-control text-center" 
                  type="text" 
                  value={otp} 
                  onChange={e=>setOtp(e.target.value)} 
                  required 
                  placeholder="Enter 6-digit code"
                  maxLength="6"
                  disabled={loading}
                />
                <button 
                  type="button"
                  className="btn btn-outline-warning"
                  onClick={handleResendOTP}
                  disabled={resendLoading || loading}
                >
                  {resendLoading ? (
                    <i className="fas fa-spinner fa-spin"></i>
                  ) : (
                    <i className="fas fa-redo"></i>
                  )}
                </button>
              </div>
              <small className="text-muted">Didn't receive the code? Click the refresh button</small>
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
                  Verifying...
                </>
              ) : (
                <>
                  <i className="fas fa-shield-check me-2"></i>
                  Verify Account
                </>
              )}
            </button>
          </form>
          
          <div className="text-center">
            <Link to="/staff" className="text-decoration-none">
              <i className="fas fa-arrow-left me-2"></i>
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}