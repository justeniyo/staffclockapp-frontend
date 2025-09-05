// src/pages/Manager/LeaveRequests.jsx - Updated for hierarchical structure

import { useState, useMemo, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'

export default function LeaveRequests() {
  const { 
    user, 
    processLeaveRequest, 
    getPendingLeaveRequestsForApproval,
    getMyDirectReports,
    allUsers
  } = useAuth()
  
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    status: 'all',
    dateFrom: '',
    dateTo: '',
    urgency: 'all'
  })
  const [sortConfig, setSortConfig] = useState({
    key: 'requestDate',
    direction: 'desc'
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(25)
  const [selectedRequest, setSelectedRequest] = useState(null)

  // Get all leave requests that this manager can approve
  const allApprovalRequests = getPendingLeaveRequestsForApproval()
  const teamMembers = getMyDirectReports()
  const teamEmails = teamMembers.map(member => member.email)
  
  // Get all leave requests from team members (not just pending ones for approval)
  const allTeamRequests = useMemo(() => {
    // This would typically come from a database query
    // For now, we'll simulate getting all requests from team members
    const { leaveRequests } = useAuth()
    return leaveRequests.filter(req => teamEmails.includes(req.staffId))
  }, [teamEmails])
  
  // Advanced filtering and sorting
  const filteredAndSortedRequests = useMemo(() => {
    let filtered = allTeamRequests

    // Apply filters
    if (filters.search) {
      filtered = filtered.filter(req => 
        req.staffName.toLowerCase().includes(filters.search.toLowerCase())
      )
    }

    if (filters.type) {
      filtered = filtered.filter(req => req.type === filters.type)
    }

    if (filters.status !== 'all') {
      filtered = filtered.filter(req => req.status === filters.status)
    }

    if (filters.urgency !== 'all') {
      const now = new Date()
      const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
      
      if (filters.urgency === 'urgent') {
        filtered = filtered.filter(req => 
          req.status === 'pending' && new Date(req.startDate) <= sevenDaysFromNow
        )
      } else if (filters.urgency === 'normal') {
        filtered = filtered.filter(req => 
          req.status !== 'pending' || new Date(req.startDate) > sevenDaysFromNow
        )
      }
    }

    if (filters.dateFrom) {
      filtered = filtered.filter(req => 
        new Date(req.startDate) >= new Date(filters.dateFrom)
      )
    }

    if (filters.dateTo) {
      filtered = filtered.filter(req => 
        new Date(req.startDate) <= new Date(filters.dateTo)
      )
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      let aValue = a[sortConfig.key]
      let bValue = b[sortConfig.key]

      // Handle different data types
      if (sortConfig.key === 'requestDate' || sortConfig.key === 'startDate') {
        aValue = new Date(aValue)
        bValue = new Date(bValue)
      } else if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase()
        bValue = bValue.toLowerCase()
      }

      // Add urgency as secondary sort for pending requests
      if (sortConfig.key === 'urgency' || (sortConfig.key === 'status' && a.status === 'pending' && b.status === 'pending')) {
        const now = new Date()
        const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
        const aUrgent = new Date(a.startDate) <= sevenDaysFromNow
        const bUrgent = new Date(b.startDate) <= sevenDaysFromNow
        
        if (aUrgent !== bUrgent) {
          return sortConfig.direction === 'asc' ? (aUrgent ? -1 : 1) : (aUrgent ? 1 : -1)
        }
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
  }, [allTeamRequests, filters, sortConfig])

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedRequests.length / itemsPerPage)
  const paginatedRequests = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredAndSortedRequests.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredAndSortedRequests, currentPage, itemsPerPage])

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

  const handleProcess = (requestId, status) => {
    try {
      processLeaveRequest(requestId, status)
      setSelectedRequest(null)
    } catch (error) {
      alert(error.message)
    }
  }

  const clearFilters = () => {
    setFilters({
      search: '',
      type: '',
      status: 'all',
      dateFrom: '',
      dateTo: '',
      urgency: 'all'
    })
    setCurrentPage(1)
  }

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-warning text-dark',
      approved: 'bg-success',
      rejected: 'bg-danger'
    }
    return badges[status] || 'bg-secondary'
  }

  const getTypeColor = (type) => {
    const colors = {
      Annual: 'text-primary',
      Sick: 'text-danger',
      Personal: 'text-info',
      Emergency: 'text-warning'
    }
    return colors[type] || 'text-secondary'
  }

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return 'fas fa-sort text-muted'
    return sortConfig.direction === 'asc' ? 'fas fa-sort-up text-primary' : 'fas fa-sort-down text-primary'
  }

  const getDurationInDays = (startDate, endDate) => {
    return Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)) + 1
  }

  const isUrgent = (request) => {
    if (request.status !== 'pending') return false
    const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    return new Date(request.startDate) <= sevenDaysFromNow
  }

  const canApprove = (request) => {
    return request.status === 'pending' && request.manager === user.email
  }

  const getUserLevelTitle = () => {
    if (user.manager === 'ceo@company.com') {
      return 'C-Level Executive'
    }
    return 'Department Manager'
  }

  return (
    <div>
      <div className="page-header">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h2 className="page-title">Team Leave Requests</h2>
            <p className="mb-0 text-muted">
              {getUserLevelTitle()} - Showing {filteredAndSortedRequests.length} of {allTeamRequests.length} requests
            </p>
          </div>
        </div>
      </div>
      
      <div className="page-content">
        {/* Enhanced Filters */}
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
              <div className="col-lg-2 col-md-6">
                <label className="form-label">Search Employee</label>
                <div className="input-group">
                  <span className="input-group-text"><i className="fas fa-search"></i></span>
                  <input 
                    type="text" 
                    className="form-control"
                    value={filters.search}
                    onChange={(e) => handleFilterChange({...filters, search: e.target.value})}
                    placeholder="Staff name..."
                  />
                </div>
              </div>
              <div className="col-lg-2 col-md-6">
                <label className="form-label">Leave Type</label>
                <select 
                  className="form-select"
                  value={filters.type}
                  onChange={(e) => handleFilterChange({...filters, type: e.target.value})}
                >
                  <option value="">All Types</option>
                  <option value="Annual">Annual</option>
                  <option value="Sick">Sick</option>
                  <option value="Personal">Personal</option>
                  <option value="Emergency">Emergency</option>
                </select>
              </div>
              <div className="col-lg-2 col-md-6">
                <label className="form-label">Status</label>
                <select 
                  className="form-select"
                  value={filters.status}
                  onChange={(e) => handleFilterChange({...filters, status: e.target.value})}
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              <div className="col-lg-2 col-md-6">
                <label className="form-label">Urgency</label>
                <select 
                  className="form-select"
                  value={filters.urgency}
                  onChange={(e) => handleFilterChange({...filters, urgency: e.target.value})}
                >
                  <option value="all">All</option>
                  <option value="urgent">Urgent (≤7 days)</option>
                  <option value="normal">Normal (>7 days)</option>
                </select>
              </div>
              <div className="col-lg-4 col-md-6">
                <label className="form-label">Leave Date Range</label>
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

        {/* Summary Cards */}
        <div className="row g-3 mb-4">
          <div className="col-md-3">
            <div className="card text-center">
              <div className="card-body">
                <h4 className="text-warning">
                  {allApprovalRequests.length}
                </h4>
                <p className="mb-0 small">Awaiting Your Approval</p>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card text-center">
              <div className="card-body">
                <h4 className="text-danger">
                  {allApprovalRequests.filter(req => isUrgent(req)).length}
                </h4>
                <p className="mb-0 small">Urgent Requests</p>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card text-center">
              <div className="card-body">
                <h4 className="text-success">
                  {allTeamRequests.filter(req => req.status === 'approved').length}
                </h4>
                <p className="mb-0 small">Approved This Month</p>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card text-center">
              <div className="card-body">
                <h4 className="text-info">
                  {teamMembers.length}
                </h4>
                <p className="mb-0 small">Team Members</p>
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="card">
          <div className="card-header">
            <div className="d-flex justify-content-between align-items-center">
              <h6 className="mb-0">Leave Requests</h6>
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
            {filteredAndSortedRequests.length === 0 ? (
              <div className="text-center py-5">
                <i className="fas fa-calendar-times fa-3x text-muted mb-3"></i>
                <p className="text-muted">No leave requests found matching your criteria.</p>
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
                          onClick={() => handleSort('staffName')}
                          className="user-select-none"
                        >
                          <div className="d-flex justify-content-between align-items-center">
                            Employee
                            <i className={getSortIcon('staffName')}></i>
                          </div>
                        </th>
                        <th 
                          role="button" 
                          onClick={() => handleSort('type')}
                          className="user-select-none"
                        >
                          <div className="d-flex justify-content-between align-items-center">
                            Type
                            <i className={getSortIcon('type')}></i>
                          </div>
                        </th>
                        <th 
                          role="button" 
                          onClick={() => handleSort('startDate')}
                          className="user-select-none"
                        >
                          <div className="d-flex justify-content-between align-items-center">
                            Dates
                            <i className={getSortIcon('startDate')}></i>
                          </div>
                        </th>
                        <th>Duration</th>
                        <th 
                          role="button" 
                          onClick={() => handleSort('status')}
                          className="user-select-none"
                        >
                          <div className="d-flex justify-content-between align-items-center">
                            Status
                            <i className={getSortIcon('status')}></i>
                          </div>
                        </th>
                        <th 
                          role="button" 
                          onClick={() => handleSort('requestDate')}
                          className="user-select-none"
                        >
                          <div className="d-flex justify-content-between align-items-center">
                            Requested
                            <i className={getSortIcon('requestDate')}></i>
                          </div>
                        </th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedRequests.map(req => {
                        const daysDiff = getDurationInDays(req.startDate, req.endDate)
                        const urgent = isUrgent(req)
                        const canApproveRequest = canApprove(req)
                        
                        return (
                          <tr key={req.id} className={urgent ? 'table-warning' : ''}>
                            <td>
                              <div className="fw-semibold">
                                {req.staffName}
                                {urgent && (
                                  <span className="badge bg-danger ms-2">
                                    <i className="fas fa-exclamation-triangle me-1"></i>
                                    Urgent
                                  </span>
                                )}
                              </div>
                              <small className="text-muted">
                                {allUsers[req.staffId]?.jobTitle || req.department}
                              </small>
                            </td>
                            <td>
                              <span className={`badge bg-light text-dark ${getTypeColor(req.type)}`}>
                                <i className={`fas ${
                                  req.type === 'Annual' ? 'fa-calendar' :
                                  req.type === 'Sick' ? 'fa-thermometer-half' :
                                  req.type === 'Personal' ? 'fa-user' : 'fa-exclamation-triangle'
                                } me-1`}></i>
                                {req.type}
                              </span>
                            </td>
                            <td>
                              <div className="fw-semibold">{req.startDate}</div>
                              <small className="text-muted">to {req.endDate}</small>
                            </td>
                            <td>
                              <span className="badge bg-info">
                                {daysDiff} day{daysDiff !== 1 ? 's' : ''}
                              </span>
                            </td>
                            <td>
                              <span className={`badge ${getStatusBadge(req.status)}`}>
                                <i className={`fas ${
                                  req.status === 'pending' ? 'fa-clock' :
                                  req.status === 'approved' ? 'fa-check' : 'fa-times'
                                } me-1`}></i>
                                {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                              </span>
                            </td>
                            <td>
                              <div className="fw-semibold">{new Date(req.requestDate).toLocaleDateString()}</div>
                              <small className="text-muted">{new Date(req.requestDate).toLocaleTimeString()}</small>
                            </td>
                            <td>
                              <div className="d-flex gap-1">
                                <button 
                                  className="btn btn-outline-primary btn-sm"
                                  onClick={() => setSelectedRequest(req)}
                                >
                                  <i className="fas fa-eye me-1"></i>
                                  Review
                                </button>
                                {canApproveRequest && (
                                  <>
                                    <button 
                                      className="btn btn-success btn-sm"
                                      onClick={() => handleProcess(req.id, 'approved')}
                                      title="Quick Approve"
                                    >
                                      <i className="fas fa-check"></i>
                                    </button>
                                    <button 
                                      className="btn btn-danger btn-sm"
                                      onClick={() => handleProcess(req.id, 'rejected')}
                                      title="Quick Reject"
                                    >
                                      <i className="fas fa-times"></i>
                                    </button>
                                  </>
                                )}
                              </div>
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
                      Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredAndSortedRequests.length)} of {filteredAndSortedRequests.length} entries
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
                        
                        {/* Page numbers - simplified for space */}
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

        {/* Review Modal */}
        {selectedRequest && (
          <div className="modal show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    <i className="fas fa-calendar-check me-2"></i>
                    Review Leave Request
                    {isUrgent(selectedRequest) && (
                      <span className="badge bg-danger ms-2">
                        <i className="fas fa-exclamation-triangle me-1"></i>
                        Urgent
                      </span>
                    )}
                  </h5>
                  <button 
                    type="button" 
                    className="btn-close"
                    onClick={() => setSelectedRequest(null)}
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-bold">Employee</label>
                      <div className="p-2 bg-light rounded">
                        {selectedRequest.staffName}
                        <div className="text-muted small">
                          {allUsers[selectedRequest.staffId]?.jobTitle || selectedRequest.department}
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold">Department</label>
                      <div className="p-2 bg-light rounded">{selectedRequest.department}</div>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold">Leave Type</label>
                      <div className="p-2 bg-light rounded">
                        <span className={getTypeColor(selectedRequest.type)}>{selectedRequest.type}</span>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold">Duration</label>
                      <div className="p-2 bg-light rounded">
                        {getDurationInDays(selectedRequest.startDate, selectedRequest.endDate)} day(s)
                      </div>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold">Start Date</label>
                      <div className="p-2 bg-light rounded">{selectedRequest.startDate}</div>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold">End Date</label>
                      <div className="p-2 bg-light rounded">{selectedRequest.endDate}</div>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold">Current Status</label>
                      <div className="p-2 bg-light rounded">
                        <span className={`badge ${getStatusBadge(selectedRequest.status)}`}>
                          {selectedRequest.status.charAt(0).toUpperCase() + selectedRequest.status.slice(1)}
                        </span>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold">Requested On</label>
                      <div className="p-2 bg-light rounded">
                        {new Date(selectedRequest.requestDate).toLocaleDateString()}
                      </div>
                    </div>
                    {selectedRequest.processedDate && (
                      <>
                        <div className="col-md-6">
                          <label className="form-label fw-bold">Processed By</label>
                          <div className="p-2 bg-light rounded">
                            {allUsers[selectedRequest.processedBy] ? 
                              `${getFullName(allUsers[selectedRequest.processedBy])}` : 
                              'Unknown'
                            }
                          </div>
                        </div>
                        <div className="col-md-6">
                          <label className="form-label fw-bold">Processed On</label>
                          <div className="p-2 bg-light rounded">
                            {new Date(selectedRequest.processedDate).toLocaleDateString()}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => setSelectedRequest(null)}
                  >
                    <i className="fas fa-times me-1"></i>
                    Close
                  </button>
                  {canApprove(selectedRequest) && (
                    <>
                      <button 
                        type="button" 
                        className="btn btn-danger"
                        onClick={() => handleProcess(selectedRequest.id, 'rejected')}
                      >
                        <i className="fas fa-times me-1"></i>
                        Reject
                      </button>
                      <button 
                        type="button" 
                        className="btn btn-success"
                        onClick={() => handleProcess(selectedRequest.id, 'approved')}
                      >
                        <i className="fas fa-check me-1"></i>
                        Approve
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}