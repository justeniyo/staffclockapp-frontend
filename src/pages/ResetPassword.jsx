import { useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { resetPassword, resendOTP } = useAuth()
  const [email, setEmail] = useState(searchParams.get('email') || '')
  const [otp, setOtp] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long')
      return
    }

    setLoading(true)

    try {
      await resetPassword(email, otp, password)
      setSuccess('Password reset successfully! You can now login with your new password.')
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

    setResendLoading(true)
    setError('')

    try {
      await resendOTP(email, 'password_reset')
      setSuccess('New verification code sent to your email!')
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
            <i className="fas fa-shield-alt me-2"></i>
            Set New Password
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
            
            <div className="mb-3">
              <label className="form-label">New Password</label>
              <input 
                className="form-control" 
                type="password" 
                value={password} 
                onChange={e=>setPassword(e.target.value)} 
                required 
                placeholder="Enter new password"
                minLength="6"
                disabled={loading}
              />
            </div>
            
            <div className="mb-3">
              <label className="form-label">Confirm Password</label>
              <input 
                className="form-control" 
                type="password" 
                value={confirmPassword} 
                onChange={e=>setConfirmPassword(e.target.value)} 
                required 
                placeholder="Confirm new password"
                minLength="6"
                disabled={loading}
              />
            </div>
            
            {error && (
              <div className="alert alert-danger py-3">
                <i className="fas fa-exclamation-triangle me-2"></i>
                {error}
              </div>
            )}
            
            {success && (
              <div className="alert alert-success py-3">
                <i className="fas fa-check-circle me-2"></i>
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
                  Updating...
                </>
              ) : (
                <>
                  <i className="fas fa-lock me-2"></i>
                  Update Password
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