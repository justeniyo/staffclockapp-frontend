import { useState, useEffect } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function VerifyAccount() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { verifyOTP, resendOTP, allUsers, activeOTPs } = useAuth()
  const [email, setEmail] = useState(searchParams.get('email') || '')
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [userInfo, setUserInfo] = useState(null)

  // Get user information for better UX
  useEffect(() => {
    if (email && allUsers[email]) {
      setUserInfo(allUsers[email])
    }
  }, [email, allUsers])

  // Get OTP info if available (for better UX)
  const otpInfo = activeOTPs[email]
  const timeRemaining = otpInfo ? Math.max(0, Math.ceil((otpInfo.expires - Date.now()) / 1000)) : 0

  const handleVerify = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await verifyOTP(email, otp)
      setSuccess('Account verified successfully! Setting up your account...')
      
      // Enhanced redirect logic based on user role and setup status
      setTimeout(() => {
        if (userInfo) {
          // For new users, always go to password reset for initial setup
          navigate(`/reset-password?email=${email}&verified=true&setup=true`)
        } else {
          // Fallback to basic setup flow
          navigate(`/reset-password?email=${email}&verified=true`)
        }
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
      setSuccess('New verification code sent to your email!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.message)
    } finally {
      setResendLoading(false)
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
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
          
          {/* Enhanced user information display */}
          {userInfo && (
            <div className="alert alert-info mb-4">
              <div className="d-flex align-items-start">
                <i className="fas fa-info-circle me-2 mt-1"></i>
                <div>
                  <strong>Account Setup for:</strong>
                  <div className="mt-1">
                    <div className="fw-semibold">{userInfo.firstName} {userInfo.lastName}</div>
                    <small className="text-muted">
                      {userInfo.jobTitle && `${userInfo.jobTitle} • `}
                      {userInfo.department || 'Staff Member'}
                    </small>
                  </div>
                  <div className="mt-2 small">
                    <strong>Next steps:</strong> After verification, you'll set your secure password.
                  </div>
                </div>
              </div>
            </div>
          )}
          
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
              {userInfo && !userInfo.verified && (
                <small className="text-warning">
                  <i className="fas fa-exclamation-triangle me-1"></i>
                  Account requires email verification
                </small>
              )}
            </div>
            
            <div className="mb-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <label className="form-label mb-0">Verification Code</label>
                {timeRemaining > 0 && (
                  <small className="text-muted">
                    <i className="fas fa-clock me-1"></i>
                    Expires in {formatTime(timeRemaining)}
                  </small>
                )}
              </div>
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
                  style={{letterSpacing: '0.5em', fontSize: '1.1rem'}}
                />
                <button 
                  type="button"
                  className="btn btn-outline-warning"
                  onClick={handleResendOTP}
                  disabled={resendLoading || loading || timeRemaining > 240} // Prevent spam
                  title={timeRemaining > 240 ? "Wait before requesting new code" : "Resend verification code"}
                >
                  {resendLoading ? (
                    <i className="fas fa-spinner fa-spin"></i>
                  ) : (
                    <i className="fas fa-redo"></i>
                  )}
                </button>
              </div>
              <div className="d-flex justify-content-between mt-1">
                <small className="text-muted">
                  {timeRemaining > 240 
                    ? `Wait ${formatTime(timeRemaining - 240)} before resending`
                    : "Didn't receive the code? Click refresh"
                  }
                </small>
                {otpInfo && otpInfo.attempts > 0 && (
                  <small className="text-warning">
                    {otpInfo.attempts} failed attempt{otpInfo.attempts !== 1 ? 's' : ''}
                  </small>
                )}
              </div>
            </div>
            
            {error && (
              <div className="alert alert-danger py-2">
                <i className="fas fa-exclamation-triangle me-2"></i>
                {error}
                {error.includes('Invalid verification code') && otpInfo?.attempts > 2 && (
                  <div className="mt-2 small">
                    <strong>Too many failed attempts?</strong> Try requesting a new code.
                  </div>
                )}
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
              disabled={loading || otp.length !== 6}
            >
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin me-2"></i>
                  Verifying Account...
                </>
              ) : (
                <>
                  <i className="fas fa-shield-check me-2"></i>
                  Verify & Continue Setup
                </>
              )}
            </button>
          </form>
          
          {/* Enhanced help section */}
          <div className="mt-4 pt-3 border-top">
            <h6 className="small text-muted mb-2">NEED HELP?</h6>
            <div className="small text-muted">
              <div className="mb-1">
                <i className="fas fa-envelope me-1"></i>
                <strong>No email received?</strong> Check your spam folder or contact IT support
              </div>
              <div className="mb-1">
                <i className="fas fa-clock me-1"></i>
                <strong>Code expired?</strong> Request a new verification code
              </div>
              <div>
                <i className="fas fa-user-cog me-1"></i>
                <strong>Wrong email?</strong> Contact your system administrator
              </div>
            </div>
          </div>
          
          <div className="text-center mt-3">
            <Link to="/" className="text-decoration-none">
              <i className="fas fa-arrow-left me-2"></i>
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}