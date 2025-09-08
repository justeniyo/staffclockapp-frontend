import { useState, useMemo } from 'react'
import { useAuth } from '../../context/AuthContext'
import { isCEO } from '../../config/seedUsers'

export default function RequestLeave() {
  const { submitLeaveRequest, updateLeaveRequest, rawLeaveRequests, user, LEAVE_TYPES } = useAuth()
  const [formData, setFormData] = useState({
    type: 'Annual',
    startDate: '',
    endDate: '',
    reason: '' // For Emergency and Sick leaves only
  })
  const [editingRequest, setEditingRequest] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const ANNUAL_LEAVE_LIMIT = 18 // days per year

  // Get my requests using the user ID
  const myRequests = rawLeaveRequests.filter(req => req.staffId === user.id)

  // Calculate annual leave usage for current year
  const annualLeaveStats = useMemo(() => {
    const currentYear = new Date().getFullYear()
    
    // Get all annual leave requests for current year (approved + pending)
    const currentYearAnnualLeave = myRequests.filter(req => {
      const reqYear = new Date(req.startDate).getFullYear()
      return req.type === 'Annual' && 
             reqYear === currentYear && 
             (req.status === 'approved' || req.status === 'pending')
    })

    // Calculate total days used/requested
    const usedDays = currentYearAnnualLeave.reduce((total, req) => {
      const days = Math.ceil((new Date(req.endDate) - new Date(req.startDate)) / (1000 * 60 * 60 * 24)) + 1
      return total + days
    }, 0)

    return {
      used: usedDays,
      remaining: ANNUAL_LEAVE_LIMIT - usedDays,
      limit: ANNUAL_LEAVE_LIMIT,
      requests: currentYearAnnualLeave
    }
  }, [myRequests, ANNUAL_LEAVE_LIMIT])

  const validateAnnualLeaveRequest = (type, startDate, endDate, excludeRequestId = null) => {
    if (type !== 'Annual') return true // No limit for other leave types

    const requestDays = getDaysDifference(startDate, endDate)
    
    // Calculate current usage excluding the request being edited
    const currentYear = new Date().getFullYear()
    const relevantRequests = myRequests.filter(req => {
      const reqYear = new Date(req.startDate).getFullYear()
      return req.type === 'Annual' && 
             reqYear === currentYear && 
             (req.status === 'approved' || req.status === 'pending') &&
             req.id !== excludeRequestId
    })

    const currentUsage = relevantRequests.reduce((total, req) => {
      const days = getDaysDifference(req.startDate, req.endDate)
      return total + days
    }, 0)

    return (currentUsage + requestDays) <= ANNUAL_LEAVE_LIMIT
  }

  const requiresReason = (type) => {
    return type === 'Emergency' || type === 'Sick'
  }

  // CEO-specific helper functions
  const getCEOLeaveMessage = (type, isUpdate = false) => {
    const action = isUpdate ? 'updated' : 'submitted'
    return `🏆 Leave request ${action} and automatically approved! 
      As CEO, your ${type.toLowerCase()} leave has executive approval and is immediately active.`
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    try {
      if (new Date(formData.endDate) < new Date(formData.startDate)) {
        throw new Error('End date must be after start date')
      }

      // Check if reason is required but not provided
      if (requiresReason(formData.type) && !formData.reason.trim()) {
        throw new Error(`Reason is required for ${formData.type} leave`)
      }

      // Check annual leave limit (CEO can override but show warning)
      if (!validateAnnualLeaveRequest(formData.type, formData.startDate, formData.endDate)) {
        const requestDays = getDaysDifference(formData.startDate, formData.endDate)
        if (!isCEO(user)) {
          throw new Error(`This request would exceed your annual leave limit. You have ${annualLeaveStats.remaining} days remaining, but requested ${requestDays} days.`)
        } else {
          // CEO warning but allow override
          setError(`⚠️ CEO Override: This request exceeds standard annual leave limits (${requestDays} days requested, ${annualLeaveStats.remaining} remaining). Executive privilege allows this override.`)
          setTimeout(() => setError(''), 5000) // Clear warning after 5 seconds
        }
      }

      const result = submitLeaveRequest(formData)
      
      // Different success message for CEO auto-approval
      if (isCEO(user)) {
        setSuccess(getCEOLeaveMessage(formData.type))
      } else {
        setSuccess('✅ Leave request submitted successfully! Your request is pending manager approval.')
      }
      
      setFormData({
        type: 'Annual',
        startDate: '',
        endDate: '',
        reason: ''
      })
    } catch (err) {
      setError(err.message)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
      // Clear reason when switching to non-reason types
      ...(name === 'type' && !requiresReason(value) ? { reason: '' } : {})
    }))
  }

  const startEdit = (request) => {
    setEditingRequest(request.id)
    setEditForm({
      type: request.type,
      startDate: request.startDate,
      endDate: request.endDate,
      reason: request.reason || ''
    })
  }

  const saveEdit = () => {
    try {
      if (new Date(editForm.endDate) < new Date(editForm.startDate)) {
        setError('End date must be after start date')
        return
      }

      // Check if reason is required but not provided
      if (requiresReason(editForm.type) && !editForm.reason.trim()) {
        setError(`Reason is required for ${editForm.type} leave`)
        return
      }

      // Check annual leave limit (excluding the request being edited)
      if (!validateAnnualLeaveRequest(editForm.type, editForm.startDate, editForm.endDate, editingRequest)) {
        const requestDays = getDaysDifference(editForm.startDate, editForm.endDate)
        const remainingAfterEdit = annualLeaveStats.remaining + 
          (myRequests.find(r => r.id === editingRequest)?.type === 'Annual' ? 
           getDaysDifference(myRequests.find(r => r.id === editingRequest).startDate, myRequests.find(r => r.id === editingRequest).endDate) : 0)
        
        if (!isCEO(user)) {
          setError(`This would exceed your annual leave limit. You would have ${remainingAfterEdit} days available, but requested ${requestDays} days.`)
          return
        } else {
          // CEO can override
          setError(`⚠️ CEO Override: Edit exceeds standard limits. Executive privilege allows this modification.`)
          setTimeout(() => setError(''), 5000)
        }
      }

      updateLeaveRequest(editingRequest, editForm)
      setEditingRequest(null)
      setEditForm({})
      
      if (isCEO(user)) {
        setSuccess(getCEOLeaveMessage(editForm.type, true))
      } else {
        setSuccess('✅ Leave request updated successfully! Changes are pending manager approval.')
      }
      setError('')
    } catch (err) {
      setError(err.message)
    }
  }

  const cancelEdit = () => {
    setEditingRequest(null)
    setEditForm({})
    setError('')
  }

  const handleEditChange = (e) => {
    const { name, value } = e.target
    setEditForm(prev => ({
      ...prev,
      [name]: value,
      // Clear reason when switching to non-reason types
      ...(name === 'type' && !requiresReason(value) ? { reason: '' } : {})
    }))
  }

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-warning text-dark',
      approved: 'bg-success',
      rejected: 'bg-danger'
    }
    return badges[status] || 'bg-secondary'
  }

  const getStatusIcon = (status) => {
    const icons = {
      pending: 'fa-clock',
      approved: 'fa-check',
      rejected: 'fa-times'
    }
    return icons[status] || 'fa-question'
  }

  const getDaysDifference = (startDate, endDate) => {
    return Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)) + 1
  }

  const canEdit = (request) => {
    // CEO can edit approved requests, others can only edit pending
    return isCEO(user) ? (request.status === 'pending' || request.status === 'approved') : request.status === 'pending'
  }

  const getLeaveTypeDescription = (type) => {
    const descriptions = {
      Annual: `Annual Leave (${annualLeaveStats.remaining} days remaining)`,
      Sick: 'Sick Leave (Reason required)',
      Emergency: 'Emergency Leave (Reason required)'
    }
    return descriptions[type] || type
  }

  const getLeaveTypeInfo = (type) => {
    const info = {
      Annual: { 
        icon: 'fa-calendar', 
        color: 'text-primary',
        description: 'Planned vacation time'
      },
      Sick: { 
        icon: 'fa-thermometer-half', 
        color: 'text-danger',
        description: 'Medical leave with reason'
      },
      Emergency: { 
        icon: 'fa-exclamation-triangle', 
        color: 'text-warning',
        description: 'Urgent situations with reason'
      }
    }
    return info[type] || { icon: 'fa-question', color: 'text-secondary', description: '' }
  }

  // Check if current form request would exceed limit
  const currentRequestExceedsLimit = useMemo(() => {
    if (formData.type !== 'Annual' || !formData.startDate || !formData.endDate) return false
    const requestDays = getDaysDifference(formData.startDate, formData.endDate)
    return requestDays > annualLeaveStats.remaining
  }, [formData, annualLeaveStats.remaining])

  // Check if current edit would exceed limit
  const currentEditExceedsLimit = useMemo(() => {
    if (!editingRequest || editForm.type !== 'Annual' || !editForm.startDate || !editForm.endDate) return false
    return !validateAnnualLeaveRequest(editForm.type, editForm.startDate, editForm.endDate, editingRequest)
  }, [editForm, editingRequest, annualLeaveStats])

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Request Leave</h2>
        <p className="mb-0">
          {isCEO(user) ? 'Executive Leave Management with Auto-Approval' : 'Submit leave requests for manager approval'}
        </p>
      </div>
      
      <div className="page-content">
        {/* Annual Leave Summary */}
        <div className="row g-3 mb-4">
          <div className="col-md-3">
            <div className="card text-center">
              <div className="card-body">
                <h4 className="text-primary">{annualLeaveStats.limit}</h4>
                <p className="mb-0 small">Annual Days/Year</p>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card text-center">
              <div className="card-body">
                <h4 className="text-warning">{annualLeaveStats.used}</h4>
                <p className="mb-0 small">Days Used/Pending</p>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card text-center">
              <div className="card-body">
                <h4 className={`${annualLeaveStats.remaining > 5 ? 'text-success' : annualLeaveStats.remaining > 0 ? 'text-warning' : 'text-danger'}`}>
                  {annualLeaveStats.remaining}
                </h4>
                <p className="mb-0 small">Days Remaining</p>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card text-center">
              <div className="card-body">
                <div className="progress mb-2">
                  <div 
                    className={`progress-bar ${annualLeaveStats.used > annualLeaveStats.limit * 0.8 ? 'bg-danger' : 'bg-success'}`}
                    style={{width: `${Math.min((annualLeaveStats.used / annualLeaveStats.limit) * 100, 100)}%`}}
                  ></div>
                </div>
                <p className="mb-0 small">Usage Progress</p>
              </div>
            </div>
          </div>
        </div>

        {/* CEO Executive Privilege Indicator */}
        {isCEO(user) && (
          <div className="row g-3 mb-4">
            <div className="col-12">
              <div className="alert alert-warning border-warning">
                <div className="d-flex align-items-center">
                  <i className="fas fa-crown fa-2x text-warning me-3"></i>
                  <div>
                    <h5 className="alert-heading mb-2">
                      <i className="fas fa-star me-2"></i>
                      CEO Executive Privilege
                    </h5>
                    <p className="mb-2">
                      <strong>Auto-Approval Active:</strong> As Chief Executive Officer, all your leave requests 
                      are automatically approved and become effective immediately upon submission.
                    </p>
                    <ul className="mb-0 small">
                      <li>✅ No manager approval required</li>
                      <li>✅ Instant activation of approved leave</li>
                      <li>✅ Full editing privileges for active requests</li>
                      <li>✅ Executive override on leave limit policies</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="row g-4">
          <div className="col-lg-6">
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">
                  <i className="fas fa-plus-circle me-2"></i>
                  {isCEO(user) ? 'New Executive Leave Request' : 'New Leave Request'}
                </h5>
              </div>
              <div className="card-body">
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label className="form-label">
                      <i className="fas fa-tag me-1"></i>
                      Leave Type
                    </label>
                    <select 
                      className="form-select" 
                      name="type" 
                      value={formData.type}
                      onChange={handleChange}
                      required
                    >
                      {LEAVE_TYPES.map(type => (
                        <option key={type} value={type}>
                          {getLeaveTypeDescription(type)}
                        </option>
                      ))}
                    </select>
                    
                    {/* Type information */}
                    <div className={`mt-2 p-2 rounded bg-light`}>
                      <small className={getLeaveTypeInfo(formData.type).color}>
                        <i className={`fas ${getLeaveTypeInfo(formData.type).icon} me-1`}></i>
                        {getLeaveTypeInfo(formData.type).description}
                        {isCEO(user) && (
                          <span className="text-warning ms-2">
                            <i className="fas fa-crown me-1"></i>
                            Auto-approval enabled
                          </span>
                        )}
                      </small>
                    </div>
                    
                    {formData.type === 'Annual' && annualLeaveStats.remaining <= 5 && !isCEO(user) && (
                      <div className={`mt-2 p-2 rounded ${annualLeaveStats.remaining === 0 ? 'bg-danger text-white' : 'bg-warning'}`}>
                        <i className="fas fa-exclamation-triangle me-1"></i>
                        {annualLeaveStats.remaining === 0 
                          ? 'No annual leave days remaining!'
                          : `Only ${annualLeaveStats.remaining} annual leave days remaining.`
                        }
                      </div>
                    )}

                    {formData.type === 'Annual' && currentRequestExceedsLimit && isCEO(user) && (
                      <div className="mt-2 p-2 rounded bg-warning">
                        <i className="fas fa-crown me-1"></i>
                        <strong>CEO Override:</strong> This request exceeds standard limits but will be auto-approved with executive privilege.
                      </div>
                    )}
                  </div>
                  
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">
                        <i className="fas fa-play me-1"></i>
                        Start Date
                      </label>
                      <input 
                        type="date" 
                        className="form-control"
                        name="startDate"
                        value={formData.startDate}
                        onChange={handleChange}
                        min={new Date().toISOString().split('T')[0]}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">
                        <i className="fas fa-stop me-1"></i>
                        End Date
                      </label>
                      <input 
                        type="date" 
                        className="form-control"
                        name="endDate"
                        value={formData.endDate}
                        onChange={handleChange}
                        min={formData.startDate || new Date().toISOString().split('T')[0]}
                        required
                      />
                    </div>
                  </div>

                  {/* Reason field for Emergency and Sick leaves */}
                  {requiresReason(formData.type) && (
                    <div className="mt-3">
                      <label className="form-label">
                        <i className="fas fa-comment-medical me-1"></i>
                        Reason <span className="text-danger">*</span>
                      </label>
                      <textarea 
                        className="form-control"
                        name="reason"
                        value={formData.reason}
                        onChange={handleChange}
                        rows="3"
                        placeholder={`Please provide reason for ${formData.type.toLowerCase()} leave...`}
                        required
                      />
                      <small className="text-muted">
                        Reason is required for {formData.type.toLowerCase()} leave requests
                        {isCEO(user) && <span className="text-warning ms-1">(will be auto-approved)</span>}
                      </small>
                    </div>
                  )}

                  {/* Duration preview */}
                  {formData.startDate && formData.endDate && (
                    <div className={`mt-3 p-3 rounded ${
                      currentRequestExceedsLimit && !isCEO(user) ? 'bg-danger text-white' : 
                      currentRequestExceedsLimit && isCEO(user) ? 'bg-warning' : 'bg-light'
                    }`}>
                      <div className="d-flex justify-content-between align-items-center">
                        <span className={currentRequestExceedsLimit && !isCEO(user) ? 'text-white' : 'text-muted'}>
                          <i className="fas fa-calendar-day me-1"></i>
                          Duration:
                        </span>
                        <span className={`badge ${
                          currentRequestExceedsLimit && !isCEO(user) ? 'bg-white text-danger' : 
                          currentRequestExceedsLimit && isCEO(user) ? 'bg-dark text-warning' : 'bg-info'
                        }`}>
                          {getDaysDifference(formData.startDate, formData.endDate)} day(s)
                        </span>
                      </div>
                      {currentRequestExceedsLimit && !isCEO(user) && (
                        <div className="mt-2">
                          <i className="fas fa-exclamation-triangle me-1"></i>
                          Exceeds available annual leave days!
                        </div>
                      )}
                      {currentRequestExceedsLimit && isCEO(user) && (
                        <div className="mt-2">
                          <i className="fas fa-crown me-1"></i>
                          CEO Executive Override - Request will be auto-approved
                        </div>
                      )}
                    </div>
                  )}
                  
                  {error && <div className="alert alert-danger py-2 mt-3">{error}</div>}
                  {success && <div className="alert alert-success py-2 mt-3">{success}</div>}
                  
                  <button 
                    type="submit" 
                    className="btn btn-warning w-100 mt-3"
                    disabled={(!isCEO(user) && formData.type === 'Annual' && annualLeaveStats.remaining === 0) || 
                             (requiresReason(formData.type) && !formData.reason.trim())}
                  >
                    <i className="fas fa-paper-plane me-2"></i>
                    {isCEO(user) ? 'Submit & Auto-Approve' : 'Submit Request'}
                  </button>
                </form>
              </div>
            </div>
          </div>
          
          <div className="col-lg-6">
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">
                  <i className="fas fa-list me-2"></i>
                  {isCEO(user) ? 'My Executive Leave Requests' : 'My Leave Requests'}
                </h5>
              </div>
              <div className="card-body">
                {myRequests.length === 0 ? (
                  <div className="text-center py-4">
                    <i className="fas fa-calendar-times fa-3x text-muted mb-3"></i>
                    <p className="text-muted">No leave requests yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {myRequests.map(req => (
                      <div key={req.id} className="border rounded p-3 mb-3">
                        {editingRequest === req.id ? (
                          // Edit mode
                          <div>
                            <div className="row g-3 mb-3">
                              <div className="col-12">
                                <label className="form-label small">Leave Type</label>
                                <select 
                                  className="form-select form-select-sm"
                                  name="type"
                                  value={editForm.type}
                                  onChange={handleEditChange}
                                >
                                  {LEAVE_TYPES.map(type => (
                                    <option key={type} value={type}>
                                      {getLeaveTypeDescription(type)}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="col-md-6">
                                <label className="form-label small">Start Date</label>
                                <input 
                                  type="date" 
                                  className="form-control form-control-sm"
                                  name="startDate"
                                  value={editForm.startDate}
                                  onChange={handleEditChange}
                                  min={new Date().toISOString().split('T')[0]}
                                />
                              </div>
                              <div className="col-md-6">
                                <label className="form-label small">End Date</label>
                                <input 
                                  type="date" 
                                  className="form-control form-control-sm"
                                  name="endDate"
                                  value={editForm.endDate}
                                  onChange={handleEditChange}
                                  min={editForm.startDate || new Date().toISOString().split('T')[0]}
                                />
                              </div>
                              {requiresReason(editForm.type) && (
                                <div className="col-12">
                                  <label className="form-label small">Reason</label>
                                  <textarea 
                                    className="form-control form-control-sm"
                                    name="reason"
                                    value={editForm.reason}
                                    onChange={handleEditChange}
                                    rows="2"
                                    placeholder={`Reason for ${editForm.type.toLowerCase()} leave...`}
                                  />
                                </div>
                              )}
                            </div>
                            
                            {editForm.startDate && editForm.endDate && (
                              <div className={`mb-3 p-2 rounded ${
                                currentEditExceedsLimit && !isCEO(user) ? 'bg-danger text-white' : 
                                currentEditExceedsLimit && isCEO(user) ? 'bg-warning' : 'bg-light'
                              }`}>
                                <div className="d-flex justify-content-between align-items-center">
                                  <span className={`small ${
                                    currentEditExceedsLimit && !isCEO(user) ? 'text-white' : 'text-muted'
                                  }`}>New Duration:</span>
                                  <span className={`badge ${
                                    currentEditExceedsLimit && !isCEO(user) ? 'bg-white text-danger' : 
                                    currentEditExceedsLimit && isCEO(user) ? 'bg-dark text-warning' : 'bg-info'
                                  }`}>
                                    {getDaysDifference(editForm.startDate, editForm.endDate)} day(s)
                                  </span>
                                </div>
                                {currentEditExceedsLimit && !isCEO(user) && (
                                  <div className="mt-1 small">
                                    <i className="fas fa-exclamation-triangle me-1"></i>
                                    Would exceed annual leave limit!
                                  </div>
                                )}
                                {currentEditExceedsLimit && isCEO(user) && (
                                  <div className="mt-1 small">
                                    <i className="fas fa-crown me-1"></i>
                                    CEO Override - Will remain auto-approved
                                  </div>
                                )}
                              </div>
                            )}
                            
                            <div className="d-flex gap-2">
                              <button 
                                className="btn btn-success btn-sm"
                                onClick={saveEdit}
                                disabled={!isCEO(user) && (currentEditExceedsLimit || 
                                         (requiresReason(editForm.type) && !editForm.reason.trim()))}
                              >
                                <i className="fas fa-check me-1"></i>
                                {isCEO(user) ? 'Save & Auto-Approve' : 'Save'}
                              </button>
                              <button 
                                className="btn btn-secondary btn-sm"
                                onClick={cancelEdit}
                              >
                                <i className="fas fa-times me-1"></i>
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          // View mode
                          <div>
                            <div className="d-flex justify-content-between align-items-start mb-2">
                              <div>
                                <div className="fw-semibold d-flex align-items-center">
                                  <i className={`fas ${getLeaveTypeInfo(req.type).icon} me-2 ${getLeaveTypeInfo(req.type).color}`}></i>
                                  {req.type} Leave
                                  {req.type === 'Annual' && (
                                    <span className="badge bg-primary ms-2">
                                      {getDaysDifference(req.startDate, req.endDate)} of {annualLeaveStats.limit}
                                    </span>
                                  )}
                                  {/* AUTO-APPROVAL BADGE */}
                                  {req.isAutoApproved && (
                                    <span className="badge bg-warning text-dark ms-2">
                                      <i className="fas fa-crown me-1"></i>
                                      Auto-Approved
                                    </span>
                                  )}
                                </div>
                                <div className="text-muted small">
                                  {req.startDate} to {req.endDate}
                                </div>
                                <div className="mt-1">
                                  <span className="badge bg-light text-dark">
                                    <i className="fas fa-calendar-day me-1"></i>
                                    {getDaysDifference(req.startDate, req.endDate)} day(s)
                                  </span>
                                </div>
                                {/* Show reason for Emergency and Sick leaves */}
                                {req.reason && (
                                  <div className="mt-2 p-2 bg-light rounded">
                                    <small className="text-muted d-block mb-1">Reason:</small>
                                    <small>{req.reason}</small>
                                  </div>
                                )}
                              </div>
                              <div className="text-end">
                                <span className={`badge ${getStatusBadge(req.status)} mb-2`}>
                                  <i className={`fas ${getStatusIcon(req.status)} me-1`}></i>
                                  {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                                  {req.isAutoApproved && ' (Auto)'}
                                </span>
                                {canEdit(req) && (
                                  <div>
                                    <button 
                                      className="btn btn-outline-primary btn-sm"
                                      onClick={() => startEdit(req)}
                                    >
                                      <i className="fas fa-edit me-1"></i>
                                      {req.isAutoApproved ? 'Modify' : 'Edit'}
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <div className="d-flex justify-content-between align-items-center text-muted small pt-2 border-top">
                              <span>
                                <i className="fas fa-clock me-1"></i>
                                Requested: {new Date(req.requestDate).toLocaleDateString()}
                              </span>
                              {req.processedDate && (
                                <span>
                                  <i className={`fas ${req.status === 'approved' ? 'fa-check' : 'fa-times'} me-1`}></i>
                                  {req.isAutoApproved ? 'Auto-Approved' : req.status === 'approved' ? 'Approved' : 'Rejected'}: {new Date(req.processedDate).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                            
                            {/* CEO AUTO-APPROVAL NOTES */}
                            {req.isAutoApproved && req.processingNotes && (
                              <div className="mt-2 p-2 bg-warning bg-opacity-10 rounded border border-warning">
                                <small className="text-warning d-block mb-1">
                                  <i className="fas fa-crown me-1"></i>
                                  Executive Status:
                                </small>
                                <small className="fw-semibold">{req.processingNotes}</small>
                              </div>
                            )}
                            
                            {/* Regular processing notes for non-auto-approved requests */}
                            {!req.isAutoApproved && req.processingNotes && (req.type === 'Emergency' || req.type === 'Sick') && (
                              <div className="mt-2 p-2 bg-light rounded">
                                <small className="text-muted d-block mb-1">Manager Notes:</small>
                                <small>{req.processingNotes}</small>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}