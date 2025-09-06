import { useMemo } from 'react'
import { useAuth } from '../../context/AuthContext'
import { getFullName } from '../../config/seedUsers'

export default function CEODashboard(){
  const { allUsers, rawLeaveRequests, clockActivities } = useAuth()
  
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
      acc[user.role] = (acc[user.role] || 0) + 1
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

    // Recent requests requiring CEO approval (executives' requests)
    const executiveRequests = thisYearRequests.filter(req => {
      const staff = usersList.find(u => u.id === req.staffId)
      return staff && staff.managerId === null && staff.role !== 'ceo' // Direct reports to CEO
    })

    return {
      totalStaff: usersList.length,
      activeStaff: usersList.filter(user => user.isClockedIn).length,
      totalManagers: usersList.filter(user => user.isManager).length,
      departmentCount: Object.keys(departmentStats).length,
      departmentStats,
      roleStats,
      leaveStats,
      activityStats,
      executiveRequests: executiveRequests.slice(0, 5),
      pendingExecutiveRequests: executiveRequests.filter(req => req.status === 'pending').length
    }
  }, [allUsers, rawLeaveRequests, clockActivities])

  // Get direct reports (executives who report to CEO)
  const directReports = useMemo(() => {
    return Object.values(allUsers).filter(user => 
      user.managerId === null && user.role !== 'ceo' && user.role !== 'system'
    )
  }, [allUsers])

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

  const getDepartmentColor = (index) => {
    const colors = ['primary', 'success', 'info', 'warning', 'danger', 'secondary']
    return colors[index % colors.length]
  }

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Executive Dashboard</h2>
        <p className="mb-0">Organization overview and strategic insights</p>
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
                <i className="fas fa-clock fa-2x text-secondary mb-2"></i>
                <h3 className="text-secondary">{organizationData.activityStats.todayTotal}</h3>
                <p className="mb-0 small">Activities</p>
                <small className="text-muted">Today</small>
              </div>
            </div>
          </div>
        </div>

        {/* Executive Actions */}
        {organizationData.pendingExecutiveRequests > 0 && (
          <div className="row g-4 mb-4">
            <div className="col-12">
              <div className="alert alert-warning">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <i className="fas fa-exclamation-triangle me-2"></i>
                    <strong>Executive Approval Required</strong>
                    <div className="small">
                      {organizationData.pendingExecutiveRequests} leave request{organizationData.pendingExecutiveRequests !== 1 ? 's' : ''} from your direct reports require{organizationData.pendingExecutiveRequests === 1 ? 's' : ''} approval
                    </div>
                  </div>
                  <button className="btn btn-warning">
                    <i className="fas fa-gavel me-2"></i>
                    Review Requests
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="row g-4">
          {/* Department Overview */}
          <div className="col-lg-6">
            <div className="card">
              <div className="card-header">
                <h6 className="mb-0">
                  <i className="fas fa-sitemap me-2"></i>
                  Department Overview
                </h6>
              </div>
              <div className="card-body">
                {Object.keys(organizationData.departmentStats).length === 0 ? (
                  <p className="text-muted text-center py-3">No department data available.</p>
                ) : (
                  <div>
                    {Object.entries(organizationData.departmentStats).map(([dept, stats], index) => (
                      <div key={dept} className="d-flex justify-content-between align-items-center py-3 border-bottom">
                        <div className="d-flex align-items-center">
                          <div className={`me-3 p-2 rounded bg-${getDepartmentColor(index)} bg-opacity-25`}>
                            <i className="fas fa-building text-dark"></i>
                          </div>
                          <div>
                            <div className="fw-semibold">{dept}</div>
                            <small className="text-muted">
                              {stats.managers} manager{stats.managers !== 1 ? 's' : ''} • {stats.clockedIn} active
                            </small>
                          </div>
                        </div>
                        <div className="text-end">
                          <span className="badge bg-primary">{stats.total} staff</span>
                          <div className="small text-muted">
                            {Math.round((stats.clockedIn / stats.total) * 100)}% active
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Recent Executive Requests */}
          <div className="col-lg-6">
            <div className="card">
              <div className="card-header">
                <h6 className="mb-0">
                  <i className="fas fa-crown me-2"></i>
                  Executive Leave Requests
                </h6>
              </div>
              <div className="card-body">
                {organizationData.executiveRequests.length === 0 ? (
                  <div className="text-center py-4">
                    <i className="fas fa-calendar-check fa-3x text-muted mb-3"></i>
                    <p className="text-muted">No recent executive leave requests.</p>
                  </div>
                ) : (
                  <div>
                    {organizationData.executiveRequests.map(req => {
                      const staff = Object.values(allUsers).find(u => u.id === req.staffId)
                      return (
                        <div key={req.id} className="d-flex justify-content-between align-items-center py-2 border-bottom">
                          <div className="d-flex align-items-center">
                            <i className={`fas ${getLeaveTypeIcon(req.type)} me-3 text-primary`}></i>
                            <div>
                              <div className="fw-semibold">
                                {staff ? getFullName(staff) : 'Unknown Executive'}
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
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Analytics Row */}
        <div className="row g-4 mt-2">
          {/* Leave Analytics */}
          <div className="col-lg-4">
            <div className="card">
              <div className="card-header">
                <h6 className="mb-0">
                  <i className="fas fa-chart-pie me-2"></i>
                  Leave Analytics
                </h6>
              </div>
              <div className="card-body">
                <div className="row g-3 mb-3">
                  <div className="col-6 text-center">
                    <div className="h4 text-primary mb-1">{organizationData.leaveStats.total}</div>
                    <small className="text-muted">Total Requests</small>
                  </div>
                  <div className="col-6 text-center">
                    <div className="h4 text-warning mb-1">{organizationData.leaveStats.pending}</div>
                    <small className="text-muted">Pending</small>
                  </div>
                </div>
                
                <div className="progress mb-3" style={{height: '10px'}}>
                  <div 
                    className="progress-bar bg-success" 
                    style={{width: organizationData.leaveStats.total > 0 ? `${(organizationData.leaveStats.approved / organizationData.leaveStats.total) * 100}%` : '0%'}}
                    title={`${organizationData.leaveStats.approved} Approved`}
                  ></div>
                  <div 
                    className="progress-bar bg-warning" 
                    style={{width: organizationData.leaveStats.total > 0 ? `${(organizationData.leaveStats.pending / organizationData.leaveStats.total) * 100}%` : '0%'}}
                    title={`${organizationData.leaveStats.pending} Pending`}
                  ></div>
                  <div 
                    className="progress-bar bg-danger" 
                    style={{width: organizationData.leaveStats.total > 0 ? `${(organizationData.leaveStats.rejected / organizationData.leaveStats.total) * 100}%` : '0%'}}
                    title={`${organizationData.leaveStats.rejected} Rejected`}
                  ></div>
                </div>

                <div className="small">
                  <div className="d-flex justify-content-between mb-1">
                    <span><i className="fas fa-circle text-success me-1"></i>Approved</span>
                    <span>{organizationData.leaveStats.approved}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-1">
                    <span><i className="fas fa-circle text-warning me-1"></i>Pending</span>
                    <span>{organizationData.leaveStats.pending}</span>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span><i className="fas fa-circle text-danger me-1"></i>Rejected</span>
                    <span>{organizationData.leaveStats.rejected}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Leave Types Distribution */}
          <div className="col-lg-4">
            <div className="card">
              <div className="card-header">
                <h6 className="mb-0">
                  <i className="fas fa-chart-bar me-2"></i>
                  Leave Types
                </h6>
              </div>
              <div className="card-body">
                {Object.keys(organizationData.leaveStats.byType).length === 0 ? (
                  <p className="text-muted text-center py-3">No leave type data available.</p>
                ) : (
                  <div>
                    {Object.entries(organizationData.leaveStats.byType).map(([type, count]) => (
                      <div key={type} className="d-flex justify-content-between align-items-center py-2 border-bottom">
                        <div className="d-flex align-items-center">
                          <i className={`fas ${getLeaveTypeIcon(type)} me-2 text-primary`}></i>
                          <span>{type}</span>
                        </div>
                        <div className="d-flex align-items-center">
                          <span className="badge bg-light text-dark me-2">{count}</span>
                          <div 
                            className="bg-primary rounded" 
                            style={{
                              width: `${Math.max((count / organizationData.leaveStats.total) * 60, 5)}px`,
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

          {/* Direct Reports */}
          <div className="col-lg-4">
            <div className="card">
              <div className="card-header">
                <h6 className="mb-0">
                  <i className="fas fa-user-friends me-2"></i>
                  Direct Reports
                </h6>
              </div>
              <div className="card-body">
                {directReports.length === 0 ? (
                  <p className="text-muted text-center py-3">No direct reports.</p>
                ) : (
                  <div>
                    {directReports.map(report => (
                      <div key={report.id} className="d-flex justify-content-between align-items-center py-2 border-bottom">
                        <div className="d-flex align-items-center">
                          <div className="me-2">
                            <i className={`fas fa-circle ${report.isClockedIn ? 'text-success' : 'text-muted'}`} style={{fontSize: '0.6rem'}}></i>
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

        {/* Organization Health Indicators */}
        <div className="row g-4 mt-2">
          <div className="col-12">
            <div className="card">
              <div className="card-header">
                <h6 className="mb-0">
                  <i className="fas fa-heartbeat me-2"></i>
                  Organization Health Indicators
                </h6>
              </div>
              <div className="card-body">
                <div className="row g-4">
                  <div className="col-md-3 text-center">
                    <div className="mb-2">
                      <i className="fas fa-user-check fa-2x text-success"></i>
                    </div>
                    <h5 className="text-success">
                      {Math.round((organizationData.activeStaff / organizationData.totalStaff) * 100)}%
                    </h5>
                    <p className="small text-muted mb-0">Staff Engagement</p>
                    <small className="text-muted">{organizationData.activeStaff}/{organizationData.totalStaff} currently active</small>
                  </div>
                  <div className="col-md-3 text-center">
                    <div className="mb-2">
                      <i className="fas fa-thumbs-up fa-2x text-primary"></i>
                    </div>
                    <h5 className="text-primary">
                      {organizationData.leaveStats.total > 0 ? Math.round((organizationData.leaveStats.approved / organizationData.leaveStats.total) * 100) : 0}%
                    </h5>
                    <p className="small text-muted mb-0">Leave Approval Rate</p>
                    <small className="text-muted">{organizationData.leaveStats.approved}/{organizationData.leaveStats.total} requests approved</small>
                  </div>
                  <div className="col-md-3 text-center">
                    <div className="mb-2">
                      <i className="fas fa-users-cog fa-2x text-info"></i>
                    </div>
                    <h5 className="text-info">
                      {Math.round((organizationData.totalManagers / organizationData.totalStaff) * 100)}%
                    </h5>
                    <p className="small text-muted mb-0">Management Ratio</p>
                    <small className="text-muted">{organizationData.totalManagers} managers for {organizationData.totalStaff} staff</small>
                  </div>
                  <div className="col-md-3 text-center">
                    <div className="mb-2">
                      <i className="fas fa-chart-line fa-2x text-warning"></i>
                    </div>
                    <h5 className="text-warning">
                      {organizationData.activityStats.todayClockIns}
                    </h5>
                    <p className="small text-muted mb-0">Today's Check-ins</p>
                    <small className="text-muted">vs {organizationData.activityStats.todayClockOuts} check-outs</small>
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