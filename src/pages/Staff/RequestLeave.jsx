import { useState, useMemo } from 'react'
import { useAuth } from '../../context/AuthContext'

export default function RequestLeave() {
  const { submitLeaveRequest, updateLeaveRequest, leaveRequests, user } = useAuth()
  const [formData, setFormData] = useState({
    type: 'Annual',
    startDate: '',
    endDate: ''
  })
  const [editingRequest, setEditingRequest] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const ANNUAL_LEAVE_LIMIT = 18 // days per year

  const myRequests = leaveRequests.filter(req => req.staffId === user.email)

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

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    try {
      if (new Date(formData.endDate) < new Date(formData.startDate)) {
        throw new Error('End date must be after start date')
      }

      // Check annual leave limit
      if (!validateAnnualLeaveRequest(formData.type, formData.startDate, formData.endDate)) {
        const requestDays = getDaysDifference(formData.startDate, formData.endDate)
        throw new Error(`This request would exceed your annual leave limit. You have ${annualLeaveStats.remaining} days remaining, but requested ${requestDays} days.`)
      }

      submitLeaveRequest(formData)
      setSuccess('Leave request submitted successfully!')
      setFormData({
        type: 'Annual',
        startDate: '',
        endDate: ''
      })
    } catch (err) {
      setError(err.message)
    }
  }

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const startEdit = (request) => {
    setEditingRequest(request.id)
    setEditForm({
      type: request.type,
      startDate: request.startDate,
      endDate: request.endDate
    })
  }

  const saveEdit = () => {
    try {
      if (new Date(editForm.endDate) < new Date(editForm.startDate)) {
        setError('End date must be after start date')
        return
      }

      // Check annual leave limit (excluding the request being edited)
      if (!validateAnnualLeaveRequest(editForm.type, editForm.startDate, editForm.endDate, editingRequest)) {
        const requestDays = getDaysDifference(editForm.startDate, editForm.endDate)
        const remainingAfterEdit = annualLeaveStats.remaining + 
          (myRequests.find(r => r.id === editingRequest)?.type === 'Annual' ? 
           getDaysDifference(myRequests.find(r => r.id === editingRequest).startDate, myRequests.find(r => r.id === editingRequest).endDate) : 0)
        
        setError(`This would exceed your annual leave limit. You would have ${remainingAfterEdit} days available, but requested ${requestDays} days.`)
        return
      }

      updateLeaveRequest(editingRequest, editForm)
      setEditingRequest(null)
      setEditForm({})
      setSuccess('Leave request updated successfully!')
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
    setEditForm(prev => ({
      ...prev,
      [e.target.name]: e.target.value
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
    return request.status === 'pending'
  }

  const getLeaveTypeDescription = (type) => {
    const descriptions = {
      Annual: `Annual Leave (${annualLeaveStats.remaining} days remaining)`,
      Sick: 'Sick Leave (No limit)',
      Personal: 'Personal Leave (No limit)', 
      Emergency: 'Emergency Leave (No limit)'
    }
    return descriptions[type] || type
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

        <div className="row g-4">
          <div className="col-lg-6">
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">
                  <i className="fas fa-plus-circle me-2"></i>
                  New Leave Request
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
                      <option value="Annual">{getLeaveTypeDescription('Annual')}</option>
                      <option value="Sick">{getLeaveTypeDescription('Sick')}</option>
                      <option value="Personal">{getLeaveTypeDescription('Personal')}</option>
                      <option value="Emergency">{getLeaveTypeDescription('Emergency')}</option>
                    </select>
                    {formData.type === 'Annual' && annualLeaveStats.remaining <= 5 && (
                      <div className={`mt-2 p-2 rounded ${annualLeaveStats.remaining === 0 ? 'bg-danger text-white' : 'bg-warning'}`}>
                        <i className="fas fa-exclamation-triangle me-1"></i>
                        {annualLeaveStats.remaining === 0 
                          ? 'No annual leave days remaining!'
                          : `Only ${annualLeaveStats.remaining} annual leave days remaining.`
                        }
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

                  {/* Duration preview */}
                  {formData.startDate && formData.endDate && (
                    <div className={`mt-3 p-3 rounded ${currentRequestExceedsLimit ? 'bg-danger text-white' : 'bg-light'}`}>
                      <div className="d-flex justify-content-between align-items-center">
                        <span className={currentRequestExceedsLimit ? 'text-white' : 'text-muted'}>
                          <i className="fas fa-calendar-day me-1"></i>
                          Duration:
                        </span>
                        <span className={`badge ${currentRequestExceedsLimit ? 'bg-white text-danger' : 'bg-info'}`}>
                          {getDaysDifference(formData.startDate, formData.endDate)} day(s)
                        </span>
                      </div>
                      {currentRequestExceedsLimit && (
                        <div className="mt-2">
                          <i className="fas fa-exclamation-triangle me-1"></i>
                          Exceeds available annual leave days!
                        </div>
                      )}
                    </div>
                  )}
                  
                  {error && <div className="alert alert-danger py-2 mt-3">{error}</div>}
                  {success && <div className="alert alert-success py-2 mt-3">{success}</div>}
                  
                  <button 
                    type="submit" 
                    className="btn btn-warning w-100 mt-3"
                    disabled={formData.type === 'Annual' && annualLeaveStats.remaining === 0}
                  >
                    <i className="fas fa-paper-plane me-2"></i>
                    Submit Request
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
                  My Leave Requests
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
                                  <option value="Annual">{getLeaveTypeDescription('Annual')}</option>
                                  <option value="Sick">{getLeaveTypeDescription('Sick')}</option>
                                  <option value="Personal">{getLeaveTypeDescription('Personal')}</option>
                                  <option value="Emergency">{getLeaveTypeDescription('Emergency')}</option>
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
                            </div>
                            
                            {editForm.startDate && editForm.endDate && (
                              <div className={`mb-3 p-2 rounded ${currentEditExceedsLimit ? 'bg-danger text-white' : 'bg-light'}`}>
                                <div className="d-flex justify-content-between align-items-center">
                                  <span className={`small ${currentEditExceedsLimit ? 'text-white' : 'text-muted'}`}>New Duration:</span>
                                  <span className={`badge ${currentEditExceedsLimit ? 'bg-white text-danger' : 'bg-info'}`}>
                                    {getDaysDifference(editForm.startDate, editForm.endDate)} day(s)
                                  </span>
                                </div>
                                {currentEditExceedsLimit && (
                                  <div className="mt-1 small">
                                    <i className="fas fa-exclamation-triangle me-1"></i>
                                    Would exceed annual leave limit!
                                  </div>
                                )}
                              </div>
                            )}
                            
                            <div className="d-flex gap-2">
                              <button 
                                className="btn btn-success btn-sm"
                                onClick={saveEdit}
                                disabled={currentEditExceedsLimit}
                              >
                                <i className="fas fa-check me-1"></i>
                                Save
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
                                <div className="fw-semibold">
                                  {req.type} Leave
                                  {req.type === 'Annual' && (
                                    <span className="badge bg-primary ms-2">
                                      {getDaysDifference(req.startDate, req.endDate)} of {annualLeaveStats.limit}
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
                              </div>
                              <div className="text-end">
                                <span className={`badge ${getStatusBadge(req.status)} mb-2`}>
                                  <i className={`fas ${getStatusIcon(req.status)} me-1`}></i>
                                  {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                                </span>
                                {canEdit(req) && (
                                  <div>
                                    <button 
                                      className="btn btn-outline-primary btn-sm"
                                      onClick={() => startEdit(req)}
                                    >
                                      <i className="fas fa-edit me-1"></i>
                                      Edit
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
                                  {req.status === 'approved' ? 'Approved' : 'Rejected'}: {new Date(req.processedDate).toLocaleDateString()}
                                </span>
                              )}
                            </div>
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