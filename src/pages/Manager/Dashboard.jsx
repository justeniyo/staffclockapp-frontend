import { useAuth } from '../../context/AuthContext'

export default function ManagerDashboard(){
  const { leaveRequests, allUsers, user } = useAuth()
  
  // Get team statistics
  const teamMembers = Object.values(allUsers).filter(staff => staff.manager === user.email)
  const teamRequests = leaveRequests.filter(req => teamMembers.some(member => member.email === req.staffId))
  const pendingRequests = teamRequests.filter(req => req.status === 'pending')
  
  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Manager Dashboard</h2>
        <p className="mb-0">Team overview and management</p>
      </div>
      
      <div className="page-content">
        <div className="row g-4 mb-4">
          <div className="col-md-3">
            <div className="card text-center">
              <div className="card-body">
                <h3 className="text-primary">{teamMembers.length}</h3>
                <p className="mb-0">Team Members</p>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card text-center">
              <div className="card-body">
                <h3 className="text-success">{teamMembers.filter(m => m.isClockedIn).length}</h3>
                <p className="mb-0">Currently Active</p>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card text-center">
              <div className="card-body">
                <h3 className="text-warning">{pendingRequests.length}</h3>
                <p className="mb-0">Pending Requests</p>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card text-center">
              <div className="card-body">
                <h3 className="text-info">{teamRequests.length}</h3>
                <p className="mb-0">Total Requests</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="row g-3">
          <div className="col-md-6">
            <div className="card">
              <div className="card-body">
                <h5 className="card-title">Team Overview</h5>
                <p className="card-text">Monitor your team's activity and performance.</p>
                <div className="mt-3">
                  {teamMembers.length === 0 ? (
                    <p className="text-muted">No team members assigned yet.</p>
                  ) : (
                    <div>
                      {teamMembers.slice(0, 3).map(member => (
                        <div key={member.email} className="d-flex justify-content-between align-items-center py-2 border-bottom">
                          <div>
                            <strong>{member.name}</strong>
                            <div className="text-muted small">{member.department}</div>
                          </div>
                          <span className={`badge ${member.isClockedIn ? 'bg-success' : 'bg-secondary'}`}>
                            {member.isClockedIn ? 'Active' : 'Offline'}
                          </span>
                        </div>
                      ))}
                      {teamMembers.length > 3 && (
                        <div className="text-center mt-2">
                          <small className="text-muted">+{teamMembers.length - 3} more team members</small>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="col-md-6">
            <div className="card">
              <div className="card-body">
                <h5 className="card-title">Leave Requests</h5>
                <p className="card-text">Review and process team leave requests.</p>
                <div className="mt-3">
                  {pendingRequests.length === 0 ? (
                    <p className="text-muted">No pending leave requests.</p>
                  ) : (
                    <div>
                      {pendingRequests.slice(0, 3).map(req => (
                        <div key={req.id} className="d-flex justify-content-between align-items-center py-2 border-bottom">
                          <div>
                            <strong>{req.staffName}</strong>
                            <div className="text-muted small">{req.type} - {req.startDate}</div>
                          </div>
                          <span className="badge bg-warning text-dark">Pending</span>
                        </div>
                      ))}
                      {pendingRequests.length > 3 && (
                        <div className="text-center mt-2">
                          <small className="text-muted">+{pendingRequests.length - 3} more requests</small>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}