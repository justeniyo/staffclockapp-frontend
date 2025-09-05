// src/pages/CEO/Dashboard.jsx - Updated for executive insights

import { useMemo } from 'react'
import { useAuth } from '../../context/AuthContext'
import { getFullName, getDirectReports } from '../../config/seedUsers'

export default function CEODashboard(){
  const { allUsers, leaveRequests, clockActivities, user } = useAuth()
  
  // Executive-level statistics and insights
  const executiveInsights = useMemo(() => {
    const activeUsers = Object.values(allUsers).filter(user => user.isActive && user.role !== 'security')
    const totalStaff = activeUsers.length
    const currentlyActive = activeUsers.filter(user => user.isClockedIn).length
    
    // C-Level executives (direct reports to CEO)
    const cLevelExecutives = getDirectReports(user.email)
    
    // Department breakdown
    const departments = [...new Set(activeUsers.map(user => user.department).filter(Boolean))]
    const departmentStats = departments.map(dept => {
      const deptUsers = activeUsers.filter(user => user.department === dept)
      const deptActive = deptUsers.filter(user => user.isClockedIn).length
      const deptManagers = deptUsers.filter(user => user.isManager).length
      
      // Get C-level executive for this department
      const cLevelExec = cLevelExecutives.find(exec => exec.department === dept)
      
      return {
        name: dept,
        totalStaff: deptUsers.length,
        activeStaff: deptActive,
        managers: deptManagers,
        activePercentage: deptUsers.length > 0 ? Math.round((deptActive / deptUsers.length) * 100) : 0,
        executive: cLevelExec ? getFullName(cLevelExec) : 'No Executive'
      }
    })

    // Leave request analytics
    const pendingLeaves = leaveRequests.filter(req => req.status === 'pending')
    const approvedLeaves = leaveRequests.filter(req => req.status === 'approved')
    const rejectedLeaves = leaveRequests.filter(req => req.status === 'rejected')
    
    // High-priority pending leaves (C-level and urgent requests)
    const highPriorityLeaves = pendingLeaves.filter(req => {
      const requestingUser = allUsers[req.staffId]
      const isExecutive = requestingUser && requestingUser.manager === user.email
      const isUrgent = new Date(req.startDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      return isExecutive || isUrgent
    })

    // Activity analytics
    const todayActivities = clockActivities.filter(activity => 
      new Date(activity.timestamp).toDateString() === new Date().toDateString()
    )
    
    const thisWeekActivities = clockActivities.filter(activity => {
      const activityDate = new Date(activity.timestamp)
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      return activityDate >= weekAgo
    })

    return {
      totalStaff,
      currentlyActive,
      cLevelExecutives,
      departments: departmentStats,
      leaves: {
        pending: pendingLeaves.length,
        approved: approvedLeaves.length,
        rejected: rejectedLeaves.length,
        highPriority: highPriorityLeaves.length,
        highPriorityRequests: highPriorityLeaves
      },
      activities: {
        today: todayActivities.length,
        thisWeek: thisWeekActivities.length,
        todayClockIns: todayActivities.filter(a => a.action === 'clock_in').length,
        todayClockOuts: todayActivities.filter(a => a.action === 'clock_out').length
      }
    }
  }, [allUsers, leaveRequests, clockActivities, user])

  // Calculate organizational health metrics
  const healthMetrics = useMemo(() => {
    const attendanceRate = executiveInsights.totalStaff > 0 
      ? Math.round((executiveInsights.currentlyActive / executiveInsights.totalStaff) * 100)
      : 0
    
    const leaveApprovalRate = (executiveInsights.leaves.approved + executiveInsights.leaves.rejected) > 0
      ? Math.round((executiveInsights.leaves.approved / (executiveInsights.leaves.approved + executiveInsights.leaves.rejected)) * 100)
      : 0
    
    // Calculate average team size per department
    const avgTeamSize = executiveInsights.departments.length > 0
      ? Math.round(executiveInsights.totalStaff / executiveInsights.departments.length)
      : 0

    return {
      attendanceRate,
      leaveApprovalRate,
      avgTeamSize,
      managementRatio: Math.round((executiveInsights.departments.reduce((sum, dept) => sum + dept.managers, 0) / executiveInsights.totalStaff) * 100)
    }
  }, [executiveInsights])

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Executive Dashboard</h2>
        <p className="mb-0">
          Organization overview and strategic insights
          <span className="text-muted ms-2">
            • {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </span>
        </p>
      </div>
      
      <div className="page-content">
        {/* High-Level KPIs */}
        <div className="row g-4 mb-4">
          <div className="col-md-2">
            <div className="card text-center border-primary">
              <div className="card-body">
                <h3 className="text-primary">{executiveInsights.totalStaff}</h3>
                <p className="mb-0 small">Total Staff</p>
              </div>
            </div>
          </div>
          <div className="col-md-2">
            <div className="card text-center border-success">
              <div className="card-body">
                <h3 className="text-success">{executiveInsights.currentlyActive}</h3>
                <p className="mb-0 small">Active Now</p>
                <small className="text-muted">{healthMetrics.attendanceRate}%</small>
              </div>
            </div>
          </div>
          <div className="col-md-2">
            <div className="card text-center border-info">
              <div className="card-body">
                <h3 className="text-info">{executiveInsights.departments.length}</h3>
                <p className="mb-0 small">Departments</p>
                <small className="text-muted">{executiveInsights.cLevelExecutives.length} Executives</small>
              </div>
            </div>
          </div>
          <div className="col-md-2">
            <div className="card text-center border-warning">
              <div className="card-body">
                <h3 className="text-warning">{executiveInsights.leaves.highPriority}</h3>
                <p className="mb-0 small">Priority Leaves</p>
                <small className="text-muted">Require Attention</small>
              </div>
            </div>
          </div>
          <div className="col-md-2">
            <div className="card text-center border-secondary">
              <div className="card-body">
                <h3 className="text-secondary">{executiveInsights.activities.today}</h3>
                <p className="mb-0 small">Today's Activity</p>
                <small className="text-muted">{executiveInsights.activities.todayClockIns}↗ {executiveInsights.activities.todayClockOuts}↘</small>
              </div>
            </div>
          </div>
          <div className="col-md-2">
            <div className="card text-center border-dark">
              <div className="card-body">
                <h3 className="text-dark">{healthMetrics.leaveApprovalRate}%</h3>
                <p className="mb-0 small">Approval Rate</p>
                <small className="text-muted">Leave Requests</small>
              </div>
            </div>
          </div>
        </div>

        {/* C-Level Executive Overview */}
        <div className="row g-3 mb-4">
          <div className="col-12">
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">
                  <i className="fas fa-users-cog me-2"></i>
                  C-Level Executive Team
                </h5>
              </div>
              <div className="card-body">
                {executiveInsights.cLevelExecutives.length === 0 ? (
                  <p className="text-muted">No direct reports assigned.</p>
                ) : (
                  <div className="row g-3">
                    {executiveInsights.cLevelExecutives.map(executive => {
                      const executivePendingLeaves = executiveInsights.leaves.highPriorityRequests
                        .filter(req => req.staffId === executive.email)
                      const directReports = getDirectReports(executive.email)
                      
                      return (
                        <div key={executive.email} className="col-md-6 col-lg-4">
                          <div className="card border">
                            <div className="card-body">
                              <div className="d-flex justify-content-between align-items-start mb-2">
                                <div>
                                  <h6 className="fw-bold mb-1">{getFullName(executive)}</h6>
                                  <p className="text-muted small mb-1">{executive.jobTitle}</p>
                                  <p className="text-muted small mb-0">{executive.department}</p>
                                </div>
                                <span className={`badge ${executive.isClockedIn ? 'bg-success' : 'bg-secondary'}`}>
                                  {executive.isClockedIn ? 'Active' : 'Offline'}
                                </span>
                              </div>
                              <div className="row g-2 text-center">
                                <div className="col-6">
                                  <div className="small text-muted">Team Size</div>
                                  <div className="fw-semibold">{directReports.length}</div>
                                </div>
                                <div className="col-6">
                                  <div className="small text-muted">Pending Leaves</div>
                                  <div className={`fw-semibold ${executivePendingLeaves.length > 0 ? 'text-warning' : 'text-success'}`}>
                                    {executivePendingLeaves.length}
                                  </div>
                                </div>
                              </div>
                              {executivePendingLeaves.length > 0 && (
                                <div className="mt-2">
                                  <small className="text-warning">
                                    <i className="fas fa-exclamation-triangle me-1"></i>
                                    Has pending leave request
                                  </small>
                                </div>
                              )}
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
        
        <div className="row g-3">
          {/* Department Performance */}
          <div className="col-md-6">
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">
                  <i className="fas fa-building me-2"></i>
                  Department Performance
                </h5>
              </div>
              <div className="card-body">
                {executiveInsights.departments.length === 0 ? (
                  <p className="text-muted">No department data available.</p>
                ) : (
                  <div>
                    {executiveInsights.departments.map(dept => (
                      <div key={dept.name} className="border rounded p-3 mb-3">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <div>
                            <h6 className="fw-bold mb-1">{dept.name}</h6>
                            <small className="text-muted">Led by {dept.executive}</small>
                          </div>
                          <span className={`badge ${
                            dept.activePercentage >= 80 ? 'bg-success' :
                            dept.activePercentage >= 60 ? 'bg-warning text-dark' : 'bg-danger'
                          }`}>
                            {dept.activePercentage}% Active
                          </span>
                        </div>
                        <div className="row g-2 text-center">
                          <div className="col-4">
                            <div className="small text-muted">Total Staff</div>
                            <div className="fw-semibold text-primary">{dept.totalStaff}</div>
                          </div>
                          <div className="col-4">
                            <div className="small text-muted">Active Now</div>
                            <div className="fw-semibold text-success">{dept.activeStaff}</div>
                          </div>
                          <div className="col-4">
                            <div className="small text-muted">Managers</div>
                            <div className="fw-semibold text-info">{dept.managers}</div>
                          </div>
                        </div>
                        <div className="progress mt-2" style={{ height: '6px' }}>
                          <div 
                            className={`progress-bar ${
                              dept.activePercentage >= 80 ? 'bg-success' :
                              dept.activePercentage >= 60 ? 'bg-warning' : 'bg-danger'
                            }`}
                            style={{width: `${dept.activePercentage}%`}}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Leave Requests & Organizational Health */}
          <div className="col-md-6">
            <div className="card mb-3">
              <div className="card-header">
                <h5 className="mb-0">
                  <i className="fas fa-calendar-check me-2"></i>
                  Leave Management Overview
                </h5>
              </div>
              <div className="card-body">
                <div className="row g-3 text-center mb-3">
                  <div className="col-4">
                    <div className="fw-semibold text-warning">{executiveInsights.leaves.pending}</div>
                    <small className="text-muted">Pending</small>
                  </div>
                  <div className="col-4">
                    <div className="fw-semibold text-success">{executiveInsights.leaves.approved}</div>
                    <small className="text-muted">Approved</small>
                  </div>
                  <div className="col-4">
                    <div className="fw-semibold text-danger">{executiveInsights.leaves.rejected}</div>
                    <small className="text-muted">Rejected</small>
                  </div>
                </div>
                
                {executiveInsights.leaves.highPriorityRequests.length > 0 && (
                  <div>
                    <h6 className="text-warning mb-2">
                      <i className="fas fa-exclamation-triangle me-1"></i>
                      High Priority Requests
                    </h6>
                    {executiveInsights.leaves.highPriorityRequests.slice(0, 3).map(req => {
                      const isExecutive = allUsers[req.staffId]?.manager === user.email
                      
                      return (
                        <div key={req.id} className="d-flex justify-content-between align-items-center py-2 border-bottom">
                          <div>
                            <div className="fw-semibold">
                              {req.staffName}
                              {isExecutive && (
                                <span className="badge bg-primary ms-1">Executive</span>
                              )}
                            </div>
                            <small className="text-muted">
                              {req.type} - {req.startDate} to {req.endDate}
                            </small>
                          </div>
                          <span className="badge bg-warning text-dark">
                            {isExecutive ? 'Your Approval' : 'Urgent'}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Organizational Health Metrics */}
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">
                  <i className="fas fa-chart-line me-2"></i>
                  Organizational Health
                </h5>
              </div>
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-6">
                    <div className="text-center">
                      <div className="h4 mb-1 text-success">{healthMetrics.attendanceRate}%</div>
                      <small className="text-muted">Attendance Rate</small>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="text-center">
                      <div className="h4 mb-1 text-info">{healthMetrics.avgTeamSize}</div>
                      <small className="text-muted">Avg Team Size</small>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="text-center">
                      <div className="h4 mb-1 text-primary">{healthMetrics.leaveApprovalRate}%</div>
                      <small className="text-muted">Leave Approval</small>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="text-center">
                      <div className="h4 mb-1 text-warning">{healthMetrics.managementRatio}%</div>
                      <small className="text-muted">Management Ratio</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions for CEO */}
        <div className="row g-3 mt-3">
          <div className="col-12">
            <div className="card">
              <div className="card-header header-light">
                <h5 className="mb-0">
                  <i className="fas fa-rocket me-2"></i>
                  Executive Actions
                </h5>
              </div>
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-md-3">
                    <div className="d-grid">
                      <button className="btn btn-outline-primary" disabled>
                        <i className="fas fa-chart-bar me-2"></i>
                        Generate Report
                      </button>
                      <small className="text-muted mt-1">Coming Soon</small>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="d-grid">
                      <button className="btn btn-outline-success" disabled>
                        <i className="fas fa-users me-2"></i>
                        Team Analytics
                      </button>
                      <small className="text-muted mt-1">Coming Soon</small>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="d-grid">
                      <button className="btn btn-outline-warning" disabled>
                        <i className="fas fa-calendar-alt me-2"></i>
                        Bulk Approvals
                      </button>
                      <small className="text-muted mt-1">Coming Soon</small>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="d-grid">
                      <button className="btn btn-outline-info" disabled>
                        <i className="fas fa-cog me-2"></i>
                        System Settings
                      </button>
                      <small className="text-muted mt-1">Coming Soon</small>
                    </div>
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