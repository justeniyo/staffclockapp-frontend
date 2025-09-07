import { useState, useMemo } from 'react'
import { useAuth } from '../../context/AuthContext'

export default function SecurityDashboard(){
  const { allUsers, clockActivities, user, locations, departments } = useAuth()
  const [dateFilter, setDateFilter] = useState('today')
  const [activityFilter, setActivityFilter] = useState('all')

  // SECURITY RESTRICTION: Get only the security guard's assigned site
  const assignedLocationId = user?.assignedLocationId || 'loc_001'
  const assignedLocation = locations[assignedLocationId]
  
  // Enhanced activity filtering with additional security-relevant filters
  const restrictedActivities = useMemo(() => {
    // Filter to ONLY show activities at the security guard's assigned location
    let filtered = clockActivities.filter(activity => 
      activity.locationId === assignedLocationId
    )
    
    // Filter by date
    const now = new Date()
    const today = now.toDateString()
    
    switch (dateFilter) {
      case 'today':
        filtered = filtered.filter(activity => 
          new Date(activity.timestamp).toDateString() === today
        )
        break
      case 'yesterday':
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        filtered = filtered.filter(activity => 
          new Date(activity.timestamp).toDateString() === yesterday.toDateString()
        )
        break
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        filtered = filtered.filter(activity => 
          new Date(activity.timestamp) >= weekAgo
        )
        break
      case 'shift':
        // Current shift (last 8 hours)
        const shiftStart = new Date(now.getTime() - 8 * 60 * 60 * 1000)
        filtered = filtered.filter(activity => 
          new Date(activity.timestamp) >= shiftStart
        )
        break
      default:
        break
    }

    // Filter by activity type
    if (activityFilter !== 'all') {
      filtered = filtered.filter(activity => activity.action === activityFilter)
    }
    
    return filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
  }, [clockActivities, assignedLocationId, dateFilter, activityFilter])
  
  // Enhanced security statistics with additional insights
  const securityStats = useMemo(() => {
    const now = new Date()
    const today = now.toDateString()
    
    const todayActivities = clockActivities.filter(activity => 
      new Date(activity.timestamp).toDateString() === today &&
      activity.locationId === assignedLocationId
    )
    
    // Get all users assigned to this location
    const siteUsers = Object.values(allUsers).filter(user => 
      user.role === 'staff' && 
      user.isActive && 
      (user.assignedLocationId === assignedLocationId || 
       user.allowedLocationIds?.includes(assignedLocationId))
    )
    
    // Currently active users at this site
    const activeUsers = siteUsers.filter(user => 
      user.isClockedIn &&
      user.currentLocationIds?.includes(assignedLocationId)
    )
    
    // Users with access but not currently on site
    const authorizedButOffsite = siteUsers.filter(user => 
      !user.isClockedIn || !user.currentLocationIds?.includes(assignedLocationId)
    )

    // Department breakdown of current occupants
    const departmentOccupancy = activeUsers.reduce((acc, user) => {
      const deptId = user.departmentId
      const dept = departments[deptId] || { name: user.department || 'Unknown' }
      acc[dept.name] = (acc[dept.name] || 0) + 1
      return acc
    }, {})

    // Security events (unusual patterns)
    const securityEvents = []
    
    // Check for after-hours activity
    const afterHours = todayActivities.filter(activity => {
      const hour = new Date(activity.timestamp).getHours()
      return hour < 6 || hour > 22 // Outside 6 AM - 10 PM
    })
    
    if (afterHours.length > 0) {
      securityEvents.push({
        type: 'after_hours',
        count: afterHours.length,
        severity: 'medium',
        description: `${afterHours.length} after-hours activities detected`
      })
    }

    // Check for rapid check in/out patterns
    const rapidPatterns = []
    for (let i = 0; i < todayActivities.length - 1; i++) {
      const current = todayActivities[i]
      const next = todayActivities[i + 1]
      if (current.staffId === next.staffId) {
        const timeDiff = Math.abs(new Date(current.timestamp) - new Date(next.timestamp))
        if (timeDiff < 5 * 60 * 1000) { // Less than 5 minutes
          rapidPatterns.push({ current, next, timeDiff })
        }
      }
    }

    if (rapidPatterns.length > 0) {
      securityEvents.push({
        type: 'rapid_pattern',
        count: rapidPatterns.length,
        severity: 'low',
        description: `${rapidPatterns.length} rapid check-in/out patterns`
      })
    }
    
    return {
      totalAuthorized: siteUsers.length,
      currentOccupancy: activeUsers.length,
      authorizedOffsite: authorizedButOffsite.length,
      todayActivities: todayActivities.length,
      todayClockIns: todayActivities.filter(a => a.action === 'clock_in').length,
      todayClockOuts: todayActivities.filter(a => a.action === 'clock_out').length,
      departmentOccupancy,
      securityEvents,
      recentActivities: restrictedActivities.slice(0, 10),
      activeUsers,
      afterHoursActivities: afterHours.length
    }
  }, [allUsers, clockActivities, assignedLocationId, restrictedActivities, departments])
  
  const getActionColor = (action) => {
    return action === 'clock_in' ? 'text-success' : 'text-danger'
  }
  
  const getActionIcon = (action) => {
    return action === 'clock_in' ? 'fa-sign-in-alt' : 'fa-sign-out-alt'
  }
  
  const getLocationIcon = (location) => {
    const icons = {
      'Main Office': 'fa-building',
      'Remote': 'fa-home',
      'Warehouse': 'fa-warehouse',
      'Branch Office': 'fa-building'
    }
    return icons[location] || 'fa-map-marker-alt'
  }
  
  const getTimeCategory = (timestamp) => {
    const activityTime = new Date(timestamp)
    const now = new Date()
    const diffMinutes = (now - activityTime) / (1000 * 60)
    
    if (diffMinutes < 5) return { text: 'Just now', color: 'text-success' }
    if (diffMinutes < 60) return { text: `${Math.floor(diffMinutes)}m ago`, color: 'text-info' }
    if (diffMinutes < 1440) return { text: `${Math.floor(diffMinutes / 60)}h ago`, color: 'text-warning' }
    return { text: activityTime.toLocaleDateString(), color: 'text-muted' }
  }

  const getSecurityEventColor = (severity) => {
    const colors = {
      low: 'text-info',
      medium: 'text-warning', 
      high: 'text-danger'
    }
    return colors[severity] || 'text-secondary'
  }

  const getSecurityEventIcon = (type) => {
    const icons = {
      after_hours: 'fa-moon',
      rapid_pattern: 'fa-tachometer-alt',
      unauthorized: 'fa-exclamation-triangle'
    }
    return icons[type] || 'fa-shield-alt'
  }

  const getOccupancyLevel = () => {
    const ratio = securityStats.currentOccupancy / securityStats.totalAuthorized
    if (ratio > 0.7) return { level: 'High', color: 'text-warning' }
    if (ratio > 0.4) return { level: 'Medium', color: 'text-info' }
    return { level: 'Low', color: 'text-success' }
  }

  const occupancyLevel = getOccupancyLevel()

  return (
    <div>
      <div className="page-header">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h2 className="page-title">Enhanced Security Dashboard</h2>
            <p className="mb-0">Advanced site monitoring and access control</p>
            {assignedLocation && (
              <div className="mt-1">
                <span className="badge bg-warning text-dark me-2">
                  <i className="fas fa-shield-alt me-1"></i>
                  Security Officer
                </span>
                <span className="badge bg-info me-2">
                  <i className="fas fa-map-marker-alt me-1"></i>
                  Monitoring: <strong>{assignedLocation.name}</strong>
                </span>
                <span className={`badge bg-light text-dark`}>
                  <i className="fas fa-users me-1"></i>
                  Occupancy: {securityStats.currentOccupancy}/{securityStats.totalAuthorized} 
                  <span className={`ms-1 ${occupancyLevel.color}`}>({occupancyLevel.level})</span>
                </span>
              </div>
            )}
          </div>
          <div className="d-flex gap-2">
            <select 
              className="form-select form-select-sm"
              value={activityFilter}
              onChange={(e) => setActivityFilter(e.target.value)}
              style={{width: 'auto'}}
            >
              <option value="all">All Activities</option>
              <option value="clock_in">Clock Ins Only</option>
              <option value="clock_out">Clock Outs Only</option>
            </select>
            <select 
              className="form-select form-select-sm"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              style={{width: 'auto'}}
            >
              <option value="today">Today</option>
              <option value="shift">Current Shift (8h)</option>
              <option value="yesterday">Yesterday</option>
              <option value="week">This Week</option>
              <option value="all">All Time</option>
            </select>
          </div>
        </div>
      </div>
      
      <div className="page-content">
        {/* Enhanced Statistics Cards */}
        <div className="row g-4 mb-4">
          <div className="col-md-2">
            <div className="card text-center">
              <div className="card-body">
                <i className="fas fa-users fa-2x text-primary mb-2"></i>
                <h3 className="text-primary">{securityStats.totalAuthorized}</h3>
                <p className="mb-0 small">Authorized Personnel</p>
              </div>
            </div>
          </div>
          <div className="col-md-2">
            <div className="card text-center">
              <div className="card-body">
                <i className="fas fa-user-check fa-2x text-success mb-2"></i>
                <h3 className="text-success">{securityStats.currentOccupancy}</h3>
                <p className="mb-0 small">Currently On Site</p>
              </div>
            </div>
          </div>
          <div className="col-md-2">
            <div className="card text-center">
              <div className="card-body">
                <i className="fas fa-sign-in-alt fa-2x text-info mb-2"></i>
                <h3 className="text-info">{securityStats.todayClockIns}</h3>
                <p className="mb-0 small">Check-ins Today</p>
              </div>
            </div>
          </div>
          <div className="col-md-2">
            <div className="card text-center">
              <div className="card-body">
                <i className="fas fa-sign-out-alt fa-2x text-warning mb-2"></i>
                <h3 className="text-warning">{securityStats.todayClockOuts}</h3>
                <p className="mb-0 small">Check-outs Today</p>
              </div>
            </div>
          </div>
          <div className="col-md-2">
            <div className="card text-center">
              <div className="card-body">
                <i className="fas fa-moon fa-2x text-secondary mb-2"></i>
                <h3 className="text-secondary">{securityStats.afterHoursActivities}</h3>
                <p className="mb-0 small">After Hours</p>
              </div>
            </div>
          </div>
          <div className="col-md-2">
            <div className="card text-center">
              <div className="card-body">
                <i className="fas fa-shield-alt fa-2x text-danger mb-2"></i>
                <h3 className="text-danger">{securityStats.securityEvents.length}</h3>
                <p className="mb-0 small">Security Events</p>
              </div>
            </div>
          </div>
        </div>

        {/* Security Events Alert */}
        {securityStats.securityEvents.length > 0 && (
          <div className="row g-4 mb-4">
            <div className="col-12">
              <div className="alert alert-warning">
                <div className="d-flex align-items-center">
                  <i className="fas fa-exclamation-triangle fa-2x me-3"></i>
                  <div className="flex-grow-1">
                    <h6 className="mb-1">Security Events Detected</h6>
                    <div className="d-flex flex-wrap gap-3">
                      {securityStats.securityEvents.map((event, index) => (
                        <div key={index} className="d-flex align-items-center">
                          <i className={`fas ${getSecurityEventIcon(event.type)} ${getSecurityEventColor(event.severity)} me-2`}></i>
                          <span className="small">{event.description}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="row g-4">
          {/* Enhanced Activity Monitoring */}
          <div className="col-lg-8">
            <div className="card">
              <div className="card-header">
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">
                    <i className="fas fa-clock me-2"></i>
                    Site Access Activities
                  </h5>
                  <div className="d-flex gap-2">
                    <span className="badge bg-info">
                      {restrictedActivities.length} activities
                    </span>
                    <span className="badge bg-secondary">
                      {dateFilter === 'today' ? 'Today' : 
                       dateFilter === 'shift' ? 'Current Shift' :
                       dateFilter === 'yesterday' ? 'Yesterday' :
                       dateFilter === 'week' ? 'This Week' : 'All Time'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="card-body">
                {securityStats.recentActivities.length === 0 ? (
                  <div className="text-center py-4">
                    <i className="fas fa-shield-alt fa-3x text-muted mb-3"></i>
                    <p className="text-muted">No activities found for the selected filters.</p>
                    <small className="text-muted">Activities from other locations are not visible to security officers.</small>
                  </div>
                ) : (
                  <div className="activity-feed">
                    {securityStats.recentActivities.map(activity => {
                      const timeInfo = getTimeCategory(activity.timestamp)
                      const activityTime = new Date(activity.timestamp)
                      const isAfterHours = activityTime.getHours() < 6 || activityTime.getHours() > 22
                      
                      return (
                        <div key={activity.id} className={`activity-item d-flex align-items-center p-3 border-bottom ${isAfterHours ? 'bg-warning bg-opacity-10' : ''}`}>
                          <div className="activity-icon me-3">
                            <i className={`fas ${getActionIcon(activity.action)} fa-lg ${getActionColor(activity.action)}`}></i>
                            {isAfterHours && (
                              <i className="fas fa-moon fa-xs position-absolute text-warning" style={{marginLeft: '-8px', marginTop: '-8px'}}></i>
                            )}
                          </div>
                          <div className="activity-content flex-grow-1">
                            <div className="d-flex justify-content-between align-items-start">
                              <div>
                                <div className="fw-semibold">{activity.staffName}</div>
                                <small className="text-muted">{activity.staffEmail} • {activity.department}</small>
                              </div>
                              <div className="text-end">
                                <span className={`badge ${activity.action === 'clock_in' ? 'bg-success' : 'bg-danger'}`}>
                                  {activity.action.replace('_', ' ').toUpperCase()}
                                </span>
                                {isAfterHours && (
                                  <div className="mt-1">
                                    <span className="badge bg-warning text-dark">
                                      <i className="fas fa-moon me-1"></i>
                                      After Hours
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="mt-1 d-flex justify-content-between align-items-center">
                              <div className="d-flex align-items-center gap-3">
                                <span className="text-muted small">
                                  <i className={`fas ${getLocationIcon(assignedLocation?.name)} me-1`}></i>
                                  {assignedLocation?.name}
                                </span>
                                <span className="text-muted small">
                                  <i className="fas fa-calendar me-1"></i>
                                  {activityTime.toLocaleDateString()}
                                </span>
                                <span className="text-muted small">
                                  <i className="fas fa-clock me-1"></i>
                                  {activityTime.toLocaleTimeString()}
                                </span>
                              </div>
                              <span className={`small ${timeInfo.color}`}>
                                {timeInfo.text}
                              </span>
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
          
          <div className="col-lg-4">
            {/* Department Occupancy Breakdown */}
            <div className="card mb-4">
              <div className="card-header">
                <h6 className="mb-0">
                  <i className="fas fa-chart-pie me-2"></i>
                  Department Occupancy
                </h6>
              </div>
              <div className="card-body">
                {Object.keys(securityStats.departmentOccupancy).length === 0 ? (
                  <div className="text-center py-3">
                    <i className="fas fa-building fa-2x text-muted mb-2"></i>
                    <p className="text-muted small mb-0">No departments currently on site</p>
                  </div>
                ) : (
                  <div>
                    {Object.entries(securityStats.departmentOccupancy).map(([dept, count], index) => {
                      const percentage = (count / securityStats.currentOccupancy) * 100
                      const colors = ['primary', 'success', 'info', 'warning', 'danger', 'secondary']
                      const color = colors[index % colors.length]
                      
                      return (
                        <div key={dept} className="mb-3">
                          <div className="d-flex justify-content-between align-items-center mb-1">
                            <span className="small fw-semibold">{dept}</span>
                            <span className="small">{count} staff</span>
                          </div>
                          <div className="progress" style={{height: '6px'}}>
                            <div 
                              className={`progress-bar bg-${color}`}
                              style={{width: `${percentage}%`}}
                            ></div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Currently On Site */}
            <div className="card mb-4">
              <div className="card-header">
                <h6 className="mb-0">
                  <i className="fas fa-users me-2"></i>
                  Currently On Site ({securityStats.currentOccupancy})
                </h6>
              </div>
              <div className="card-body">
                {securityStats.activeUsers.length === 0 ? (
                  <div className="text-center py-3">
                    <i className="fas fa-user-slash text-muted mb-2"></i>
                    <p className="text-muted small mb-0">No staff currently on site</p>
                  </div>
                ) : (
                  <div style={{maxHeight: '300px', overflowY: 'auto'}}>
                    {securityStats.activeUsers.map(user => {
                      const dept = departments[user.departmentId] || { name: user.department || 'Unknown' }
                      return (
                        <div key={user.id} className="d-flex justify-content-between align-items-center py-2 border-bottom">
                          <div>
                            <div className="fw-semibold small">{user.firstName} {user.lastName}</div>
                            <small className="text-muted">{dept.name} • {user.jobTitle}</small>
                          </div>
                          <div className="text-end">
                            <span className="badge bg-success">
                              <i className="fas fa-circle fa-xs me-1"></i>
                              Active
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
            
            {/* Enhanced Site Information */}
            <div className="card">
              <div className="card-header">
                <h6 className="mb-0">
                  <i className="fas fa-map-marker-alt me-2"></i>
                  Site Security Status
                </h6>
              </div>
              <div className="card-body">
                {assignedLocation ? (
                  <div>
                    <div className="mb-3">
                      <label className="form-label fw-bold small">Location Details</label>
                      <div className="p-2 bg-light rounded">
                        <div className="fw-semibold">{assignedLocation.name}</div>
                        <small className="text-muted">{assignedLocation.address}</small>
                        <div className="mt-1">
                          <span className="badge bg-info">{assignedLocation.type}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <label className="form-label fw-bold small">Security Metrics</label>
                      <div className="row g-2 text-center">
                        <div className="col-6">
                          <div className="p-2 bg-light rounded">
                            <div className="fw-bold text-success">{securityStats.currentOccupancy}</div>
                            <small className="text-muted">On Site</small>
                          </div>
                        </div>
                        <div className="col-6">
                          <div className="p-2 bg-light rounded">
                            <div className="fw-bold text-warning">{securityStats.authorizedOffsite}</div>
                            <small className="text-muted">Authorized Offsite</small>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="form-label fw-bold small">Today's Activity</label>
                      <div className="row g-2 text-center">
                        <div className="col-6">
                          <div className="p-2 bg-light rounded">
                            <div className="fw-bold text-success">{securityStats.todayClockIns}</div>
                            <small className="text-muted">Check-ins</small>
                          </div>
                        </div>
                        <div className="col-6">
                          <div className="p-2 bg-light rounded">
                            <div className="fw-bold text-danger">{securityStats.todayClockOuts}</div>
                            <small className="text-muted">Check-outs</small>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Occupancy Level Indicator */}
                    <div className="mt-4 pt-3 border-top">
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="small fw-bold">Occupancy Level</span>
                        <span className={`badge bg-light ${occupancyLevel.color}`}>
                          {occupancyLevel.level}
                        </span>
                      </div>
                      <div className="progress mt-2" style={{height: '8px'}}>
                        <div 
                          className={`progress-bar ${
                            occupancyLevel.level === 'High' ? 'bg-warning' :
                            occupancyLevel.level === 'Medium' ? 'bg-info' : 'bg-success'
                          }`}
                          style={{width: `${(securityStats.currentOccupancy / securityStats.totalAuthorized) * 100}%`}}
                        ></div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-3">
                    <i className="fas fa-exclamation-triangle text-warning mb-2"></i>
                    <p className="text-muted small mb-0">Location information unavailable</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Security Guidelines */}
        <div className="row g-4 mt-2">
          <div className="col-12">
            <div className="card">
              <div className="card-header bg-dark text-white">
                <h6 className="mb-0 text-white">
                  <i className="fas fa-shield-alt me-2"></i>
                  Enhanced Security Monitoring Capabilities
                </h6>
              </div>
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-md-6">
                    <h6 className="text-primary">Active Monitoring Features:</h6>
                    <ul className="list-unstyled">
                      <li><i className="fas fa-check text-success me-2"></i>Real-time occupancy tracking</li>
                      <li><i className="fas fa-check text-success me-2"></i>Department-wise presence breakdown</li>
                      <li><i className="fas fa-check text-success me-2"></i>After-hours activity detection</li>
                      <li><i className="fas fa-check text-success me-2"></i>Rapid check-in/out pattern alerts</li>
                      <li><i className="fas fa-check text-success me-2"></i>Authorized personnel verification</li>
                    </ul>
                  </div>
                  <div className="col-md-6">
                    <h6 className="text-warning">Security Restrictions & Compliance:</h6>
                    <ul className="list-unstyled">
                      <li><i className="fas fa-lock text-warning me-2"></i>Site-specific access only</li>
                      <li><i className="fas fa-lock text-warning me-2"></i>No cross-location visibility</li>
                      <li><i className="fas fa-lock text-warning me-2"></i>Authorized personnel lists only</li>
                      <li><i className="fas fa-lock text-warning me-2"></i>Privacy-compliant monitoring</li>
                      <li><i className="fas fa-lock text-warning me-2"></i>Audit trail maintenance</li>
                    </ul>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-top">
                  <small className="text-muted">
                    <i className="fas fa-info-circle me-1"></i>
                    Security officers can monitor activities only at their assigned location. For security incidents 
                    or unusual patterns, document observations and contact your supervisor or emergency response team.
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}