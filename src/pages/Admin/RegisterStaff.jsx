import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { getFullName, getUserById, isCEO, canAccessManagerPortal } from '../../config/seedUsers'

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
  
  // ENHANCED: Department and location management with detailed confirmation
  const [showCreateDepartment, setShowCreateDepartment] = useState(false)
  const [showCreateLocation, setShowCreateLocation] = useState(false)
  const [showDepartmentConfirmation, setShowDepartmentConfirmation] = useState(false)
  const [showLocationConfirmation, setShowLocationConfirmation] = useState(false)
  const [newDepartment, setNewDepartment] = useState({ name: '', description: '' })
  const [newLocation, setNewLocation] = useState({ name: '', address: '', type: 'office' })

  const departmentsList = Object.values(departments).filter(dept => dept.isActive)
  const locationsList = Object.values(locations).filter(loc => loc.isActive)
  
  // Get potential managers based on hierarchy
  const getPotentialManagers = () => {
    const usersList = Object.values(allUsers)
    
    if (formData.role === 'staff' && formData.subRole === 'ceo') {
      return [] // CEO reports to no one
    }
    
    if (formData.role === 'admin' || formData.role === 'security') {
      // Admin and Security can report to admin or CEO
      return usersList.filter(user => 
        (user.role === 'admin' || isCEO(user)) && 
        user.isActive
      )
    }
    
    // For staff members (including CEO)
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
        (isCEO(user) || 
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
      if (!(formData.role === 'staff' && formData.subRole === 'ceo') && !formData.managerId) {
        throw new Error('Manager selection is required')
      }
      
      // Validate role-specific rules
      if (formData.role === 'staff' && formData.subRole === 'ceo' && formData.managerId) {
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
        departmentName: department?.name || formData.department,
        displayRole: formData.subRole === 'ceo' ? 'CEO (Staff)' : formData.role
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
        newData.isManager = value === 'staff' && prev.subRole === 'ceo' ? true : false
      }
      
      // Handle CEO sub-role
      if (name === 'subRole') {
        if (value === 'ceo') {
          newData.isManager = true
          newData.managerId = ''
          newData.department = 'Executive'
        }
      }
      
      // Reset manager when department changes
      if (name === 'department') {
        newData.managerId = ''
      }
      
      // Admin and Security cannot be managers
      if (name === 'role' && (value === 'admin' || value === 'security')) {
        newData.isManager = false
        newData.subRole = ''
      }
      
      return newData
    })
  }

  // ENHANCED: Department creation with detailed confirmation
  const handleDepartmentSubmit = (e) => {
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

      // Show confirmation modal instead of creating immediately
      setShowDepartmentConfirmation(true)
    } catch (err) {
      setError(err.message)
    }
  }

  const confirmDepartmentCreation = async () => {
    try {
      const dept = await createDepartment(newDepartment)
      setFormData(prev => ({ ...prev, department: dept.name }))
      setNewDepartment({ name: '', description: '' })
      setShowCreateDepartment(false)
      setShowDepartmentConfirmation(false)
      setSuccess('Department created successfully!')
    } catch (err) {
      setError(err.message)
    }
  }

  // ENHANCED: Location creation with detailed confirmation
  const handleLocationSubmit = (e) => {
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

      // Show confirmation modal instead of creating immediately
      setShowLocationConfirmation(true)
    } catch (err) {
      setError(err.message)
    }
  }

  const confirmLocationCreation = async () => {
    try {
      const location = await createLocation(newLocation)
      setFormData(prev => ({ ...prev, assignedLocationId: location.id }))
      setNewLocation({ name: '', address: '', type: 'office' })
      setShowCreateLocation(false)
      setShowLocationConfirmation(false)
      setSuccess('Location created successfully!')
    } catch (err) {
      setError(err.message)
    }
  }

  const getManagerDisplayName = (manager) => {
    const title = manager.jobTitle || manager.role.charAt(0).toUpperCase() + manager.role.slice(1)
    const ceoLabel = isCEO(manager) ? ' (CEO)' : ''
    return `${getFullName(manager)} - ${title} (${manager.department})${ceoLabel}`
  }

  const getRoleDescription = (role, subRole = '') => {
    if (role === 'staff' && subRole === 'ceo') {
      return 'Chief Executive Officer - highest level in organization hierarchy with manager portal access'
    }
    
    const descriptions = {
      staff: 'Regular employee who can be assigned to departments and report to managers',
      admin: 'System administrator with full access to manage staff and system settings',
      security: 'Third-party security guard assigned to monitor specific sites'
    }
    return descriptions[role] || ''
  }

  // Helper to determine if staff-related fields should be shown
  const showStaffFields = () => {
    return formData.role === 'staff'
  }

  const getLocationTypeDescription = (type) => {
    const descriptions = {
      office: 'Standard office environment with desk work',
      warehouse: 'Industrial warehouse or storage facility',
      remote: 'Work from home or remote location',
      field: 'Mobile or outdoor work assignments'
    }
    return descriptions[type] || ''
  }

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Register New Staff</h2>
        <p className="mb-0 text-muted">Create new user accounts with detailed confirmation</p>
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
                      </select>
                      <small className="text-muted">
                        {getRoleDescription(formData.role, formData.subRole)}
                      </small>
                    </div>
                    
                    {/* CEO Sub-role Option for Staff */}
                    {formData.role === 'staff' && (
                      <div className="col-md-6">
                        <label className="form-label">Executive Level</label>
                        <select 
                          className="form-select"
                          name="subRole"
                          value={formData.subRole || ''}
                          onChange={handleChange}
                        >
                          <option value="">Regular Staff</option>
                          <option value="ceo">Chief Executive Officer</option>
                        </select>
                        <small className="text-muted">
                          CEO gets automatic manager portal access
                        </small>
                      </div>
                    )}
                    
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
                        disabled={formData.subRole === 'ceo'}
                      >
                        <option value="">Select Department</option>
                        {departmentsList.map(dept => (
                          <option key={dept.id} value={dept.name}>{dept.name}</option>
                        ))}
                      </select>
                      {formData.subRole === 'ceo' && (
                        <small className="text-info">CEO is automatically assigned to Executive department</small>
                      )}
                    </div>
                    
                    <div className="col-md-6">
                      <label className="form-label">Job Title</label>
                      <input 
                        type="text" 
                        className="form-control"
                        name="jobTitle"
                        value={formData.jobTitle}
                        onChange={handleChange}
                        placeholder={formData.subRole === 'ceo' ? 'Chief Executive Officer' : 'e.g. Senior Developer, Sales Manager'}
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
                    
                    {/* Staff-specific fields */}
                    {showStaffFields() && (
                      <div className="col-md-6">
                        <div className="form-check mt-4">
                          <input 
                            type="checkbox" 
                            className="form-check-input"
                            name="isManager"
                            checked={formData.isManager || formData.subRole === 'ceo'}
                            onChange={handleChange}
                            disabled={formData.subRole === 'ceo'}
                          />
                          <label className="form-check-label">
                            Is Manager
                            {formData.subRole === 'ceo' && (
                              <span className="text-info ms-2">(CEO is automatically a manager)</span>
                            )}
                          </label>
                        </div>
                      </div>
                    )}
                    
                    {/* Manager Selection */}
                    {!(formData.role === 'staff' && formData.subRole === 'ceo') && (
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
                          required
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
                    {(formData.managerId || formData.subRole === 'ceo') && (
                      <div className="col-12">
                        <div className="alert alert-info">
                          <h6 className="alert-heading">
                            <i className="fas fa-sitemap me-2"></i>
                            Reporting Hierarchy Preview
                          </h6>
                          <div className="d-flex align-items-center">
                            <span className="badge bg-primary me-2">
                              {getFullName(formData)} ({formData.jobTitle || formData.subRole === 'ceo' ? 'CEO' : formData.role})
                            </span>
                            {formData.managerId && (
                              <>
                                <i className="fas fa-arrow-right mx-2"></i>
                                <span className="badge bg-success">
                                  {getManagerDisplayName(getUserById(formData.managerId))}
                                </span>
                              </>
                            )}
                            {formData.subRole === 'ceo' && (
                              <span className="badge bg-warning text-dark ms-2">Top Level - No Manager</span>
                            )}
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

            {/* Enhanced Hierarchy Information Card */}
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
                      <li><i className="fas fa-crown text-warning me-2"></i><strong>CEO:</strong> Top level, manager portal access</li>
                      <li><i className="fas fa-users text-primary me-2"></i><strong>Executives:</strong> Report to CEO, manage departments</li>
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
                      <li>• CEO automatically gets manager privileges</li>
                      <li>• Admin and Security cannot be managers</li>
                      <li>• Staff can be managers of their department</li>
                      <li>• CEO can access both executive and manager portals</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ENHANCED: Staff Registration Confirmation Modal */}
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
                    <strong>Please review all details carefully before confirming registration:</strong>
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
                          {confirmationData.displayRole.toUpperCase()}
                        </span>
                        {confirmationData.isManager && (
                          <span className="badge bg-info">Manager</span>
                        )}
                        {confirmationData.subRole === 'ceo' && (
                          <span className="badge bg-warning text-dark ms-1">CEO Portal Access</span>
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
                      {confirmationData.subRole === 'ceo' && (
                        <li className="text-warning fw-bold">CEO will have access to both executive and manager portals</li>
                      )}
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

        {/* ENHANCED: Department Creation Modal with Confirmation */}
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
                <form onSubmit={handleDepartmentSubmit}>
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
                      <i className="fas fa-search me-1"></i>
                      Review Department
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Department Confirmation Modal */}
        {showDepartmentConfirmation && (
          <div className="modal show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    <i className="fas fa-check-circle me-2"></i>
                    Confirm Department Creation
                  </h5>
                  <button 
                    type="button" 
                    className="btn-close"
                    onClick={() => setShowDepartmentConfirmation(false)}
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="alert alert-info">
                    <i className="fas fa-info-circle me-2"></i>
                    <strong>Please confirm the department details:</strong>
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label fw-bold">Department Name</label>
                    <div className="p-2 bg-light rounded">{newDepartment.name}</div>
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label fw-bold">Description</label>
                    <div className="p-2 bg-light rounded">
                      {newDepartment.description || 'No description provided'}
                    </div>
                  </div>
                  
                  <div className="alert alert-warning">
                    <i className="fas fa-exclamation-triangle me-2"></i>
                    <strong>This action will:</strong>
                    <ul className="mb-0 mt-2">
                      <li>Create a new department in the system</li>
                      <li>Make it available for staff assignment</li>
                      <li>Auto-select it for the current staff registration</li>
                    </ul>
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => setShowDepartmentConfirmation(false)}
                  >
                    <i className="fas fa-times me-1"></i>
                    Cancel
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-success"
                    onClick={confirmDepartmentCreation}
                  >
                    <i className="fas fa-plus me-1"></i>
                    Create Department
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ENHANCED: Location Creation Modal with Confirmation */}
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
                <form onSubmit={handleLocationSubmit}>
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
                      <small className="text-muted">
                        {getLocationTypeDescription(newLocation.type)}
                      </small>
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
                      <i className="fas fa-search me-1"></i>
                      Review Location
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Location Confirmation Modal */}
        {showLocationConfirmation && (
          <div className="modal show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    <i className="fas fa-check-circle me-2"></i>
                    Confirm Location Creation
                  </h5>
                  <button 
                    type="button" 
                    className="btn-close"
                    onClick={() => setShowLocationConfirmation(false)}
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="alert alert-info">
                    <i className="fas fa-info-circle me-2"></i>
                    <strong>Please confirm the location details:</strong>
                  </div>
                  
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-bold">Location Name</label>
                      <div className="p-2 bg-light rounded">{newLocation.name}</div>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold">Type</label>
                      <div className="p-2 bg-light rounded">
                        <span className="badge bg-info">{newLocation.type}</span>
                      </div>
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-bold">Address</label>
                      <div className="p-2 bg-light rounded">
                        {newLocation.address || 'No address provided'}
                      </div>
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-bold">Description</label>
                      <div className="p-2 bg-light rounded">
                        {getLocationTypeDescription(newLocation.type)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="alert alert-warning mt-3">
                    <i className="fas fa-exclamation-triangle me-2"></i>
                    <strong>This action will:</strong>
                    <ul className="mb-0 mt-2">
                      <li>Create a new location in the system</li>
                      <li>Make it available for staff assignment</li>
                      <li>Auto-select it for the current staff registration</li>
                      <li>Enable multi-location check-ins for staff</li>
                    </ul>
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => setShowLocationConfirmation(false)}
                  >
                    <i className="fas fa-times me-1"></i>
                    Cancel
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-success"
                    onClick={confirmLocationCreation}
                  >
                    <i className="fas fa-plus me-1"></i>
                    Create Location
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}