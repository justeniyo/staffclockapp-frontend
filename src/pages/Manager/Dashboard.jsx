import { useMemo } from 'react'
import { useAuth } from '../../context/AuthContext'
import { Link } from 'react-router-dom'
import { getFullName, getUserById } from '../../config/seedUsers'

export default function ManagerDashboard(){
  const { rawLeaveRequests, allUsers, user, clockActivities } = useAuth()
  
  // Get team statistics using ID-based relationships
  const teamData = useMemo(() => {
    // Find team members who report to this manager (using user ID)
    const teamMembers = Object.values(allUsers).filter(staff => staff.managerId === user.id)
    
    // Get leave requests from team members
    const teamRequests = rawLeaveRequests.filter(req => 
      teamMembers.some(member => member.id === req.staffId)
    )
    const pendingRequests = teamRequests.filter(req => req.status === 'pending')
    
    // Get recent team activities
    const teamActivities = clockActivities
      .filter(activity => teamMembers.some(member => member.id === activity.staffId))
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 5)
    
    // Calculate team leave statistics
    const currentYear = new Date().getFullYear()
    const thisYearRequests = teamRequests.filter(req => 
      new Date(req.startDate).getFullYear() === currentYear
    )
    
    const approvedRequests = thisYearRequests.filter(req => req.status === 'approved')
    const rejectedRequests = thisYearRequests.filter(req => req.status === 'rejected')
    
    return {
      members: teamMembers,
      requests: teamRequests,
      pendingRequests,
      activities: teamActivities,
      approvedCount: approvedRequests.length,
      rejectedCount: rejectedRequests.length,
      totalRequests: thisYearRequests.length
    }
  }, [allUsers, rawLeaveRequests, user.id, clockActivities])

  // Get my own leave requests as a manager (using user ID)
  const myLeaveData = useMemo(() => {
    const myRequests = rawLeaveRequests.filter(req => req.staffId === user.id)
    const pending = myRequests.filter(req => req.status === 'pending').length
    
    return {
      requests: myRequests,
      pendingCount: pending
    }
  }, [rawLeaveRequests, user.id])

  // Get my manager for escalation (using managerId)
  const myManager = user.managerId ? getUserById(user.managerId) : null

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-warning text-dark',
      approved: 'bg-success',
      rejected: 'bg-danger'
    }
    return badges[status] || 'bg-secondary'
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

  const getActivityColor = (action) => {
    return action === 'clock_in' ? 'text-success' : 'text-danger'
  }

  // Helper to get staff member from activity using staffId
  const getStaffFromActivity = (activity) => {
    return teamData.members.find(m => m.id === activity.staffId)
  }

  // Helper to get staff member from request using staffId
  const getStaffFromRequest = (request) => {
    return teamData.members.find(m => m.id === request.staffId)
  }

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Manager Dashboard</h2>
        <p className="mb-0">Team overview and management</p>
        <small className="text-muted">
          Managing {teamData.members.length} team member{teamData.members.length !== 1 ? 's' : ''} in {user.department}
          {myManager && (
            <span> • Reports to {getFullName(myManager)}</span>
          )}
        </small>
      </div>
      
      <div className="page-content">
        {/* Statistics Cards */}
        <div className="row g-4 mb-4">
          <div className="col-md-3">
            <div className="card text-center">
              <div className="card-body">
                <i className="fas fa-users fa-2x text-primary mb-2"></i>
                <h3 className="text-primary">{teamData.members.length}</h3>
                <p className="mb-0">Team Members</p>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card text-center">
              <div className="card-body">
                <i className="fas fa-user-check fa-2x text-success mb-2"></i>
                <h3 className="text-success">{teamData.members.filter(m => m.isClockedIn).length}</h3>
                <p className="mb-0">Currently Active</p>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card text-center">
              <div className="card-body">
                <i className="fas fa-clock fa-2x text-warning mb-2"></i>
                <h3 className="text-warning">{teamData.pendingRequests.length}</h3>
                <p className="mb-0">Pending Requests</p>
                {teamData.pendingRequests.length > 0 && (
                  <Link to="/manager/leave-requests" className="btn btn-sm btn-outline-warning mt-1">
                    Review Now
                  </Link>
                )}
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card text-center">
              <div className="card-body">
                <i className="fas fa-calendar-alt fa-2x text-info mb-2"></i>
                <h3 className="text-info">{teamData.totalRequests}</h3>
                <p className="mb-0">Total Requests</p>
                <small className="text-muted">This Year</small>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="row g-4 mb-4">
          <div className="col-12">
            <div className="card">
              <div className="card-header">
                <h6 className="mb-0">
                  <i className="fas fa-bolt me-2"></i>
                  Quick Actions
                </h6>
              </div>
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-md-3">
                    <Link to="/manager/leave-requests" className="btn btn-outline-primary w-100">
                      <i className="fas fa-calendar-check me-2"></i>
                      Review Leave Requests
                      {teamData.pendingRequests.length > 0 && (
                        <span className="badge bg-warning text-dark ms-2">
                          {teamData.pendingRequests.length}
                        </span>
                      )}
                    </Link>
                  </div>
                  <div className="col-md-3">
                    <Link to="/staff/request-leave" className="btn btn-outline-secondary w-100">
                      <i className="fas fa-calendar-plus me-2"></i>
                      Request My Leave
                      {myLeaveData.pendingCount > 0 && (
                        <span className="badge bg-info ms-2">
                          {myLeaveData.pendingCount}
                        </span>
                      )}
                    </Link>
                  </div>
                  <div className="col-md-3">
                    <Link to="/staff-dashboard" className="btn btn-outline-info w-100">
                      <i className="fas fa-user me-2"></i>
                      My Staff Portal
                    </Link>
                  </div>
                  <div className="col-md-3">
                    <Link to="/clock" className="btn btn-outline-success w-100">
                      <i className="fas fa-clock me-2"></i>
                      Clock In/Out
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="row g-4">
          {/* Team Overview */}
          <div className="col-lg-6">
            <div className="card">
              <div className="card-header">
                <h6 className="mb-0">
                  <i className="fas fa-users me-2"></i>
                  Team Overview
                </h6>
              </div>
              <div className="card-body">
                {teamData.members.length === 0 ? (
                  <div className="text-center py-4">
                    <i className="fas fa-users fa-3x text-muted mb-3"></i>
                    <p className="text-muted">No team members assigned yet.</p>
                    <small className="text-muted">Team members will appear here when they are assigned to report to you.</small>
                  </div>
                ) : (
                  <div>
                    {teamData.members.slice(0, 5).map(member => (
                      <div key={member.id} className="d-flex justify-content-between align-items-center py-2 border-bottom">
                        <div className="d-flex align-items-center">
                          <div className="me-3">
                            <i className={`fas fa-circle ${member.isClockedIn ? 'text-success' : 'text-muted'}`} style={{fontSize: '0.6rem'}}></i>
                          </div>
                          <div>
                            <div className="fw-semibold">{getFullName(member)}</div>
                            <small className="text-muted">
                              {member.jobTitle || member.role} • {member.department}
                            </small>
                          </div>
                        </div>
                        <div className="text-end">
                          <span className={`badge ${member.isClockedIn ? 'bg-success' : 'bg-secondary'}`}>
                            {member.isClockedIn ? 'Active' : 'Offline'}
                          </span>
                        </div>
                      </div>
                    ))}
                    {teamData.members.length > 5 && (
                      <div className="text-center mt-3">
                        <small className="text-muted">
                          +{teamData.members.length - 5} more team member{teamData.members.length - 5 !== 1 ? 's' : ''}
                        </small>
                      </div>
                    )}
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
                <Link to="/manager/leave-requests" className="btn btn-sm btn-outline-primary">
                  View All
                </Link>
              </div>
              <div className="card-body">
                {teamData.pendingRequests.length === 0 ? (
                  <div className="text-center py-4">
                    <i className="fas fa-calendar-check fa-3x text-muted mb-3"></i>
                    <p className="text-muted">No pending leave requests.</p>
                    <small className="text-muted">New requests from your team will appear here.</small>
                  </div>
                ) : (
                  <div>
                    {teamData.pendingRequests.slice(0, 4).map(req => {
                      const staff = getStaffFromRequest(req)
                      return (
                        <div key={req.id} className="d-flex justify-content-between align-items-center py-2 border-bottom">
                          <div className="d-flex align-items-center">
                            <i className={`fas ${getLeaveTypeIcon(req.type)} me-3 text-primary`}></i>
                            <div>
                              <div className="fw-semibold">{staff ? getFullName(staff) : 'Unknown'}</div>
                              <small className="text-muted">
                                {req.type} • {req.startDate} to {req.endDate}
                              </small>
                            </div>
                          </div>
                          <div className="text-end">
                            <span className={`badge ${getStatusBadge(req.status)}`}>
                              {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                            </span>
                            <div className="small text-muted">
                              {new Date(req.requestDate).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                    {teamData.pendingRequests.length > 4 && (
                      <div className="text-center mt-3">
                        <small className="text-muted">
                          +{teamData.pendingRequests.length - 4} more pending request{teamData.pendingRequests.length - 4 !== 1 ? 's' : ''}
                        </small>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Team Activity Feed */}
        <div className="row g-4 mt-2">
          <div className="col-lg-8">
            <div className="card">
              <div className="card-header">
                <h6 className="mb-0">
                  <i className="fas fa-activity me-2"></i>
                  Recent Team Activity
                </h6>
              </div>
              <div className="card-body">
                {teamData.activities.length === 0 ? (
                  <div className="text-center py-4">
                    <i className="fas fa-clock fa-3x text-muted mb-3"></i>
                    <p className="text-muted">No recent team activities.</p>
                  </div>
                ) : (
                  <div>
                    {teamData.activities.map(activity => {
                      const staff = getStaffFromActivity(activity)
                      return (
                        <div key={activity.id} className="d-flex align-items-center py-2 border-bottom">
                          <div className="me-3">
                            <i className={`fas ${getActivityIcon(activity.action)} ${getActivityColor(activity.action)}`}></i>
                          </div>
                          <div className="flex-grow-1">
                            <div className="d-flex justify-content-between align-items-start">
                              <div>
                                <div className="fw-semibold">
                                  {staff ? getFullName(staff) : 'Unknown Staff'}
                                </div>
                                <small className="text-muted">
                                  {activity.action.replace('_', ' ').toUpperCase()} • {activity.location || activity.locationName}
                                </small>
                              </div>
                              <small className="text-muted">
                                {new Date(activity.timestamp).toLocaleDateString()} {new Date(activity.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </small>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Manager Statistics */}
          <div className="col-lg-4">
            <div className="card">
              <div className="card-header">
                <h6 className="mb-0">
                  <i className="fas fa-chart-pie me-2"></i>
                  Management Statistics
                </h6>
              </div>
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-6 text-center">
                    <div className="h4 text-success mb-1">{teamData.approvedCount}</div>
                    <small className="text-muted">Approved</small>
                  </div>
                  <div className="col-6 text-center">
                    <div className="h4 text-danger mb-1">{teamData.rejectedCount}</div>
                    <small className="text-muted">Rejected</small>
                  </div>
                  <div className="col-12">
                    <div className="progress" style={{height: '10px'}}>
                      <div 
                        className="progress-bar bg-success" 
                        style={{width: teamData.totalRequests > 0 ? `${(teamData.approvedCount / teamData.totalRequests) * 100}%` : '0%'}}
                      ></div>
                      <div 
                        className="progress-bar bg-danger" 
                        style={{width: teamData.totalRequests > 0 ? `${(teamData.rejectedCount / teamData.totalRequests) * 100}%` : '0%'}}
                      ></div>
                    </div>
                    <div className="d-flex justify-content-between mt-2">
                      <small className="text-muted">
                        {teamData.totalRequests > 0 ? Math.round((teamData.approvedCount / teamData.totalRequests) * 100) : 0}% Approval Rate
                      </small>
                      <small className="text-muted">
                        {teamData.totalRequests} Total
                      </small>
                    </div>
                  </div>
                </div>

                {/* My Leave Status */}
                <div className="mt-4 pt-3 border-top">
                  <h6 className="small text-muted mb-2">MY LEAVE STATUS</h6>
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <div className="fw-semibold small">My Requests</div>
                      <small className="text-muted">{myLeaveData.requests.length} total</small>
                    </div>
                    <div className="text-end">
                      {myLeaveData.pendingCount > 0 && (
                        <span className="badge bg-warning text-dark">
                          {myLeaveData.pendingCount} Pending
                        </span>
                      )}
                    </div>
                  </div>
                  <Link to="/staff/request-leave" className="btn btn-outline-primary btn-sm w-100 mt-2">
                    <i className="fas fa-calendar-plus me-1"></i>
                    Request Leave
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}