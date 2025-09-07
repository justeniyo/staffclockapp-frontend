import { useState, useMemo } from 'react'
import { useAuth } from '../../context/AuthContext'

export default function SecurityDashboard(){
  const { allUsers, clockActivities, user, locations } = useAuth()
  const [dateFilter, setDateFilter] = useState('today')
  const [locationFilter, setLocationFilter] = useState('all')

  // Get the security guard's assigned site
  const assignedLocationId = user?.assignedLocationId || 'loc_001'
  const assignedLocation = locations[assignedLocationId]
  
  // Security guards should only see activities at their assigned location
  const relevantActivities = useMemo(() => {
    let filtered = clockActivities
    
    // Filter by assigned site/location
    if (assignedLocationId && locationFilter === 'assigned') {
      filtered = filtered.filter(activity => activity.locationId === assignedLocationId)
    } else if (locationFilter !== 'all') {
      filtered = filtered.filter(activity => activity.locationId === locationFilter)
    }
    
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
      default:
        break
    }
    
    return filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
  }, [clockActivities, assignedLocationId, dateFilter, locationFilter])
  
  // Security-relevant statistics
  const stats = useMemo(() => {
    const now = new Date()
    const today = now.toDateString()
    
    const todayActivities = clockActivities.filter(activity => 
      new Date(activity.timestamp).toDateString() === today &&
      (assignedLocationId ? activity.locationId === assignedLocationId : true)
    )
    
    const currentlyActive = Object.values(allUsers).filter(user => 
      user.role === 'staff' && 
      user.isActive && 
      user.isClockedIn
    )
    
    return {
      totalUsers: Object.values(allUsers).filter(u => u.role !== 'system').length,
      activeUsers: currentlyActive.length,
      todayActivities: todayActivities.length,
      todayClockIns: todayActivities.filter(a => a.action === 'clock_in').length,
      todayClockOuts: todayActivities.filter(a => a.action === 'clock_out').length,
      recentActivities: relevantActivities.slice(0, 10)
    }
  }, [allUsers, clockActivities, assignedLocationId, relevantActivities])
  
  // Get unique locations from activities
  const availableLocations = Object.values(locations).filter(loc => loc.isActive)
  
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

  return (
    <div>
      <div className="page-header">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h2 className="page-title">Security Dashboard</h2>
            <p className="mb-0">Monitoring access control and staff activities</p>
            {assignedLocation && (
              <small className="text-muted">
                <i className="fas fa-map-marker-alt me-1"></i>
                Assigned Site: <strong>{assignedLocation.name}</strong>
              </small>
            )}
          </div>
          <div className="d-flex gap-2">
            <select 
              className="form-select form-select-sm"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              style={{width: 'auto'}}
            >
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="week">This Week</option>
              <option value="all">All Time</option>
            </select>
            <select 
              className="form-select form-select-sm"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              style={{width: 'auto'}}
            >
              <option value="all">All Locations</option>
              {assignedLocationId && (
                <option value="assigned">My Site ({assignedLocation?.name})</option>
              )}
              {availableLocations.map(location => (
                <option key={location.id} value={location.id}>{location.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      <div className="page-content">
        {/* Statistics Cards */}
        <div className="row g-4 mb-4">
          <div className="col-md-3">
            <div className="card text-center">
              <div className="card-body">
                <i className="fas fa-users fa-2x text-primary mb-2"></i>
                <h3 className="text-primary">{stats.totalUsers}</h3>
                <p className="mb-0">Total Users</p>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card text-center">
              <div className="card-body">
                <i className="fas fa-user-check fa-2x text-success mb-2"></i>
                <h3 className="text-success">{stats.activeUsers}</h3>
                <p className="mb-0">Currently Active</p>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card text-center">
              <div className="card-body">
                <i className="fas fa-sign-in-alt fa-2x text-info mb-2"></i>
                <h3 className="text-info">{stats.todayClockIns}</h3>
                <p className="mb-0">Clock Ins Today</p>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card text-center">
              <div className="card-body">
                <i className="fas fa-sign-out-alt fa-2x text-warning mb-2"></i>
                <h3 className="text-warning">{stats.todayClockOuts}</h3>
                <p className="mb-0">Clock Outs Today</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Activity Monitoring */}
        <div className="row g-4">
          <div className="col-lg-8">
            <div className="card">
              <div className="card-header">
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">
                    <i className="fas fa-clock me-2"></i>
                    Recent Access Activities
                  </h5>
                  <div className="badge bg-info">
                    {relevantActivities.length} activities
                  </div>
                </div>
              </div>
              <div className="card-body">
                {stats.recentActivities.length === 0 ? (
                  <div className="text-center py-4">
                    <i className="fas fa-shield-alt fa-3x text-muted mb-3"></i>
                    <p className="text-muted">No recent activities for selected filters.</p>
                  </div>
                ) : (
                  <div className="activity-feed">
                    {stats.recentActivities.map(activity => {
                      const timeInfo = getTimeCategory(activity.timestamp)
                      const activityLocation = locations[activity.locationId] || { name: activity.location || 'Unknown' }
                      return (
                        <div key={activity.id} className="activity-item d-flex align-items-center p-3 border-bottom">
                          <div className="activity-icon me-3">
                            <i className={`fas ${getActionIcon(activity.action)} fa-lg ${getActionColor(activity.action)}`}></i>
                          </div>
                          <div className="activity-content flex-grow-1">
                            <div className="d-flex justify-content-between align-items-start">
                              <div>
                                <div className="fw-semibold">{activity.staffName}</div>
                                <small className="text-muted">{activity.staffEmail}</small>
                              </div>
                              <div className="text-end">
                                <span className={`badge ${activity.action === 'clock_in' ? 'bg-success' : 'bg-danger'}`}>
                                  {activity.action.replace('_', ' ').toUpperCase()}
                                </span>
                              </div>
                            </div>
                            <div className="mt-1 d-flex justify-content-between align-items-center">
                              <div className="d-flex align-items-center gap-3">
                                <span className="text-muted small">
                                  <i className={`fas ${getLocationIcon(activityLocation.name)} me-1`}></i>
                                  {activityLocation.name}
                                </span>
                                <span className="text-muted small">
                                  <i className="fas fa-building me-1"></i>
                                  {activity.department}
                                </span>
                              </div>
                              <span className={`small ${timeInfo.color}`}>
                                <i className="fas fa-clock me-1"></i>
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
            {/* Currently Active Staff */}
            <div className="card mb-4">
              <div className="card-header">
                <h6 className="mb-0">
                  <i className="fas fa-users me-2"></i>
                  Currently Active Staff
                </h6>
              </div>
              <div className="card-body">
                {Object.values(allUsers)
                  .filter(user => user.role === 'staff' && user.isActive && user.isClockedIn)
                  .slice(0, 8)
                  .map(user => {
                    const userLocation = locations[user.assignedLocationId] || { name: 'Unknown' }
                    return (
                      <div key={user.id} className="d-flex justify-content-between align-items-center py-2 border-bottom">
                        <div>
                          <div className="fw-semibold small">{user.firstName} {user.lastName}</div>
                          <small className="text-muted">{user.department} • {userLocation.name}</small>
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
                {Object.values(allUsers).filter(user => user.role === 'staff' && user.isActive && user.isClockedIn).length === 0 && (
                  <div className="text-center py-3">
                    <i className="fas fa-user-slash text-muted mb-2"></i>
                    <p className="text-muted small mb-0">No staff currently active</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Location Summary */}
            <div className="card">
              <div className="card-header">
                <h6 className="mb-0">
                  <i className="fas fa-map-marker-alt me-2"></i>
                  Location Summary
                </h6>
              </div>
              <div className="card-body">
                {availableLocations.map(location => {
                  const locationUsers = Object.values(allUsers).filter(user => 
                    user.assignedLocationId === location.id && user.isActive && user.isClockedIn
                  )
                  
                  return (
                    <div key={location.id} className="d-flex justify-content-between align-items-center py-2 border-bottom">
                      <div>
                        <div className="fw-semibold small">{location.name}</div>
                        <small className="text-muted">{location.type} • {location.address}</small>
                      </div>
                      <div className="text-end">
                        <span className={`badge ${locationUsers.length > 0 ? 'bg-success' : 'bg-secondary'}`}>
                          {locationUsers.length} active
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}