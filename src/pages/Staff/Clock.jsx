import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'

export default function Clock() {
  const { user, clockIn, clockOut, locations } = useAuth()
  const [selectedLocationId, setSelectedLocationId] = useState(user?.assignedLocationId || 'loc_001')
  
  // Get available active locations
  const availableLocations = Object.values(locations).filter(loc => loc.isActive)
  const selectedLocation = locations[selectedLocationId]
  
  const handleClockIn = () => {
    clockIn(selectedLocationId)
  }
  
  const handleClockOut = () => {
    clockOut(selectedLocationId)
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
                {user?.isClockedIn && (
                  <div className="alert alert-success">
                    <i className="fas fa-map-marker-alt me-2"></i>
                    Currently at: <strong>{selectedLocation?.name || 'Unknown Location'}</strong>
                  </div>
                )}
              </div>
            </div>

            {/* Location Selection Card */}
            <div className="card mb-4">
              <div className="card-header">
                <h6 className="mb-0">
                  <i className="fas fa-map-marker-alt me-2"></i>
                  Select Location
                </h6>
              </div>
              <div className="card-body">
                <div className="mb-3">
                  <label className="form-label">Work Location</label>
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
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}