// src/pages/Staff/Dashboard.jsx - Updated for hierarchical structure

import { useAuth } from '../../context/AuthContext'
import { Link } from 'react-router-dom'
import { getFullName } from '../../config/seedUsers'

export default function StaffDashboard() {
  const { user, getMyLeaveRequests, clockActivities, allUsers } = useAuth()

  const myRequests = getMyLeaveRequests()
  const myActivities = clockActivities.filter(activity => activity.staffId === user.email).slice(0, 5)
  const pendingRequests = myRequests.filter(req => req.status === 'pending').length

  // Get manager information
  const managerInfo = user.manager ? allUsers[user.manager] : null

  // Calculate leave stats for current year
  const currentYear = new Date().getFullYear()
  const annualLeaveUsed = myRequests
    .filter(req => {
      const reqYear = new Date(req.startDate).getFullYear()
      return req.type === 'Annual' && 
             reqYear === currentYear && 
             req.status === 'approved'
    })
    .reduce((total, req) => {
      const days = Math.ceil((new Date(req.endDate) - new Date(req.startDate)) / (1000 * 60 * 60 * 24)) + 1
      return total + days
    }, 0)

  const ANNUAL_LEAVE_LIMIT = 18
  const remainingLeave = ANNUAL_LEAVE_LIMIT - annualLeaveUsed

  // Get user's position in hierarchy
  const getHierarchyInfo = () => {
    if (user.role === 'ceo') {
      return { level: 'Chief Executive Officer', color: 'text-success' }
    }
    if (user.manager === 'ceo@company.com') {
      return { level: 'C-Level Executive', color: 'text-primary' }
    }
    if (user.isManager) {
      return { level: 'Department Manager', color: 'text-info' }
    }
    return { level: 'Team Member', color: 'text-secondary' }
  }

  const hierarchyInfo = getHierarchyInfo()

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Staff Dashboard</h2>
        <p className="mb-0">
          Welcome back, {getFullName(user)}! 
          <span className={`ms-2 ${hierarchyInfo.color}`}>
            <i className="fas fa-user-tie me-1"></i>
            {hierarchyInfo.level}
          </span>
        </p>
      </div>

      <div className="page-content">
        {/* Status Cards */}
        <div className="row g-4 mb-4">
          <div className="col-md-3">
            <div className="card text-center">
              <div className="card-body">
                <h4 className={user.isClockedIn ? 'text-success' : 'text-muted'}>
                  <i className={`fas ${user.isClockedIn ? 'fa-clock' : 'fa-clock'} me-2`}></i>
                  {user.isClockedIn ? 'Clocked In' : 'Clocked Out'}
                </h4>
                <Link to="/clock" className="btn btn-outline-warning">
                  {user.isClockedIn ? 'Clock Out' : 'Clock In'}
                </Link>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card text-center">
              <div className="card-body">
                <h4 className="text-primary">{myRequests.length}</h4>
                <p className="mb-2">Leave Requests</p>
                {pendingRequests > 0 && (
                  <small className="text-warning">
                    <i className="fas fa-clock me-1"></i>
                    {pendingRequests} pending
                  </small>
                )}
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card text-center">
              <div className="card-body">
                <h4 className={remainingLeave > 5 ? 'text-success' : remainingLeave > 0 ? 'text-warning' : 'text-danger'}>
                  {remainingLeave}
                </h4>
                <p className="mb-2">Annual Leave Days</p>
                <small className="text-muted">
                  {annualLeaveUsed} of {ANNUAL_LEAVE_LIMIT} used
                </small>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card text-center">
              <div className="card-body">
                <h4 className="text-info">{user.department}</h4>
                <p className="mb-2">Department</p>
                <small className="text-muted">{user.jobTitle || 'Staff Member'}</small>
              </div>
            </div>
          </div>
        </div>

        {/* Manager Access Button for Managers */}
        {user.isManager && (
          <div className="row g-3 mb-4">
            <div className="col-12">
              <div className="card bg-gradient" style={{ background: 'linear-gradient(135deg, #1f2937, #374151)' }}>
                <div className="card-body text-white">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h5 className="mb-1 text-white">
                        <i className="fas fa-users me-2"></i>
                        Management Portal
                      </h5>
                      <p className="mb-0 text-light">
                        Access team management features and approve leave requests
                      </p>
                    </div>
                    <Link to="/manager-dashboard" className="btn btn-light">
                      <i className="fas fa-external-link-alt me-2"></i>
                      Access Manager Portal
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="row g-3">
          {/* Recent Activities */}
          <div className="col-md-6">
            <div className="card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h6 className="mb-0">
                  <i className="fas fa-history me-2"></i>
                  Recent Activities
                </h6>
                <Link to="/clock" className="btn btn-sm btn-outline-primary">
                  <i className="fas fa-clock me-1"></i>
                  View Clock
                </Link>
              </div>
              <div className="card-body">
                {myActivities.length === 0 ? (
                  <div className="text-center py-4">
                    <i className="fas fa-clock fa-2x text-muted mb-3"></i>
                    <p className="text-muted">No recent activities.</p>
                    <Link to="/clock" className="btn btn-outline-primary btn-sm">
                      Clock In Now
                    </Link>
                  </div>
                ) : (
                  <div>
                    {myActivities.map(activity => (
                      <div key={activity.id} className="d-flex justify-content-between align-items-center py-2 border-bottom">
                        <div>
                          <div className="fw-semibold">
                            {new Date(activity.timestamp).toLocaleDateString()}
                          </div>
                          <small className="text-muted">
                            {new Date(activity.timestamp).toLocaleTimeString()}
                          </small>
                        </div>
                        <div className="text-end">
                          <span className={`badge ${activity.action === 'clock_in' ? 'bg-success' : 'bg-danger'} me-2`}>
                            <i className={`fas ${activity.action === 'clock_in' ? 'fa-sign-in-alt' : 'fa-sign-out-alt'} me-1`}></i>
                            {activity.action.replace('_', ' ').toUpperCase()}
                          </span>
                          <div>
                            <small className="text-muted">
                              <i className="fas fa-map-marker-alt me-1"></i>
                              {activity.location}
                            </small>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Leave Requests */}
          <div className="col-md-6">
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
                {myRequests.length === 0 ? (
                  <div className="text-center py-4">
                    <i className="fas fa-calendar-plus fa-2x text-muted mb-3"></i>
                    <p className="text-muted">No leave requests yet.</p>
                    <Link to="/staff/request-leave" className="btn btn-outline-primary btn-sm">
                      Request Leave
                    </Link>
                  </div>
                ) : (
                  <div>
                    {myRequests.slice(0, 4).map(req => {
                      const daysDiff = Math.ceil((new Date(req.endDate) - new Date(req.startDate)) / (1000 * 60 * 60 * 24)) + 1
                      
                      return (
                        <div key={req.id} className="d-flex justify-content-between align-items-center py-2 border-bottom">
                          <div>
                            <div className="fw-semibold">{req.type} Leave</div>
                            <div className="text-muted small">
                              {req.startDate} to {req.endDate}
                            </div>
                            <div className="mt-1">
                              <span className="badge bg-light text-dark">
                                <i className="fas fa-calendar-day me-1"></i>
                                {daysDiff} day{daysDiff !== 1 ? 's' : ''}
                              </span>
                            </div>
                          </div>
                          <div className="text-end">
                            <span className={`badge ${
                              req.status === 'pending' ? 'bg-warning text-dark' :
                              req.status === 'approved' ? 'bg-success' : 'bg-danger'
                            }`}>
                              <i className={`fas ${
                                req.status === 'pending' ? 'fa-clock' :
                                req.status === 'approved' ? 'fa-check' : 'fa-times'
                              } me-1`}></i>
                              {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                    {myRequests.length > 4 && (
                      <div className="text-center mt-3">
                        <Link to="/staff/request-leave" className="btn btn-outline-primary btn-sm">
                          View All Requests
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Manager Information */}
        {managerInfo && (
          <div className="row g-3 mt-3">
            <div className="col-12">
              <div className="card">
                <div className="card-header header-light">
                  <h6 className="mb-0">
                    <i className="fas fa-user-tie me-2"></i>
                    Reporting Structure
                  </h6>
                </div>
                <div className="card-body">
                  <div className="d-flex align-items-center">
                    <div className="flex-grow-1">
                      <div className="fw-semibold">Reports to: {getFullName(managerInfo)}</div>
                      <div className="text-muted small">
                        {managerInfo.jobTitle || managerInfo.department}
                      </div>
                      <div className="text-muted small">
                        <i className="fas fa-envelope me-1"></i>
                        {managerInfo.email}
                      </div>
                    </div>
                    <div className="text-end">
                      <span className={`badge ${managerInfo.isClockedIn ? 'bg-success' : 'bg-secondary'}`}>
                        {managerInfo.isClockedIn ? 'Available' : 'Offline'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Annual Leave Progress */}
        <div className="row g-3 mt-3">
          <div className="col-12">
            <div className="card">
              <div className="card-header header-light">
                <h6 className="mb-0">
                  <i className="fas fa-chart-pie me-2"></i>
                  Annual Leave Usage ({currentYear})
                </h6>
              </div>
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-md-8">
                    <div className="d-flex justify-content-between mb-2">
                      <span>Used: {annualLeaveUsed} days</span>
                      <span>Remaining: {remainingLeave} days</span>
                    </div>
                    <div className="progress" style={{ height: '20px' }}>
                      <div 
                        className={`progress-bar ${
                          annualLeaveUsed > ANNUAL_LEAVE_LIMIT * 0.8 ? 'bg-warning' : 
                          annualLeaveUsed > ANNUAL_LEAVE_LIMIT * 0.6 ? 'bg-info' : 'bg-success'
                        }`}
                        style={{width: `${Math.min((annualLeaveUsed / ANNUAL_LEAVE_LIMIT) * 100, 100)}%`}}
                      >
                        {Math.round((annualLeaveUsed / ANNUAL_LEAVE_LIMIT) * 100)}%
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="text-center">
                      <div className="h4 mb-1">{ANNUAL_LEAVE_LIMIT}</div>
                      <small className="text-muted">Total Annual Days</small>
                    </div>
                  </div>
                </div>
                
                {remainingLeave <= 3 && remainingLeave > 0 && (
                  <div className="alert alert-warning mt-3 mb-0">
                    <i className="fas fa-exclamation-triangle me-2"></i>
                    You have only {remainingLeave} annual leave day{remainingLeave !== 1 ? 's' : ''} remaining this year.
                  </div>
                )}
                
                {remainingLeave <= 0 && (
                  <div className="alert alert-danger mt-3 mb-0">
                    <i className="fas fa-ban me-2"></i>
                    You have used all your annual leave days for this year.
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