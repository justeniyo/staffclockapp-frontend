// src/pages/Manager/Dashboard.jsx - Updated for hierarchical structure

import { useAuth } from '../../context/AuthContext'
import { getFullName } from '../../config/seedUsers'

export default function ManagerDashboard(){
  const { 
    user, 
    getMyDirectReports, 
    getPendingLeaveRequestsForApproval,
    getMyTeamClockActivities 
  } = useAuth()
  
  // Get team statistics using new helper functions
  const teamMembers = getMyDirectReports()
  const pendingRequests = getPendingLeaveRequestsForApproval()
  const teamActivities = getMyTeamClockActivities()
  
  // Calculate today's activities
  const todayActivities = teamActivities.filter(activity => 
    new Date(activity.timestamp).toDateString() === new Date().toDateString()
  )
  
  // Get user's level in hierarchy for display
  const getUserLevelTitle = () => {
    if (user.manager === 'ceo@company.com') {
      return 'C-Level Executive'
    }
    if (user.isManager) {
      return 'Department Manager'
    }
    return 'Team Lead'
  }
  
  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Manager Dashboard</h2>
        <p className="mb-0">
          {getUserLevelTitle()} - {user.jobTitle || 'Management Portal'}
        </p>
      </div>
      
      <div className="page-content">
        <div className="row g-4 mb-4">
          <div className="col-md-3">
            <div className="card text-center">
              <div className="card-body">
                <h3 className="text-primary">{teamMembers.length}</h3>
                <p className="mb-0">Direct Reports</p>
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
                <p className="mb-0">Pending Approvals</p>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card text-center">
              <div className="card-body">
                <h3 className="text-info">{todayActivities.length}</h3>
                <p className="mb-0">Today's Activities</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="row g-3">
          <div className="col-md-6">
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">
                  <i className="fas fa-users me-2"></i>
                  Team Overview
                </h5>
              </div>
              <div className="card-body">
                {teamMembers.length === 0 ? (
                  <div className="text-center py-4">
                    <i className="fas fa-user-plus fa-2x text-muted mb-3"></i>
                    <p className="text-muted">No direct reports assigned yet.</p>
                    <small className="text-muted">
                      Contact administration to assign team members.
                    </small>
                  </div>
                ) : (
                  <div>
                    {teamMembers.slice(0, 5).map(member => (
                      <div key={member.email} className="d-flex justify-content-between align-items-center py-2 border-bottom">
                        <div>
                          <div className="fw-semibold">{getFullName(member)}</div>
                          <div className="text-muted small">
                            {member.jobTitle || member.department}
                            {member.isManager && (
                              <span className="badge bg-info ms-2">Manager</span>
                            )}
                          </div>
                        </div>
                        <div className="text-end">
                          <span className={`badge ${member.isClockedIn ? 'bg-success' : 'bg-secondary'}`}>
                            {member.isClockedIn ? 'Active' : 'Offline'}
                          </span>
                        </div>
                      </div>
                    ))}
                    {teamMembers.length > 5 && (
                      <div className="text-center mt-3">
                        <small className="text-muted">
                          +{teamMembers.length - 5} more team members
                        </small>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="col-md-6">
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">
                  <i className="fas fa-calendar-check me-2"></i>
                  Pending Leave Requests
                </h5>
              </div>
              <div className="card-body">
                {pendingRequests.length === 0 ? (
                  <div className="text-center py-4">
                    <i className="fas fa-check-circle fa-2x text-success mb-3"></i>
                    <p className="text-muted">No pending leave requests.</p>
                    <small className="text-muted">
                      All requests have been processed.
                    </small>
                  </div>
                ) : (
                  <div>
                    {pendingRequests.slice(0, 5).map(req => {
                      const daysDiff = Math.ceil((new Date(req.endDate) - new Date(req.startDate)) / (1000 * 60 * 60 * 24)) + 1
                      const isUrgent = new Date(req.startDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Within 7 days
                      
                      return (
                        <div key={req.id} className="d-flex justify-content-between align-items-start py-2 border-bottom">
                          <div className="flex-grow-1">
                            <div className="fw-semibold">
                              {req.staffName}
                              {isUrgent && (
                                <span className="badge bg-warning text-dark ms-2">
                                  <i className="fas fa-exclamation-triangle me-1"></i>
                                  Urgent
                                </span>
                              )}
                            </div>
                            <div className="text-muted small">
                              {req.type} - {daysDiff} day{daysDiff !== 1 ? 's' : ''}
                            </div>
                            <div className="text-muted small">
                              {req.startDate} to {req.endDate}
                            </div>
                          </div>
                          <div className="text-end">
                            <span className="badge bg-warning text-dark">
                              <i className="fas fa-clock me-1"></i>
                              Pending
                            </span>
                            <div className="text-muted small mt-1">
                              {new Date(req.requestDate).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                    {pendingRequests.length > 5 && (
                      <div className="text-center mt-3">
                        <small className="text-muted">
                          +{pendingRequests.length - 5} more pending requests
                        </small>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Additional insights for higher-level managers */}
        {user.manager === 'ceo@company.com' && (
          <div className="row g-3 mt-3">
            <div className="col-12">
              <div className="card">
                <div className="card-header header-light">
                  <h5 className="mb-0">
                    <i className="fas fa-chart-line me-2"></i>
                    Executive Insights
                  </h5>
                </div>
                <div className="card-body">
                  <div className="row g-3">
                    <div className="col-md-3">
                      <div className="text-center">
                        <h4 className="text-primary mb-1">
                          {teamMembers.filter(m => m.isManager).length}
                        </h4>
                        <small className="text-muted">Department Managers</small>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="text-center">
                        <h4 className="text-success mb-1">
                          {Math.round(teamMembers.filter(m => m.isClockedIn).length / teamMembers.length * 100) || 0}%
                        </h4>
                        <small className="text-muted">Active Rate</small>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="text-center">
                        <h4 className="text-warning mb-1">
                          {pendingRequests.filter(req => 
                            new Date(req.startDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                          ).length}
                        </h4>
                        <small className="text-muted">Urgent Requests</small>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="text-center">
                        <h4 className="text-info mb-1">
                          {todayActivities.length}
                        </h4>
                        <small className="text-muted">Today's Check-ins</small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}