import { useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { resetPassword } = useAuth()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  
  const token = searchParams.get('token')

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
      await resetPassword(token, password)
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

  if (!token) {
    return (
      <div className="login-page login-staff">
        <div className="card login-card">
          <div className="card-header">
            <div className="login-logo">StaffClock</div>
          </div>
          <div className="card-body text-center">
            <div className="alert alert-danger">
              Invalid reset link. Please request a new password reset.
            </div>
            <Link to="/staff" className="btn btn-warning">
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="login-page login-staff">
      <div className="card login-card">
        <div className="card-header">
          <div className="login-logo">StaffClock</div>
        </div>
        <div className="card-body">
          <div className="login-title">Set New Password</div>
          
          <form onSubmit={handleSubmit}>
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
              />
            </div>
            
            {error && <div className="alert alert-danger py-2">{error}</div>}
            {success && <div className="alert alert-success py-2">{success}</div>}
            
            <button 
              className="btn btn-warning w-100 mb-3" 
              type="submit"
              disabled={loading}
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
          
          <div className="text-center">
            <Link to="/staff" className="text-decoration-none">
              ← Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}