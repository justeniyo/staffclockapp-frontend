import { useState, useMemo, useCallback } from 'react'
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
  const [sortConfig, setSortConfig] = useState({
    key: 'timestamp',
    direction: 'desc'
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(25)

  const departments = [...new Set(Object.values(allUsers).map(user => user.department).filter(Boolean))]
  const locations = [...new Set(clockActivities.map(activity => activity.location).filter(Boolean))]

  // Advanced filtering and sorting
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
  }, [clockActivities, filters, sortConfig])

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedActivities.length / itemsPerPage)
  const paginatedActivities = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredAndSortedActivities.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredAndSortedActivities, currentPage, itemsPerPage])

  // Reset pagination when filters change
  const handleFilterChange = useCallback((newFilters) => {
    setFilters(newFilters)
    setCurrentPage(1)
  }, [])

  // Sorting handler
  const handleSort = useCallback((key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }, [])

  // Export function
  const exportToCSV = () => {
    const headers = ['Timestamp', 'Staff Name', 'Email', 'Department', 'Action', 'Location']
    const csvContent = [
      headers.join(','),
      ...filteredAndSortedActivities.map(activity => [
        new Date(activity.timestamp).toLocaleString(),
        activity.staffName,
        activity.staffEmail,
        activity.department,
        activity.action.replace('_', ' ').toUpperCase(),
        activity.location
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
    setCurrentPage(1)
  }

  const getActionBadge = (action) => {
    return action === 'clock_in' ? 'bg-success' : 'bg-danger'
  }

  const getLocationColor = (location) => {
    const colors = {
      'Main Office': 'text-primary',
      'Remote': 'text-info', 
      'Warehouse': 'text-warning',
      'Field': 'text-secondary'
    }
    return colors[location] || 'text-secondary'
  }

  const getLocationIcon = (location) => {
    const icons = {
      'Main Office': 'fa-building',
      'Remote': 'fa-home',
      'Warehouse': 'fa-warehouse',
      'Field': 'fa-map-marker-alt'
    }
    return icons[location] || 'fa-map-marker-alt'
  }

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return 'fas fa-sort text-muted'
    return sortConfig.direction === 'asc' ? 'fas fa-sort-up text-primary' : 'fas fa-sort-down text-primary'
  }

  // Statistics
  const stats = useMemo(() => {
    const today = new Date().toDateString()
    const todayActivities = clockActivities.filter(activity => 
      new Date(activity.timestamp).toDateString() === today
    )
    
    return {
      total: clockActivities.length,
      today: todayActivities.length,
      clockIns: todayActivities.filter(a => a.action === 'clock_in').length,
      clockOuts: todayActivities.filter(a => a.action === 'clock_out').length
    }
  }, [clockActivities])

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
            onClick={exportToCSV}
            disabled={filteredAndSortedActivities.length === 0}
          >
            <i className="fas fa-download me-2"></i>
            Export CSV
          </button>
        </div>
      </div>
      
      <div className="page-content">
        {/* Statistics Cards */}
        <div className="row g-3 mb-4">
          <div className="col-md-3">
            <div className="card text-center">
              <div className="card-body">
                <h4 className="text-primary">{stats.total}</h4>
                <p className="mb-0 small">Total Activities</p>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card text-center">
              <div className="card-body">
                <h4 className="text-info">{stats.today}</h4>
                <p className="mb-0 small">Today's Activities</p>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card text-center">
              <div className="card-body">
                <h4 className="text-success">{stats.clockIns}</h4>
                <p className="mb-0 small">Clock Ins Today</p>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card text-center">
              <div className="card-body">
                <h4 className="text-danger">{stats.clockOuts}</h4>
                <p className="mb-0 small">Clock Outs Today</p>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Filters */}
        <div className="card mb-4">
          <div className="card-header">
            <div className="d-flex justify-content-between align-items-center">
              <h6 className="mb-0">Advanced Filters</h6>
              <div className="d-flex gap-2">
                <button 
                  className="btn btn-sm btn-outline-secondary"
                  onClick={clearFilters}
                >
                  <i className="fas fa-times me-1"></i>
                  Clear All
                </button>
              </div>
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
                  {locations.map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
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
                      {paginatedActivities.map(activity => (
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
                          </td>
                          <td>
                            <span className="badge bg-light text-dark">{activity.department}</span>
                          </td>
                          <td>
                            <span className={`badge ${getActionBadge(activity.action)}`}>
                              <i className={`fas ${activity.action === 'clock_in' ? 'fa-sign-in-alt' : 'fa-sign-out-alt'} me-1`}></i>
                              {activity.action.replace('_', ' ').toUpperCase()}
                            </span>
                          </td>
                          <td>
                            <span className={getLocationColor(activity.location)}>
                              <i className={`fas ${getLocationIcon(activity.location)} me-1`}></i>
                              {activity.location}
                            </span>
                          </td>
                        </tr>
                      ))}
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
      </div>
    </div>
  )
}