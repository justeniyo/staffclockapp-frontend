import { useAuth } from '../../context/AuthContext'

export default function SecurityDashboard(){
  const { allUsers, clockActivities } = useAuth()
  
  // Security-relevant statistics
  const stats = {
    totalUsers: Object.keys(allUsers).length,
    activeUsers: Object.values(allUsers).filter(user => user.isClockedIn).length,
    todayActivities: clockActivities.filter(activity => 
      new Date(activity.timestamp).toDateString() === new Date().toDateString()
    ).length,
    recentActivities: clockActivities.slice(0, 10)
  }
  
  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Security Dashboard</h2>
        <p className="mb-0">System monitoring and access control</p>
      </div>
      
      <div className="page-content">
        <div className="row g-4 mb-4">
          <div className="col-md-4">
            <div className="card text-center">
              <div className="card-body">
                <h3 className="text-primary">{stats.totalUsers}</h3>
                <p className="mb-0">Total Users</p>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card text-center">
              <div className="card-body">
                <h3 className="text-success">{stats.activeUsers}</h3>
                <p className="mb-0">Active Now</p>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card text-center">
              <div className="card-body">
                <h3 className="text-info">{stats.todayActivities}</h3>
                <p className="mb-0">Today's Activities</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="row g-3">
          <div className="col-12">
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">Recent Access Activities</h5>
              </div>
              <div className="card-body">
                {stats.recentActivities.length === 0 ? (
                  <p className="text-muted">No recent activities.</p>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead>
                        <tr>
                          <th>Time</th>
                          <th>User</th>
                          <th>Department</th>
                          <th>Action</th>
                          <th>Location</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.recentActivities.map(activity => (
                          <tr key={activity.id}>
                            <td>
                              <div>{new Date(activity.timestamp).toLocaleDateString()}</div>
                              <small className="text-muted">
                                {new Date(activity.timestamp).toLocaleTimeString()}
                              </small>
                            </td>
                            <td>
                              <strong>{activity.staffName}</strong>
                              <div className="text-muted small">{activity.staffId}</div>
                            </td>
                            <td>{activity.department}</td>
                            <td>
                              <span className={`badge ${activity.action === 'clock_in' ? 'bg-success' : 'bg-danger'}`}>
                                {activity.action.replace('_', ' ').toUpperCase()}
                              </span>
                            </td>
                            <td>{activity.location}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
