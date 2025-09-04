import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function VerifyAccount() {
  const [searchParams] = useSearchParams()
  const { verifyOTP, resendVerificationOTP } = useAuth()
  const [email, setEmail] = useState(searchParams.get('email') || '')
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleVerify = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await verifyOTP(email, otp)
      setSuccess('Account verified successfully! You can now login with your credentials.')
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
    setLoading(true)

    try {
      await resendVerificationOTP(email)
      setSuccess('New verification code sent to your email!')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page login-staff">
      <div className="card login-card">
        <div className="card-header">
          <div className="login-logo">StaffClock</div>
        </div>
        <div className="card-body">
          <div className="login-title">Verify Your Account</div>
          
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
              />
            </div>
            
            <div className="mb-3">
              <label className="form-label">Verification Code</label>
              <input 
                className="form-control text-center" 
                type="text" 
                value={otp} 
                onChange={e=>setOtp(e.target.value)} 
                required 
                placeholder="Enter 6-digit code"
                maxLength="6"
              />
            </div>
            
            {error && <div className="alert alert-danger py-2">{error}</div>}
            {success && <div className="alert alert-success py-2">{success}</div>}
            
            <button 
              className="btn btn-warning w-100 mb-3" 
              type="submit"
              disabled={loading}
            >
              {loading ? 'Verifying...' : 'Verify Account'}
            </button>
          </form>
          
          <div className="text-center">
            <button 
              className="btn btn-link p-0 text-decoration-none"
              onClick={handleResendOTP}
              disabled={loading}
            >
              Didn't receive the code? Resend
            </button>
          </div>
          
          <div className="text-center mt-3">
            <Link to="/staff" className="text-decoration-none">
              ← Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}