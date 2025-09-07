import { useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function VerifyResetOTP() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { activeOTPs, resendOTP } = useAuth()
  const [email, setEmail] = useState(searchParams.get('email') || '')
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const otpData = activeOTPs[email]
      
      console.log('Verifying reset OTP:', { email, providedOTP: otp, storedData: otpData, currentTime: Date.now() })
      
      if (!otpData || otpData.type !== 'password_reset') {
        throw new Error('No password reset request found')
      }

      // FIXED: Proper string comparison for OTP
      if (otpData.otp.toString() !== otp.toString()) {
        console.log('Reset OTP mismatch:', { provided: otp, expected: otpData.otp })
        throw new Error('Invalid verification code')
      }

      if (Date.now() > otpData.expires) {
        console.log('Reset OTP expired:', { currentTime: Date.now(), expires: otpData.expires })
        throw new Error('Code expired. Request a new one.')
      }

      // OTP verified, redirect to password reset
      navigate(`/reset-password?email=${email}&verified=true`)
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

    setResendLoading(true)
    setError('')

    try {
      await resendOTP(email, 'password_reset')
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
            <i className="fas fa-key me-2"></i>
            Verify Reset Code
          </div>
          
          {/* Debug info for demo */}
          {activeOTPs[email] && (
            <div className="alert alert-warning mb-3">
              <div className="small">
                <strong>Demo Code:</strong> {activeOTPs[email].otp}
                <br/>
                <small className="text-muted">
                  Expires: {new Date(activeOTPs[email].expires).toLocaleTimeString()}
                </small>
              </div>
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Email Address</label>
              <input 
                className="form-control" 
                type="email" 
                value={email} 
                onChange={e=>setEmail(e.target.value)} 
                required 
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
                  placeholder="6-digit code"
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
                  <i className="fas fa-check me-2"></i>
                  Verify Code
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