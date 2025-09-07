import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'

export default function Clock() {
  const { user, clockIn, clockOut, addLocation, removeLocation, locations } = useAuth()
  const [selectedLocationId, setSelectedLocationId] = useState(user?.assignedLocationId || 'loc_001')
  const [processing, setProcessing] = useState(false)
  
  // Get available locations user can access
  const availableLocations = Object.values(locations).filter(loc => 
    loc.isActive && user?.allowedLocationIds?.includes(loc.id)
  )
  
  const selectedLocation = locations[selectedLocationId]
  const currentLocations = user?.currentLocationIds?.map(id => locations[id]).filter(Boolean) || []
  const isLocationActive = user?.currentLocationIds?.includes(selectedLocationId)
  
  const handleClockIn = async () => {
    if (user?.isClockedIn) return
    
    setProcessing(true)
    try {
      await clockIn(selectedLocationId)
    } catch (error) {
      console.error('Clock in failed:', error.message)
      alert(error.message)
    } finally {
      setProcessing(false)
    }
  }
  
  const handleClockOut = async () => {
    if (!user?.isClockedIn) return
    
    setProcessing(true)
    try {
      await clockOut()
    } catch (error) {
      console.error('Clock out failed:', error.message)
      alert(error.message)
    } finally {
      setProcessing(false)
    }
  }

  const handleAddLocation = async () => {
    if (!user?.isClockedIn || isLocationActive) return
    
    setProcessing(true)
    try {
      await addLocation(selectedLocationId)
    } catch (error) {
      console.error('Add location failed:', error.message)
      alert(error.message)
    } finally {
      setProcessing(false)
    }
  }

  const handleRemoveLocation = async (locationId) => {
    if (!user?.isClockedIn || !user?.currentLocationIds?.includes(locationId)) return
    
    setProcessing(true)
    try {
      await removeLocation(locationId)
    } catch (error) {
      console.error('Remove location failed:', error.message)
      alert(error.message)
    } finally {
      setProcessing(false)
    }
  }
  
  const getCurrentStatus = () => {
    if (user?.isClockedIn) {
      return {
        status: 'On Duty',
        statusClass: 'text-success',
        statusIcon: 'fa-check-circle',
        message: `Active at ${currentLocations.length} location${currentLocations.length !== 1 ? 's' : ''}`,
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
  
  const getLocationIcon = (location) => {
    const icons = {
      office: 'fa-building',
      warehouse: 'fa-warehouse',
      remote: 'fa-home',
      field: 'fa-map-marker-alt'
    }
    return icons[location?.type] || 'fa-map-marker-alt'
  }

  const getLocationColor = (location) => {
    const colors = {
      office: 'text-primary',
      warehouse: 'text-warning',
      remote: 'text-info',
      field: 'text-success'
    }
    return colors[location?.type] || 'text-secondary'
  }
  
  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Multi-Location Clock System</h2>
        <p className="mb-0">Track your working hours across multiple locations</p>
      </div>
      
      <div className="page-content">
        <div className="row justify-content-center">
          <div className="col-lg-8">
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
                
                {/* Current locations display if clocked in */}
                {user?.isClockedIn && currentLocations.length > 0 && (
                  <div className="alert alert-success">
                    <h6 className="mb-2">
                      <i className="fas fa-map-marked-alt me-2"></i>
                      Currently Active Locations:
                    </h6>
                    <div className="d-flex flex-wrap justify-content-center gap-2">
                      {currentLocations.map(location => (
                        <div key={location.id} className="d-flex align-items-center bg-white rounded px-3 py-2">
                          <i className={`fas ${getLocationIcon(location)} ${getLocationColor(location)} me-2`}></i>
                          <span className="fw-semibold me-2">{location.name}</span>
                          {currentLocations.length > 1 && (
                            <button 
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleRemoveLocation(location.id)}
                              disabled={processing}
                              title="Remove from active locations"
                            >
                              <i className="fas fa-times"></i>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Location Management Card */}
            <div className="card mb-4">
              <div className="card-header">
                <h6 className="mb-0">
                  <i className="fas fa-map-marker-alt me-2"></i>
                  Location Management
                </h6>
              </div>
              <div className="card-body">
                <div className="mb-3">
                  <label className="form-label">
                    {user?.isClockedIn ? 'Add Work Location' : 'Initial Work Location'}
                  </label>
                  <select 
                    className="form-select" 
                    value={selectedLocationId}
                    onChange={(e) => setSelectedLocationId(e.target.value)}
                  >
                    {availableLocations.map(location => (
                      <option key={location.id} value={location.id}>
                        {location.name} ({location.type})
                        {location.address && ` - ${location.address}`}
                      </option>
                    ))}
                  </select>
                  {selectedLocation && (
                    <small className="text-muted">
                      <i className={`fas ${getLocationIcon(selectedLocation)} me-1`}></i>
                      {selectedLocation.type} • {selectedLocation.address}
                    </small>
                  )}
                </div>

                {/* Multi-location status */}
                {user?.isClockedIn && (
                  <div className="row g-3 mb-3">
                    <div className="col-md-6">
                      <div className="card bg-light">
                        <div className="card-body text-center">
                          <h5 className="text-primary">{currentLocations.length}</h5>
                          <small className="text-muted">Active Location{currentLocations.length !== 1 ? 's' : ''}</small>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="card bg-light">
                        <div className="card-body text-center">
                          <h5 className="text-info">{availableLocations.length - currentLocations.length}</h5>
                          <small className="text-muted">Available to Add</small>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Add Location Button for Clocked In Users */}
                {user?.isClockedIn && (
                  <div className="alert alert-info">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <i className="fas fa-plus-circle me-2"></i>
                        <strong>Add Location</strong>
                        <div className="small">
                          {isLocationActive 
                            ? `Already active at ${selectedLocation?.name}` 
                            : `Add ${selectedLocation?.name} to your active locations`
                          }
                        </div>
                      </div>
                      <button 
                        className="btn btn-info"
                        onClick={handleAddLocation}
                        disabled={processing || isLocationActive}
                      >
                        {processing ? (
                          <>
                            <i className="fas fa-spinner fa-spin me-1"></i>
                            Adding...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-plus me-1"></i>
                            Add Location
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {!user?.isClockedIn && (
                  <div className="alert alert-secondary">
                    <i className="fas fa-info-circle me-2"></i>
                    You can add additional locations after clocking in
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
                      disabled={user?.isClockedIn || processing}
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
                      disabled={!user?.isClockedIn || processing}
                    >
                      <i className="fas fa-sign-out-alt me-2"></i>
                      Clock Out
                    </button>
                    <small className="text-muted d-block text-center mt-2">
                      {!user?.isClockedIn ? 'Not clocked in' : 'End shift at all locations'}
                    </small>
                  </div>
                </div>

                {/* Quick Action - Primary button based on status */}
                <div className="mt-4 pt-3 border-top">
                  <button 
                    className={`btn ${currentStatus.buttonClass} w-100 btn-lg`}
                    onClick={currentStatus.action}
                    disabled={processing}
                  >
                    <i className={`fas ${currentStatus.buttonIcon} me-2`}></i>
                    {currentStatus.buttonText} 
                    {!user?.isClockedIn && selectedLocation && ` at ${selectedLocation.name}`}
                  </button>
                </div>
              </div>
            </div>

            {/* Available Locations Overview */}
            <div className="card">
              <div className="card-header">
                <h6 className="mb-0">
                  <i className="fas fa-list me-2"></i>
                  Your Authorized Locations
                </h6>
              </div>
              <div className="card-body">
                <div className="row g-3">
                  {availableLocations.map(location => {
                    const isActive = user?.currentLocationIds?.includes(location.id)
                    const isAssigned = user?.assignedLocationId === location.id
                    
                    return (
                      <div key={location.id} className="col-md-6">
                        <div className={`card ${isActive ? 'border-success' : isAssigned ? 'border-primary' : 'border-light'}`}>
                          <div className="card-body">
                            <div className="d-flex justify-content-between align-items-start">
                              <div>
                                <h6 className="mb-1">
                                  <i className={`fas ${getLocationIcon(location)} ${getLocationColor(location)} me-2`}></i>
                                  {location.name}
                                </h6>
                                <small className="text-muted">{location.address}</small>
                                <div className="mt-1">
                                  <span className={`badge bg-light text-dark`}>
                                    {location.type}
                                  </span>
                                  {isAssigned && (
                                    <span className="badge bg-primary ms-1">Primary</span>
                                  )}
                                </div>
                              </div>
                              <div className="text-end">
                                {isActive ? (
                                  <span className="badge bg-success">
                                    <i className="fas fa-check me-1"></i>
                                    Active
                                  </span>
                                ) : (
                                  <span className="badge bg-secondary">
                                    Available
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            {/* Location specific actions */}
                            {user?.isClockedIn && (
                              <div className="mt-2">
                                {isActive ? (
                                  currentLocations.length > 1 && (
                                    <button 
                                      className="btn btn-sm btn-outline-danger w-100"
                                      onClick={() => handleRemoveLocation(location.id)}
                                      disabled={processing}
                                    >
                                      <i className="fas fa-minus me-1"></i>
                                      Remove
                                    </button>
                                  )
                                ) : (
                                  <button 
                                    className="btn btn-sm btn-outline-success w-100"
                                    onClick={() => {
                                      setSelectedLocationId(location.id)
                                      handleAddLocation()
                                    }}
                                    disabled={processing}
                                  >
                                    <i className="fas fa-plus me-1"></i>
                                    Add
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Multi-Location Instructions */}
            <div className="card mt-4">
              <div className="card-body">
                <h6 className="card-title">
                  <i className="fas fa-info-circle me-2"></i>
                  Multi-Location Work Guide
                </h6>
                <div className="row g-3">
                  <div className="col-md-6">
                    <h6 className="small text-muted mb-2">HOW IT WORKS</h6>
                    <ul className="list-unstyled small">
                      <li><i className="fas fa-check text-success me-2"></i>Clock in at your primary location</li>
                      <li><i className="fas fa-check text-success me-2"></i>Add additional locations while on duty</li>
                      <li><i className="fas fa-check text-success me-2"></i>Work simultaneously from multiple sites</li>
                      <li><i className="fas fa-check text-success me-2"></i>Remove locations you no longer need</li>
                      <li><i className="fas fa-check text-success me-2"></i>Clock out ends all location assignments</li>
                    </ul>
                  </div>
                  <div className="col-md-6">
                    <h6 className="small text-muted mb-2">BENEFITS</h6>
                    <ul className="list-unstyled small">
                      <li><i className="fas fa-star text-warning me-2"></i>Flexible work arrangements</li>
                      <li><i className="fas fa-star text-warning me-2"></i>Accurate location tracking</li>
                      <li><i className="fas fa-star text-warning me-2"></i>Support for hybrid work</li>
                      <li><i className="fas fa-star text-warning me-2"></i>Real-time presence visibility</li>
                      <li><i className="fas fa-star text-warning me-2"></i>Compliance with work policies</li>
                    </ul>
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