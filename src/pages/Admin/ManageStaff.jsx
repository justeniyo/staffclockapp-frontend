import { useState, useMemo, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import { getFullName } from '../../config/seedUsers'

export default function ManageStaff(){
  const { allUsers, updateStaff } = useAuth()
  const [filters, setFilters] = useState({
    search: '',
    department: '',
    role: '',
    status: 'all',
    manager: ''
  })
  const [sortConfig, setSortConfig] = useState({
    key: 'staffName',
    direction: 'asc'
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(25)
  const [editingUser, setEditingUser] = useState(null)
  const [editForm, setEditForm] = useState({})

  const departments = [...new Set(Object.values(allUsers).map(user => user.department).filter(Boolean))]
  const managers = Object.entries(allUsers).filter(([email, user]) => 
    user.isManager && user.role === 'staff'
  )

  // Advanced filtering and sorting
  const filteredAndSortedStaff = useMemo(() => {
    let filtered = Object.entries(allUsers)
      .filter(([email, user]) => user.role !== 'system')
      .map(([email, user]) => ({ ...user, email, staffName: getFullName(user) }))

    // Apply filters
    if (filters.search) {
      filtered = filtered.filter(user => 
        user.staffName.toLowerCase().includes(filters.search.toLowerCase()) ||
        user.email.toLowerCase().includes(filters.search.toLowerCase())
      )
    }

    if (filters.department) {
      filtered = filtered.filter(user => user.department === filters.department)
    }

    if (filters.role) {
      filtered = filtered.filter(user => user.role === filters.role)
    }

    if (filters.manager) {
      filtered = filtered.filter(user => user.manager === filters.manager)
    }

    if (filters.status !== 'all') {
      if (filters.status === 'verified') {
        filtered = filtered.filter(user => user.verified === true)
      } else if (filters.status === 'unverified') {
        filtered = filtered.filter(user => user.verified === false)
      } else if (filters.status === 'active') {
        filtered = filtered.filter(user => user.isActive === true)
      } else if (filters.status === 'inactive') {
        filtered = filtered.filter(user => user.isActive === false)
      } else if (filters.status === 'clocked_in') {
        filtered = filtered.filter(user => user.isClockedIn === true)
      }
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      let aValue = a[sortConfig.key]
      let bValue = b[sortConfig.key]

      // Handle different data types
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase()
        bValue = bValue.toLowerCase()
      } else if (typeof aValue === 'boolean') {
        aValue = aValue ? 1 : 0
        bValue = bValue ? 1 : 0
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
  }, [allUsers, filters, sortConfig])

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedStaff.length / itemsPerPage)
  const paginatedStaff = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredAndSortedStaff.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredAndSortedStaff, currentPage, itemsPerPage])

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

  const startEdit = (user) => {
    setEditingUser(user.email)
    setEditForm({...user})
  }

  const saveEdit = () => {
    updateStaff(editingUser, editForm)
    setEditingUser(null)
    setEditForm({})
  }

  const cancelEdit = () => {
    setEditingUser(null)
    setEditForm({})
  }

  const clearFilters = () => {
    setFilters({
      search: '',
      department: '',
      role: '',
      status: 'all',
      manager: ''
    })
    setCurrentPage(1)
  }

  const getRoleBadge = (role) => {
    const badges = {
      staff: 'bg-primary',
      admin: 'bg-danger',
      security: 'bg-warning text-dark',
      ceo: 'bg-success'
    }
    return badges[role] || 'bg-secondary'
  }

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return 'fas fa-sort text-muted'
    return sortConfig.direction === 'asc' ? 'fas fa-sort-up text-primary' : 'fas fa-sort-down text-primary'
  }

  return (
    <div>
      <div className="page-header">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h2 className="page-title">Manage Staff</h2>
            <p className="mb-0 text-muted">Showing {filteredAndSortedStaff.length} of {Object.keys(allUsers).length - 1} staff members</p>
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
                <label className="form-label">Search Staff</label>
                <div className="input-group">
                  <span className="input-group-text"><i className="fas fa-search"></i></span>
                  <input 
                    type="text" 
                    className="form-control"
                    value={filters.search}
                    onChange={(e) => handleFilterChange({...filters, search: e.target.value})}
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
                <label className="form-label">Role</label>
                <select 
                  className="form-select"
                  value={filters.role}
                  onChange={(e) => handleFilterChange({...filters, role: e.target.value})}
                >
                  <option value="">All Roles</option>
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                  <option value="security">Security</option>
                  <option value="ceo">CEO</option>
                </select>
              </div>
              <div className="col-lg-2 col-md-6">
                <label className="form-label">Manager</label>
                <select 
                  className="form-select"
                  value={filters.manager}
                  onChange={(e) => handleFilterChange({...filters, manager: e.target.value})}
                >
                  <option value="">All Managers</option>
                  {managers.map(([email, manager]) => (
                    <option key={email} value={email}>
                      {getFullName(manager)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-lg-3 col-md-6">
                <label className="form-label">Status</label>
                <select 
                  className="form-select"
                  value={filters.status}
                  onChange={(e) => handleFilterChange({...filters, status: e.target.value})}
                >
                  <option value="all">All Status</option>
                  <option value="verified">Verified</option>
                  <option value="unverified">Unverified</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="clocked_in">Currently Clocked In</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="card">
          <div className="card-header">
            <div className="d-flex justify-content-between align-items-center">
              <h6 className="mb-0">Staff Members</h6>
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
            {filteredAndSortedStaff.length === 0 ? (
              <div className="text-center py-5">
                <i className="fas fa-users fa-3x text-muted mb-3"></i>
                <p className="text-muted">No staff members found matching your criteria.</p>
                <button className="btn btn-outline-primary" onClick={clearFilters}>
                  Clear Filters
                </button>
              </div>
            ) : (
              <>
                {/* Responsive Table */}
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th 
                          role="button" 
                          onClick={() => handleSort('staffName')}
                          className="user-select-none"
                        >
                          <div className="d-flex justify-content-between align-items-center">
                            Name
                            <i className={getSortIcon('staffName')}></i>
                          </div>
                        </th>
                        <th 
                          role="button" 
                          onClick={() => handleSort('email')}
                          className="user-select-none"
                        >
                          <div className="d-flex justify-content-between align-items-center">
                            Email
                            <i className={getSortIcon('email')}></i>
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
                          onClick={() => handleSort('role')}
                          className="user-select-none"
                        >
                          <div className="d-flex justify-content-between align-items-center">
                            Role
                            <i className={getSortIcon('role')}></i>
                          </div>
                        </th>
                        <th>Manager</th>
                        <th 
                          role="button" 
                          onClick={() => handleSort('verified')}
                          className="user-select-none"
                        >
                          <div className="d-flex justify-content-between align-items-center">
                            Status
                            <i className={getSortIcon('verified')}></i>
                          </div>
                        </th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedStaff.map(user => (
                        <tr key={user.email}>
                          <td>
                            {editingUser === user.email ? (
                              <div className="row g-2">
                                <div className="col">
                                  <input 
                                    className="form-control form-control-sm"
                                    placeholder="First Name"
                                    value={editForm.firstName || ''}
                                    onChange={(e) => setEditForm(prev => ({...prev, firstName: e.target.value}))}
                                  />
                                </div>
                                <div className="col">
                                  <input 
                                    className="form-control form-control-sm"
                                    placeholder="Last Name"
                                    value={editForm.lastName || ''}
                                    onChange={(e) => setEditForm(prev => ({...prev, lastName: e.target.value}))}
                                  />
                                </div>
                              </div>
                            ) : (
                              <div>
                                <div className="fw-semibold">{user.staffName}</div>
                                <div className="d-flex gap-1 mt-1">
                                  {user.isManager && <span className="badge bg-info">Manager</span>}
                                  {user.isClockedIn && <span className="badge bg-success">Active</span>}
                                </div>
                              </div>
                            )}
                          </td>
                          <td>
                            <span className="text-muted">{user.email}</span>
                          </td>
                          <td>
                            {editingUser === user.email ? (
                              <select 
                                className="form-select form-select-sm"
                                value={editForm.department || ''}
                                onChange={(e) => setEditForm(prev => ({...prev, department: e.target.value}))}
                              >
                                <option value="">Select Department</option>
                                {departments.map(dept => (
                                  <option key={dept} value={dept}>{dept}</option>
                                ))}
                              </select>
                            ) : (
                              <span className="badge bg-light text-dark">{user.department}</span>
                            )}
                          </td>
                          <td>
                            {editingUser === user.email ? (
                              <select 
                                className="form-select form-select-sm"
                                value={editForm.role || ''}
                                onChange={(e) => setEditForm(prev => ({...prev, role: e.target.value}))}
                              >
                                <option value="staff">Staff</option>
                                <option value="admin">Admin</option>
                                <option value="security">Security</option>
                                <option value="ceo">CEO</option>
                              </select>
                            ) : (
                              <span className={`badge ${getRoleBadge(user.role)}`}>
                                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                              </span>
                            )}
                          </td>
                          <td>
                            {editingUser === user.email ? (
                              <select 
                                className="form-select form-select-sm"
                                value={editForm.manager || ''}
                                onChange={(e) => setEditForm(prev => ({...prev, manager: e.target.value}))}
                              >
                                <option value="">No Manager</option>
                                {managers.map(([managerEmail, manager]) => (
                                  <option key={managerEmail} value={managerEmail}>
                                    {getFullName(manager)}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <span className="text-muted small">
                                {user.manager ? getFullName(allUsers[user.manager]) || 'Unknown' : 'None'}
                              </span>
                            )}
                          </td>
                          <td>
                            <div className="d-flex flex-column gap-1">
                              <span className={`badge ${user.verified ? 'bg-success' : 'bg-warning text-dark'}`}>
                                <i className={`fas ${user.verified ? 'fa-check-circle' : 'fa-clock'} me-1`}></i>
                                {user.verified ? 'Verified' : 'Pending'}
                              </span>
                              {!user.isActive && <span className="badge bg-danger">Inactive</span>}
                            </div>
                          </td>
                          <td>
                            {editingUser === user.email ? (
                              <div className="btn-group btn-group-sm">
                                <button className="btn btn-success" onClick={saveEdit}>
                                  <i className="fas fa-check"></i>
                                </button>
                                <button className="btn btn-secondary" onClick={cancelEdit}>
                                  <i className="fas fa-times"></i>
                                </button>
                              </div>
                            ) : (
                              <button 
                                className="btn btn-outline-primary btn-sm"
                                onClick={() => startEdit(user)}
                              >
                                <i className="fas fa-edit me-1"></i>
                                Edit
                              </button>
                            )}
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
                      Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredAndSortedStaff.length)} of {filteredAndSortedStaff.length} entries
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