// src/pages/Admin/Dashboard.jsx - Updated for hierarchical structure

import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useMemo } from 'react'

export default function AdminDashboard(){
  const { allUsers, leaveRequests, clockActivities } = useAuth()
  
  // Enhanced admin statistics with hierarchical insights
  const adminStats = useMemo(() => {
    const activeUsers = Object.values(allUsers).filter(user => user.role !== 'admin' && user.isActive)
    const totalStaff = activeUsers.length
    const currentlyActive = activeUsers.filter(user => user.isClockedIn).length
    const unverifiedStaff = activeUsers.filter(user => !user.verified).length
    
    // Hierarchical analysis
    const ceoCount = activeUsers.filter(user => user.role === 'ceo').length
    const executiveCount = activeUsers.filter(user => user.manager && allUsers[user.manager]?.role === 'ceo').length
    const managerCount = activeUsers.filter(user => user.isManager && user.role === 'staff').length
    const regularStaffCount = activeUsers.filter(user => !user.isManager && user.role === 'staff').length
    
    // Department breakdown
    const departments = [...new Set(activeUsers.map(user => user.department).filter(Boolean))]
    const departmentStats = departments.map(dept => {
      const deptUsers = activeUsers.filter(user => user.department === dept)
      return {
        name: dept,
        total: deptUsers.length,
        active: deptUsers.filter(user => user.isClockedIn).length,
        managers: deptUsers.filter(user => user.isManager).length,
        unverified: deptUsers.filter(user => !user.verified).length
      }
    })
    
    // Security users
    const securityUsers = Object.values(allUsers).filter(user => user.role === 'security' && user.isActive)
    
    // Leave request statistics
    const pendingRequests = leaveRequests.filter(req => req.status === 'pending').length
    const todayActivities = clockActivities.filter(activity => 
      new Date(activity.timestamp).toDateString() === new Date().toDateString()
    ).length
    
    // System health indicators
    const verificationRate = totalStaff > 0 ? Math.round(((totalStaff - unverifiedStaff) / totalStaff) * 100) : 100
    const attendanceRate = totalStaff > 0 ? Math.round((currentlyActive / totalStaff) * 100) : 0
    
    return {
      totalStaff,
      currentlyActive,
      unverifiedStaff,
      hierarchy: {
        ceo: ceoCount,
        executives: executiveCount,
        managers: managerCount,
        regularStaff: regularStaffCount
      },
      departments: departmentStats,
      security: securityUsers.length,
      pendingRequests,
      todayActivities,
      systemHealth: {
        verificationRate,
        attendanceRate
      }
    }
  }, [allUsers, leaveRequests, clockActivities])

  // Recent system activities
  const recentActivities = useMemo(() => {
    const activities = []
    
    // Recent user registrations
    const recentUsers = Object.entries(allUsers)
      .filter(([email, user]) => user.createdAt && new Date(user.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
      .map(([email, user]) => ({
        type: 'user_registered',
        description: `New user registered: ${user.firstName} ${user.lastName}`,
        timestamp: user.createdAt,
        user: email
      }))
    
    // Recent leave requests
    const recentLeaves = leaveRequests
      .filter(req => new Date(req.requestDate) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
      .map(req => ({
        type: 'leave_request',
        description: `Leave request ${req.status}: ${req.staffName}`,
        timestamp: req.requestDate,
        user: req.staffId
      }))
    
    activities.push(...recentUsers, ...recentLeaves)
    return activities
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 10)
  }, [allUsers, leaveRequests])

  return (
    <div>
      <div className="page-header">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h2 className="page-title">Admin Dashboard</h2>
            <p className="mb-0">System administration and user management</p>
          </div>
          <div className="d-flex gap-2">
            <span className={`badge ${adminStats.systemHealth.verificationRate >= 95 ? 'bg-success' : 'bg-warning text-dark'}`}>
              System Health: {adminStats.systemHealth.verificationRate}%
            </span>
            <span className="badge bg-info">
              {adminStats.todayActivities} Activities Today
            </span>
          </div>
        </div>
      </div>
      
      <div className="page-content">
        {/* Key Metrics */}
        <div className="row g-4 mb-4">
          <div className="col-md-3">
            <div className="card text-center border-primary">
              <div className="card-body">
                <h3 className="text-primary">{adminStats.totalStaff}</h3>
                <p className="mb-0">Total Staff</p>
                <small className="text-muted">+{adminStats.security} Security</small>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card text-center border-success">
              <div className="card-body">
                <h3 className="text-success">{adminStats.currentlyActive}</h3>
                <p className="mb-0">Currently Active</p>
                <small className="text-muted">{adminStats.systemHealth.attendanceRate}% attendance</small>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card text-center border-warning">
              <div className="card-body">
                <h3 className="text-warning">{adminStats.unverifiedStaff}</h3>
                <p className="mb-0">Unverified Staff</p>
                <small className="text-muted">Need activation</small>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card text-center border-info">
              <div className="card-body">
                <h3 className="text-info">{adminStats.pendingRequests}</h3>
                <p className="mb-0">Pending Requests</p>
                <small className="text-muted">Manager review needed</small>
              </div>
            </div>
          </div>
        </div>

        {/* Organizational Hierarchy Overview */}
        <div className="row g-3 mb-4">
          <div className="col-md-6">
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">
                  <i className="fas fa-sitemap me-2"></i>
                  Organizational Hierarchy
                </h5>
              </div>
              <div className="card-body">
                <div className="row g-3 text-center">
                  <div className="col-6">
                    <div className="card border-success">
                      <div className="card-body py-2">
                        <h4 className="text-success mb-1">{adminStats.hierarchy.ceo}</h4>
                        <small className="text-muted">CEO</small>
                      </div>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="card border-primary">
                      <div className="card-body py-2">
                        <h4 className="text-primary mb-1">{adminStats.hierarchy.executives}</h4>
                        <small className="text-muted">C-Level</small>
                      </div>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="card border-info">
                      <div className="card-body py-2">
                        <h4 className="text-info mb-1">{adminStats.hierarchy.managers}</h4>
                        <small className="text-muted">Managers</small>
                      </div>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="card border-secondary">
                      <div className="card-body py-2">
                        <h4 className="text-secondary mb-1">{adminStats.hierarchy.regularStaff}</h4>
                        <small className="text-muted">Staff</small>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-3">
                  <small className="text-muted">
                    <i className="fas fa-info-circle me-1"></i>
                    Hierarchy structure enables proper leave approval workflows
                  </small>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-6">
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">
                  <i className="fas fa-building me-2"></i>
                  Department Breakdown
                </h5>
              </div>
              <div className="card-body">
                {adminStats.departments.length === 0 ? (
                  <p className="text-muted">No departments configured.</p>
                ) : (
                  <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    {adminStats.departments.map(dept => (
                      <div key={dept.name} className="d-flex justify-content-between align-items-center py-2 border-bottom">
                        <div>
                          <strong>{dept.name}</strong>
                          <div className="text-muted small">
                            {dept.managers} manager{dept.managers !== 1 ? 's' : ''}
                          </div>
                        </div>
                        <div className="text-end">
                          <div className="fw-semibold">{dept.total}</div>
                          <div className="d-flex gap-1">
                            <span className="badge bg-success">{dept.active}</span>
                            {dept.unverified > 0 && (
                              <span className="badge bg-warning text-dark">{dept.unverified}</span>
                            )}
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

        {/* Quick Actions */}
        <div className="row g-3 mb-4">
          <div className="col-md-6">
            <div className="card h-100">
              <div className="card-header">
                <h5 className="mb-0">
                  <i className="fas fa-user-plus me-2"></i>
                  User Management
                </h5>
              </div>
              <div className="card-body">
                <p className="card-text">Register new employees and manage existing staff accounts.</p>
                <div className="d-grid gap-2">
                  <Link to="/admin/register-staff" className="btn btn-warning">
                    <i className="fas fa-user-plus me-2"></i>
                    Register New Staff
                  </Link>
                  <Link to="/admin/manage-staff" className="btn btn-outline-primary">
                    <i className="fas fa-users-cog me-2"></i>
                    Manage Existing Staff
                  </Link>
                </div>
                {adminStats.unverifiedStaff > 0 && (
                  <div className="alert alert-warning mt-3 mb-0">
                    <i className="fas fa-exclamation-triangle me-1"></i>
                    <strong>{adminStats.unverifiedStaff}</strong> unverified accounts need attention
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="col-md-6">
            <div className="card h-100">
              <div className="card-header">
                <h5 className="mb-0">
                  <i className="fas fa-clock me-2"></i>
                  Activity Monitoring
                </h5>
              </div>
              <div className="card-body">
                <p className="card-text">Monitor staff clock activities and generate reports.</p>
                <div className="d-grid gap-2">
                  <Link to="/admin/clock-activities" className="btn btn-warning">
                    <i className="fas fa-chart-line me-2"></i>
                    View Clock Activities
                  </Link>
                  <button className="btn btn-outline-secondary" disabled>
                    <i className="fas fa-download me-2"></i>
                    Generate Reports
                    <small className="d-block">Coming Soon</small>
                  </button>
                </div>
                <div className="mt-3">
                  <small className="text-muted">
                    <i className="fas fa-info-circle me-1"></i>
                    {adminStats.todayActivities} activities recorded today
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent System Activity */}
        <div className="row g-3">
          <div className="col-md-8">
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">
                  <i className="fas fa-history me-2"></i>
                  Recent System Activity
                </h5>
              </div>
              <div className="card-body">
                {recentActivities.length === 0 ? (
                  <p className="text-muted text-center py-3">No recent system activity.</p>
                ) : (
                  <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {recentActivities.map((activity, index) => (
                      <div key={index} className="d-flex justify-content-between align-items-center py-2 border-bottom">
                        <div>
                          <div className="fw-semibold">{activity.description}</div>
                          <small className="text-muted">
                            {new Date(activity.timestamp).toLocaleString()}
                          </small>
                        </div>
                        <span className={`badge ${
                          activity.type === 'user_registered' ? 'bg-info' :
                          activity.type === 'leave_request' ? 'bg-warning text-dark' : 'bg-secondary'
                        }`}>
                          {activity.type.replace('_', ' ')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="col-md-4">
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">
                  <i className="fas fa-shield-alt me-2"></i>
                  Security Overview
                </h5>
              </div>
              <div className="card-body">
                <div className="row g-3 text-center">
                  <div className="col-12">
                    <div className="fw-semibold text-info">{adminStats.security}</div>
                    <small className="text-muted">Security Guards</small>
                  </div>
                  <div className="col-6">
                    <div className="fw-semibold text-success">{adminStats.systemHealth.verificationRate}%</div>
                    <small className="text-muted">Verified</small>
                  </div>
                  <div className="col-6">
                    <div className="fw-semibold text-primary">{adminStats.systemHealth.attendanceRate}%</div>
                    <small className="text-muted">Attendance</small>
                  </div>
                </div>
                
                <div className="mt-3">
                  <div className="d-grid">
                    <button className="btn btn-outline-info btn-sm" disabled>
                      <i className="fas fa-cog me-1"></i>
                      Security Settings
                    </button>
                  </div>
                  <small className="text-muted mt-2 d-block text-center">Coming Soon</small>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* System Alerts */}
        {(adminStats.unverifiedStaff > 0 || adminStats.pendingRequests > 10) && (
          <div className="row g-3 mt-3">
            <div className="col-12">
              <div className="card border-warning">
                <div className="card-header bg-warning text-dark">
                  <h6 className="mb-0">
                    <i className="fas fa-exclamation-triangle me-2"></i>
                    System Alerts
                  </h6>
                </div>
                <div className="card-body">
                  <div className="row g-3">
                    {adminStats.unverifiedStaff > 0 && (
                      <div className="col-md-6">
                        <div className="alert alert-warning mb-0">
                          <strong>{adminStats.unverifiedStaff}</strong> unverified user accounts
                          <div className="mt-2">
                            <Link to="/admin/manage-staff" className="btn btn-sm btn-warning">
                              Review Accounts
                            </Link>
                          </div>
                        </div>
                      </div>
                    )}
                    {adminStats.pendingRequests > 10 && (
                      <div className="col-md-6">
                        <div className="alert alert-info mb-0">
                          <strong>{adminStats.pendingRequests}</strong> pending leave requests
                          <div className="mt-2">
                            <small className="text-muted">Managers need to process these requests</small>
                          </div>
                        </div>
                      </div>
                    )}
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