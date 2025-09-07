import { useMemo } from 'react'
import { useAuth } from '../../context/AuthContext'
import { Link } from 'react-router-dom'
import { getFullName, getUserById } from '../../config/seedUsers'

export default function StaffDashboard() {
  const { user, rawLeaveRequests, clockActivities } = useAuth()

  // Get my requests and activities using user ID
  const myData = useMemo(() => {
    const myRequests = rawLeaveRequests.filter(req => req.staffId === user.id)
    const myActivities = clockActivities.filter(activity => activity.staffId === user.id).slice(0, 5)
    const pendingRequests = myRequests.filter(req => req.status === 'pending').length
    
    // Calculate annual leave usage
    const currentYear = new Date().getFullYear()
    const annualLeaveThisYear = myRequests.filter(req => {
      const reqYear = new Date(req.startDate).getFullYear()
      return req.type === 'Annual' && 
             reqYear === currentYear && 
             (req.status === 'approved' || req.status === 'pending')
    })
    
    const annualDaysUsed = annualLeaveThisYear.reduce((total, req) => {
      const days = Math.ceil((new Date(req.endDate) - new Date(req.startDate)) / (1000 * 60 * 60 * 24)) + 1
      return total + days
    }, 0)
    
    return {
      requests: myRequests,
      activities: myActivities,
      pendingRequests,
      annualDaysUsed,
      annualDaysRemaining: 18 - annualDaysUsed
    }
  }, [rawLeaveRequests, clockActivities, user.id])

  // Get manager information
  const manager = user.managerId ? getUserById(user.managerId) : null

  // Get team members if user is a manager
  const teamMembers = useMemo(() => {
    if (!user.isManager) return []
    return Object.values(user.isManager ? {} : {}) // Will be populated from allUsers in actual implementation
  }, [user.isManager])

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

  const getLeaveTypeIcon = (type) => {
    const icons = {
      Annual: 'fa-calendar',
      Sick: 'fa-thermometer-half',
      Personal: 'fa-user',
      Emergency: 'fa-exclamation-triangle'
    }
    return icons[type] || 'fa-question'
  }

  const getActivityIcon = (action) => {
    return action === 'clock_in' ? 'fa-sign-in-alt' : 'fa-sign-out-alt'
  }

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Staff Dashboard</h2>
        <p className="mb-0">Welcome back, {getFullName(user)}!</p>
        {user.jobTitle && (
          <small className="text-muted d-block">{user.jobTitle} • {user.department}</small>
        )}
      </div>

      <div className="page-content">
        {/* Status Cards */}
        <div className="row g-4 mb-4">
          <div className="col-md-3">
            <div className="card text-center">
              <div className="card-body">
                <i className={`fas ${user.isClockedIn ? 'fa-user-check' : 'fa-user-clock'} fa-2x ${user.isClockedIn ? 'text-success' : 'text-muted'} mb-2`}></i>
                <h4 className={user.isClockedIn ? 'text-success' : 'text-muted'}>
                  {user.isClockedIn ? 'Clocked In' : 'Clocked Out'}
                </h4>
                <Link to="/clock" className="btn btn-outline-warning btn-sm">
                  {user.isClockedIn ? 'Clock Out' : 'Clock In'}
                </Link>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card text-center">
              <div className="card-body">
                <i className="fas fa-calendar-alt fa-2x text-primary mb-2"></i>
                <h4 className="text-primary">{myData.requests.length}</h4>
                <p className="mb-2">Leave Requests</p>
                {myData.pendingRequests > 0 && (
                  <small className="text-warning">
                    <i className="fas fa-clock me-1"></i>
                    {myData.pendingRequests} pending
                  </small>
                )}
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card text-center">
              <div className="card-body">
                <i className="fas fa-calendar-check fa-2x text-info mb-2"></i>
                <h4 className="text-info">{myData.annualDaysUsed}</h4>
                <p className="mb-2">Annual Days Used</p>
                <small className={`${myData.annualDaysRemaining > 5 ? 'text-success' : 'text-warning'}`}>
                  {myData.annualDaysRemaining} remaining
                </small>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card text-center">
              <div className="card-body">
                <i className="fas fa-building fa-2x text-secondary mb-2"></i>
                <h4 className="text-secondary">{user.department}</h4>
                <p className="mb-2">Department</p>
                {manager && (
                  <small className="text-muted">
                    Reports to {getFullName(manager)}
                  </small>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Manager Portal Button for managers */}
        {user.isManager && (
          <div className="row g-3 mb-4">
            <div className="col-12">
              <div className="alert alert-info">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <i className="fas fa-users me-2"></i>
                    <strong>Manager Access Available</strong>
                    <div className="small">You have manager privileges. Access your team management portal.</div>
                  </div>
                  <Link to="/manager-dashboard" className="btn btn-info">
                    <i className="fas fa-users-cog me-2"></i>
                    Manager Portal
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="row g-4">
          {/* Recent Activities */}
          <div className="col-lg-6">
            <div className="card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h6 className="mb-0">
                  <i className="fas fa-clock me-2"></i>
                  Recent Activities
                </h6>
                <Link to="/clock" className="btn btn-sm btn-outline-primary">
                  <i className="fas fa-clock me-1"></i>
                  Clock
                </Link>
              </div>
              <div className="card-body">
                {myData.activities.length === 0 ? (
                  <div className="text-center py-4">
                    <i className="fas fa-clock fa-3x text-muted mb-3"></i>
                    <p className="text-muted">No recent activities.</p>
                    <Link to="/clock" className="btn btn-outline-warning btn-sm">
                      Clock In Now
                    </Link>
                  </div>
                ) : (
                  <div>
                    {myData.activities.map(activity => (
                      <div key={activity.id} className="d-flex justify-content-between align-items-center py-2 border-bottom">
                        <div className="d-flex align-items-center">
                          <i className={`fas ${getActivityIcon(activity.action)} me-3 ${activity.action === 'clock_in' ? 'text-success' : 'text-danger'}`}></i>
                          <div>
                            <div className="fw-semibold">
                              {activity.action.replace('_', ' ').toUpperCase()}
                            </div>
                            <small className="text-muted">
                              <i className="fas fa-map-marker-alt me-1"></i>
                              {activity.location}
                            </small>
                          </div>
                        </div>
                        <div className="text-end">
                          <div className="small fw-semibold">
                            {new Date(activity.timestamp).toLocaleDateString()}
                          </div>
                          <small className="text-muted">
                            {new Date(activity.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </small>
                        </div>
                      </div>
                    ))}
                    <div className="text-center mt-3">
                      <Link to="/clock" className="btn btn-outline-primary btn-sm">
                        View All Activities
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Leave Requests */}
          <div className="col-lg-6">
            <div className="card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h6 className="mb-0">
                  <i className="fas fa-calendar-alt me-2"></i>
                  Leave Requests
                </h6>
                <Link to="/staff/request-leave" className="btn btn-sm btn-outline-primary">
                  <i className="fas fa-plus me-1"></i>
                  New Request
                </Link>
              </div>
              <div className="card-body">
                {myData.requests.length === 0 ? (
                  <div className="text-center py-4">
                    <i className="fas fa-calendar-times fa-3x text-muted mb-3"></i>
                    <p className="text-muted">No leave requests yet.</p>
                    <Link to="/staff/request-leave" className="btn btn-outline-warning btn-sm">
                      Request Leave
                    </Link>
                  </div>
                ) : (
                  <div>
                    {myData.requests.slice(0, 3).map(req => (
                      <div key={req.id} className="d-flex justify-content-between align-items-center py-2 border-bottom">
                        <div className="d-flex align-items-center">
                          <i className={`fas ${getLeaveTypeIcon(req.type)} me-3 text-primary`}></i>
                          <div>
                            <div className="fw-semibold">{req.type} Leave</div>
                            <small className="text-muted">
                              {req.startDate} to {req.endDate}
                            </small>
                          </div>
                        </div>
                        <div className="text-end">
                          <span className={`badge ${getStatusBadge(req.status)}`}>
                            <i className={`fas ${getStatusIcon(req.status)} me-1`}></i>
                            {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                          </span>
                        </div>
                      </div>
                    ))}
                    <div className="text-center mt-3">
                      <Link to="/staff/request-leave" className="btn btn-outline-primary btn-sm">
                        View All Requests
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Annual Leave Progress */}
        <div className="row g-4 mt-2">
          <div className="col-12">
            <div className="card">
              <div className="card-header">
                <h6 className="mb-0">
                  <i className="fas fa-chart-pie me-2"></i>
                  Annual Leave Usage ({new Date().getFullYear()})
                </h6>
              </div>
              <div className="card-body">
                <div className="row align-items-center">
                  <div className="col-md-8">
                    <div className="progress mb-2" style={{height: '20px'}}>
                      <div 
                        className={`progress-bar ${myData.annualDaysUsed > 15 ? 'bg-danger' : myData.annualDaysUsed > 12 ? 'bg-warning' : 'bg-success'}`}
                        style={{width: `${Math.min((myData.annualDaysUsed / 18) * 100, 100)}%`}}
                      >
                        {myData.annualDaysUsed} / 18 days
                      </div>
                    </div>
                    <div className="d-flex justify-content-between text-muted small">
                      <span>0 days</span>
                      <span>18 days (annual limit)</span>
                    </div>
                  </div>
                  <div className="col-md-4 text-md-end">
                    <div className="d-flex justify-content-md-end gap-3">
                      <div className="text-center">
                        <div className="h5 mb-1 text-primary">{myData.annualDaysUsed}</div>
                        <small className="text-muted">Used</small>
                      </div>
                      <div className="text-center">
                        <div className={`h5 mb-1 ${myData.annualDaysRemaining > 5 ? 'text-success' : 'text-warning'}`}>
                          {myData.annualDaysRemaining}
                        </div>
                        <small className="text-muted">Remaining</small>
                      </div>
                    </div>
                  </div>
                </div>
                {myData.annualDaysRemaining <= 3 && (
                  <div className={`alert ${myData.annualDaysRemaining === 0 ? 'alert-danger' : 'alert-warning'} mt-3 mb-0`}>
                    <i className="fas fa-exclamation-triangle me-2"></i>
                    {myData.annualDaysRemaining === 0 
                      ? 'You have used all your annual leave for this year.'
                      : `You only have ${myData.annualDaysRemaining} annual leave days remaining for this year.`
                    }
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