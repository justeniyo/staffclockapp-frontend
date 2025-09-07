import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { getFullName, getUserById } from '../../config/seedUsers'

export default function RegisterStaff() {
  const { 
    registerStaff, 
    allUsers, 
    departments, 
    locations,
    createDepartment,
    createLocation
  } = useAuth()
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    department: '',
    jobTitle: '',
    role: 'staff',
    isManager: false,
    managerId: '',
    assignedLocationId: ''
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // Confirmation modal state
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [confirmationData, setConfirmationData] = useState(null)
  
  // Department and location management
  const [showCreateDepartment, setShowCreateDepartment] = useState(false)
  const [showCreateLocation, setShowCreateLocation] = useState(false)
  const [newDepartment, setNewDepartment] = useState({ name: '', description: '' })
  const [newLocation, setNewLocation] = useState({ name: '', address: '', type: 'office' })

  const departmentsList = Object.values(departments).filter(dept => dept.isActive)
  const locationsList = Object.values(locations).filter(loc => loc.isActive)
  
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

  const handleSubmit = async (e) => {
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

      if (!formData.assignedLocationId) {
        throw new Error('Location assignment is required')
      }
      
      // Prepare confirmation data
      const manager = formData.managerId ? getUserById(formData.managerId) : null
      const location = locations[formData.assignedLocationId]
      const department = departmentsList.find(d => d.name === formData.department)
      
      setConfirmationData({
        ...formData,
        managerName: manager ? getFullName(manager) : 'None',
        locationName: location?.name || 'Unknown',
        departmentName: department?.name || formData.department
      })
      
      setShowConfirmation(true)
    } catch (err) {
      setError(err.message)
    }
  }

  // ACTUAL REGISTRATION AFTER CONFIRMATION
  const confirmRegistration = async () => {
    try {
      const result = registerStaff(formData)
      setSuccess(`Staff registered successfully! 
        Email: ${formData.email} 
        Temporary Password: ${result.defaultPassword} 
        Verification OTP: ${result.otp}
        
        The user must verify their account and set a new password before they can login.`)
      
      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        department: '',
        jobTitle: '',
        role: 'staff',
        isManager: false,
        managerId: '',
        assignedLocationId: ''
      })
      
      setShowConfirmation(false)
      setConfirmationData(null)
    } catch (err) {
      setError(err.message)
      setShowConfirmation(false)
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

  const handleCreateDepartment = async (e) => {
    e.preventDefault()
    setError('')
    
    try {
      if (!newDepartment.name.trim()) {
        throw new Error('Department name is required')
      }
      
      // Check if department already exists
      const existingDept = departmentsList.find(dept => 
        dept.name.toLowerCase() === newDepartment.name.toLowerCase()
      )
      if (existingDept) {
        throw new Error('Department already exists')
      }

      const dept = await createDepartment(newDepartment)
      setFormData(prev => ({ ...prev, department: dept.name }))
      setNewDepartment({ name: '', description: '' })
      setShowCreateDepartment(false)
      setSuccess('Department created successfully!')
    } catch (err) {
      setError(err.message)
    }
  }

  const handleCreateLocation = async (e) => {
    e.preventDefault()
    setError('')
    
    try {
      if (!newLocation.name.trim()) {
        throw new Error('Location name is required')
      }
      
      // Check if location already exists
      const existingLoc = locationsList.find(loc => 
        loc.name.toLowerCase() === newLocation.name.toLowerCase()
      )
      if (existingLoc) {
        throw new Error('Location already exists')
      }

      const location = await createLocation(newLocation)
      setFormData(prev => ({ ...prev, assignedLocationId: location.id }))
      setNewLocation({ name: '', address: '', type: 'office' })
      setShowCreateLocation(false)
      setSuccess('Location created successfully!')
    } catch (err) {
      setError(err.message)
    }
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

  // Helper to determine if staff-related fields should be shown
  const showStaffFields = () => {
    return formData.role === 'staff'
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
                      <label className="form-label">
                        Department *
                        <button 
                          type="button" 
                          className="btn btn-sm btn-outline-primary ms-2"
                          onClick={() => setShowCreateDepartment(true)}
                        >
                          <i className="fas fa-plus"></i> New
                        </button>
                      </label>
                      <select 
                        className="form-select"
                        name="department"
                        value={formData.department}
                        onChange={handleChange}
                        required
                      >
                        <option value="">Select Department</option>
                        {departmentsList.map(dept => (
                          <option key={dept.id} value={dept.name}>{dept.name}</option>
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
                      <label className="form-label">
                        Location Assignment *
                        <button 
                          type="button" 
                          className="btn btn-sm btn-outline-primary ms-2"
                          onClick={() => setShowCreateLocation(true)}
                        >
                          <i className="fas fa-plus"></i> New
                        </button>
                      </label>
                      <select 
                        className="form-select"
                        name="assignedLocationId"
                        value={formData.assignedLocationId}
                        onChange={handleChange}
                        required
                      >
                        <option value="">Select Location</option>
                        {locationsList.map(location => (
                          <option key={location.id} value={location.id}>
                            {location.name} ({location.type})
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    {/* Staff-specific fields - only show for staff role */}
                    {showStaffFields() && (
                      <div className="col-md-6">
                        <div className="form-check mt-4">
                          <input 
                            type="checkbox" 
                            className="form-check-input"
                            name="isManager"
                            checked={formData.isManager}
                            onChange={handleChange}
                          />
                          <label className="form-check-label">
                            Is Manager
                          </label>
                        </div>
                      </div>
                    )}
                    
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

        {/* CONFIRMATION MODAL - REPLACES BROWSER ALERTS */}
        {showConfirmation && confirmationData && (
          <div className="modal show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    <i className="fas fa-user-plus me-2"></i>
                    Confirm Staff Registration
                  </h5>
                  <button 
                    type="button" 
                    className="btn-close"
                    onClick={() => setShowConfirmation(false)}
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="alert alert-info">
                    <i className="fas fa-info-circle me-2"></i>
                    <strong>Please review the details below before confirming registration:</strong>
                  </div>
                  
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-bold">Full Name</label>
                      <div className="p-2 bg-light rounded">
                        {confirmationData.firstName} {confirmationData.lastName}
                      </div>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold">Email</label>
                      <div className="p-2 bg-light rounded">{confirmationData.email}</div>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold">Phone</label>
                      <div className="p-2 bg-light rounded">{confirmationData.phone}</div>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold">Role</label>
                      <div className="p-2 bg-light rounded">
                        <span className="badge bg-primary me-2">
                          {confirmationData.role.toUpperCase()}
                        </span>
                        {confirmationData.isManager && (
                          <span className="badge bg-info">Manager</span>
                        )}
                      </div>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold">Department</label>
                      <div className="p-2 bg-light rounded">{confirmationData.departmentName}</div>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold">Job Title</label>
                      <div className="p-2 bg-light rounded">
                        {confirmationData.jobTitle || 'Not specified'}
                      </div>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold">Reports To</label>
                      <div className="p-2 bg-light rounded">{confirmationData.managerName}</div>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold">Assigned Location</label>
                      <div className="p-2 bg-light rounded">{confirmationData.locationName}</div>
                    </div>
                  </div>
                  
                  <div className="mt-4 p-3 bg-warning bg-opacity-25 rounded">
                    <h6 className="text-warning mb-2">
                      <i className="fas fa-exclamation-triangle me-2"></i>
                      After Registration:
                    </h6>
                    <ul className="mb-0 small">
                      <li>User will receive a temporary password</li>
                      <li>A verification OTP will be sent to their email</li>
                      <li>User must verify their account and set a new password</li>
                      <li>User cannot login until verification is complete</li>
                    </ul>
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => setShowConfirmation(false)}
                  >
                    <i className="fas fa-times me-1"></i>
                    Cancel
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-warning"
                    onClick={confirmRegistration}
                  >
                    <i className="fas fa-check me-1"></i>
                    Confirm Registration
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create Department Modal */}
        {showCreateDepartment && (
          <div className="modal show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    <i className="fas fa-building me-2"></i>
                    Create New Department
                  </h5>
                  <button 
                    type="button" 
                    className="btn-close"
                    onClick={() => setShowCreateDepartment(false)}
                  ></button>
                </div>
                <form onSubmit={handleCreateDepartment}>
                  <div className="modal-body">
                    <div className="mb-3">
                      <label className="form-label">Department Name *</label>
                      <input 
                        type="text" 
                        className="form-control"
                        value={newDepartment.name}
                        onChange={(e) => setNewDepartment(prev => ({...prev, name: e.target.value}))}
                        required
                        placeholder="e.g. Marketing, Legal, etc."
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Description</label>
                      <textarea 
                        className="form-control"
                        value={newDepartment.description}
                        onChange={(e) => setNewDepartment(prev => ({...prev, description: e.target.value}))}
                        rows="3"
                        placeholder="Brief description of the department's role..."
                      />
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button 
                      type="button" 
                      className="btn btn-secondary"
                      onClick={() => setShowCreateDepartment(false)}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="btn btn-primary"
                    >
                      <i className="fas fa-plus me-1"></i>
                      Create Department
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Create Location Modal */}
        {showCreateLocation && (
          <div className="modal show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    <i className="fas fa-map-marker-alt me-2"></i>
                    Create New Location
                  </h5>
                  <button 
                    type="button" 
                    className="btn-close"
                    onClick={() => setShowCreateLocation(false)}
                  ></button>
                </div>
                <form onSubmit={handleCreateLocation}>
                  <div className="modal-body">
                    <div className="mb-3">
                      <label className="form-label">Location Name *</label>
                      <input 
                        type="text" 
                        className="form-control"
                        value={newLocation.name}
                        onChange={(e) => setNewLocation(prev => ({...prev, name: e.target.value}))}
                        required
                        placeholder="e.g. Branch Office, Warehouse 2, etc."
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Address</label>
                      <input 
                        type="text" 
                        className="form-control"
                        value={newLocation.address}
                        onChange={(e) => setNewLocation(prev => ({...prev, address: e.target.value}))}
                        placeholder="Physical address or description"
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Location Type</label>
                      <select 
                        className="form-select"
                        value={newLocation.type}
                        onChange={(e) => setNewLocation(prev => ({...prev, type: e.target.value}))}
                      >
                        <option value="office">Office</option>
                        <option value="warehouse">Warehouse</option>
                        <option value="remote">Remote</option>
                        <option value="field">Field</option>
                      </select>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button 
                      type="button" 
                      className="btn btn-secondary"
                      onClick={() => setShowCreateLocation(false)}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="btn btn-primary"
                    >
                      <i className="fas fa-plus me-1"></i>
                      Create Location
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}