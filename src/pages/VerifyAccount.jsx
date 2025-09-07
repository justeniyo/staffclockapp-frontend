import { useState, useEffect } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function VerifyAccount() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { verifyOTP, resendOTP, activeOTPs } = useAuth()
  const [email, setEmail] = useState(searchParams.get('email') || '')
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)

  // FIXED: Debug OTP data for development
  useEffect(() => {
    if (email && activeOTPs[email]) {
      console.log('Current OTP for', email, ':', activeOTPs[email].otp)
      console.log('OTP expires at:', new Date(activeOTPs[email].expires).toLocaleString())
    }
  }, [email, activeOTPs])

  const handleVerify = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      console.log('Attempting to verify OTP:', { email, otp, activeOTPs })
      await verifyOTP(email, otp)
      setSuccess('Account verified! Redirecting to set your password...')
      // FIXED: After verification, redirect to password reset instead of login
      setTimeout(() => {
        navigate(`/reset-password?email=${email}&verified=true`)
      }, 2000)
    } catch (err) {
      console.error('Verification error:', err)
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
      const result = await resendOTP(email, 'verification')
      setSuccess('New verification code sent!')
      console.log('New OTP generated:', result.otp)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.message)
    } finally {
      setResendLoading(false)
    }
  }

  // FIXED: Get current OTP info for debugging
  const currentOtpData = activeOTPs[email]
  const isOtpExpired = currentOtpData ? Date.now() > currentOtpData.expires : false

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
          
          <div className="alert alert-info mb-4">
            <i className="fas fa-info-circle me-2"></i>
            <strong>New User Setup:</strong>
            <div className="small mt-1">
              After verification, you'll be prompted to set your new password.
            </div>
          </div>

          {/* FIXED: Development helper - show current OTP */}
          {process.env.NODE_ENV === 'development' && currentOtpData && (
            <div className="alert alert-warning mb-3">
              <div className="small">
                <strong>Development Mode:</strong><br/>
                Current OTP: <code>{currentOtpData.otp}</code><br/>
                Expires: {new Date(currentOtpData.expires).toLocaleString()}<br/>
                Status: {isOtpExpired ? 'Expired' : 'Valid'}
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
                  title="Resend verification code"
                >
                  {resendLoading ? (
                    <i className="fas fa-spinner fa-spin"></i>
                  ) : (
                    <i className="fas fa-redo"></i>
                  )}
                </button>
              </div>
              <small className="text-muted">
                {isOtpExpired ? (
                  <span className="text-danger">Code expired - click refresh to get a new one</span>
                ) : (
                  "Didn't receive the code? Click the refresh button"
                )}
              </small>
            </div>
            
            {error && (
              <div className="alert alert-danger py-2">
                <i className="fas fa-exclamation-triangle me-2"></i>
                {error}
                {currentOtpData && (
                  <div className="small mt-1">
                    Debug: OTP exists = {!!currentOtpData}, 
                    Provided = "{otp}", 
                    Expected = "{currentOtpData.otp}",
                    Expired = {isOtpExpired ? 'Yes' : 'No'}
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
              disabled={loading || !otp.trim()}
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

          {/* FIXED: Help section for OTP issues */}
          <div className="mt-4 pt-3 border-top">
            <h6 className="small text-muted mb-2">Having Issues?</h6>
            <div className="small text-muted">
              <div className="mb-1">• Make sure you're entering the 6-digit code exactly as received</div>
              <div className="mb-1">• Check if the code has expired (codes are valid for 5 minutes)</div>
              <div className="mb-1">• Click the refresh button to get a new code if needed</div>
              <div>• Contact support if problems persist</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}