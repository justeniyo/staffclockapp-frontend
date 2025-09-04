import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function AdminDashboard(){
  const { allUsers, leaveRequests, clockActivities } = useAuth()
  
  const stats = {
    totalStaff: Object.keys(allUsers).length,
    activeStaff: Object.values(allUsers).filter(user => user.isClockedIn).length,
    pendingRequests: leaveRequests.filter(req => req.status === 'pending').length,
    todayActivities: clockActivities.filter(activity => 
      new Date(activity.timestamp).toDateString() === new Date().toDateString()
    ).length
  }

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Admin Dashboard</h2>
      </div>
      
      <div className="page-content">
        <div className="row g-4 mb-4">
          <div className="col-md-3">
            <div className="card text-center">
              <div className="card-body">
                <h3 className="text-primary">{stats.totalStaff}</h3>
                <p className="mb-0">Total Staff</p>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card text-center">
              <div className="card-body">
                <h3 className="text-success">{stats.activeStaff}</h3>
                <p className="mb-0">Currently Active</p>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card text-center">
              <div className="card-body">
                <h3 className="text-warning">{stats.pendingRequests}</h3>
                <p className="mb-0">Pending Requests</p>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card text-center">
              <div className="card-body">
                <h3 className="text-info">{stats.todayActivities}</h3>
                <p className="mb-0">Today's Activities</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="row g-3">
          <div className="col-md-6">
            <div className="card">
              <div className="card-body">
                <h5 className="card-title">Register New Staff</h5>
                <p className="card-text">Add new employees with email verification.</p>
                <Link to="/admin/register-staff" className="btn btn-outline-dark">Register Staff</Link>
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="card">
              <div className="card-body">
                <h5 className="card-title">Manage Staff</h5>
                <p className="card-text">Update staff details, roles, and departments.</p>
                <Link to="/admin/manage-staff" className="btn btn-outline-dark">Manage Staff</Link>
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="card">
              <div className="card-body">
                <h5 className="card-title">Clock Activities</h5>
                <p className="card-text">Monitor and export staff clock in/out activities.</p>
                <Link to="/admin/clock-activities" className="btn btn-outline-dark">View Activities</Link>
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="card">
              <div className="card-body">
                <h5 className="card-title">Leave Requests</h5>
                <p className="card-text">Overview of all leave requests across departments.</p>
                <div className="mt-2">
                  <small className="text-muted">
                    {stats.pendingRequests} pending requests require manager attention
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
