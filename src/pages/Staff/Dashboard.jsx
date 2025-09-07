import { useMemo } from 'react'
import { useAuth } from '../../context/AuthContext'
import { Link } from 'react-router-dom'
import { getFullName, getUserById, isCEO } from '../../config/seedUsers'

export default function StaffDashboard() {
  const { user, rawLeaveRequests, clockActivities, locations, departments, allUsers } = useAuth()

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

  // Get manager information using the new ID-based structure
  const manager = user.managerId ? getUserById(user.managerId) : null
  const department = user.departmentId ? departments[user.departmentId] : null
  const assignedLocation = user.assignedLocationId ? locations[user.assignedLocationId] : null

  // Get team members if user is a manager (using new ID-based relationships)
  const teamMembers = useMemo(() => {
    if (!user.isManager) return []
    return Object.values(allUsers).filter(member => member.managerId === user.id)
  }, [user.isManager, user.id, allUsers])

  // Enhanced location information
  const locationInfo = useMemo(() => {
    const allowedLocations = user.allowedLocationIds?.map(id => locations[id]).filter(Boolean) || []
    const currentLocations = user.currentLocationIds?.map(id => locations[id]).filter(Boolean) || []
    
    return {
      assigned: assignedLocation,
      allowed: allowedLocations,
      current: currentLocations,
      totalAccess: allowedLocations.length
    }
  }, [user.allowedLocationIds, user.currentLocationIds, locations, assignedLocation])

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

  const getLocationIcon = (location) => {
    const icons = {
      office: 'fa-building',
      warehouse: 'fa-warehouse',
      remote: 'fa-home',
      field: 'fa-map-marker-alt'
    }
    return icons[location?.type] || 'fa-map-marker-alt'
  }

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Staff Dashboard</h2>
        <p className="mb-0">Welcome back, {getFullName(user)}!</p>
        <div className="mt-1">
          {user.jobTitle && (
            <span className="badge bg-primary me-2">{user.jobTitle}</span>
          )}
          {department && (
            <span className="badge bg-info me-2">
              <i className="fas fa-building me-1"></i>
              {department.name}
            </span>
          )}
          {isCEO(user) && (
            <span className="badge bg-warning text-dark me-2">
              <i className="fas fa-crown me-1"></i>
              CEO
            </span>
          )}
          {user.isManager && !isCEO(user) && (
            <span className="badge bg-success me-2">
              <i className="fas fa-users me-1"></i>
              Manager
            </span>
          )}
        </div>
      </div>

      <div className="page-content">
        {/* Enhanced Status Cards */}
        <div className="row g-4 mb-4">
          <div className="col-md-3">
            <div className="card text-center">
              <div className="card-body">
                <i className={`fas ${user.isClockedIn ? 'fa-user-check' : 'fa-user-clock'} fa-2x ${user.isClockedIn ? 'text-success' : 'text-muted'} mb-2`}></i>
                <h4 className={user.isClockedIn ? 'text-success' : 'text-muted'}>
                  {user.isClockedIn ? 'On Duty' : 'Off Duty'}
                </h4>
                {user.isClockedIn && locationInfo.current.length > 0 && (
                  <div className="mb-2">
                    <small className="text-success">
                      Active at {locationInfo.current.length} location{locationInfo.current.length !== 1 ? 's' : ''}
                    </small>
                  </div>
                )}
                <Link to="/clock" className="btn btn-outline-warning btn-sm">
                  {user.isClockedIn ? 'Manage Locations' : 'Clock In'}
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
                <i className="fas fa-map-marker-alt fa-2x text-secondary mb-2"></i>
                <h4 className="text-secondary">{locationInfo.totalAccess}</h4>
                <p className="mb-2">Location Access</p>
                {assignedLocation && (
                  <small className="text-muted">
                    Primary: {assignedLocation.name}
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
                    <div className="small">
                      You have manager privileges. 
                      {teamMembers.length > 0 && ` Managing ${teamMembers.length} team member${teamMembers.length !== 1 ? 's' : ''}.`}
                    </div>
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

        {/* Enhanced Location Information */}
        {locationInfo.totalAccess > 1 && (
          <div className="row g-3 mb-4">
            <div className="col-12">
              <div className="card">
                <div className="card-header">
                  <h6 className="mb-0">
                    <i className="fas fa-map-marked-alt me-2"></i>
                    My Location Access
                  </h6>
                </div>
                <div className="card-body">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <h6 className="small text-muted mb-2">PRIMARY LOCATION</h6>
                      {assignedLocation ? (
                        <div className="d-flex align-items-center p-2 bg-light rounded">
                          <i className={`fas ${getLocationIcon(assignedLocation)} text-primary me-2`}></i>
                          <div>
                            <div className="fw-semibold">{assignedLocation.name}</div>
                            <small className="text-muted">{assignedLocation.type} • {assignedLocation.address}</small>
                          </div>
                        </div>
                      ) : (
                        <p className="text-muted">No primary location assigned</p>
                      )}
                    </div>
                    <div className="col-md-6">
                      <h6 className="small text-muted mb-2">ADDITIONAL ACCESS ({locationInfo.allowed.length - 1})</h6>
                      <div className="d-flex flex-wrap gap-1">
                        {locationInfo.allowed
                          .filter(loc => loc.id !== user.assignedLocationId)
                          .map(location => (
                            <span key={location.id} className="badge bg-secondary">
                              <i className={`fas ${getLocationIcon(location)} me-1`}></i>
                              {location.name}
                            </span>
                          ))}
                      </div>
                    </div>
                  </div>
                  
                  {user.isClockedIn && locationInfo.current.length > 0 && (
                    <div className="mt-3 pt-3 border-top">
                      <h6 className="small text-success mb-2">CURRENTLY ACTIVE</h6>
                      <div className="d-flex flex-wrap gap-2">
                        {locationInfo.current.map(location => (
                          <div key={location.id} className="badge bg-success">
                            <i className={`fas ${getLocationIcon(location)} me-1`}></i>
                            {location.name}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
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
                    {myData.activities.map(activity => {
                      const location = locations[activity.locationId]
                      return (
                        <div key={activity.id} className="d-flex justify-content-between align-items-center py-2 border-bottom">
                          <div className="d-flex align-items-center">
                            <i className={`fas ${getActivityIcon(activity.action)} me-3 ${activity.action === 'clock_in' ? 'text-success' : 'text-danger'}`}></i>
                            <div>
                              <div className="fw-semibold">
                                {activity.action.replace('_', ' ').toUpperCase()}
                              </div>
                              <small className="text-muted">
                                <i className={`fas ${getLocationIcon(location)} me-1`}></i>
                                {location?.name || activity.location}
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
                      )
                    })}
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

        {/* Enhanced Annual Leave Progress */}
        <div className="row g-4 mt-2">
          <div className="col-lg-8">
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

          {/* Enhanced Profile Information */}
          <div className="col-lg-4">
            <div className="card">
              <div className="card-header">
                <h6 className="mb-0">
                  <i className="fas fa-user me-2"></i>
                  Profile Information
                </h6>
              </div>
              <div className="card-body">
                <div className="mb-3">
                  <label className="form-label fw-bold small">Name</label>
                  <div className="p-2 bg-light rounded">{getFullName(user)}</div>
                </div>
                
                {user.jobTitle && (
                  <div className="mb-3">
                    <label className="form-label fw-bold small">Job Title</label>
                    <div className="p-2 bg-light rounded">{user.jobTitle}</div>
                  </div>
                )}
                
                <div className="mb-3">
                  <label className="form-label fw-bold small">Department</label>
                  <div className="p-2 bg-light rounded">
                    {department ? department.name : 'Unknown'}
                    {department?.description && (
                      <small className="text-muted d-block">{department.description}</small>
                    )}
                  </div>
                </div>
                
                {manager && (
                  <div className="mb-3">
                    <label className="form-label fw-bold small">Reports To</label>
                    <div className="p-2 bg-light rounded">
                      {getFullName(manager)}
                      {manager.jobTitle && (
                        <small className="text-muted d-block">{manager.jobTitle}</small>
                      )}
                    </div>
                  </div>
                )}
                
                {user.phone && (
                  <div className="mb-3">
                    <label className="form-label fw-bold small">Contact</label>
                    <div className="p-2 bg-light rounded">
                      <i className="fas fa-phone me-1"></i>
                      {user.phone}
                    </div>
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