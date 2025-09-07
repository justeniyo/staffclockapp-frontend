import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'

export default function Clock() {
  const { user, clockIn, clockOut, addLocation, removeLocation, locations } = useAuth()
  const [selectedLocationId, setSelectedLocationId] = useState(user?.assignedLocationId || 'loc_001')
  const [loading, setLoading] = useState(false)
  const [lastAction, setLastAction] = useState('')
  
  // Get available active locations
  const availableLocations = Object.values(locations).filter(loc => loc.isActive)
  const selectedLocation = locations[selectedLocationId]
  
  // FIXED: Get current location (only one at a time)
  const currentLocationIds = user?.currentLocationIds || []
  const currentLocation = currentLocationIds.length > 0 ? locations[currentLocationIds[0]] : null
  
  // Check if selected location is the current active location
  const isLocationActive = currentLocationIds.includes(selectedLocationId)
  
  const handleClockIn = async () => {
    setLoading(true)
    try {
      await clockIn(selectedLocationId)
      setLastAction('clocked_in')
      setTimeout(() => setLastAction(''), 3000)
    } catch (error) {
      console.error('Clock in failed:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const handleClockOut = async () => {
    setLoading(true)
    try {
      await clockOut()
      setLastAction('clocked_out')
      setTimeout(() => setLastAction(''), 3000)
    } catch (error) {
      console.error('Clock out failed:', error)
    } finally {
      setLoading(false)
    }
  }

  // FIXED: Handle changing location (not adding additional)
  const handleChangeLocation = async () => {
    if (isLocationActive || !user?.isClockedIn) return
    
    setLoading(true)
    try {
      const result = await addLocation(selectedLocationId)
      setLastAction('location_changed')
      setTimeout(() => setLastAction(''), 3000)
    } catch (error) {
      console.error('Change location failed:', error)
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  // FIXED: Remove location means clock out (since only one location allowed)
  const handleRemoveLocation = async () => {
    setLoading(true)
    try {
      await removeLocation(currentLocationIds[0])
      setLastAction('clocked_out')
      setTimeout(() => setLastAction(''), 3000)
    } catch (error) {
      console.error('Remove location failed:', error)
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }
  
  const getCurrentStatus = () => {
    if (user?.isClockedIn && currentLocation) {
      return {
        status: 'On Duty',
        statusClass: 'text-success',
        statusIcon: 'fa-check-circle',
        message: `Currently at ${currentLocation.name}`,
        buttonText: 'Clock Out',
        buttonClass: 'btn-danger',
        buttonIcon: 'fa-sign-out-alt',
        action: handleClockOut
      }
    } else {
      return {
        status: 'Off Duty',
        statusClass: 'text-muted',
        statusIcon: 'fa-clock',
        message: 'Ready to start your shift?',
        buttonText: 'Clock In',
        buttonClass: 'btn-success',
        buttonIcon: 'fa-sign-in-alt',
        action: handleClockIn
      }
    }
  }
  
  const currentStatus = getCurrentStatus()
  
  const getLocationTypeIcon = (type) => {
    const icons = {
      office: 'fa-building',
      warehouse: 'fa-warehouse',
      remote: 'fa-home',
      field: 'fa-map-marker-alt'
    }
    return icons[type] || 'fa-map-marker-alt'
  }

  const getLocationTypeColor = (type) => {
    const colors = {
      office: 'text-primary',
      warehouse: 'text-warning',
      remote: 'text-info',
      field: 'text-success'
    }
    return colors[type] || 'text-secondary'
  }

  const getActionMessage = () => {
    switch (lastAction) {
      case 'clocked_in':
        return { text: 'Successfully clocked in!', class: 'alert-success' }
      case 'clocked_out':
        return { text: 'Successfully clocked out!', class: 'alert-info' }
      case 'location_changed':
        return { text: 'Location changed successfully!', class: 'alert-success' }
      default:
        return null
    }
  }

  const actionMessage = getActionMessage()
  
  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Location Clock</h2>
        <p className="mb-0">Track your working hours - one location at a time</p>
      </div>
      
      <div className="page-content">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            {/* Action Feedback */}
            {actionMessage && (
              <div className={`alert ${actionMessage.class} alert-dismissible fade show`}>
                <i className="fas fa-check-circle me-2"></i>
                {actionMessage.text}
              </div>
            )}

            {/* Status Card */}
            <div className="card mb-4">
              <div className="card-body text-center py-5">
                <div className="mb-4">
                  <i className={`fas ${currentStatus.statusIcon} fa-4x ${currentStatus.statusClass}`}></i>
                </div>
                <h3 className={`mb-2 ${currentStatus.statusClass}`}>
                  {currentStatus.status}
                </h3>
                <p className="text-muted mb-4">{currentStatus.message}</p>
                
                {/* FIXED: Current Location Display - Only One Location */}
                {user?.isClockedIn && currentLocation && (
                  <div className="row justify-content-center mb-4">
                    <div className="col-md-6">
                      <div className="card border-success">
                        <div className="card-body p-3">
                          <div className="d-flex justify-content-between align-items-start">
                            <div className="text-start">
                              <h6 className="card-title mb-1">
                                <i className={`fas ${getLocationTypeIcon(currentLocation.type)} ${getLocationTypeColor(currentLocation.type)} me-2`}></i>
                                {currentLocation.name}
                              </h6>
                              <p className="card-text small text-muted mb-0">{currentLocation.address}</p>
                              <span className={`badge bg-light ${getLocationTypeColor(currentLocation.type)} mt-1`}>
                                {currentLocation.type}
                              </span>
                            </div>
                            <button 
                              className="btn btn-sm btn-outline-danger"
                              onClick={handleRemoveLocation}
                              disabled={loading}
                              title="Clock out from this location"
                            >
                              <i className="fas fa-sign-out-alt"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Location Management Card */}
            <div className="card mb-4">
              <div className="card-header">
                <h6 className="mb-0">
                  <i className="fas fa-map-marked-alt me-2"></i>
                  {user?.isClockedIn ? 'Change Work Location' : 'Select Work Location'}
                </h6>
              </div>
              <div className="card-body">
                <div className="mb-3">
                  <label className="form-label">
                    {user?.isClockedIn ? 'Switch to Different Location' : 'Primary Work Location'}
                  </label>
                  <select 
                    className="form-select" 
                    value={selectedLocationId}
                    onChange={(e) => setSelectedLocationId(e.target.value)}
                    disabled={loading}
                  >
                    {availableLocations.map(location => (
                      <option key={location.id} value={location.id}>
                        {location.name} - {location.type}
                        {location.address && ` (${location.address})`}
                      </option>
                    ))}
                  </select>
                  {selectedLocation && (
                    <small className="text-muted d-block mt-1">
                      <i className={`fas ${getLocationTypeIcon(selectedLocation.type)} me-1`}></i>
                      {selectedLocation.type} • {selectedLocation.address}
                    </small>
                  )}
                </div>

                {/* FIXED: Location Change Actions */}
                {user?.isClockedIn && (
                  <div>
                    {isLocationActive ? (
                      <div className="alert alert-info">
                        <i className="fas fa-info-circle me-2"></i>
                        <strong>Current Location:</strong> You are currently working at {selectedLocation?.name}
                      </div>
                    ) : (
                      <div className="alert alert-warning">
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <i className="fas fa-exchange-alt me-2"></i>
                            <strong>Change Location:</strong> Move from {currentLocation?.name} to {selectedLocation?.name}
                            <br/>
                            <small className="text-muted">This will clock you out from {currentLocation?.name} and into {selectedLocation?.name}</small>
                          </div>
                          <button 
                            className="btn btn-warning btn-sm"
                            onClick={handleChangeLocation}
                            disabled={loading}
                          >
                            {loading ? (
                              <>
                                <i className="fas fa-spinner fa-spin me-1"></i>
                                Changing...
                              </>
                            ) : (
                              <>
                                <i className="fas fa-exchange-alt me-1"></i>
                                Change Location
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {!user?.isClockedIn && (
                  <div className="alert alert-secondary">
                    <i className="fas fa-info-circle me-2"></i>
                    Clock in to start working at your selected location. You can change locations later if needed.
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons Card */}
            <div className="card mb-4">
              <div className="card-body">
                <div className="row g-3">
                  {/* Clock In Button */}
                  <div className="col-md-6">
                    <button 
                      className={`btn btn-success w-100 btn-lg ${user?.isClockedIn ? 'disabled' : ''}`}
                      onClick={handleClockIn}
                      disabled={user?.isClockedIn || loading}
                    >
                      {loading && !user?.isClockedIn ? (
                        <>
                          <i className="fas fa-spinner fa-spin me-2"></i>
                          Clocking In...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-sign-in-alt me-2"></i>
                          Clock In
                        </>
                      )}
                    </button>
                    <small className="text-muted d-block text-center mt-2">
                      {user?.isClockedIn ? 'Already clocked in' : 'Start your shift'}
                    </small>
                  </div>

                  {/* Clock Out Button */}
                  <div className="col-md-6">
                    <button 
                      className={`btn btn-danger w-100 btn-lg ${!user?.isClockedIn ? 'disabled' : ''}`}
                      onClick={handleClockOut}
                      disabled={!user?.isClockedIn || loading}
                    >
                      {loading && user?.isClockedIn ? (
                        <>
                          <i className="fas fa-spinner fa-spin me-2"></i>
                          Clocking Out...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-sign-out-alt me-2"></i>
                          Clock Out
                        </>
                      )}
                    </button>
                    <small className="text-muted d-block text-center mt-2">
                      {!user?.isClockedIn ? 'Not clocked in' : `End shift at ${currentLocation?.name}`}
                    </small>
                  </div>
                </div>

                {/* Primary Action Button */}
                <div className="mt-4 pt-3 border-top">
                  <button 
                    className={`btn ${currentStatus.buttonClass} w-100 btn-lg`}
                    onClick={currentStatus.action}
                    disabled={loading}
                  >
                    <i className={`fas ${currentStatus.buttonIcon} me-2`}></i>
                    {loading ? 'Processing...' : currentStatus.buttonText}
                    {user?.isClockedIn && selectedLocation && ` (currently at ${currentLocation?.name})`}
                    {!user?.isClockedIn && selectedLocation && ` at ${selectedLocation.name}`}
                  </button>
                </div>
              </div>
            </div>

            {/* FIXED: Single Location Work Guide */}
            <div className="card">
              <div className="card-header">
                <h6 className="mb-0">
                  <i className="fas fa-info-circle me-2"></i>
                  Location-Based Work Guide
                </h6>
              </div>
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-md-6">
                    <h6 className="text-primary">How It Works:</h6>
                    <ul className="list-unstyled small">
                      <li><i className="fas fa-check text-success me-2"></i>Clock in at your selected location</li>
                      <li><i className="fas fa-check text-success me-2"></i>Work at one location at a time</li>
                      <li><i className="fas fa-check text-success me-2"></i>Change locations when needed</li>
                      <li><i className="fas fa-check text-success me-2"></i>Clock out when your shift ends</li>
                      <li><i className="fas fa-check text-success me-2"></i>All location changes are tracked</li>
                    </ul>
                  </div>
                  <div className="col-md-6">
                    <h6 className="text-info">Benefits:</h6>
                    <ul className="list-unstyled small">
                      <li><i className="fas fa-star text-warning me-2"></i>Clear location tracking</li>
                      <li><i className="fas fa-star text-warning me-2"></i>Accurate work location records</li>
                      <li><i className="fas fa-star text-warning me-2"></i>Simplified presence management</li>
                      <li><i className="fas fa-star text-warning me-2"></i>Better resource allocation</li>
                      <li><i className="fas fa-star text-warning me-2"></i>Comprehensive activity logs</li>
                    </ul>
                  </div>
                </div>

                {/* FIXED: Current Status Summary */}
                <div className="mt-4 pt-3 border-top">
                  <div className="row g-3 text-center">
                    <div className="col-3">
                      <div className="fw-bold text-primary">{user?.firstName}</div>
                      <small className="text-muted">Employee</small>
                    </div>
                    <div className="col-3">
                      <div className="fw-bold text-info">{user?.department}</div>
                      <small className="text-muted">Department</small>
                    </div>
                    <div className="col-3">
                      <div className="fw-bold text-secondary">{user?.jobTitle || 'Staff'}</div>
                      <small className="text-muted">Position</small>
                    </div>
                    <div className="col-3">
                      <div className="fw-bold text-warning">{currentLocation ? '1' : '0'}</div>
                      <small className="text-muted">Active Location</small>
                    </div>
                  </div>
                </div>

                {/* Available Locations Preview */}
                <div className="mt-4 pt-3 border-top">
                  <h6 className="small text-muted mb-2">AVAILABLE LOCATIONS</h6>
                  <div className="row g-2">
                    {availableLocations.slice(0, 4).map(location => {
                      const isActive = currentLocationIds.includes(location.id)
                      return (
                        <div key={location.id} className="col-md-3">
                          <div className={`p-2 rounded text-center ${isActive ? 'bg-success text-white' : 'bg-light'}`}>
                            <i className={`fas ${getLocationTypeIcon(location.type)} me-1`}></i>
                            <div className="small fw-bold">{location.name}</div>
                            <div className="text-xs">{location.type}</div>
                            {isActive && (
                              <small className="badge bg-light text-success mt-1">
                                <i className="fas fa-check me-1"></i>Active
                              </small>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* FIXED: Single Location Policy Notice */}
                <div className="mt-4 pt-3 border-top">
                  <div className="alert alert-info mb-0">
                    <h6 className="alert-heading">
                      <i className="fas fa-map-marker-alt me-2"></i>
                      Location Policy:
                    </h6>
                    <p className="mb-0 small">
                      Staff can only be present at <strong>one location at a time</strong>. 
                      When you change locations, you'll be automatically checked out from your current location 
                      and checked in to the new location. This ensures accurate tracking and compliance with 
                      workplace policies.
                    </p>
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