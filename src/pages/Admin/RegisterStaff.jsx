import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { getFullName } from '../../config/seedUsers'

export default function RegisterStaff() {
  const { registerStaff, allUsers } = useAuth()
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    department: '',
    role: 'staff',
    isManager: false,
    manager: ''
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const departments = ['IT', 'HR', 'Sales', 'Operations', 'Finance', 'Marketing']
  const managers = Object.entries(allUsers).filter(([email, user]) => 
    user.isManager && user.role === 'staff' && user.isActive
  )

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    
    try {
      if (allUsers[formData.email]) {
        throw new Error('Email already exists')
      }
      
      const result = registerStaff(formData)
      setSuccess(`Staff registered successfully! Email: ${formData.email} | Password: ${result.defaultPassword} | OTP: ${result.otp}`)
      
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        department: '',
        role: 'staff',
        isManager: false,
        manager: ''
      })
    } catch (err) {
      setError(err.message)
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Register New Staff</h2>
      </div>
      
      <div className="page-content">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">Staff Information</h5>
              </div>
              <div className="card-body">
                <form onSubmit={handleSubmit}>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">First Name *</label>
                      <input 
                        type="text" 
                        className="form-control"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Last Name *</label>
                      <input 
                        type="text" 
                        className="form-control"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Email Address *</label>
                      <input 
                        type="email" 
                        className="form-control"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Phone Number *</label>
                      <input 
                        type="tel" 
                        className="form-control"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="+1-555-0123"
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Department *</label>
                      <select 
                        className="form-select"
                        name="department"
                        value={formData.department}
                        onChange={handleChange}
                        required
                      >
                        <option value="">Select Department</option>
                        {departments.map(dept => (
                          <option key={dept} value={dept}>{dept}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Role *</label>
                      <select 
                        className="form-select"
                        name="role"
                        value={formData.role}
                        onChange={handleChange}
                        required
                      >
                        <option value="staff">Staff</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <div className="form-check mt-4">
                        <input 
                          type="checkbox" 
                          className="form-check-input"
                          name="isManager"
                          checked={formData.isManager}
                          onChange={handleChange}
                        />
                        <label className="form-check-label">Is Manager</label>
                      </div>
                    </div>
                    {!formData.isManager && formData.role === 'staff' && (
                      <div className="col-12">
                        <label className="form-label">Reports To</label>
                        <select 
                          className="form-select"
                          name="manager"
                          value={formData.manager}
                          onChange={handleChange}
                        >
                          <option value="">Select Manager (Optional)</option>
                          {managers.map(([email, manager]) => (
                            <option key={email} value={email}>
                              {getFullName(manager)} - {manager.department}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                  
                  {error && <div className="alert alert-danger mt-3">{error}</div>}
                  {success && <div className="alert alert-success mt-3">{success}</div>}
                  
                  <div className="mt-4">
                    <button type="submit" className="btn btn-warning">
                      Register Staff Member
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}