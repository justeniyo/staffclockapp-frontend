import { useState, useMemo } from 'react'
import { useAuth } from '../../context/AuthContext'

export default function ClockActivities() {
  const { clockActivities, allUsers } = useAuth()
  const [filters, setFilters] = useState({
    staff: '',
    department: '',
    action: '',
    dateFrom: '',
    dateTo: '',
    location: ''
  })

  const departments = [...new Set(Object.values(allUsers).map(user => user.department).filter(Boolean))]
  const locations = [...new Set(clockActivities.map(activity => activity.location).filter(Boolean))]

  const filteredActivities = useMemo(() => {
    let filtered = clockActivities

    if (filters.staff) {
      filtered = filtered.filter(activity => 
        activity.staffName.toLowerCase().includes(filters.staff.toLowerCase()) ||
        activity.staffId.toLowerCase().includes(filters.staff.toLowerCase())
      )
    }

    if (filters.department) {
      filtered = filtered.filter(activity => activity.department === filters.department)
    }

    if (filters.action) {
      filtered = filtered.filter(activity => activity.action === filters.action)
    }

    if (filters.location) {
      filtered = filtered.filter(activity => activity.location === filters.location)
    }

    if (filters.dateFrom) {
      filtered = filtered.filter(activity => 
        new Date(activity.timestamp) >= new Date(filters.dateFrom)
      )
    }

    if (filters.dateTo) {
      filtered = filtered.filter(activity => 
        new Date(activity.timestamp) <= new Date(filters.dateTo + 'T23:59:59')
      )
    }

    return filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
  }, [clockActivities, filters])

  const exportToCSV = () => {
    const headers = ['Timestamp', 'Staff Name', 'Email', 'Department', 'Action', 'Location', 'Notes']
    const csvContent = [
      headers.join(','),
      ...filteredActivities.map(activity => [
        new Date(activity.timestamp).toLocaleString(),
        activity.staffName,
        activity.staffId,
        activity.department,
        activity.action.replace('_', ' ').toUpperCase(),
        activity.location,
        activity.notes || ''
      ].map(field => `"${field}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `clock_activities_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    window.URL.revokeObjectURL(url)
  }

  const clearFilters = () => {
    setFilters({
      staff: '',
      department: '',
      action: '',
      dateFrom: '',
      dateTo: '',
      location: ''
    })
  }

  const getActionBadge = (action) => {
    return action === 'clock_in' ? 'bg-success' : 'bg-danger'
  }

  const getLocationColor = (location) => {
    const colors = {
      Office: 'text-primary',
      Remote: 'text-info', 
      Field: 'text-warning'
    }
    return colors[location] || 'text-secondary'
  }

  return (
    <div>
      <div className="page-header">
        <div className="d-flex justify-content-between align-items-center">
          <h2 className="page-title">Clock Activities</h2>
          <button 
            className="btn btn-warning"
            onClick={exportToCSV}
            disabled={filteredActivities.length === 0}
          >
            Export CSV ({filteredActivities.length} records)
          </button>
        </div>
      </div>
      
      <div className="page-content">
        <div className="card mb-4">
          <div className="card-header">
            <h6 className="mb-0">Filters</h6>
          </div>
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label">Staff (Name/Email)</label>
                <input 
                  type="text" 
                  className="form-control"
                  value={filters.staff}
                  onChange={(e) => setFilters(prev => ({...prev, staff: e.target.value}))}
                  placeholder="Search staff..."
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">Department</label>
                <select 
                  className="form-select"
                  value={filters.department}
                  onChange={(e) => setFilters(prev => ({...prev, department: e.target.value}))}
                >
                  <option value="">All Departments</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label">Action</label>
                <select 
                  className="form-select"
                  value={filters.action}
                  onChange={(e) => setFilters(prev => ({...prev, action: e.target.value}))}
                >
                  <option value="">All Actions</option>
                  <option value="clock_in">Clock In</option>
                  <option value="clock_out">Clock Out</option>
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label">From Date</label>
                <input 
                  type="date" 
                  className="form-control"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters(prev => ({...prev, dateFrom: e.target.value}))}
                />
              </div>
              <div className="col-md-3">
                <label className="form-label">To Date</label>
                <input 
                  type="date" 
                  className="form-control"
                  value={filters.dateTo}
                  onChange={(e) => setFilters(prev => ({...prev, dateTo: e.target.value}))}
                />
              </div>
              <div className="col-md-3">
                <label className="form-label">Location</label>
                <select 
                  className="form-select"
                  value={filters.location}
                  onChange={(e) => setFilters(prev => ({...prev, location: e.target.value}))}
                >
                  <option value="">All Locations</option>
                  {locations.map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-3 d-flex align-items-end">
                <button 
                  className="btn btn-outline-secondary w-100"
                  onClick={clearFilters}
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h6 className="mb-0">Activity Log ({filteredActivities.length} records)</h6>
          </div>
          <div className="card-body">
            {filteredActivities.length === 0 ? (
              <p className="text-muted text-center py-4">No activities found matching your criteria.</p>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>Staff</th>
                      <th>Department</th>
                      <th>Action</th>
                      <th>Location</th>
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredActivities.map(activity => (
                      <tr key={activity.id}>
                        <td>
                          <div>{new Date(activity.timestamp).toLocaleDateString()}</div>
                          <small className="text-muted">
                            {new Date(activity.timestamp).toLocaleTimeString()}
                          </small>
                        </td>
                        <td>
                          <strong>{activity.staffName}</strong>
                          <div className="text-muted small">{activity.staffId}</div>
                        </td>
                        <td>{activity.department}</td>
                        <td>
                          <span className={`badge ${getActionBadge(activity.action)}`}>
                            {activity.action.replace('_', ' ').toUpperCase()}
                          </span>
                        </td>
                        <td>
                          <span className={getLocationColor(activity.location)}>
                            {activity.location}
                          </span>
                        </td>
                        <td className="text-muted small">{activity.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}