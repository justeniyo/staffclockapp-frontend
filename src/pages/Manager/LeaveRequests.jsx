import { useState, useMemo, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'

export default function LeaveRequests() {
  const { leaveRequests, processLeaveRequest, user, allUsers, saveFilterState, getFilterState } = useAuth()
  
  // FILTER STATE PERSISTENCE
  const savedFilters = getFilterState('manager-leave-requests') || {
    search: '',
    type: '',
    status: 'all',
    dateFrom: '',
    dateTo: ''
  }

  const [filters, setFilters] = useState(savedFilters)
  const [sortConfig, setSortConfig] = useState({
    key: 'requestDate',
    direction: 'desc'
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(25)
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [processingNotes, setProcessingNotes] = useState('')
  const [actionType, setActionType] = useState('') // 'approve' or 'reject'

  // Get team members who report to this manager
  const teamMembers = Object.values(allUsers).filter(staff => staff.managerId === user.id)
  const teamIds = teamMembers.map(member => member.id)
  
  // Advanced filtering and sorting
  const filteredAndSortedRequests = useMemo(() => {
    // Filter to only show requests from team members
    let filtered = leaveRequests.filter(req => teamIds.includes(req.staffId))

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

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1
      }
      return 0
    })

    return sorted
  }, [leaveRequests, teamIds, filters, sortConfig])

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedRequests.length / itemsPerPage)
  const paginatedRequests = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredAndSortedRequests.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredAndSortedRequests, currentPage, itemsPerPage])

  // Reset pagination when filters change and save filter state
  const handleFilterChange = useCallback((newFilters) => {
    setFilters(newFilters)
    setCurrentPage(1)
    saveFilterState('manager-leave-requests', newFilters) // PERSIST FILTERS
  }, [saveFilterState])

  // Sorting handler
  const handleSort = useCallback((key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }, [])

  const requiresNotes = (type) => {
    return type === 'Emergency' || type === 'Sick'
  }

  // UPDATED: Handle processing with required rejection notes
  const handleProcess = (requestId, status) => {
    try {
      const request = filteredAndSortedRequests.find(req => req.id === requestId)
      
      // REQUIRE REJECTION REASON
      if (status === 'rejected' && !processingNotes.trim()) {
        throw new Error('Rejection reason is required')
      }
      
      // For Emergency and Sick leaves, require notes for approval too
      if (requiresNotes(request?.type) && status !== 'pending' && !processingNotes.trim()) {
        throw new Error(`Processing notes are required for ${request.type} leave requests`)
      }
      
      processLeaveRequest(requestId, status, processingNotes)
      setSelectedRequest(null)
      setProcessingNotes('')
      setActionType('')
    } catch (error) {
      alert(error.message)
    }
  }

  const openRequestModal = (request, action = '') => {
    setSelectedRequest(request)
    setProcessingNotes('')
    setActionType(action)
  }

  const clearFilters = () => {
    const defaultFilters = {
      search: '',
      type: '',
      status: 'all',
      dateFrom: '',
      dateTo: ''
    }
    setFilters(defaultFilters)
    setCurrentPage(1)
    saveFilterState('manager-leave-requests', defaultFilters) // PERSIST CLEAR
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

  const getTypeIcon = (type) => {
    const icons = {
      Annual: 'fa-calendar',
      Sick: 'fa-thermometer-half',
      Personal: 'fa-user',
      Emergency: 'fa-exclamation-triangle'
    }
    return icons[type] || 'fa-question'
  }

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return 'fas fa-sort text-muted'
    return sortConfig.direction === 'asc' ? 'fas fa-sort-up text-primary' : 'fas fa-sort-down text-primary'
  }

  const getDurationInDays = (startDate, endDate) => {
    return Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)) + 1
  }

  return (
    <div>
      <div className="page-header">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h2 className="page-title">Team Leave Requests</h2>
            <p className="mb-0 text-muted">
              Showing {filteredAndSortedRequests.length} of {leaveRequests.filter(req => teamIds.includes(req.staffId)).length} requests
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
              <div className="col-lg-3 col-md-6">
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
              <div className="col-lg-5 col-md-6">
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
                        return (
                          <tr key={req.id}>
                            <td>
                              <div className="fw-semibold">{req.staffName}</div>
                              <small className="text-muted">{req.department}</small>
                            </td>
                            <td>
                              <span className={`badge bg-light text-dark ${getTypeColor(req.type)}`}>
                                <i className={`fas ${getTypeIcon(req.type)} me-1`}></i>
                                {req.type}
                              </span>
                              {requiresNotes(req.type) && (
                                <div className="mt-1">
                                  <small className="badge bg-info">Requires Notes</small>
                                </div>
                              )}
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
                              {req.status === 'pending' ? (
                                <div className="btn-group btn-group-sm">
                                  <button 
                                    className="btn btn-outline-success"
                                    onClick={() => openRequestModal(req, 'approve')}
                                    title="Approve Request"
                                  >
                                    <i className="fas fa-check"></i>
                                  </button>
                                  <button 
                                    className="btn btn-outline-danger"
                                    onClick={() => openRequestModal(req, 'reject')}
                                    title="Reject Request"
                                  >
                                    <i className="fas fa-times"></i>
                                  </button>
                                </div>
                              ) : (
                                <button 
                                  className="btn btn-outline-primary btn-sm"
                                  onClick={() => openRequestModal(req)}
                                >
                                  <i className="fas fa-eye me-1"></i>
                                  View
                                </button>
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

        {/* UPDATED: Enhanced Review Modal with Required Rejection Notes */}
        {selectedRequest && (
          <div className="modal show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    <i className="fas fa-calendar-check me-2"></i>
                    {actionType === 'approve' ? 'Approve' : actionType === 'reject' ? 'Reject' : 'Review'} Leave Request
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
                      <div className="p-2 bg-light rounded">{selectedRequest.staffName}</div>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold">Department</label>
                      <div className="p-2 bg-light rounded">{selectedRequest.department}</div>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold">Leave Type</label>
                      <div className="p-2 bg-light rounded">
                        <span className={getTypeColor(selectedRequest.type)}>
                          <i className={`fas ${getTypeIcon(selectedRequest.type)} me-1`}></i>
                          {selectedRequest.type}
                        </span>
                        {requiresNotes(selectedRequest.type) && (
                          <span className="badge bg-warning text-dark ms-2">Notes Required</span>
                        )}
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
                    
                    {/* Show reason if it exists */}
                    {selectedRequest.reason && (
                      <div className="col-12">
                        <label className="form-label fw-bold">Reason</label>
                        <div className="p-2 bg-light rounded">{selectedRequest.reason}</div>
                      </div>
                    )}
                    
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
                    
                    {/* Show existing processing notes if any */}
                    {selectedRequest.processingNotes && (
                      <div className="col-12">
                        <label className="form-label fw-bold">Previous Notes</label>
                        <div className="p-2 bg-light rounded">{selectedRequest.processingNotes}</div>
                      </div>
                    )}
                    
                    {/* UPDATED: Processing notes input - required for all types when rejecting */}
                    {selectedRequest.status === 'pending' && (
                      <div className="col-12">
                        <label className="form-label fw-bold">
                          {actionType === 'reject' ? 'Rejection Reason' : 'Processing Notes'}
                          {(requiresNotes(selectedRequest.type) || actionType === 'reject') && (
                            <span className="text-danger"> *</span>
                          )}
                        </label>
                        <textarea 
                          className="form-control"
                          value={processingNotes}
                          onChange={(e) => setProcessingNotes(e.target.value)}
                          rows="3"
                          placeholder={
                            actionType === 'reject' 
                              ? 'Please provide a reason for rejecting this request...'
                              : `Add notes for this ${selectedRequest.type.toLowerCase()} leave request...`
                          }
                        />
                        <small className="text-muted">
                          {actionType === 'reject' 
                            ? 'A rejection reason is required' 
                            : requiresNotes(selectedRequest.type)
                              ? `Notes are required when processing ${selectedRequest.type.toLowerCase()} leave requests`
                              : 'Add optional notes for this decision'
                          }
                        </small>
                      </div>
                    )}
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => {
                      setSelectedRequest(null)
                      setActionType('')
                      setProcessingNotes('')
                    }}
                  >
                    <i className="fas fa-times me-1"></i>
                    Close
                  </button>
                  {selectedRequest.status === 'pending' && (
                    <>
                      {actionType !== 'approve' && (
                        <button 
                          type="button" 
                          className="btn btn-danger"
                          onClick={() => handleProcess(selectedRequest.id, 'rejected')}
                          disabled={!processingNotes.trim()} // ALWAYS require notes for rejection
                        >
                          <i className="fas fa-times me-1"></i>
                          Reject
                        </button>
                      )}
                      {actionType !== 'reject' && (
                        <button 
                          type="button" 
                          className="btn btn-success"
                          onClick={() => handleProcess(selectedRequest.id, 'approved')}
                          disabled={requiresNotes(selectedRequest.type) && !processingNotes.trim()}
                        >
                          <i className="fas fa-check me-1"></i>
                          Approve
                        </button>
                      )}
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