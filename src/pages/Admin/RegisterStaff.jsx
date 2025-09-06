import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { getFullName, getUserById } from '../../config/seedUsers'

export default function RegisterStaff() {
  const { registerStaff, allUsers } = useAuth()
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    department: '',
    jobTitle: '',
    role: 'staff',
    isManager: false,
    managerId: ''
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const departments = ['IT', 'HR', 'Sales', 'Operations', 'Finance', 'Marketing', 'Administration', 'Security', 'Executive']
  
  // Get potential managers based on hierarchy
  const getPotentialManagers = () => {
    const usersList = Object.values(allUsers)
    
    if (formData.role === 'ceo') {
      return [] // CEO reports to no one
    }
    
    if (formData.role === 'admin' || formData.role === 'security') {
      // Admin and Security can report to admin or CEO
      return usersList.filter(user => 
        (user.role === 'admin' || user.role === 'ceo') && 
        user.isActive
      )
    }
    
    // For staff members
    if (formData.department) {
      // First try to find managers in the same department
      const departmentManagers = usersList.filter(user => 
        user.department === formData.department &&
        user.isManager && 
        user.role === 'staff' &&
        user.isActive
      )
      
      if (departmentManagers.length > 0) {
        return departmentManagers
      }
      
      // If no department managers, show executives and CEO
      return usersList.filter(user => 
        (user.role === 'ceo' || 
         (user.role === 'staff' && user.isManager && 
          ['Executive', 'Administration'].includes(user.department))) &&
        user.isActive
      )
    }
    
    // Default: show all managers
    return usersList.filter(user => 
      user.isManager && user.isActive
    )
  }

  const potentialManagers = getPotentialManagers()

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    
    try {
      if (allUsers[formData.email]) {
        throw new Error('Email already exists')
      }
      
      // Validate manager selection for non-CEO roles
      if (formData.role !== 'ceo' && !formData.managerId) {
        throw new Error('Manager selection is required')
      }
      
      // Validate role-specific rules
      if (formData.role === 'ceo' && formData.managerId) {
        throw new Error('CEO cannot have a manager')
      }
      
      if (formData.role === 'admin' && formData.isManager) {
        throw new Error('Admin role cannot be a manager')
      }
      
      if (formData.role === 'security' && formData.isManager) {
        throw new Error('Security role cannot be a manager')
      }
      
      const result = registerStaff(formData)
      setSuccess(`Staff registered successfully! Email: ${formData.email} | Password: ${result.defaultPassword} | OTP: ${result.otp}`)
      
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        department: '',
        jobTitle: '',
        role: 'staff',
        isManager: false,
        managerId: ''
      })
    } catch (err) {
      setError(err.message)
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => {
      const newData = {
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }
      
      // Reset manager when role changes
      if (name === 'role') {
        newData.managerId = ''
        newData.isManager = value === 'ceo' ? true : false // CEO is always a manager
      }
      
      // Reset manager when department changes
      if (name === 'department') {
        newData.managerId = ''
      }
      
      // CEO cannot have isManager false
      if (name === 'role' && value === 'ceo') {
        newData.isManager = true
      }
      
      // Admin and Security cannot be managers
      if (name === 'role' && (value === 'admin' || value === 'security')) {
        newData.isManager = false
      }
      
      return newData
    })
  }

  const getManagerDisplayName = (manager) => {
    const title = manager.jobTitle || manager.role.charAt(0).toUpperCase() + manager.role.slice(1)
    return `${getFullName(manager)} - ${title} (${manager.department})`
  }

  const getRoleDescription = (role) => {
    const descriptions = {
      staff: 'Regular employee who can be assigned to departments and report to managers',
      admin: 'System administrator with full access to manage staff and system settings',
      security: 'Third-party security guard assigned to monitor specific sites',
      ceo: 'Chief Executive Officer - highest level in organization hierarchy'
    }
    return descriptions[role] || ''
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
                        <option value="security">Security</option>
                        <option value="ceo">CEO</option>
                      </select>
                      <small className="text-muted">
                        {getRoleDescription(formData.role)}
                      </small>
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
                      <label className="form-label">Job Title</label>
                      <input 
                        type="text" 
                        className="form-control"
                        name="jobTitle"
                        value={formData.jobTitle}
                        onChange={handleChange}
                        placeholder="e.g. Senior Developer, Sales Manager"
                      />
                    </div>
                    <div className="col-md-6">
                      <div className="form-check mt-4">
                        <input 
                          type="checkbox" 
                          className="form-check-input"
                          name="isManager"
                          checked={formData.isManager}
                          onChange={handleChange}
                          disabled={formData.role === 'ceo' || formData.role === 'admin' || formData.role === 'security'}
                        />
                        <label className="form-check-label">
                          Is Manager
                          {formData.role === 'ceo' && <small className="text-muted ms-2">(CEO is always a manager)</small>}
                          {(formData.role === 'admin' || formData.role === 'security') && 
                            <small className="text-muted ms-2">({formData.role} cannot be manager)</small>}
                        </label>
                      </div>
                    </div>
                    
                    {/* Manager Selection */}
                    {formData.role !== 'ceo' && (
                      <div className="col-12">
                        <label className="form-label">
                          Reports To *
                          <small className="text-muted ms-2">
                            {formData.department && `(Showing managers for ${formData.department} department)`}
                          </small>
                        </label>
                        <select 
                          className="form-select"
                          name="managerId"
                          value={formData.managerId}
                          onChange={handleChange}
                          required={formData.role !== 'ceo'}
                        >
                          <option value="">Select Manager</option>
                          {potentialManagers.map(manager => (
                            <option key={manager.id} value={manager.id}>
                              {getManagerDisplayName(manager)}
                            </option>
                          ))}
                        </select>
                        {potentialManagers.length === 0 && formData.department && (
                          <small className="text-warning">
                            <i className="fas fa-exclamation-triangle me-1"></i>
                            No managers found for {formData.department} department. Please select a different department or create a manager first.
                          </small>
                        )}
                      </div>
                    )}
                    
                    {/* Hierarchy Preview */}
                    {formData.managerId && (
                      <div className="col-12">
                        <div className="alert alert-info">
                          <h6 className="alert-heading">
                            <i className="fas fa-sitemap me-2"></i>
                            Reporting Hierarchy Preview
                          </h6>
                          <div className="d-flex align-items-center">
                            <span className="badge bg-primary me-2">
                              {getFullName(formData)} ({formData.jobTitle || formData.role})
                            </span>
                            <i className="fas fa-arrow-right mx-2"></i>
                            <span className="badge bg-success">
                              {getManagerDisplayName(getUserById(formData.managerId))}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {error && <div className="alert alert-danger mt-3">{error}</div>}
                  {success && <div className="alert alert-success mt-3">{success}</div>}
                  
                  <div className="mt-4">
                    <button type="submit" className="btn btn-warning">
                      <i className="fas fa-user-plus me-2"></i>
                      Register Staff Member
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Hierarchy Information Card */}
            <div className="card mt-4">
              <div className="card-header">
                <h6 className="mb-0">
                  <i className="fas fa-info-circle me-2"></i>
                  Organization Hierarchy Guidelines
                </h6>
              </div>
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-md-6">
                    <h6>Role Hierarchy:</h6>
                    <ul className="list-unstyled">
                      <li><i className="fas fa-crown text-warning me-2"></i><strong>CEO:</strong> Top level, no manager</li>
                      <li><i className="fas fa-users text-primary me-2"></i><strong>Executives:</strong> Report to CEO</li>
                      <li><i className="fas fa-user-tie text-info me-2"></i><strong>Department Managers:</strong> Report to Executives</li>
                      <li><i className="fas fa-user text-secondary me-2"></i><strong>Staff:</strong> Report to Department Managers</li>
                    </ul>
                  </div>
                  <div className="col-md-6">
                    <h6>Special Roles:</h6>
                    <ul className="list-unstyled">
                      <li><i className="fas fa-cog text-danger me-2"></i><strong>Admin:</strong> System management, outside hierarchy</li>
                      <li><i className="fas fa-shield-alt text-warning me-2"></i><strong>Security:</strong> Third-party, reports to admin</li>
                    </ul>
                    
                    <h6 className="mt-3">Manager Rules:</h6>
                    <ul className="list-unstyled small text-muted">
                      <li>• CEO is automatically a manager</li>
                      <li>• Admin and Security cannot be managers</li>
                      <li>• Staff can be managers of their department</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}