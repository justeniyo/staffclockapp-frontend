import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'

export default function RequestLeave() {
  const { submitLeaveRequest, leaveRequests, user } = useAuth()
  const [formData, setFormData] = useState({
    type: 'Annual',
    startDate: '',
    endDate: '',
    reason: ''
  })
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const myRequests = leaveRequests.filter(req => req.staffId === user.email)

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    try {
      if (new Date(formData.endDate) < new Date(formData.startDate)) {
        throw new Error('End date must be after start date')
      }

      submitLeaveRequest(formData)
      setSuccess('Leave request submitted successfully!')
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
    setFormData(prev => ({
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

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Request Leave</h2>
      </div>
      
      <div className="page-content">
        <div className="row g-4">
          <div className="col-lg-6">
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">New Leave Request</h5>
              </div>
              <div className="card-body">
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label className="form-label">Leave Type</label>
                    <select 
                      className="form-select" 
                      name="type" 
                      value={formData.type}
                      onChange={handleChange}
                      required
                    >
                      <option value="Annual">Annual Leave</option>
                      <option value="Sick">Sick Leave</option>
                      <option value="Personal">Personal Leave</option>
                      <option value="Emergency">Emergency Leave</option>
                    </select>
                  </div>
                  
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">Start Date</label>
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
                      <label className="form-label">End Date</label>
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
                  
                  <div className="mb-3">
                    <label className="form-label">Reason</label>
                    <textarea 
                      className="form-control" 
                      rows="3"
                      name="reason"
                      value={formData.reason}
                      onChange={handleChange}
                      placeholder="Please provide details for your leave request..."
                      required
                    />
                  </div>
                  
                  {error && <div className="alert alert-danger py-2">{error}</div>}
                  {success && <div className="alert alert-success py-2">{success}</div>}
                  
                  <button type="submit" className="btn btn-warning w-100">Submit Request</button>
                </form>
              </div>
            </div>
          </div>
          
          <div className="col-lg-6">
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">My Leave Requests</h5>
              </div>
              <div className="card-body">
                {myRequests.length === 0 ? (
                  <p className="text-muted">No leave requests yet.</p>
                ) : (
                  <div className="space-y-3">
                    {myRequests.map(req => (
                      <div key={req.id} className="border rounded p-3 mb-3">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <div>
                            <strong>{req.type} Leave</strong>
                            <div className="text-muted small">
                              {req.startDate} to {req.endDate}
                            </div>
                          </div>
                          <span className={`badge ${getStatusBadge(req.status)}`}>
                            {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                          </span>
                        </div>
                        <p className="mb-2">{req.reason}</p>
                        {req.notes && (
                          <div className="mt-2 p-2 bg-light rounded">
                            <small className="text-muted">Manager Notes:</small>
                            <div>{req.notes}</div>
                          </div>
                        )}
                        <small className="text-muted">
                          Requested: {new Date(req.requestDate).toLocaleDateString()}
                        </small>
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