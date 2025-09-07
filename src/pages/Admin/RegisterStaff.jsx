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
    departmentId: '', // NEW: Support ID-based departments
    jobTitle: '',
    role: 'staff',
    isManager: false,
    managerId: '',
    assignedLocationId: '',
    allowedLocationIds: [] // NEW: Multi-location support
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // Enhanced confirmation modal state
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [confirmationData, setConfirmationData] = useState(null)
  const [validationErrors, setValidationErrors] = useState([])
  const [warnings, setWarnings] = useState([])
  
  // Department and location management
  const [showCreateDepartment, setShowCreateDepartment] = useState(false)
  const [showCreateLocation, setShowCreateLocation] = useState(false)
  const [newDepartment, setNewDepartment] = useState({ name: '', description: '' })
  const [newLocation, setNewLocation] = useState({ name: '', address: '', type: 'office' })

  // Convert departments and locations objects to arrays for easier iteration
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
        (user.role === 'admin' || user.subRole === 'ceo') && 
        user.isActive
      )
    }
    
    // For staff members
    if (formData.departmentId) {
      // Find the selected department
      const selectedDept = departments[formData.departmentId]
      if (selectedDept) {
        // First try to find managers in the same department
        const departmentManagers = usersList.filter(user => 
          (user.departmentId === formData.departmentId || user.department === selectedDept.name) &&
          user.isManager && 
          user.role === 'staff' &&
          user.isActive
        )
        
        if (departmentManagers.length > 0) {
          return departmentManagers
        }
      }
      
      // If no department managers, show executives and CEO
      return usersList.filter(user => 
        (user.subRole === 'ceo' || user.subRole === 'executive' ||
         (user.role === 'staff' && user.isManager && 
          (user.department === 'Executive' || user.department === 'Administration'))) &&
        user.isActive
      )
    }
    
    // Default: show all managers
    return usersList.filter(user => 
      user.isManager && user.isActive
    )
  }

  const potentialManagers = getPotentialManagers()

  // Enhanced validation function
  const validateFormData = () => {
    const errors = []
    const warnings = []
    
    // Required field validation
    if (!formData.firstName.trim()) errors.push('First name is required')
    if (!formData.lastName.trim()) errors.push('Last name is required')
    if (!formData.email.trim()) errors.push('Email is required')
    if (!formData.phone.trim()) errors.push('Phone number is required')
    if (!formData.departmentId) errors.push('Department is required')
    if (!formData.assignedLocationId) errors.push('Primary location assignment is required')
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (formData.email && !emailRegex.test(formData.email)) {
      errors.push('Invalid email format')
    }
    
    // Check for duplicate email
    if (allUsers[formData.email]) {
      errors.push('Email already exists in the system')
    }
    
    // Manager validation
    if (formData.role !== 'ceo' && !formData.managerId) {
      errors.push('Manager selection is required for non-CEO roles')
    }
    
    // Role-specific validation
    if (formData.role === 'ceo' && formData.managerId) {
      errors.push('CEO cannot have a manager')
    }
    
    if (formData.role === 'admin' && formData.isManager) {
      errors.push('Admin role cannot be a manager')
    }
    
    if (formData.role === 'security' && formData.isManager) {
      errors.push('Security role cannot be a manager')
    }
    
    // Multi-location validation
    if (formData.allowedLocationIds.length === 0) {
      warnings.push('No additional locations selected - user will only have access to primary location')
    }
    
    if (formData.allowedLocationIds.length > 0 && !formData.allowedLocationIds.includes(formData.assignedLocationId)) {
      warnings.push('Primary location should be included in allowed locations')
    }
    
    // Department hierarchy warnings
    const manager = formData.managerId ? getUserById(formData.managerId) : null
    const selectedDept = departments[formData.departmentId]
    if (manager && selectedDept && manager.departmentId !== formData.departmentId && manager.department !== selectedDept.name) {
      warnings.push(`Manager is from ${manager.department || 'unknown'} department, but user is assigned to ${selectedDept.name}`)
    }
    
    // Job title recommendations
    if (!formData.jobTitle.trim()) {
      warnings.push('Job title is recommended for better organization')
    }
    
    return { errors, warnings }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    const validation = validateFormData()
    setValidationErrors(validation.errors)
    setWarnings(validation.warnings)
    
    if (validation.errors.length > 0) {
      setError('Please fix the validation errors before proceeding')
      return
    }
    
    try {
      // Prepare enhanced confirmation data
      const manager = formData.managerId ? getUserById(formData.managerId) : null
      const primaryLocation = locations[formData.assignedLocationId]
      const department = departments[formData.departmentId]
      const allowedLocations = formData.allowedLocationIds.map(id => locations[id]).filter(Boolean)
      
      // Calculate organizational impact
      const departmentCount = Object.values(allUsers).filter(u => 
        (u.departmentId === formData.departmentId || u.department === department?.name) && u.isActive
      ).length
      const managerReports = manager ? Object.values(allUsers).filter(u => u.managerId === manager.id && u.isActive).length : 0
      
      setConfirmationData({
        ...formData,
        managerName: manager ? getFullName(manager) : 'None',
        managerJobTitle: manager?.jobTitle || manager?.role,
        managerDepartment: manager?.department,
        primaryLocationName: primaryLocation?.name || 'Unknown',
        primaryLocationAddress: primaryLocation?.address,
        departmentName: department?.name || formData.department,
        departmentDescription: department?.description,
        allowedLocations,
        organizationalImpact: {
          departmentSize: departmentCount,
          managerReportCount: managerReports,
          isNewDepartment: !department,
          totalAllowedLocations: formData.allowedLocationIds.length + 1 // +1 for primary
        },
        validation: {
          errors: validation.errors,
          warnings: validation.warnings
        }
      })
      
      setShowConfirmation(true)
    } catch (err) {
      setError(err.message)
    }
  }

  // ACTUAL REGISTRATION AFTER DETAILED CONFIRMATION
  const confirmRegistration = async () => {
    try {
      // Get department name for backward compatibility
      const selectedDept = departments[formData.departmentId]
      
      // Include multi-location data in registration
      const registrationData = {
        ...formData,
        department: selectedDept?.name || '', // Backward compatibility
        departmentId: formData.departmentId,
        allowedLocationIds: [
          formData.assignedLocationId, // Always include primary location
          ...formData.allowedLocationIds.filter(id => id !== formData.assignedLocationId)
        ]
      }
      
      const result = registerStaff(registrationData)
      setSuccess(`Staff registered successfully! 
        
        Registration Details:
        • Name: ${formData.firstName} ${formData.lastName}
        • Email: ${formData.email} 
        • Temporary Password: ${result.defaultPassword}
        • Verification OTP: ${result.otp}
        • Primary Location: ${confirmationData.primaryLocationName}
        • Additional Locations: ${confirmationData.allowedLocations.length}
        
        Next Steps:
        1. User must verify their account using the OTP
        2. After verification, they must set a new password
        3. User can then login and access the system
        
        The user has been notified via email with setup instructions.`)
      
      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        department: '',
        departmentId: '',
        jobTitle: '',
        role: 'staff',
        isManager: false,
        managerId: '',
        assignedLocationId: '',
        allowedLocationIds: []
      })
      
      setShowConfirmation(false)
      setConfirmationData(null)
      setValidationErrors([])
      setWarnings([])
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
      if (name === 'departmentId') {
        newData.managerId = ''
        // Update department name for backward compatibility
        const dept = departments[value]
        newData.department = dept?.name || ''
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

  const handleLocationToggle = (locationId) => {
    setFormData(prev => ({
      ...prev,
      allowedLocationIds: prev.allowedLocationIds.includes(locationId)
        ? prev.allowedLocationIds.filter(id => id !== locationId)
        : [...prev.allowedLocationIds, locationId]
    }))
  }

  // Department and location creation handlers
  const handleCreateDepartment = async (e) => {
    e.preventDefault()
    setError('')
    
    try {
      if (!newDepartment.name.trim()) {
        throw new Error('Department name is required')
      }
      
      const existingDept = departmentsList.find(dept => 
        dept.name.toLowerCase() === newDepartment.name.toLowerCase()
      )
      if (existingDept) {
        throw new Error('Department already exists')
      }

      const dept = await createDepartment(newDepartment)
      setFormData(prev => ({ 
        ...prev, 
        departmentId: dept.id,
        department: dept.name 
      }))
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
    const dept = manager.department || (manager.departmentId ? departments[manager.departmentId]?.name : 'Unknown')
    return `${getFullName(manager)} - ${title} (${dept})`
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
        <p className="mb-0">Create new user accounts with detailed validation and review</p>
      </div>
      
      <div className="page-content">
        <div className="row justify-content-center">
          <div className="col-lg-10">
            
            {/* Validation Errors Alert */}
            {validationErrors.length > 0 && (
              <div className="alert alert-danger">
                <h6 className="alert-heading">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  Validation Errors
                </h6>
                <ul className="mb-0">
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Warnings Alert */}
            {warnings.length > 0 && (
              <div className="alert alert-warning">
                <h6 className="alert-heading">
                  <i className="fas fa-info-circle me-2"></i>
                  Recommendations & Warnings
                </h6>
                <ul className="mb-0">
                  {warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">
                  <i className="fas fa-user-plus me-2"></i>
                  Staff Information & Configuration
                </h5>
              </div>
              <div className="card-body">
                <form onSubmit={handleSubmit}>
                  {/* Basic Information */}
                  <div className="row g-3 mb-4">
                    <div className="col-12">
                      <h6 className="text-primary border-bottom pb-2">
                        <i className="fas fa-user me-2"></i>
                        Basic Information
                      </h6>
                    </div>
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
                  </div>

                  {/* Role & Department */}
                  <div className="row g-3 mb-4">
                    <div className="col-12">
                      <h6 className="text-primary border-bottom pb-2">
                        <i className="fas fa-briefcase me-2"></i>
                        Role & Department Assignment
                      </h6>
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
                          <i className="fas fa-plus"></i>
                        </button>
                      </label>
                      <select 
                        className="form-select"
                        name="departmentId"
                        value={formData.departmentId}
                        onChange={handleChange}
                        required
                      >
                        <option value="">Select Department</option>
                        {departmentsList.map(dept => (
                          <option key={dept.id} value={dept.id}>{dept.name}</option>
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
                    
                    {/* Manager Checkbox for Staff Role */}
                    {formData.role === 'staff' && (
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
                            <strong>Is Manager</strong>
                            <small className="text-muted d-block">
                              Can approve leave requests and manage team members
                            </small>
                          </label>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Location Assignment */}
                  <div className="row g-3 mb-4">
                    <div className="col-12">
                      <h6 className="text-primary border-bottom pb-2">
                        <i className="fas fa-map-marker-alt me-2"></i>
                        Location Assignment & Access
                      </h6>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">
                        Primary Location *
                        <button 
                          type="button" 
                          className="btn btn-sm btn-outline-primary ms-2"
                          onClick={() => setShowCreateLocation(true)}
                        >
                          <i className="fas fa-plus"></i>
                        </button>
                      </label>
                      <select 
                        className="form-select"
                        name="assignedLocationId"
                        value={formData.assignedLocationId}
                        onChange={handleChange}
                        required
                      >
                        <option value="">Select Primary Location</option>
                        {locationsList.map(location => (
                          <option key={location.id} value={location.id}>
                            {location.name} ({location.type})
                          </option>
                        ))}
                      </select>
                      <small className="text-muted">Main work location for this user</small>
                    </div>
                    
                    {/* Multi-Location Access */}
                    <div className="col-12">
                      <label className="form-label">Additional Location Access</label>
                      <div className="row g-2">
                        {locationsList.map(location => (
                          <div key={location.id} className="col-md-4">
                            <div className="form-check">
                              <input 
                                type="checkbox" 
                                className="form-check-input"
                                checked={formData.allowedLocationIds.includes(location.id)}
                                onChange={() => handleLocationToggle(location.id)}
                                disabled={location.id === formData.assignedLocationId}
                              />
                              <label className="form-check-label">
                                <strong>{location.name}</strong>
                                <small className="text-muted d-block">
                                  {location.type} • {location.address}
                                </small>
                                {location.id === formData.assignedLocationId && (
                                  <span className="badge bg-primary">Primary</span>
                                )}
                              </label>
                            </div>
                          </div>
                        ))}
                      </div>
                      <small className="text-muted">
                        Select additional locations this user can access while on duty
                      </small>
                    </div>
                  </div>
                  
                  {/* Manager Selection */}
                  {formData.role !== 'ceo' && (
                    <div className="row g-3 mb-4">
                      <div className="col-12">
                        <h6 className="text-primary border-bottom pb-2">
                          <i className="fas fa-sitemap me-2"></i>
                          Reporting Structure
                        </h6>
                      </div>
                      <div className="col-12">
                        <label className="form-label">
                          Reports To *
                          <small className="text-muted ms-2">
                            {formData.departmentId && `(Showing managers for ${departments[formData.departmentId]?.name} department)`}
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
                        {potentialManagers.length === 0 && formData.departmentId && (
                          <small className="text-warning">
                            <i className="fas fa-exclamation-triangle me-1"></i>
                            No managers found for {departments[formData.departmentId]?.name} department. Please select a different department or create a manager first.
                          </small>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Hierarchy Preview */}
                  {formData.managerId && (
                    <div className="alert alert-info">
                      <h6 className="alert-heading">
                        <i className="fas fa-sitemap me-2"></i>
                        Reporting Hierarchy Preview
                      </h6>
                      <div className="d-flex align-items-center flex-wrap">
                        <span className="badge bg-primary me-2 mb-1">
                          {getFullName(formData)} ({formData.jobTitle || formData.role})
                        </span>
                        <i className="fas fa-arrow-right mx-2"></i>
                        <span className="badge bg-success mb-1">
                          {getManagerDisplayName(getUserById(formData.managerId))}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {error && <div className="alert alert-danger mt-3">{error}</div>}
                  {success && <div className="alert alert-success mt-3" style={{whiteSpace: 'pre-line'}}>{success}</div>}
                  
                  <div className="mt-4">
                    <button type="submit" className="btn btn-warning btn-lg">
                      <i className="fas fa-search me-2"></i>
                      Review & Confirm Registration
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* ENHANCED CONFIRMATION MODAL */}
        {showConfirmation && confirmationData && (
          <div className="modal show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-xl">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    <i className="fas fa-user-plus me-2"></i>
                    Detailed Registration Review
                  </h5>
                  <button 
                    type="button" 
                    className="btn-close"
                    onClick={() => setShowConfirmation(false)}
                  ></button>
                </div>
                <div className="modal-body">
                  
                  {/* Warnings Display */}
                  {confirmationData.validation.warnings.length > 0 && (
                    <div className="alert alert-warning">
                      <h6 className="alert-heading">
                        <i className="fas fa-exclamation-triangle me-2"></i>
                        Please Review These Warnings:
                      </h6>
                      <ul className="mb-0">
                        {confirmationData.validation.warnings.map((warning, index) => (
                          <li key={index}>{warning}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  <div className="row g-4">
                    {/* Personal Information */}
                    <div className="col-md-6">
                      <div className="card border">
                        <div className="card-header header-light">
                          <h6 className="mb-0">
                            <i className="fas fa-user me-2"></i>
                            Personal Information
                          </h6>
                        </div>
                        <div className="card-body">
                          <table className="table table-borderless table-sm">
                            <tr>
                              <td className="fw-bold">Full Name:</td>
                              <td>{confirmationData.firstName} {confirmationData.lastName}</td>
                            </tr>
                            <tr>
                              <td className="fw-bold">Email:</td>
                              <td>{confirmationData.email}</td>
                            </tr>
                            <tr>
                              <td className="fw-bold">Phone:</td>
                              <td>{confirmationData.phone}</td>
                            </tr>
                            <tr>
                              <td className="fw-bold">Job Title:</td>
                              <td>{confirmationData.jobTitle || 'Not specified'}</td>
                            </tr>
                          </table>
                        </div>
                      </div>
                    </div>

                    {/* Role & Department */}
                    <div className="col-md-6">
                      <div className="card border">
                        <div className="card-header header-light">
                          <h6 className="mb-0">
                            <i className="fas fa-briefcase me-2"></i>
                            Role & Department
                          </h6>
                        </div>
                        <div className="card-body">
                          <table className="table table-borderless table-sm">
                            <tr>
                              <td className="fw-bold">Role:</td>
                              <td>
                                <span className="badge bg-primary me-2">
                                  {confirmationData.role.toUpperCase()}
                                </span>
                                {confirmationData.isManager && (
                                  <span className="badge bg-info">Manager</span>
                                )}
                              </td>
                            </tr>
                            <tr>
                              <td className="fw-bold">Department:</td>
                              <td>
                                {confirmationData.departmentName}
                                {confirmationData.organizationalImpact.isNewDepartment && (
                                  <span className="badge bg-warning text-dark ms-2">New</span>
                                )}
                              </td>
                            </tr>
                            <tr>
                              <td className="fw-bold">Department Size:</td>
                              <td>{confirmationData.organizationalImpact.departmentSize} current members</td>
                            </tr>
                            <tr>
                              <td className="fw-bold">Reports To:</td>
                              <td>
                                {confirmationData.managerName}
                                <br />
                                <small className="text-muted">
                                  {confirmationData.managerJobTitle} • {confirmationData.managerDepartment}
                                </small>
                              </td>
                            </tr>
                          </table>
                        </div>
                      </div>
                    </div>

                    {/* Location Access */}
                    <div className="col-md-6">
                      <div className="card border">
                        <div className="card-header header-light">
                          <h6 className="mb-0">
                            <i className="fas fa-map-marker-alt me-2"></i>
                            Location Access
                          </h6>
                        </div>
                        <div className="card-body">
                          <div className="mb-3">
                            <strong>Primary Location:</strong>
                            <div className="mt-1 p-2 bg-light rounded">
                              <i className="fas fa-building me-2 text-primary"></i>
                              {confirmationData.primaryLocationName}
                              <br />
                              <small className="text-muted">{confirmationData.primaryLocationAddress}</small>
                            </div>
                          </div>
                          
                          {confirmationData.allowedLocations.length > 0 && (
                            <div>
                              <strong>Additional Locations ({confirmationData.allowedLocations.length}):</strong>
                              <div className="mt-1">
                                {confirmationData.allowedLocations.map(location => (
                                  <div key={location.id} className="p-2 bg-light rounded mb-1">
                                    <small>
                                      <i className="fas fa-map-marker-alt me-1 text-info"></i>
                                      {location.name} ({location.type})
                                    </small>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          <div className="mt-2 text-center">
                            <span className="badge bg-info">
                              Total Access: {confirmationData.organizationalImpact.totalAllowedLocations} location{confirmationData.organizationalImpact.totalAllowedLocations !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* System Impact */}
                    <div className="col-md-6">
                      <div className="card border">
                        <div className="card-header header-light">
                          <h6 className="mb-0">
                            <i className="fas fa-chart-line me-2"></i>
                            Organizational Impact
                          </h6>
                        </div>
                        <div className="card-body">
                          <table className="table table-borderless table-sm">
                            <tr>
                              <td className="fw-bold">Manager's Reports:</td>
                              <td>{confirmationData.organizationalImpact.managerReportCount} current direct reports</td>
                            </tr>
                            <tr>
                              <td className="fw-bold">Department Growth:</td>
                              <td>Will become member #{confirmationData.organizationalImpact.departmentSize + 1}</td>
                            </tr>
                            <tr>
                              <td className="fw-bold">Location Impact:</td>
                              <td>{confirmationData.organizationalImpact.totalAllowedLocations} locations accessible</td>
                            </tr>
                            <tr>
                              <td className="fw-bold">Manager Status:</td>
                              <td>
                                {confirmationData.isManager ? (
                                  <span className="text-success">
                                    <i className="fas fa-check me-1"></i>
                                    Can manage team members
                                  </span>
                                ) : (
                                  <span className="text-muted">
                                    <i className="fas fa-user me-1"></i>
                                    Individual contributor
                                  </span>
                                )}
                              </td>
                            </tr>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Post-Registration Process */}
                  <div className="mt-4 p-3 bg-primary bg-opacity-10 rounded">
                    <h6 className="text-primary mb-2">
                      <i className="fas fa-info-circle me-2"></i>
                      Post-Registration Process:
                    </h6>
                    <div className="row g-3">
                      <div className="col-md-3">
                        <div className="text-center">
                          <i className="fas fa-user-plus fa-2x text-primary mb-2"></i>
                          <div className="small">
                            <strong>1. Registration</strong><br />
                            Account created with temporary password
                          </div>
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="text-center">
                          <i className="fas fa-envelope fa-2x text-info mb-2"></i>
                          <div className="small">
                            <strong>2. Email Verification</strong><br />
                            OTP sent for account verification
                          </div>
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="text-center">
                          <i className="fas fa-key fa-2x text-warning mb-2"></i>
                          <div className="small">
                            <strong>3. Password Setup</strong><br />
                            User sets secure password
                          </div>
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="text-center">
                          <i className="fas fa-check-circle fa-2x text-success mb-2"></i>
                          <div className="small">
                            <strong>4. System Access</strong><br />
                            Full access granted
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => setShowConfirmation(false)}
                  >
                    <i className="fas fa-arrow-left me-1"></i>
                    Back to Edit
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-warning btn-lg"
                    onClick={confirmRegistration}
                  >
                    <i className="fas fa-check me-1"></i>
                    Confirm & Register Staff Member
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