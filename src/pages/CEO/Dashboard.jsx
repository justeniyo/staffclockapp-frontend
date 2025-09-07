import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getFullName, getUserById, isCEO, isExecutive } from '../../config/seedUsers'

export default function CEODashboard(){
  const { allUsers, rawLeaveRequests, clockActivities, user } = useAuth()
  
  // CEO always has manager privileges for leave processing
  const ceoAsManager = useMemo(() => {
    return isCEO(user)
  }, [user])
  
  // Executive-level statistics and insights
  const organizationData = useMemo(() => {
    const usersList = Object.values(allUsers).filter(user => user.role !== 'system')
    
    // Department breakdown
    const departmentStats = usersList.reduce((acc, user) => {
      if (user.department) {
        if (!acc[user.department]) {
          acc[user.department] = {
            total: 0,
            active: 0,
            managers: 0,
            clockedIn: 0
          }
        }
        acc[user.department].total++
        if (user.isActive) acc[user.department].active++
        if (user.isManager) acc[user.department].managers++
        if (user.isClockedIn) acc[user.department].clockedIn++
      }
      return acc
    }, {})

    // Role breakdown
    const roleStats = usersList.reduce((acc, user) => {
      const displayRole = isCEO(user) ? 'CEO' : isExecutive(user) ? 'Executive' : user.role
      acc[displayRole] = (acc[displayRole] || 0) + 1
      return acc
    }, {})

    // Leave request analytics
    const currentYear = new Date().getFullYear()
    const thisYearRequests = rawLeaveRequests.filter(req => 
      new Date(req.startDate).getFullYear() === currentYear
    )

    const leaveStats = {
      total: thisYearRequests.length,
      pending: thisYearRequests.filter(req => req.status === 'pending').length,
      approved: thisYearRequests.filter(req => req.status === 'approved').length,
      rejected: thisYearRequests.filter(req => req.status === 'rejected').length,
      byType: thisYearRequests.reduce((acc, req) => {
        acc[req.type] = (acc[req.type] || 0) + 1
        return acc
      }, {})
    }

    // Activity analytics
    const today = new Date().toDateString()
    const todayActivities = clockActivities.filter(activity => 
      new Date(activity.timestamp).toDateString() === today
    )

    const activityStats = {
      todayTotal: todayActivities.length,
      todayClockIns: todayActivities.filter(a => a.action === 'clock_in').length,
      todayClockOuts: todayActivities.filter(a => a.action === 'clock_out').length,
      totalActivities: clockActivities.length
    }

    // CEO Leave Processing: Show requests that require CEO approval
    // This includes: executives, department managers, and escalated requests
    const ceoProcessingRequests = thisYearRequests.filter(req => {
      const staff = usersList.find(u => u.id === req.staffId)
      if (!staff) return false
      
      // Show requests from executives and department managers
      return (
        isExecutive(staff) || 
        (staff.isManager && staff.subRole === 'manager') ||
        req.status === 'pending'
      )
    })

    const pendingCEORequests = ceoProcessingRequests.filter(req => req.status === 'pending').length

    // CEO's direct reports (executives)
    const directReports = usersList.filter(u => u.managerId === user.id)

    return {
      totalStaff: usersList.length,
      activeStaff: usersList.filter(user => user.isClockedIn).length,
      totalManagers: usersList.filter(user => user.isManager).length,
      departmentCount: Object.keys(departmentStats).length,
      departmentStats,
      roleStats,
      leaveStats,
      activityStats,
      ceoRequests: ceoProcessingRequests.slice(0, 5),
      pendingCEORequests,
      directReports
    }
  }, [allUsers, rawLeaveRequests, clockActivities, user])

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
      Emergency: 'fa-exclamation-triangle'
    }
    return icons[type] || 'fa-question'
  }

  const getDepartmentColor = (index) => {
    const colors = ['primary', 'success', 'info', 'warning', 'danger', 'secondary']
    return colors[index % colors.length]
  }

  const getRoleColor = (role) => {
    const colors = {
      CEO: 'success',
      Executive: 'primary', 
      admin: 'danger',
      security: 'warning',
      staff: 'info'
    }
    return colors[role] || 'secondary'
  }

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">
          <i className="fas fa-crown me-2 text-warning"></i>
          Executive Dashboard
        </h2>
        <p className="mb-0">Organization overview and strategic leadership</p>
        
        {/* CEO Privileges Display */}
        <div className="mt-2">
          <span className="badge bg-warning text-dark me-2">
            <i className="fas fa-crown me-1"></i>
            Chief Executive Officer
          </span>
          {ceoAsManager && (
            <span className="badge bg-info me-2">
              <i className="fas fa-users-cog me-1"></i>
              Manager Access Enabled
            </span>
          )}
          <span className="badge bg-secondary">
            <i className="fas fa-building me-1"></i>
            {user.department}
          </span>
        </div>

        {/* CEO Manager Portal Notice */}
        {ceoAsManager && organizationData.pendingCEORequests > 0 && (
          <div className="alert alert-warning mt-3 mb-0">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <i className="fas fa-exclamation-triangle me-2"></i>
                <strong>CEO Approval Required:</strong>
                <span className="ms-2">
                  {organizationData.pendingCEORequests} executive-level leave request{organizationData.pendingCEORequests !== 1 ? 's' : ''} awaiting your approval
                </span>
              </div>
              <Link to="/manager/leave-requests" className="btn btn-dark">
                <i className="fas fa-gavel me-2"></i>
                Review Now
              </Link>
            </div>
          </div>
        )}
      </div>
      
      <div className="page-content">
        {/* High-Level Metrics */}
        <div className="row g-4 mb-4">
          <div className="col-md-2">
            <div className="card text-center">
              <div className="card-body">
                <i className="fas fa-users fa-2x text-primary mb-2"></i>
                <h3 className="text-primary">{organizationData.totalStaff}</h3>
                <p className="mb-0 small">Total Staff</p>
              </div>
            </div>
          </div>
          <div className="col-md-2">
            <div className="card text-center">
              <div className="card-body">
                <i className="fas fa-user-check fa-2x text-success mb-2"></i>
                <h3 className="text-success">{organizationData.activeStaff}</h3>
                <p className="mb-0 small">Active Now</p>
              </div>
            </div>
          </div>
          <div className="col-md-2">
            <div className="card text-center">
              <div className="card-body">
                <i className="fas fa-building fa-2x text-info mb-2"></i>
                <h3 className="text-info">{organizationData.departmentCount}</h3>
                <p className="mb-0 small">Departments</p>
              </div>
            </div>
          </div>
          <div className="col-md-2">
            <div className="card text-center">
              <div className="card-body">
                <i className="fas fa-user-tie fa-2x text-warning mb-2"></i>
                <h3 className="text-warning">{organizationData.totalManagers}</h3>
                <p className="mb-0 small">Managers</p>
              </div>
            </div>
          </div>
          <div className="col-md-2">
            <div className="card text-center">
              <div className="card-body">
                <i className="fas fa-calendar-check fa-2x text-success mb-2"></i>
                <h3 className="text-success">{organizationData.leaveStats.approved}</h3>
                <p className="mb-0 small">Approved</p>
                <small className="text-muted">This Year</small>
              </div>
            </div>
          </div>
          <div className="col-md-2">
            <div className="card text-center">
              <div className="card-body">
                <i className="fas fa-crown fa-2x text-warning mb-2"></i>
                <h3 className="text-warning">{organizationData.pendingCEORequests}</h3>
                <p className="mb-0 small">CEO Queue</p>
                <small className="text-muted">Pending</small>
              </div>
            </div>
          </div>
        </div>

        {/* Executive Actions - Enhanced for CEO dual role */}
        <div className="row g-4 mb-4">
          <div className="col-12">
            <div className="card">
              <div className="card-header">
                <h6 className="mb-0">
                  <i className="fas fa-bolt me-2"></i>
                  Executive Actions
                </h6>
              </div>
              <div className="card-body">
                <div className="row g-3">
                  {/* CEO Manager Portal - Enhanced */}
                  {ceoAsManager && (
                    <div className="col-md-3">
                      <Link to="/manager/leave-requests" className="btn btn-outline-primary w-100">
                        <i className="fas fa-crown me-2"></i>
                        CEO Approvals
                        {organizationData.pendingCEORequests > 0 && (
                          <span className="badge bg-warning text-dark ms-2">
                            {organizationData.pendingCEORequests}
                          </span>
                        )}
                      </Link>
                      <small className="text-muted d-block text-center mt-1">
                        Executive Leave Processing
                      </small>
                    </div>
                  )}
                  
                  {/* CEO Personal Leave Request */}
                  <div className="col-md-3">
                    <Link to="/staff/request-leave" className="btn btn-outline-secondary w-100">
                      <i className="fas fa-calendar-plus me-2"></i>
                      My Leave Request
                    </Link>
                    <small className="text-muted d-block text-center mt-1">
                      CEO Personal Time Off
                    </small>
                  </div>
                  
                  {/* CEO Staff Portal Access */}
                  <div className="col-md-3">
                    <Link to="/staff-dashboard" className="btn btn-outline-info w-100">
                      <i className="fas fa-user me-2"></i>
                      Staff Portal
                    </Link>
                    <small className="text-muted d-block text-center mt-1">
                      Personal Dashboard
                    </small>
                  </div>
                  
                  {/* CEO Clock In/Out */}
                  <div className="col-md-3">
                    <Link to="/clock" className="btn btn-outline-success w-100">
                      <i className="fas fa-clock me-2"></i>
                      Clock In/Out
                    </Link>
                    <small className="text-muted d-block text-center mt-1">
                      Time Tracking
                    </small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="row g-4">
          {/* Role Distribution - Enhanced */}
          <div className="col-lg-4">
            <div className="card">
              <div className="card-header">
                <h6 className="mb-0">
                  <i className="fas fa-sitemap me-2"></i>
                  Organizational Structure
                </h6>
              </div>
              <div className="card-body">
                {Object.keys(organizationData.roleStats).length === 0 ? (
                  <p className="text-muted text-center py-3">No role data available.</p>
                ) : (
                  <div>
                    {Object.entries(organizationData.roleStats).map(([role, count]) => (
                      <div key={role} className="d-flex justify-content-between align-items-center py-2 border-bottom">
                        <div className="d-flex align-items-center">
                          <span className={`badge bg-${getRoleColor(role)} me-2`}>
                            {role === 'CEO' ? <i className="fas fa-crown"></i> : 
                             role === 'Executive' ? <i className="fas fa-user-tie"></i> :
                             <i className="fas fa-user"></i>}
                          </span>
                          <span className="fw-semibold">{role}</span>
                        </div>
                        <div className="d-flex align-items-center">
                          <span className="fw-semibold me-2">{count}</span>
                          <div 
                            className={`bg-${getRoleColor(role)} rounded`}
                            style={{
                              width: `${Math.max((count / organizationData.totalStaff) * 50, 5)}px`,
                              height: '8px'
                            }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* CEO Leave Requests Queue - Enhanced */}
          <div className="col-lg-4">
            <div className="card">
              <div className="card-header">
                <h6 className="mb-0">
                  <i className="fas fa-crown me-2"></i>
                  CEO Approval Queue
                </h6>
              </div>
              <div className="card-body">
                {organizationData.ceoRequests.length === 0 ? (
                  <div className="text-center py-4">
                    <i className="fas fa-calendar-check fa-3x text-muted mb-3"></i>
                    <p className="text-muted">No requests requiring CEO approval.</p>
                  </div>
                ) : (
                  <div>
                    {organizationData.ceoRequests.map(req => {
                      const staff = Object.values(allUsers).find(u => u.id === req.staffId)
                      const isExecutiveRequest = isExecutive(staff)
                      return (
                        <div key={req.id} className="d-flex justify-content-between align-items-center py-2 border-bottom">
                          <div className="d-flex align-items-center">
                            <div className="me-2">
                              {isExecutiveRequest && (
                                <i className="fas fa-crown text-warning me-1" title="Executive Level"></i>
                              )}
                              <i className={`fas ${getLeaveTypeIcon(req.type)} text-primary`}></i>
                            </div>
                            <div>
                              <div className="fw-semibold">
                                {staff ? getFullName(staff) : 'Unknown Staff'}
                              </div>
                              <small className="text-muted">
                                {staff?.jobTitle || staff?.role} • {req.type} • {req.startDate} to {req.endDate}
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
                    {ceoAsManager && (
                      <div className="text-center mt-3">
                        <Link to="/manager/leave-requests" className="btn btn-outline-primary btn-sm">
                          <i className="fas fa-gavel me-1"></i>
                          Process All Requests
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Direct Reports - Enhanced */}
          <div className="col-lg-4">
            <div className="card">
              <div className="card-header">
                <h6 className="mb-0">
                  <i className="fas fa-user-friends me-2"></i>
                  Executive Team
                </h6>
              </div>
              <div className="card-body">
                {organizationData.directReports.length === 0 ? (
                  <p className="text-muted text-center py-3">No direct reports.</p>
                ) : (
                  <div>
                    {organizationData.directReports.map(report => (
                      <div key={report.id} className="d-flex justify-content-between align-items-center py-2 border-bottom">
                        <div className="d-flex align-items-center">
                          <div className="me-2">
                            <i className={`fas fa-circle ${report.isClockedIn ? 'text-success' : 'text-muted'}`} style={{fontSize: '0.6rem'}}></i>
                            {isExecutive(report) && (
                              <i className="fas fa-star text-warning ms-1" title="Executive"></i>
                            )}
                          </div>
                          <div>
                            <div className="fw-semibold small">{getFullName(report)}</div>
                            <small className="text-muted">
                              {report.jobTitle || report.role} • {report.department}
                            </small>
                          </div>
                        </div>
                        <div className="text-end">
                          <span className={`badge ${report.isClockedIn ? 'bg-success' : 'bg-secondary'} badge-sm`}>
                            {report.isClockedIn ? 'Active' : 'Offline'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Department Overview - Enhanced */}
        <div className="row g-4 mt-2">
          <div className="col-12">
            <div className="card">
              <div className="card-header">
                <h6 className="mb-0">
                  <i className="fas fa-building me-2"></i>
                  Department Performance Overview
                </h6>
              </div>
              <div className="card-body">
                {Object.keys(organizationData.departmentStats).length === 0 ? (
                  <p className="text-muted text-center py-3">No department data available.</p>
                ) : (
                  <div className="row g-3">
                    {Object.entries(organizationData.departmentStats).map(([dept, stats], index) => (
                      <div key={dept} className="col-md-4 col-lg-3">
                        <div className="card border">
                          <div className="card-body text-center">
                            <div className={`mb-2 p-2 rounded bg-${getDepartmentColor(index)} bg-opacity-25`}>
                              <i className="fas fa-building text-dark"></i>
                            </div>
                            <h6 className="fw-bold">{dept}</h6>
                            <div className="row g-2 text-center">
                              <div className="col-6">
                                <div className="small text-muted">Total</div>
                                <div className="fw-bold text-primary">{stats.total}</div>
                              </div>
                              <div className="col-6">
                                <div className="small text-muted">Active</div>
                                <div className="fw-bold text-success">{stats.clockedIn}</div>
                              </div>
                            </div>
                            <div className="mt-2">
                              <div className="progress" style={{height: '4px'}}>
                                <div 
                                  className="progress-bar bg-success"
                                  style={{width: `${(stats.clockedIn / stats.total) * 100}%`}}
                                ></div>
                              </div>
                              <small className="text-muted">
                                {Math.round((stats.clockedIn / stats.total) * 100)}% engagement
                              </small>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* CEO Privileges Notice */}
        <div className="row g-4 mt-2">
          <div className="col-12">
            <div className="card">
              <div className="card-header bg-warning text-dark">
                <h6 className="mb-0">
                  <i className="fas fa-crown me-2"></i>
                  CEO Privileges & Responsibilities
                </h6>
              </div>
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-md-6">
                    <h6 className="text-primary">Executive Privileges:</h6>
                    <ul className="list-unstyled">
                      <li><i className="fas fa-check text-success me-2"></i>Approve all executive-level leave requests</li>
                      <li><i className="fas fa-check text-success me-2"></i>Access to all department performance data</li>
                      <li><i className="fas fa-check text-success me-2"></i>Organization-wide statistics and insights</li>
                      <li><i className="fas fa-check text-success me-2"></i>Direct access to all strategic information</li>
                    </ul>
                  </div>
                  <div className="col-md-6">
                    <h6 className="text-warning">Dual Role Capabilities:</h6>
                    <ul className="list-unstyled">
                      <li><i className="fas fa-star text-warning me-2"></i>CEO + Staff role for leave management</li>
                      <li><i className="fas fa-star text-warning me-2"></i>Manager portal access for approvals</li>
                      <li><i className="fas fa-star text-warning me-2"></i>Personal leave request capabilities</li>
                      <li><i className="fas fa-star text-warning me-2"></i>Clock in/out tracking like any staff member</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}