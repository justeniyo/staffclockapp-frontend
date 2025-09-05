// src/pages/Security/Dashboard.jsx - Updated for location-based monitoring

import { useState, useMemo } from 'react'
import { useAuth } from '../../context/AuthContext'

export default function SecurityDashboard(){
  const { allUsers, user, getLocationClockActivities } = useAuth()
  const [selectedLocation, setSelectedLocation] = useState('all')
  const [timeFilter, setTimeFilter] = useState('today')

  // Get all available locations from clock activities
  const allLocations = useMemo(() => {
    const locations = new Set()
    Object.values(allUsers).forEach(user => {
      if (user.assignedLocation) locations.add(user.assignedLocation)
    })
    // Add common locations that might not be in user assignments
    locations.add('Main Office')
    locations.add('Warehouse Site')
    locations.add('Remote')
    return Array.from(locations).sort()
  }, [allUsers])

  // Get activities based on location and time filter
  const activities = useMemo(() => {
    let allActivities = getLocationClockActivities(selectedLocation)
    
    // Apply time filter
    const now = new Date()
    switch (timeFilter) {
      case 'today':
        allActivities = allActivities.filter(activity => 
          new Date(activity.timestamp).toDateString() === now.toDateString()
        )
        break
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        allActivities = allActivities.filter(activity => 
          new Date(activity.timestamp) >= weekAgo
        )
        break
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        allActivities = allActivities.filter(activity => 
          new Date(activity.timestamp) >= monthAgo
        )
        break
    }
    
    return allActivities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
  }, [selectedLocation, timeFilter, getLocationClockActivities])

  // Security-relevant statistics
  const stats = useMemo(() => {
    const totalUsers = Object.values(allUsers).filter(u => u.role !== 'security' && u.isActive).length
    const activeUsers = Object.values(allUsers).filter(u => u.isClockedIn && u.role !== 'security').length
    
    // Location-specific stats
    const locationUsers = selectedLocation === 'all' 
      ? Object.values(allUsers).filter(u => u.role !== 'security' && u.isActive)
      : Object.values(allUsers).filter(u => u.assignedLocation === selectedLocation || 
          (selectedLocation === 'Main Office' && !u.assignedLocation && u.role !== 'security'))
    
    const locationActiveUsers = locationUsers.filter(u => u.isClockedIn)
    
    const todayActivities = activities.filter(activity => 
      new Date(activity.timestamp).toDateString() === new Date().toDateString()
    )
    
    // Count activities by type for today
    const todayClockIns = todayActivities.filter(a => a.action === 'clock_in').length
    const todayClockOuts = todayActivities.filter(a => a.action === 'clock_out').length
    
    return {
      totalUsers,
      activeUsers,
      locationUsers: locationUsers.length,
      locationActiveUsers: locationActiveUsers.length,
      todayActivities: todayActivities.length,
      todayClockIns,
      todayClockOuts,
      recentActivities: activities.slice(0, 15)
    }
  }, [allUsers, selectedLocation, activities])

  // Get current time for display
  const currentTime = new Date().toLocaleString()

  // Export activities function
  const exportActivities = () => {
    const headers = ['Timestamp', 'Staff Name', 'Email', 'Department', 'Action', 'Location']
    const csvContent = [
      headers.join(','),
      ...activities.map(activity => [
        new Date(activity.timestamp).toLocaleString(),
        activity.staffName,
        activity.staffId,
        activity.department,
        activity.action.replace('_', ' ').toUpperCase(),
        activity.location
      ].map(field => `"${field}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `security_activities_${selectedLocation}_${timeFilter}_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div>
      <div className="page-header">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h2 className="page-title">Security Dashboard</h2>
            <p className="mb-0">
              <i className="fas fa-shield-alt me-2"></i>
              System monitoring and access control
              {user.assignedLocation && (
                <span className="badge bg-warning text-dark ms-2">
                  Assigned: {user.assignedLocation}
                </span>
              )}
            </p>
          </div>
          <div className="text-muted small">
            <i className="fas fa-clock me-1"></i>
            {currentTime}
          </div>
        </div>
      </div>
      
      <div className="page-content">
        {/* Control Panel */}
        <div className="row g-3 mb-4">
          <div className="col-md-6">
            <div className="card">
              <div className="card-header header-light">
                <h6 className="mb-0">
                  <i className="fas fa-filter me-2"></i>
                  Monitoring Controls
                </h6>
              </div>
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Location</label>
                    <select 
                      className="form-select"
                      value={selectedLocation}
                      onChange={(e) => setSelectedLocation(e.target.value)}
                    >
                      <option value="all">All Locations</option>
                      {allLocations.map(location => (
                        <option key={location} value={location}>
                          {location}
                          {user.assignedLocation === location && ' (Your Assignment)'}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Time Period</label>
                    <select 
                      className="form-select"
                      value={timeFilter}
                      onChange={(e) => setTimeFilter(e.target.value)}
                    >
                      <option value="today">Today</option>
                      <option value="week">Past 7 Days</option>
                      <option value="month">Past 30 Days</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="card">
              <div className="card-header header-light">
                <h6 className="mb-0">
                  <i className="fas fa-download me-2"></i>
                  Export & Reports
                </h6>
              </div>
              <div className="card-body">
                <button 
                  className="btn btn-warning w-100"
                  onClick={exportActivities}
                  disabled={activities.length === 0}
                >
                  <i className="fas fa-download me-2"></i>
                  Export Activity Log
                </button>
                <small className="text-muted mt-2 d-block">
                  Exports {activities.length} activities for {selectedLocation === 'all' ? 'all locations' : selectedLocation}
                </small>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Dashboard */}
        <div className="row g-4 mb-4">
          <div className="col-md-3">
            <div className="card text-center border-primary">
              <div className="card-body">
                <h3 className="text-primary">{selectedLocation === 'all' ? stats.totalUsers : stats.locationUsers}</h3>
                <p className="mb-0 small">
                  {selectedLocation === 'all' ? 'Total' : 'Location'} Users
                </p>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card text-center border-success">
              <div className="card-body">
                <h3 className="text-success">{selectedLocation === 'all' ? stats.activeUsers : stats.locationActiveUsers}</h3>
                <p className="mb-0 small">Currently Active</p>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card text-center border-info">
              <div className="card-body">
                <h3 className="text-info">{stats.todayClockIns}</h3>
                <p className="mb-0 small">Today's Check-ins</p>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card text-center border-warning">
              <div className="card-body">
                <h3 className="text-warning">{stats.todayClockOuts}</h3>
                <p className="mb-0 small">Today's Check-outs</p>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Summary by Department */}
        <div className="row g-3 mb-4">
          <div className="col-md-6">
            <div className="card">
              <div className="card-header">
                <h6 className="mb-0">
                  <i className="fas fa-building me-2"></i>
                  Department Activity Summary
                </h6>
              </div>
              <div className="card-body">
                {(() => {
                  const deptStats = activities.reduce((acc, activity) => {
                    if (!acc[activity.department]) {
                      acc[activity.department] = { clockIns: 0, clockOuts: 0 }
                    }
                    if (activity.action === 'clock_in') acc[activity.department].clockIns++
                    else acc[activity.department].clockOuts++
                    return acc
                  }, {})

                  const deptEntries = Object.entries(deptStats)
                  
                  return deptEntries.length === 0 ? (
                    <p className="text-muted text-center py-3">No activity data for selected filters.</p>
                  ) : (
                    <div>
                      {deptEntries.map(([dept, stats]) => (
                        <div key={dept} className="d-flex justify-content-between align-items-center py-2 border-bottom">
                          <div>
                            <strong>{dept}</strong>
                          </div>
                          <div>
                            <span className="badge bg-success me-1">
                              <i className="fas fa-sign-in-alt me-1"></i>
                              {stats.clockIns}
                            </span>
                            <span className="badge bg-danger">
                              <i className="fas fa-sign-out-alt me-1"></i>
                              {stats.clockOuts}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                })()}
              </div>
            </div>
          </div>
          
          <div className="col-md-6">
            <div className="card">
              <div className="card-header">
                <h6 className="mb-0">
                  <i className="fas fa-map-marker-alt me-2"></i>
                  Location Activity Summary
                </h6>
              </div>
              <div className="card-body">
                {(() => {
                  const locationStats = activities.reduce((acc, activity) => {
                    if (!acc[activity.location]) {
                      acc[activity.location] = { count: 0, lastActivity: activity.timestamp }
                    }
                    acc[activity.location].count++
                    if (new Date(activity.timestamp) > new Date(acc[activity.location].lastActivity)) {
                      acc[activity.location].lastActivity = activity.timestamp
                    }
                    return acc
                  }, {})

                  const locationEntries = Object.entries(locationStats)
                  
                  return locationEntries.length === 0 ? (
                    <p className="text-muted text-center py-3">No location data for selected filters.</p>
                  ) : (
                    <div>
                      {locationEntries.map(([location, stats]) => (
                        <div key={location} className="d-flex justify-content-between align-items-center py-2 border-bottom">
                          <div>
                            <strong>{location}</strong>
                            <div className="text-muted small">
                              Last: {new Date(stats.lastActivity).toLocaleTimeString()}
                            </div>
                          </div>
                          <span className="badge bg-info">
                            {stats.count} activities
                          </span>
                        </div>
                      ))}
                    </div>
                  )
                })()}
              </div>
            </div>
          </div>
        </div>
        
        {/* Recent Access Activities */}
        <div className="row g-3">
          <div className="col-12">
            <div className="card">
              <div className="card-header">
                <div className="d-flex justify-content-between align-items-center">
                  <h6 className="mb-0">
                    <i className="fas fa-list me-2"></i>
                    Recent Access Activities
                    <span className="badge bg-secondary ms-2">{activities.length}</span>
                  </h6>
                  <div className="text-muted small">
                    {selectedLocation === 'all' ? 'All Locations' : selectedLocation} • {timeFilter}
                  </div>
                </div>
              </div>
              <div className="card-body p-0">
                {stats.recentActivities.length === 0 ? (
                  <div className="text-center py-5">
                    <i className="fas fa-shield-alt fa-3x text-muted mb-3"></i>
                    <p className="text-muted">No activities found for selected filters.</p>
                    <small className="text-muted">
                      Try adjusting the location or time period filters above.
                    </small>
                  </div>
                ) : (
                  <div className="table-responsive" style={{ maxHeight: '500px' }}>
                    <table className="table table-hover mb-0">
                      <thead className="table-dark sticky-top">
                        <tr>
                          <th>Time</th>
                          <th>User</th>
                          <th>Department</th>
                          <th>Action</th>
                          <th>Location</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.recentActivities.map(activity => {
                          const userInfo = allUsers[activity.staffId]
                          const isRecent = new Date(activity.timestamp) > new Date(Date.now() - 30 * 60 * 1000) // Last 30 minutes
                          
                          return (
                            <tr key={activity.id} className={isRecent ? 'table-warning' : ''}>
                              <td>
                                <div className="fw-semibold">
                                  {new Date(activity.timestamp).toLocaleDateString()}
                                </div>
                                <small className="text-muted">
                                  {new Date(activity.timestamp).toLocaleTimeString()}
                                  {isRecent && (
                                    <span className="badge bg-warning text-dark ms-1">Recent</span>
                                  )}
                                </small>
                              </td>
                              <td>
                                <div className="fw-semibold">{activity.staffName}</div>
                                <small className="text-muted">{activity.staffId}</small>
                              </td>
                              <td>
                                <span className="badge bg-light text-dark">{activity.department}</span>
                              </td>
                              <td>
                                <span className={`badge ${activity.action === 'clock_in' ? 'bg-success' : 'bg-danger'}`}>
                                  <i className={`fas ${activity.action === 'clock_in' ? 'fa-sign-in-alt' : 'fa-sign-out-alt'} me-1`}></i>
                                  {activity.action.replace('_', ' ').toUpperCase()}
                                </span>
                              </td>
                              <td>
                                <span className={`${
                                  activity.location === 'Main Office' ? 'text-primary' :
                                  activity.location === 'Remote' ? 'text-info' :
                                  activity.location === 'Warehouse Site' ? 'text-warning' : 'text-secondary'
                                }`}>
                                  <i className={`fas ${
                                    activity.location === 'Main Office' ? 'fa-building' :
                                    activity.location === 'Remote' ? 'fa-home' : 'fa-map-marker-alt'
                                  } me-1`}></i>
                                  {activity.location}
                                </span>
                              </td>
                              <td>
                                {userInfo ? (
                                  <span className={`badge ${userInfo.isClockedIn ? 'bg-success' : 'bg-secondary'}`}>
                                    {userInfo.isClockedIn ? 'Active' : 'Offline'}
                                  </span>
                                ) : (
                                  <span className="badge bg-light text-dark">Unknown</span>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
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