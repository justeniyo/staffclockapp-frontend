import { useState, useMemo, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'

export default function ClockActivities() {
  const { clockActivities, allUsers, locations, saveFilterState, getFilterState } = useAuth()
  
  // ENHANCED: Filter state persistence with location support
  const savedFilters = getFilterState('admin-clock-activities') || {
    staff: '',
    department: '',
    action: '',
    dateFrom: '',
    dateTo: '',
    location: '',
    jobTitle: '',
    manager: ''
  }

  const [filters, setFilters] = useState(savedFilters)
  const [sortConfig, setSortConfig] = useState({
    key: 'timestamp',
    direction: 'desc'
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(25)
  const [showExportModal, setShowExportModal] = useState(false)
  const [exportOptions, setExportOptions] = useState({
    format: 'csv',
    includeHeaders: true,
    dateRange: 'filtered',
    includeInactive: false,
    groupByStaff: false,
    includeLocationDetails: true,
    includeManagerInfo: true
  })

  const departments = [...new Set(Object.values(allUsers).map(user => user.department).filter(Boolean))]
  const activeLocations = Object.values(locations).filter(loc => loc.isActive)
  const managers = Object.values(allUsers).filter(user => user.isManager && user.isActive)

  // ENHANCED: Advanced filtering and sorting with multi-location support
  const filteredAndSortedActivities = useMemo(() => {
    let filtered = clockActivities

    // Apply filters
    if (filters.staff) {
      filtered = filtered.filter(activity => 
        activity.staffName.toLowerCase().includes(filters.staff.toLowerCase()) ||
        activity.staffEmail.toLowerCase().includes(filters.staff.toLowerCase())
      )
    }

    if (filters.department) {
      filtered = filtered.filter(activity => activity.department === filters.department)
    }

    if (filters.action) {
      filtered = filtered.filter(activity => activity.action === filters.action)
    }

    if (filters.location) {
      filtered = filtered.filter(activity => activity.locationId === filters.location)
    }

    if (filters.jobTitle) {
      filtered = filtered.filter(activity => {
        const staff = Object.values(allUsers).find(u => u.id === activity.staffId)
        return staff?.jobTitle?.toLowerCase().includes(filters.jobTitle.toLowerCase())
      })
    }

    if (filters.manager) {
      filtered = filtered.filter(activity => {
        const staff = Object.values(allUsers).find(u => u.id === activity.staffId)
        return staff?.managerId === filters.manager
      })
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

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      let aValue = a[sortConfig.key]
      let bValue = b[sortConfig.key]

      // Handle different data types
      if (sortConfig.key === 'timestamp') {
        aValue = new Date(aValue)
        bValue = new Date(bValue)
      } else if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase()
        bValue = bValue.toLowerCase()
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1
      }
      return 0
    })

    return sorted
  }, [clockActivities, filters, sortConfig, allUsers])

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedActivities.length / itemsPerPage)
  const paginatedActivities = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredAndSortedActivities.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredAndSortedActivities, currentPage, itemsPerPage])

  // Reset pagination when filters change and save filter state
  const handleFilterChange = useCallback((newFilters) => {
    setFilters(newFilters)
    setCurrentPage(1)
    saveFilterState('admin-clock-activities', newFilters)
  }, [saveFilterState])

  // Sorting handler
  const handleSort = useCallback((key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }, [])

  // ENHANCED: Advanced export function with multiple formats and options
  const performExport = () => {
    let dataToExport = exportOptions.dateRange === 'filtered' 
      ? filteredAndSortedActivities 
      : clockActivities

    // Filter out inactive users if requested
    if (!exportOptions.includeInactive) {
      dataToExport = dataToExport.filter(activity => {
        const staff = Object.values(allUsers).find(u => u.id === activity.staffId)
        return staff?.isActive !== false
      })
    }

    if (exportOptions.format === 'csv') {
      exportToCSV(dataToExport)
    } else if (exportOptions.format === 'json') {
      exportToJSON(dataToExport)
    } else if (exportOptions.format === 'excel') {
      exportToExcel(dataToExport)
    }

    setShowExportModal(false)
  }

  const exportToCSV = (data) => {
    const headers = ['Timestamp', 'Date', 'Time', 'Staff Name', 'Email', 'Department', 'Job Title', 'Action', 'Location', 'Location Type']
    
    if (exportOptions.includeManagerInfo) {
      headers.push('Manager', 'Manager Email')
    }
    
    if (exportOptions.includeLocationDetails) {
      headers.push('Location Address', 'Location ID')
    }

    let csvData = data
    
    if (exportOptions.groupByStaff) {
      // Group activities by staff member
      const groupedData = data.reduce((acc, activity) => {
        const key = activity.staffId
        if (!acc[key]) acc[key] = []
        acc[key].push(activity)
        return acc
      }, {})
      
      csvData = Object.values(groupedData).flat().sort((a, b) => {
        // Sort by staff name, then by timestamp
        if (a.staffName !== b.staffName) {
          return a.staffName.localeCompare(b.staffName)
        }
        return new Date(a.timestamp) - new Date(b.timestamp)
      })
    }

    const csvContent = [
      exportOptions.includeHeaders ? headers.join(',') : null,
      ...csvData.map(activity => {
        const staff = Object.values(allUsers).find(u => u.id === activity.staffId)
        const manager = staff?.managerId ? Object.values(allUsers).find(u => u.id === staff.managerId) : null
        const location = locations[activity.locationId]
        
        const row = [
          new Date(activity.timestamp).toLocaleString(),
          new Date(activity.timestamp).toLocaleDateString(),
          new Date(activity.timestamp).toLocaleTimeString(),
          `"${activity.staffName}"`,
          activity.staffEmail,
          `"${activity.department}"`,
          `"${staff?.jobTitle || 'N/A'}"`,
          activity.action.replace('_', ' ').toUpperCase(),
          `"${activity.location}"`,
          location?.type || 'unknown'
        ]
        
        if (exportOptions.includeManagerInfo) {
          row.push(`"${manager ? `${manager.firstName} ${manager.lastName}` : 'No Manager'}"`)
          row.push(manager?.email || 'N/A')
        }
        
        if (exportOptions.includeLocationDetails) {
          row.push(`"${location?.address || 'N/A'}"`)
          row.push(activity.locationId)
        }
        
        return row.join(',')
      })
    ].filter(Boolean).join('\n')

    downloadFile(csvContent, `clock_activities_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv')
  }

  const exportToJSON = (data) => {
    const enhancedData = data.map(activity => {
      const staff = Object.values(allUsers).find(u => u.id === activity.staffId)
      const manager = staff?.managerId ? Object.values(allUsers).find(u => u.id === staff.managerId) : null
      const location = locations[activity.locationId]
      
      const enhanced = {
        ...activity,
        staffDetails: {
          name: activity.staffName,
          email: activity.staffEmail,
          department: activity.department,
          jobTitle: staff?.jobTitle || null,
          isActive: staff?.isActive || false
        },
        locationDetails: {
          name: activity.location,
          type: location?.type || 'unknown',
          address: location?.address || null,
          id: activity.locationId
        }
      }
      
      if (exportOptions.includeManagerInfo && manager) {
        enhanced.managerDetails = {
          name: `${manager.firstName} ${manager.lastName}`,
          email: manager.email,
          jobTitle: manager.jobTitle || null
        }
      }
      
      return enhanced
    })

    const jsonContent = JSON.stringify({
      exportInfo: {
        exportedAt: new Date().toISOString(),
        totalRecords: enhancedData.length,
        filters: filters,
        includeInactive: exportOptions.includeInactive
      },
      activities: enhancedData
    }, null, 2)

    downloadFile(jsonContent, `clock_activities_${new Date().toISOString().split('T')[0]}.json`, 'application/json')
  }

  const exportToExcel = (data) => {
    // For Excel format, we'll create a more structured CSV that Excel can handle better
    const workbookData = {
      summary: {
        totalActivities: data.length,
        dateRange: filters.dateFrom && filters.dateTo 
          ? `${filters.dateFrom} to ${filters.dateTo}` 
          : 'All time',
        exportedAt: new Date().toLocaleString(),
        uniqueStaff: [...new Set(data.map(a => a.staffId))].length,
        uniqueLocations: [...new Set(data.map(a => a.locationId))].length
      },
      activities: data.map(activity => {
        const staff = Object.values(allUsers).find(u => u.id === activity.staffId)
        const manager = staff?.managerId ? Object.values(allUsers).find(u => u.id === staff.managerId) : null
        const location = locations[activity.locationId]
        
        return {
          'Date': new Date(activity.timestamp).toLocaleDateString(),
          'Time': new Date(activity.timestamp).toLocaleTimeString(),
          'Staff Name': activity.staffName,
          'Email': activity.staffEmail,
          'Department': activity.department,
          'Job Title': staff?.jobTitle || '',
          'Action': activity.action.replace('_', ' ').toUpperCase(),
          'Location': activity.location,
          'Location Type': location?.type || '',
          'Location Address': location?.address || '',
          'Manager': manager ? `${manager.firstName} ${manager.lastName}` : '',
          'Status': staff?.isActive ? 'Active' : 'Inactive'
        }
      })
    }

    // Create a comprehensive CSV for Excel
    const headers = Object.keys(workbookData.activities[0] || {})
    const csvContent = [
      `Export Summary`,
      `Total Activities: ${workbookData.summary.totalActivities}`,
      `Date Range: ${workbookData.summary.dateRange}`,
      `Exported At: ${workbookData.summary.exportedAt}`,
      `Unique Staff: ${workbookData.summary.uniqueStaff}`,
      `Unique Locations: ${workbookData.summary.uniqueLocations}`,
      '',
      headers.join(','),
      ...workbookData.activities.map(row => 
        headers.map(header => `"${row[header] || ''}"`).join(',')
      )
    ].join('\n')

    downloadFile(csvContent, `clock_activities_detailed_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv')
  }

  const downloadFile = (content, filename, mimeType) => {
    const blob = new Blob([content], { type: mimeType })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    window.URL.revokeObjectURL(url)
  }

  const clearFilters = () => {
    const defaultFilters = {
      staff: '',
      department: '',
      action: '',
      dateFrom: '',
      dateTo: '',
      location: '',
      jobTitle: '',
      manager: ''
    }
    setFilters(defaultFilters)
    setCurrentPage(1)
    saveFilterState('admin-clock-activities', defaultFilters)
  }

  const getActionBadge = (action) => {
    const badges = {
      clock_in: 'bg-success',
      clock_out: 'bg-danger',
      location_add: 'bg-info',
      location_remove: 'bg-warning text-dark'
    }
    return badges[action] || 'bg-secondary'
  }

  const getActionIcon = (action) => {
    const icons = {
      clock_in: 'fa-sign-in-alt',
      clock_out: 'fa-sign-out-alt',
      location_add: 'fa-plus-circle',
      location_remove: 'fa-minus-circle'
    }
    return icons[action] || 'fa-question'
  }

  const getLocationColor = (location) => {
    const colors = {
      'Main Office': 'text-primary',
      'Remote': 'text-info', 
      'Warehouse': 'text-warning',
      'Field Operations': 'text-success',
      'Branch Office': 'text-secondary'
    }
    return colors[location] || 'text-secondary'
  }

  const getLocationIcon = (locationId) => {
    const location = locations[locationId]
    const icons = {
      office: 'fa-building',
      remote: 'fa-home',
      warehouse: 'fa-warehouse',
      field: 'fa-map-marker-alt'
    }
    return icons[location?.type] || 'fa-map-marker-alt'
  }

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return 'fas fa-sort text-muted'
    return sortConfig.direction === 'asc' ? 'fas fa-sort-up text-primary' : 'fas fa-sort-down text-primary'
  }

  // ENHANCED: Statistics with multi-location insights
  const stats = useMemo(() => {
    const today = new Date().toDateString()
    const todayActivities = clockActivities.filter(activity => 
      new Date(activity.timestamp).toDateString() === today
    )
    
    const multiLocationStaff = Object.values(allUsers).filter(user => 
      user.currentLocationIds && user.currentLocationIds.length > 1
    ).length

    const locationUsage = Object.values(locations).map(location => ({
      ...location,
      todayActivities: todayActivities.filter(a => a.locationId === location.id).length,
      totalActivities: clockActivities.filter(a => a.locationId === location.id).length
    }))
    
    return {
      total: clockActivities.length,
      today: todayActivities.length,
      clockIns: todayActivities.filter(a => a.action === 'clock_in').length,
      clockOuts: todayActivities.filter(a => a.action === 'clock_out').length,
      locationChanges: todayActivities.filter(a => a.action === 'location_add' || a.action === 'location_remove').length,
      multiLocationStaff,
      locationUsage: locationUsage.sort((a, b) => b.todayActivities - a.todayActivities)
    }
  }, [clockActivities, locations, allUsers])

  return (
    <div>
      <div className="page-header">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h2 className="page-title">Clock Activities</h2>
            <p className="mb-0 text-muted">Showing {filteredAndSortedActivities.length} of {clockActivities.length} activities</p>
          </div>
          <button 
            className="btn btn-warning"
            onClick={() => setShowExportModal(true)}
            disabled={filteredAndSortedActivities.length === 0}
          >
            <i className="fas fa-download me-2"></i>
            Advanced Export
          </button>
        </div>
      </div>
      
      <div className="page-content">
        {/* ENHANCED: Statistics Cards with multi-location support */}
        <div className="row g-3 mb-4">
          <div className="col-md-2">
            <div className="card text-center">
              <div className="card-body">
                <h4 className="text-primary">{stats.total}</h4>
                <p className="mb-0 small">Total Activities</p>
              </div>
            </div>
          </div>
          <div className="col-md-2">
            <div className="card text-center">
              <div className="card-body">
                <h4 className="text-info">{stats.today}</h4>
                <p className="mb-0 small">Today's Activities</p>
              </div>
            </div>
          </div>
          <div className="col-md-2">
            <div className="card text-center">
              <div className="card-body">
                <h4 className="text-success">{stats.clockIns}</h4>
                <p className="mb-0 small">Clock Ins Today</p>
              </div>
            </div>
          </div>
          <div className="col-md-2">
            <div className="card text-center">
              <div className="card-body">
                <h4 className="text-danger">{stats.clockOuts}</h4>
                <p className="mb-0 small">Clock Outs Today</p>
              </div>
            </div>
          </div>
          <div className="col-md-2">
            <div className="card text-center">
              <div className="card-body">
                <h4 className="text-warning">{stats.locationChanges}</h4>
                <p className="mb-0 small">Location Changes</p>
              </div>
            </div>
          </div>
          <div className="col-md-2">
            <div className="card text-center">
              <div className="card-body">
                <h4 className="text-secondary">{stats.multiLocationStaff}</h4>
                <p className="mb-0 small">Multi-Location Staff</p>
              </div>
            </div>
          </div>
        </div>

        {/* Location Usage Insights */}
        <div className="card mb-4">
          <div className="card-header">
            <h6 className="mb-0">
              <i className="fas fa-map-marked-alt me-2"></i>
              Location Usage Today
            </h6>
          </div>
          <div className="card-body">
            <div className="row g-3">
              {stats.locationUsage.slice(0, 4).map(location => (
                <div key={location.id} className="col-md-3">
                  <div className="text-center">
                    <i className={`fas ${getLocationIcon(location.id)} fa-2x text-primary mb-2`}></i>
                    <h5 className="text-primary">{location.todayActivities}</h5>
                    <p className="mb-0 small">{location.name}</p>
                    <small className="text-muted">{location.totalActivities} total</small>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ENHANCED: Filters with additional options */}
        <div className="card mb-4">
          <div className="card-header">
            <div className="d-flex justify-content-between align-items-center">
              <h6 className="mb-0">Advanced Filters</h6>
              <button 
                className="btn btn-sm btn-outline-secondary"
                onClick={clearFilters}
              >
                <i className="fas fa-times me-1"></i>
                Clear All
              </button>
            </div>
          </div>
          <div className="card-body">
            <div className="row g-3">
              <div className="col-lg-3 col-md-6">
                <label className="form-label">Search Staff</label>
                <div className="input-group">
                  <span className="input-group-text"><i className="fas fa-search"></i></span>
                  <input 
                    type="text" 
                    className="form-control"
                    value={filters.staff}
                    onChange={(e) => handleFilterChange({...filters, staff: e.target.value})}
                    placeholder="Name or email..."
                  />
                </div>
              </div>
              <div className="col-lg-2 col-md-6">
                <label className="form-label">Department</label>
                <select 
                  className="form-select"
                  value={filters.department}
                  onChange={(e) => handleFilterChange({...filters, department: e.target.value})}
                >
                  <option value="">All Departments</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
              <div className="col-lg-2 col-md-6">
                <label className="form-label">Action</label>
                <select 
                  className="form-select"
                  value={filters.action}
                  onChange={(e) => handleFilterChange({...filters, action: e.target.value})}
                >
                  <option value="">All Actions</option>
                  <option value="clock_in">Clock In</option>
                  <option value="clock_out">Clock Out</option>
                  <option value="location_add">Add Location</option>
                  <option value="location_remove">Remove Location</option>
                </select>
              </div>
              <div className="col-lg-2 col-md-6">
                <label className="form-label">Location</label>
                <select 
                  className="form-select"
                  value={filters.location}
                  onChange={(e) => handleFilterChange({...filters, location: e.target.value})}
                >
                  <option value="">All Locations</option>
                  {activeLocations.map(loc => (
                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                  ))}
                </select>
              </div>
              <div className="col-lg-3 col-md-6">
                <label className="form-label">Date Range</label>
                <div className="input-group">
                  <input 
                    type="date" 
                    className="form-control"
                    value={filters.dateFrom}
                    onChange={(e) => handleFilterChange({...filters, dateFrom: e.target.value})}
                    title="From Date"
                  />
                  <span className="input-group-text">to</span>
                  <input 
                    type="date" 
                    className="form-control"
                    value={filters.dateTo}
                    onChange={(e) => handleFilterChange({...filters, dateTo: e.target.value})}
                    title="To Date"
                  />
                </div>
              </div>
              <div className="col-lg-2 col-md-6">
                <label className="form-label">Job Title</label>
                <input 
                  type="text" 
                  className="form-control"
                  value={filters.jobTitle}
                  onChange={(e) => handleFilterChange({...filters, jobTitle: e.target.value})}
                  placeholder="Filter by job title..."
                />
              </div>
              <div className="col-lg-2 col-md-6">
                <label className="form-label">Manager</label>
                <select 
                  className="form-select"
                  value={filters.manager}
                  onChange={(e) => handleFilterChange({...filters, manager: e.target.value})}
                >
                  <option value="">All Managers</option>
                  {managers.map(manager => (
                    <option key={manager.id} value={manager.id}>
                      {manager.firstName} {manager.lastName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="card">
          <div className="card-header">
            <div className="d-flex justify-content-between align-items-center">
              <h6 className="mb-0">Activity Log</h6>
              <div className="d-flex align-items-center gap-3">
                <div className="d-flex align-items-center gap-2">
                  <label className="form-label mb-0 small">Show:</label>
                  <select 
                    className="form-select form-select-sm"
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value))
                      setCurrentPage(1)
                    }}
                    style={{width: 'auto'}}
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
          <div className="card-body p-0">
            {filteredAndSortedActivities.length === 0 ? (
              <div className="text-center py-5">
                <i className="fas fa-search fa-3x text-muted mb-3"></i>
                <p className="text-muted">No activities found matching your criteria.</p>
                <button className="btn btn-outline-primary" onClick={clearFilters}>
                  Clear Filters
                </button>
              </div>
            ) : (
              <>
                {/* Responsive Table */}
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead className="table-light">
                      <tr>
                        <th 
                          role="button" 
                          onClick={() => handleSort('timestamp')}
                          className="user-select-none"
                        >
                          <div className="d-flex justify-content-between align-items-center">
                            Timestamp
                            <i className={getSortIcon('timestamp')}></i>
                          </div>
                        </th>
                        <th 
                          role="button" 
                          onClick={() => handleSort('staffName')}
                          className="user-select-none"
                        >
                          <div className="d-flex justify-content-between align-items-center">
                            Staff
                            <i className={getSortIcon('staffName')}></i>
                          </div>
                        </th>
                        <th 
                          role="button" 
                          onClick={() => handleSort('department')}
                          className="user-select-none"
                        >
                          <div className="d-flex justify-content-between align-items-center">
                            Department
                            <i className={getSortIcon('department')}></i>
                          </div>
                        </th>
                        <th 
                          role="button" 
                          onClick={() => handleSort('action')}
                          className="user-select-none"
                        >
                          <div className="d-flex justify-content-between align-items-center">
                            Action
                            <i className={getSortIcon('action')}></i>
                          </div>
                        </th>
                        <th 
                          role="button" 
                          onClick={() => handleSort('location')}
                          className="user-select-none"
                        >
                          <div className="d-flex justify-content-between align-items-center">
                            Location
                            <i className={getSortIcon('location')}></i>
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedActivities.map(activity => {
                        const staff = Object.values(allUsers).find(u => u.id === activity.staffId)
                        const location = locations[activity.locationId]
                        return (
                          <tr key={activity.id}>
                            <td>
                              <div className="fw-semibold">{new Date(activity.timestamp).toLocaleDateString()}</div>
                              <small className="text-muted">
                                {new Date(activity.timestamp).toLocaleTimeString()}
                              </small>
                            </td>
                            <td>
                              <div className="fw-semibold">{activity.staffName}</div>
                              <small className="text-muted">{activity.staffEmail}</small>
                              {staff?.jobTitle && (
                                <div className="small text-info">{staff.jobTitle}</div>
                              )}
                            </td>
                            <td>
                              <span className="badge bg-light text-dark">{activity.department}</span>
                            </td>
                            <td>
                              <span className={`badge ${getActionBadge(activity.action)}`}>
                                <i className={`fas ${getActionIcon(activity.action)} me-1`}></i>
                                {activity.action.replace('_', ' ').toUpperCase()}
                              </span>
                            </td>
                            <td>
                              <div className={getLocationColor(activity.location)}>
                                <i className={`fas ${getLocationIcon(activity.locationId)} me-1`}></i>
                                {activity.location}
                              </div>
                              {location && (
                                <small className="text-muted d-block">
                                  {location.type} • {location.address}
                                </small>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="d-flex justify-content-between align-items-center p-3 border-top">
                    <div className="text-muted small">
                      Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredAndSortedActivities.length)} of {filteredAndSortedActivities.length} entries
                    </div>
                    <nav>
                      <ul className="pagination pagination-sm mb-0">
                        <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                          <button 
                            className="page-link" 
                            onClick={() => setCurrentPage(1)}
                            disabled={currentPage === 1}
                          >
                            <i className="fas fa-angle-double-left"></i>
                          </button>
                        </li>
                        <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                          <button 
                            className="page-link" 
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                          >
                            <i className="fas fa-angle-left"></i>
                          </button>
                        </li>
                        
                        {/* Page numbers */}
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }
                          
                          return (
                            <li key={pageNum} className={`page-item ${currentPage === pageNum ? 'active' : ''}`}>
                              <button 
                                className="page-link" 
                                onClick={() => setCurrentPage(pageNum)}
                              >
                                {pageNum}
                              </button>
                            </li>
                          );
                        })}
                        
                        <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                          <button 
                            className="page-link" 
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                          >
                            <i className="fas fa-angle-right"></i>
                          </button>
                        </li>
                        <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                          <button 
                            className="page-link" 
                            onClick={() => setCurrentPage(totalPages)}
                            disabled={currentPage === totalPages}
                          >
                            <i className="fas fa-angle-double-right"></i>
                          </button>
                        </li>
                      </ul>
                    </nav>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* ENHANCED: Advanced Export Modal */}
        {showExportModal && (
          <div className="modal show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    <i className="fas fa-download me-2"></i>
                    Advanced Export Options
                  </h5>
                  <button 
                    type="button" 
                    className="btn-close"
                    onClick={() => setShowExportModal(false)}
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="row g-4">
                    <div className="col-md-6">
                      <h6 className="text-primary">Export Format</h6>
                      <div className="form-check">
                        <input 
                          className="form-check-input" 
                          type="radio" 
                          name="format" 
                          value="csv"
                          checked={exportOptions.format === 'csv'}
                          onChange={(e) => setExportOptions(prev => ({...prev, format: e.target.value}))}
                        />
                        <label className="form-check-label">
                          <strong>CSV</strong> - Standard comma-separated values
                        </label>
                      </div>
                      <div className="form-check">
                        <input 
                          className="form-check-input" 
                          type="radio" 
                          name="format" 
                          value="excel"
                          checked={exportOptions.format === 'excel'}
                          onChange={(e) => setExportOptions(prev => ({...prev, format: e.target.value}))}
                        />
                        <label className="form-check-label">
                          <strong>Excel-Ready CSV</strong> - Enhanced with summary data
                        </label>
                      </div>
                      <div className="form-check">
                        <input 
                          className="form-check-input" 
                          type="radio" 
                          name="format" 
                          value="json"
                          checked={exportOptions.format === 'json'}
                          onChange={(e) => setExportOptions(prev => ({...prev, format: e.target.value}))}
                        />
                        <label className="form-check-label">
                          <strong>JSON</strong> - Structured data with metadata
                        </label>
                      </div>
                    </div>
                    
                    <div className="col-md-6">
                      <h6 className="text-success">Data Range</h6>
                      <div className="form-check">
                        <input 
                          className="form-check-input" 
                          type="radio" 
                          name="dateRange" 
                          value="filtered"
                          checked={exportOptions.dateRange === 'filtered'}
                          onChange={(e) => setExportOptions(prev => ({...prev, dateRange: e.target.value}))}
                        />
                        <label className="form-check-label">
                          <strong>Filtered Data</strong> - Current filter results ({filteredAndSortedActivities.length} records)
                        </label>
                      </div>
                      <div className="form-check">
                        <input 
                          className="form-check-input" 
                          type="radio" 
                          name="dateRange" 
                          value="all"
                          checked={exportOptions.dateRange === 'all'}
                          onChange={(e) => setExportOptions(prev => ({...prev, dateRange: e.target.value}))}
                        />
                        <label className="form-check-label">
                          <strong>All Data</strong> - Complete activity history ({clockActivities.length} records)
                        </label>
                      </div>
                    </div>
                    
                    <div className="col-12">
                      <h6 className="text-info">Export Options</h6>
                      <div className="row g-3">
                        <div className="col-md-6">
                          <div className="form-check">
                            <input 
                              className="form-check-input" 
                              type="checkbox" 
                              checked={exportOptions.includeHeaders}
                              onChange={(e) => setExportOptions(prev => ({...prev, includeHeaders: e.target.checked}))}
                            />
                            <label className="form-check-label">Include column headers</label>
                          </div>
                          <div className="form-check">
                            <input 
                              className="form-check-input" 
                              type="checkbox" 
                              checked={exportOptions.includeLocationDetails}
                              onChange={(e) => setExportOptions(prev => ({...prev, includeLocationDetails: e.target.checked}))}
                            />
                            <label className="form-check-label">Include location details</label>
                          </div>
                          <div className="form-check">
                            <input 
                              className="form-check-input" 
                              type="checkbox" 
                              checked={exportOptions.includeManagerInfo}
                              onChange={(e) => setExportOptions(prev => ({...prev, includeManagerInfo: e.target.checked}))}
                            />
                            <label className="form-check-label">Include manager information</label>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="form-check">
                            <input 
                              className="form-check-input" 
                              type="checkbox" 
                              checked={exportOptions.includeInactive}
                              onChange={(e) => setExportOptions(prev => ({...prev, includeInactive: e.target.checked}))}
                            />
                            <label className="form-check-label">Include inactive staff</label>
                          </div>
                          <div className="form-check">
                            <input 
                              className="form-check-input" 
                              type="checkbox" 
                              checked={exportOptions.groupByStaff}
                              onChange={(e) => setExportOptions(prev => ({...prev, groupByStaff: e.target.checked}))}
                            />
                            <label className="form-check-label">Group by staff member</label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 p-3 bg-info bg-opacity-10 rounded">
                    <h6 className="text-info mb-2">
                      <i className="fas fa-info-circle me-2"></i>
                      Export Preview
                    </h6>
                    <div className="small">
                      <strong>Format:</strong> {exportOptions.format.toUpperCase()} | 
                      <strong> Records:</strong> {exportOptions.dateRange === 'filtered' ? filteredAndSortedActivities.length : clockActivities.length} | 
                      <strong> Columns:</strong> ~{8 + (exportOptions.includeManagerInfo ? 2 : 0) + (exportOptions.includeLocationDetails ? 2 : 0)}
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => setShowExportModal(false)}
                  >
                    <i className="fas fa-times me-1"></i>
                    Cancel
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-warning"
                    onClick={performExport}
                  >
                    <i className="fas fa-download me-1"></i>
                    Export {exportOptions.format.toUpperCase()}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}