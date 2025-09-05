import { useAuth } from '../../context/AuthContext'
import { Link } from 'react-router-dom'
import { getFullName } from '../../config/seedUsers'

export default function StaffDashboard() {
  const { user, leaveRequests, clockActivities } = useAuth()

  const myRequests = leaveRequests.filter(req => req.staffId === user.email)
  const myActivities = clockActivities.filter(activity => activity.staffId === user.email).slice(0, 5)
  const pendingRequests = myRequests.filter(req => req.status === 'pending').length

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Staff Dashboard</h2>
        <p className="mb-0">Welcome back, {getFullName(user)}!</p>
      </div>

      <div className="page-content">
        <div className="row g-4 mb-4">
          <div className="col-md-4">
            <div className="card text-center">
              <div className="card-body">
                <h4 className={user.isClockedIn ? 'text-success' : 'text-muted'}>
                  {user.isClockedIn ? 'Clocked In' : 'Clocked Out'}
                </h4>
                <Link to="/clock" className="btn btn-outline-warning">
                  {user.isClockedIn ? 'Clock Out' : 'Clock In'}
                </Link>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card text-center">
              <div className="card-body">
                <h4 className="text-primary">{myRequests.length}</h4>
                <p className="mb-2">Leave Requests</p>
                {pendingRequests > 0 && (
                  <small className="text-warning">{pendingRequests} pending</small>
                )}
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card text-center">
              <div className="card-body">
                <h4 className="text-info">{user.department}</h4>
                <p className="mb-0">Department</p>
              </div>
            </div>
          </div>
        </div>

        <div className="row g-3">
          <div className="col-md-6">
            <div className="card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h6 className="mb-0">Recent Activities</h6>
                <Link to="/clock" className="btn btn-sm btn-outline-primary">View Clock</Link>
              </div>
              <div className="card-body">
                {myActivities.length === 0 ? (
                  <p className="text-muted">No recent activities.</p>
                ) : (
                                    <div>
                    {myActivities.map(activity => (
                      <div key={activity.id} className="d-flex justify-content-between align-items-center py-2 border-bottom">
                        <small className="text-muted">
                          {new Date(activity.timestamp).toLocaleDateString()}
                        </small>
                        <div>
                          <span className={`badge ${activity.action === 'clock_in' ? 'bg-success' : 'bg-danger'} me-2`}>
                            {activity.action.replace('_', ' ').toUpperCase()}
                          </span>
                          <small className="text-muted">{activity.location}</small>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="col-md-6">
            <div className="card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h6 className="mb-0">Leave Requests</h6>
                <Link to="/staff/request-leave" className="btn btn-sm btn-outline-primary">New Request</Link>
              </div>
              <div className="card-body">
                {myRequests.length === 0 ? (
                  <p className="text-muted">No leave requests yet.</p>
                ) : (
                  <div>
                    {myRequests.slice(0, 3).map(req => (
                      <div key={req.id} className="d-flex justify-content-between align-items-center py-2 border-bottom">
                        <div>
                          <strong>{req.type}</strong>
                          <div className="text-muted small">{req.startDate} to {req.endDate}</div>
                        </div>
                        <span className={`badge ${req.status === 'pending' ? 'bg-warning text-dark' :
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