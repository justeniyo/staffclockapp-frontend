import { useAuth } from '../../context/AuthContext'

export default function CEODashboard(){
  const { allUsers, leaveRequests, clockActivities } = useAuth()
  
  // Executive-level statistics
  const stats = {
    totalStaff: Object.keys(allUsers).length,
    activeStaff: Object.values(allUsers).filter(user => user.isClockedIn).length,
    departments: [...new Set(Object.values(allUsers).map(user => user.department).filter(Boolean))].length,
    pendingRequests: leaveRequests.filter(req => req.status === 'pending').length,
    approvedRequests: leaveRequests.filter(req => req.status === 'approved').length,
    todayActivities: clockActivities.filter(activity => 
      new Date(activity.timestamp).toDateString() === new Date().toDateString()
    ).length
  }
  
  // Department breakdown
  const departmentStats = Object.values(allUsers).reduce((acc, user) => {
    if (user.department) {
      acc[user.department] = (acc[user.department] || 0) + 1
    }
    return acc
  }, {})
  
  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Executive Dashboard</h2>
        <p className="mb-0">Organization overview and insights</p>
      </div>
      
      <div className="page-content">
        <div className="row g-4 mb-4">
          <div className="col-md-2">
            <div className="card text-center">
              <div className="card-body">
                <h3 className="text-primary">{stats.totalStaff}</h3>
                <p className="mb-0">Total Staff</p>
              </div>
            </div>
          </div>
          <div className="col-md-2">
            <div className="card text-center">
              <div className="card-body">
                <h3 className="text-success">{stats.activeStaff}</h3>
                <p className="mb-0">Active Now</p>
              </div>
            </div>
          </div>
          <div className="col-md-2">
            <div className="card text-center">
              <div className="card-body">
                <h3 className="text-info">{stats.departments}</h3>
                <p className="mb-0">Departments</p>
              </div>
            </div>
          </div>
          <div className="col-md-2">
            <div className="card text-center">
              <div className="card-body">
                <h3 className="text-warning">{stats.pendingRequests}</h3>
                <p className="mb-0">Pending</p>
              </div>
            </div>
          </div>
          <div className="col-md-2">
            <div className="card text-center">
              <div className="card-body">
                <h3 className="text-success">{stats.approvedRequests}</h3>
                <p className="mb-0">Approved</p>
              </div>
            </div>
          </div>
          <div className="col-md-2">
            <div className="card text-center">
              <div className="card-body">
                <h3 className="text-secondary">{stats.todayActivities}</h3>
                <p className="mb-0">Today</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="row g-3">
          <div className="col-md-6">
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">Department Overview</h5>
              </div>
              <div className="card-body">
                {Object.keys(departmentStats).length === 0 ? (
                  <p className="text-muted">No department data available.</p>
                ) : (
                  <div>
                    {Object.entries(departmentStats).map(([dept, count]) => (
                      <div key={dept} className="d-flex justify-content-between align-items-center py-2 border-bottom">
                        <div>
                          <strong>{dept}</strong>
                        </div>
                        <span className="badge bg-primary">{count} staff</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="col-md-6">
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">Recent Leave Requests</h5>
              </div>
              <div className="card-body">
                {leaveRequests.length === 0 ? (
                  <p className="text-muted">No leave requests.</p>
                ) : (
                  <div>
                    {leaveRequests.slice(0, 5).map(req => (
                      <div key={req.id} className="d-flex justify-content-between align-items-center py-2 border-bottom">
                        <div>
                          <strong>{req.staffName}</strong>
                          <div className="text-muted small">{req.type} - {req.startDate}</div>
                        </div>
                        <span className={`badge ${
                          req.status === 'pending' ? 'bg-warning text-dark' :
                          req.status === 'approved' ? 'bg-success' : 'bg-danger'
                        }`}>
                          {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                        </span>
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