import { useState, useMemo } from 'react'
import { useAuth } from '../../context/AuthContext'

export default function LeaveRequests() {
  const { leaveRequests, processLeaveRequest, user, allUsers } = useAuth()
  const [filter, setFilter] = useState('all')
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [notes, setNotes] = useState('')

  // Get team members
  const teamMembers = Object.values(allUsers).filter(staff => staff.manager === user.email)
  const teamEmails = teamMembers.map(member => member.email)
  
  // Filter requests for manager's team
  const teamRequests = useMemo(() => {
    let filtered = leaveRequests.filter(req => teamEmails.includes(req.staffId))
    
    if (filter !== 'all') {
      filtered = filtered.filter(req => req.status === filter)
    }
    
    return filtered.sort((a, b) => new Date(b.requestDate) - new Date(a.requestDate))
  }, [leaveRequests, teamEmails, filter])

  const handleProcess = (requestId, status) => {
    processLeaveRequest(requestId, status, notes)
    setSelectedRequest(null)
    setNotes('')
  }

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-warning text-dark',
      approved: 'bg-success',
      rejected: 'bg-danger'
    }
    return badges[status] || 'bg-secondary'
  }

  const getTypeColor = (type) => {
    const colors = {
      Annual: 'text-primary',
      Sick: 'text-danger',
      Personal: 'text-info',
      Emergency: 'text-warning'
    }
    return colors[type] || 'text-secondary'
  }

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Team Leave Requests</h2>
      </div>
      
      <div className="page-content">
        <div className="card">
          <div className="card-header d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Requests for Your Team</h5>
            <select 
              className="form-select w-auto"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">All Requests</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div className="card-body">
            {teamRequests.length === 0 ? (
              <p className="text-muted text-center py-4">No leave requests found for your team.</p>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Type</th>
                      <th>Dates</th>
                      <th>Duration</th>
                      <th>Status</th>
                      <th>Requested</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teamRequests.map(req => {
                      const daysDiff = Math.ceil((new Date(req.endDate) - new Date(req.startDate)) / (1000 * 60 * 60 * 24)) + 1
                      return (
                        <tr key={req.id}>
                          <td>
                            <strong>{req.staffName}</strong>
                            <div className="text-muted small">{req.department}</div>
                          </td>
                          <td>
                            <span className={getTypeColor(req.type)}>{req.type}</span>
                          </td>
                          <td>
                            <div>{req.startDate}</div>
                            <div className="text-muted small">to {req.endDate}</div>
                          </td>
                          <td>{daysDiff} day{daysDiff !== 1 ? 's' : ''}</td>
                          <td>
                            <span className={`badge ${getStatusBadge(req.status)}`}>
                              {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                            </span>
                          </td>
                          <td className="text-muted small">
                            {new Date(req.requestDate).toLocaleDateString()}
                          </td>
                          <td>
                            <button 
                              className="btn btn-outline-primary btn-sm"
                              onClick={() => setSelectedRequest(req)}
                            >
                              Review
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Review Modal */}
        {selectedRequest && (
          <div className="modal show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Review Leave Request</h5>
                  <button 
                    type="button" 
                    className="btn-close"
                    onClick={() => setSelectedRequest(null)}
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-bold">Employee</label>
                      <div>{selectedRequest.staffName}</div>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold">Department</label>
                      <div>{selectedRequest.department}</div>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold">Leave Type</label>
                      <div className={getTypeColor(selectedRequest.type)}>{selectedRequest.type}</div>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold">Current Status</label>
                      <div>
                        <span className={`badge ${getStatusBadge(selectedRequest.status)}`}>
                          {selectedRequest.status.charAt(0).toUpperCase() + selectedRequest.status.slice(1)}
                        </span>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold">Start Date</label>
                      <div>{selectedRequest.startDate}</div>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold">End Date</label>
                      <div>{selectedRequest.endDate}</div>
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-bold">Reason</label>
                      <div className="p-3 bg-light rounded">{selectedRequest.reason}</div>
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-bold">Manager Notes</label>
                      <textarea 
                        className="form-control"
                        rows="3"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Add your comments here..."
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => setSelectedRequest(null)}
                  >
                    Cancel
                  </button>
                  {selectedRequest.status === 'pending' && (
                    <>
                      <button 
                        type="button" 
                        className="btn btn-danger"
                        onClick={() => handleProcess(selectedRequest.id, 'rejected')}
                      >
                        Reject
                      </button>
                      <button 
                        type="button" 
                        className="btn btn-success"
                        onClick={() => handleProcess(selectedRequest.id, 'approved')}
                      >
                        Approve
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}