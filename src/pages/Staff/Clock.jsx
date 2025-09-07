import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'

export default function Clock() {
  const { user, clockIn, clockOut, switchLocation, locations } = useAuth()
  const [selectedLocationId, setSelectedLocationId] = useState(user?.assignedLocationId || 'loc_001')
  const [switching, setSwitching] = useState(false)
  
  // Get available active locations
  const availableLocations = Object.values(locations).filter(loc => loc.isActive)
  const selectedLocation = locations[selectedLocationId]
  const currentLocation = user?.currentLocationId ? locations[user.currentLocationId] : null
  
  const handleClockIn = () => {
    clockIn(selectedLocationId)
  }
  
  const handleClockOut = () => {
    clockOut(selectedLocationId)
  }

  const handleSwitchLocation = async () => {
    if (!user?.isClockedIn || selectedLocationId === (user.currentLocationId || user.assignedLocationId)) {
      return
    }

    setSwitching(true)
    try {
      const result = switchLocation(selectedLocationId)
      // You could show a toast notification here
      console.log(`Switched to ${result.newLocation}`)
    } catch (error) {
      console.error('Location switch failed:', error.message)
      alert(error.message)
    } finally {
      setSwitching(false)
    }
  }
  
  const getCurrentStatus = () => {
    if (user?.isClockedIn) {
      return {
        status: 'Clocked In',
        statusClass: 'text-success',
        statusIcon: 'fa-check-circle',
        message: 'You are currently on duty',
        buttonText: 'Clock Out',
        buttonClass: 'btn-danger',
        buttonIcon: 'fa-sign-out-alt',
        action: handleClockOut
      }
    } else {
      return {
        status: 'Clocked Out',
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
  const isLocationDifferent = user?.isClockedIn && selectedLocationId !== (user.currentLocationId || user.assignedLocationId)
  
  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Clock In/Out</h2>
        <p className="mb-0">Track your working hours</p>
      </div>
      
      <div className="page-content">
        <div className="row justify-content-center">
          <div className="col-lg-6">
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
                
                {/* Current location display if clocked in */}
                {user?.isClockedIn && currentLocation && (
                  <div className="alert alert-success">
                    <i className="fas fa-map-marker-alt me-2"></i>
                    Currently at: <strong>{currentLocation.name}</strong>
                    <div className="small text-muted mt-1">{currentLocation.address}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Location Selection Card */}
            <div className="card mb-4">
              <div className="card-header">
                <h6 className="mb-0">
                  <i className="fas fa-map-marker-alt me-2"></i>
                  {user?.isClockedIn ? 'Switch Location' : 'Select Location'}
                </h6>
              </div>
              <div className="card-body">
                <div className="mb-3">
                  <label className="form-label">
                    {user?.isClockedIn ? 'New Work Location' : 'Work Location'}
                  </label>
                  <select 
                    className="form-select" 
                    value={selectedLocationId}
                    onChange={(e) => setSelectedLocationId(e.target.value)}
                  >
                    {availableLocations.map(location => (
                      <option key={location.id} value={location.id}>
                        {location.name} {location.address && `- ${location.address}`}
                      </option>
                    ))}
                  </select>
                  {selectedLocation && (
                    <small className="text-muted">
                      Type: {selectedLocation.type} 
                      {selectedLocation.address && ` • ${selectedLocation.address}`}
                    </small>
                  )}
                </div>

                {/* Location Switch Button for Clocked In Users */}
                {user?.isClockedIn && isLocationDifferent && (
                  <div className="alert alert-info">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <i className="fas fa-exchange-alt me-2"></i>
                        <strong>Location Change Available</strong>
                        <div className="small">Switch from {currentLocation?.name} to {selectedLocation?.name}</div>
                      </div>
                      <button 
                        className="btn btn-info btn-sm"
                        onClick={handleSwitchLocation}
                        disabled={switching}
                      >
                        {switching ? (
                          <>
                            <i className="fas fa-spinner fa-spin me-1"></i>
                            Switching...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-exchange-alt me-1"></i>
                            Switch Now
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {user?.isClockedIn && !isLocationDifferent && (
                  <div className="alert alert-secondary">
                    <i className="fas fa-info-circle me-2"></i>
                    You are currently at this location
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons Card */}
            <div className="card">
              <div className="card-body">
                <div className="row g-3">
                  {/* Clock In Button */}
                  <div className="col-md-6">
                    <button 
                      className={`btn btn-success w-100 btn-lg ${user?.isClockedIn ? 'disabled' : ''}`}
                      onClick={handleClockIn}
                      disabled={user?.isClockedIn}
                    >
                      <i className="fas fa-sign-in-alt me-2"></i>
                      Clock In
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
                      disabled={!user?.isClockedIn}
                    >
                      <i className="fas fa-sign-out-alt me-2"></i>
                      Clock Out
                    </button>
                    <small className="text-muted d-block text-center mt-2">
                      {!user?.isClockedIn ? 'Not clocked in' : 'End your shift'}
                    </small>
                  </div>
                </div>

                {/* Quick Action - Primary button based on status */}
                <div className="mt-4 pt-3 border-top">
                  <button 
                    className={`btn ${currentStatus.buttonClass} w-100 btn-lg`}
                    onClick={currentStatus.action}
                  >
                    <i className={`fas ${currentStatus.buttonIcon} me-2`}></i>
                    {currentStatus.buttonText} at {selectedLocation?.name}
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Info Card */}
            <div className="card mt-4">
              <div className="card-body">
                <h6 className="card-title">
                  <i className="fas fa-info-circle me-2"></i>
                  Quick Info
                </h6>
                <div className="row g-3 text-center">
                  <div className="col-4">
                    <div className="fw-bold text-primary">{user?.firstName}</div>
                    <small className="text-muted">Employee</small>
                  </div>
                  <div className="col-4">
                    <div className="fw-bold text-info">{user?.department}</div>
                    <small className="text-muted">Department</small>
                  </div>
                  <div className="col-4">
                    <div className="fw-bold text-secondary">{user?.jobTitle || 'Staff'}</div>
                    <small className="text-muted">Position</small>
                  </div>
                </div>

                {/* Location Switch Instructions */}
                {user?.isClockedIn && (
                  <div className="mt-3 pt-3 border-top">
                    <h6 className="small text-muted mb-2">LOCATION SWITCHING</h6>
                    <small className="text-muted">
                      <i className="fas fa-info-circle me-1"></i>
                      You can switch locations while on duty. Select a new location above and click "Switch Now" to move to a different site.
                    </small>
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