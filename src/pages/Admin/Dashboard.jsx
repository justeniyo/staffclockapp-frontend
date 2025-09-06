import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function AdminDashboard(){
  const { allUsers, rawLeaveRequests, clockActivities } = useAuth()
  
  // System administration statistics
  const systemData = useMemo(() => {
    const usersList = Object.values(allUsers).filter(user => user.role !== 'system')
    
    // User statistics
    const userStats = {
      total: usersList.length,
      active: usersList.filter(user => user.isActive).length,
      inactive: usersList.filter(user => !user.isActive).length,
      verified: usersList.filter(user => user.verified).length,
      unverified: usersList.filter(user => !user.verified).length,
      clockedIn: usersList.filter(user => user.isClockedIn).length,
      managers: usersList.filter(user => user.isManager).length
    }

    // Role distribution
    const roleStats = usersList.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1
      return acc
    }, {})

    // Department statistics
    const departmentStats = usersList.reduce((acc, user) => {
      if (user.department) {
        if (!acc[user.department]) {
          acc[user.department] = {
            total: 0,
            active: 0,
            managers: 0,
            unverified: 0
          }
        }
        acc[user.department].total++
        if (user.isActive) acc[user.department].active++
        if (user.isManager) acc[user.department].managers++
        if (!user.verified) acc[user.department].unverified++
      }
      return acc
    }, {})

    // Activity statistics
    const today = new Date().toDateString()
    const todayActivities = clockActivities.filter(activity => 
      new Date(activity.timestamp).toDateString() === today
    )

    const activityStats = {
      totalActivities: clockActivities.length,
      todayActivities: todayActivities.length,
      todayClockIns: todayActivities.filter(a => a.action === 'clock_in').length,
      todayClockOuts: todayActivities.filter(a => a.action === 'clock_out').length,
      recentActivities: clockActivities.slice(0, 5)
    }

    // Leave request statistics
    const currentYear = new Date().getFullYear()
    const thisYearRequests = rawLeaveRequests.filter(req => 
      new Date(req.startDate).getFullYear() === currentYear
    )

    const leaveStats = {
      totalRequests: thisYearRequests.length,
      pendingRequests: thisYearRequests.filter(req => req.status === 'pending').length,
      approvedRequests: thisYearRequests.filter(req => req.status === 'approved').length,
      rejectedRequests: thisYearRequests.filter(req => req.status === 'rejected').length
    }

    // System issues that need attention
    const systemIssues = []
    
    if (userStats.unverified > 0) {
      systemIssues.push({
        type: 'warning',
        icon: 'fa-user-clock',
        title: 'Unverified Users',
        description: `${userStats.unverified} user${userStats.unverified !== 1 ? 's' : ''} need${userStats.unverified === 1 ? 's' : ''} email verification`,
        action: 'Manage Staff',
        link: '/admin/manage-staff'
      })
    }

    if (userStats.inactive > 0) {
      systemIssues.push({
        type: 'info',
        icon: 'fa-user-slash',
        title: 'Inactive Users',
        description: `${userStats.inactive} inactive user${userStats.inactive !== 1 ? 's' : ''} in the system`,
        action: 'Review Users',
        link: '/admin/manage-staff'
      })
    }

    if (leaveStats.pendingRequests > 5) {
      systemIssues.push({
        type: 'warning',
        icon: 'fa-calendar-times',
        title: 'Pending Requests Backlog',
        description: `${leaveStats.pendingRequests} leave requests are pending approval`,
        action: 'View Activities',
        link: '/admin/clock-activities'
      })
    }

    return {
      userStats,
      roleStats,
      departmentStats,
      activityStats,
      leaveStats,
      systemIssues
    }
  }, [allUsers, rawLeaveRequests, clockActivities])

  const getRoleColor = (role) => {
    const colors = {
      ceo: 'success',
      admin: 'danger',
      security: 'warning',
      staff: 'primary'
    }
    return colors[role] || 'secondary'
  }

  const getDepartmentColor = (index) => {
    const colors = ['primary', 'success', 'info', 'warning', 'danger', 'secondary']
    return colors[index % colors.length]
  }

  const getSystemIssueClass = (type) => {
    const classes = {
      warning: 'alert-warning',
      info: 'alert-info',
      danger: 'alert-danger',
      success: 'alert-success'
    }
    return classes[type] || 'alert-secondary'
  }

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Admin Dashboard</h2>
        <p className="mb-0">System administration and user management</p>
      </div>
      
      <div className="page-content">
        {/* System Health Overview */}
        <div className="row g-4 mb-4">
          <div className="col-md-2">
            <div className="card text-center">
              <div className="card-body">
                <i className="fas fa-users fa-2x text-primary mb-2"></i>
                <h3 className="text-primary">{systemData.userStats.total}</h3>
                <p className="mb-0 small">Total Users</p>
              </div>
            </div>
          </div>
          <div className="col-md-2">
            <div className="card text-center">
              <div className="card-body">
                <i className="fas fa-user-check fa-2x text-success mb-2"></i>
                <h3 className="text-success">{systemData.userStats.active}</h3>
                <p className="mb-0 small">Active Users</p>
              </div>
            </div>
          </div>
          <div className="col-md-2">
            <div className="card text-center">
              <div className="card-body">
                <i className="fas fa-user-clock fa-2x text-warning mb-2"></i>
                <h3 className="text-warning">{systemData.userStats.unverified}</h3>
                <p className="mb-0 small">Unverified</p>
              </div>
            </div>
          </div>
          <div className="col-md-2">
            <div className="card text-center">
              <div className="card-body">
                <i className="fas fa-user-tie fa-2x text-info mb-2"></i>
                <h3 className="text-info">{systemData.userStats.managers}</h3>
                <p className="mb-0 small">Managers</p>
              </div>
            </div>
          </div>
          <div className="col-md-2">
            <div className="card text-center">
              <div className="card-body">
                <i className="fas fa-calendar-alt fa-2x text-secondary mb-2"></i>
                <h3 className="text-secondary">{systemData.leaveStats.pendingRequests}</h3>
                <p className="mb-0 small">Pending Requests</p>
              </div>
            </div>
          </div>
          <div className="col-md-2">
            <div className="card text-center">
              <div className="card-body">
                <i className="fas fa-clock fa-2x text-dark mb-2"></i>
                <h3 className="text-dark">{systemData.activityStats.todayActivities}</h3>
                <p className="mb-0 small">Today's Activity</p>
              </div>
            </div>
          </div>
        </div>

        {/* System Issues */}
        {systemData.systemIssues.length > 0 && (
          <div className="row g-4 mb-4">
            <div className="col-12">
              <div className="card">
                <div className="card-header">
                  <h6 className="mb-0">
                    <i className="fas fa-exclamation-triangle me-2"></i>
                    System Attention Required
                  </h6>
                </div>
                <div className="card-body">
                  <div className="row g-3">
                    {systemData.systemIssues.map((issue, index) => (
                      <div key={index} className="col-md-4">
                        <div className={`alert ${getSystemIssueClass(issue.type)} mb-0`}>
                          <div className="d-flex align-items-start">
                            <i className={`fas ${issue.icon} me-2 mt-1`}></i>
                            <div className="flex-grow-1">
                              <div className="fw-semibold">{issue.title}</div>
                              <div className="small mb-2">{issue.description}</div>
                              <Link to={issue.link} className="btn btn-sm btn-outline-dark">
                                {issue.action}
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

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
                    <Link to="/admin/register-staff" className="btn btn-outline-primary w-100">
                      <i className="fas fa-user-plus me-2"></i>
                      Register Staff
                    </Link>
                  </div>
                  <div className="col-md-3">
                    <Link to="/admin/manage-staff" className="btn btn-outline-info w-100">
                      <i className="fas fa-users-cog me-2"></i>
                      Manage Staff
                      {systemData.userStats.unverified > 0 && (
                        <span className="badge bg-warning text-dark ms-2">
                          {systemData.userStats.unverified}
                        </span>
                      )}
                    </Link>
                  </div>
                  <div className="col-md-3">
                    <Link to="/admin/clock-activities" className="btn btn-outline-success w-100">
                      <i className="fas fa-clock me-2"></i>
                      Clock Activities
                    </Link>
                  </div>
                  <div className="col-md-3">
                    <button className="btn btn-outline-secondary w-100" disabled>
                      <i className="fas fa-cog me-2"></i>
                      System Settings
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="row g-4">
          {/* Role Distribution */}
          <div className="col-lg-4">
            <div className="card">
              <div className="card-header">
                <h6 className="mb-0">
                  <i className="fas fa-user-tag me-2"></i>
                  Role Distribution
                </h6>
              </div>
              <div className="card-body">
                {Object.keys(systemData.roleStats).length === 0 ? (
                  <p className="text-muted text-center py-3">No role data available.</p>
                ) : (
                  <div>
                    {Object.entries(systemData.roleStats).map(([role, count]) => (
                      <div key={role} className="d-flex justify-content-between align-items-center py-2 border-bottom">
                        <div className="d-flex align-items-center">
                          <span className={`badge bg-${getRoleColor(role)} me-2`}>
                            {role.toUpperCase()}
                          </span>
                          <span className="text-capitalize">{role}</span>
                        </div>
                        <div className="d-flex align-items-center">
                          <span className="fw-semibold me-2">{count}</span>
                          <div 
                            className={`bg-${getRoleColor(role)} rounded`}
                            style={{
                              width: `${Math.max((count / systemData.userStats.total) * 50, 5)}px`,
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

          {/* Department Status */}
          <div className="col-lg-4">
            <div className="card">
              <div className="card-header">
                <h6 className="mb-0">
                  <i className="fas fa-building me-2"></i>
                  Department Status
                </h6>
              </div>
              <div className="card-body">
                {Object.keys(systemData.departmentStats).length === 0 ? (
                  <p className="text-muted text-center py-3">No department data available.</p>
                ) : (
                  <div>
                    {Object.entries(systemData.departmentStats).map(([dept, stats], index) => (
                      <div key={dept} className="py-2 border-bottom">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <div className="fw-semibold">{dept}</div>
                          <span className="badge bg-light text-dark">{stats.total} total</span>
                        </div>
                        <div className="d-flex justify-content-between small text-muted">
                          <span>{stats.active} active</span>
                          <span>{stats.managers} manager{stats.managers !== 1 ? 's' : ''}</span>
                          {stats.unverified > 0 && (
                            <span className="text-warning">{stats.unverified} unverified</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Recent System Activity */}
          <div className="col-lg-4">
            <div className="card">
              <div className="card-header">
                <h6 className="mb-0">
                  <i className="fas fa-history me-2"></i>
                  Recent Activity
                </h6>
              </div>
              <div className="card-body">
                {systemData.activityStats.recentActivities.length === 0 ? (
                  <p className="text-muted text-center py-3">No recent activities.</p>
                ) : (
                  <div>
                    {systemData.activityStats.recentActivities.map(activity => (
                      <div key={activity.id} className="d-flex align-items-center py-2 border-bottom">
                        <div className="me-3">
                          <i className={`fas ${activity.action === 'clock_in' ? 'fa-sign-in-alt text-success' : 'fa-sign-out-alt text-danger'}`}></i>
                        </div>
                        <div className="flex-grow-1">
                          <div className="small fw-semibold">{activity.staffName}</div>
                          <div className="text-muted" style={{fontSize: '0.75rem'}}>
                            {activity.action.replace('_', ' ').toUpperCase()} • {activity.location}
                          </div>
                        </div>
                        <div className="text-end">
                          <div className="small text-muted">
                            {new Date(activity.timestamp).toLocaleDateString()}
                          </div>
                          <div className="text-muted" style={{fontSize: '0.7rem'}}>
                            {new Date(activity.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="text-center mt-2">
                      <Link to="/admin/clock-activities" className="btn btn-sm btn-outline-primary">
                        View All Activities
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* System Statistics */}
        <div className="row g-4 mt-2">
          <div className="col-12">
            <div className="card">
              <div className="card-header">
                <h6 className="mb-0">
                  <i className="fas fa-chart-bar me-2"></i>
                  System Performance Metrics
                </h6>
              </div>
              <div className="card-body">
                <div className="row g-4">
                  <div className="col-md-3 text-center">
                    <div className="mb-2">
                      <i className="fas fa-user-check fa-2x text-success"></i>
                    </div>
                    <h5 className="text-success">
                      {Math.round((systemData.userStats.verified / systemData.userStats.total) * 100)}%
                    </h5>
                    <p className="small text-muted mb-0">Verification Rate</p>
                    <small className="text-muted">{systemData.userStats.verified}/{systemData.userStats.total} verified</small>
                  </div>
                  <div className="col-md-3 text-center">
                    <div className="mb-2">
                      <i className="fas fa-users fa-2x text-primary"></i>
                    </div>
                    <h5 className="text-primary">
                      {Math.round((systemData.userStats.active / systemData.userStats.total) * 100)}%
                    </h5>
                    <p className="small text-muted mb-0">Active Users</p>
                    <small className="text-muted">{systemData.userStats.active}/{systemData.userStats.total} active</small>
                  </div>
                  <div className="col-md-3 text-center">
                    <div className="mb-2">
                      <i className="fas fa-clock fa-2x text-info"></i>
                    </div>
                    <h5 className="text-info">
                      {Math.round((systemData.userStats.clockedIn / systemData.userStats.active) * 100)}%
                    </h5>
                    <p className="small text-muted mb-0">Current Engagement</p>
                    <small className="text-muted">{systemData.userStats.clockedIn}/{systemData.userStats.active} clocked in</small>
                  </div>
                  <div className="col-md-3 text-center">
                    <div className="mb-2">
                      <i className="fas fa-calendar-check fa-2x text-warning"></i>
                    </div>
                    <h5 className="text-warning">
                      {systemData.leaveStats.totalRequests > 0 ? Math.round((systemData.leaveStats.approvedRequests / systemData.leaveStats.totalRequests) * 100) : 0}%
                    </h5>
                    <p className="small text-muted mb-0">Leave Approval Rate</p>
                    <small className="text-muted">{systemData.leaveStats.approvedRequests}/{systemData.leaveStats.totalRequests} approved</small>
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