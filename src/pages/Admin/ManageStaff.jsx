import { useState, useMemo, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import { getFullName, getUserById } from '../../config/seedUsers'

export default function ManageStaff(){
  const { 
    allUsers, 
    updateStaff, 
    deactivateUser, 
    reactivateUser, 
    locations, 
    departments,
    saveFilterState,
    getFilterState
  } = useAuth()
  
  // FILTER STATE PERSISTENCE
  const savedFilters = getFilterState('admin-manage-staff') || {
    search: '',
    department: '',
    role: '',
    status: 'active',
    manager: ''
  }

  const [filters, setFilters] = useState(savedFilters)
  const [sortConfig, setSortConfig] = useState({
    key: 'staffName',
    direction: 'asc'
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(25)
  const [editingUser, setEditingUser] = useState(null)
  const [editForm, setEditForm] = useState({})
  
  // DEACTIVATION MODALS - REPLACE BROWSER ALERTS
  const [showDeactivateModal, setShowDeactivateModal] = useState(null)
  const [deactivateReason, setDeactivateReason] = useState('')
  const [showCeoReplacementModal, setShowCeoReplacementModal] = useState(null)
  const [replacementCeoEmail, setReplacementCeoEmail] = useState('')

  const departmentsList = Object.values(departments).filter(dept => dept.isActive)
  const locationsList = Object.values(locations).filter(loc => loc.isActive)
  const managers = Object.entries(allUsers).filter(([email, user]) => 
    user.isManager && user.isActive
  )

  // Convert allUsers object to array with computed fields
  const usersArray = useMemo(() => {
    return Object.entries(allUsers)
      .filter(([email, user]) => user.role !== 'system')
      .map(([email, user]) => ({ 
        ...user, 
        email, 
        staffName: getFullName(user),
        managerName: user.managerId ? getFullName(getUserById(user.managerId)) : 'None',
        locationName: user.assignedLocationId ? locations[user.assignedLocationId]?.name : 'Unknown'
      }))
  }, [allUsers, locations])

  // Advanced filtering and sorting
  const filteredAndSortedStaff = useMemo(() => {
    let filtered = usersArray

    // Apply filters
    if (filters.search) {
      filtered = filtered.filter(user => 
        user.staffName.toLowerCase().includes(filters.search.toLowerCase()) ||
        user.email.toLowerCase().includes(filters.search.toLowerCase()) ||
        user.jobTitle?.toLowerCase().includes(filters.search.toLowerCase())
      )
    }

    if (filters.department) {
      filtered = filtered.filter(user => user.department === filters.department)
    }

    if (filters.role) {
      filtered = filtered.filter(user => user.role === filters.role)
    }

    if (filters.manager) {
      filtered = filtered.filter(user => user.managerId === filters.manager)
    }

    // Updated status filtering
    if (filters.status !== 'all') {
      if (filters.status === 'verified') {
        filtered = filtered.filter(user => user.verified === true)
      } else if (filters.status === 'unverified') {
        filtered = filtered.filter(user => user.verified === false)
      } else if (filters.status === 'active') {
        filtered = filtered.filter(user => user.isActive === true)
      } else if (filters.status === 'inactive') {
        filtered = filtered.filter(user => user.isActive === false)
      } else if (filters.status === 'on_duty') {
        filtered = filtered.filter(user => user.isClockedIn === true)
      } else if (filters.status === 'managers') {
        filtered = filtered.filter(user => user.isManager === true)
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
  }, [usersArray, filters, sortConfig])

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedStaff.length / itemsPerPage)
  const paginatedStaff = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredAndSortedStaff.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredAndSortedStaff, currentPage, itemsPerPage])

  // Reset pagination when filters change and save filter state
  const handleFilterChange = useCallback((newFilters) => {
    setFilters(newFilters)
    setCurrentPage(1)
    saveFilterState('admin-manage-staff', newFilters) // PERSIST FILTERS
  }, [saveFilterState])

  // Sorting handler
  const handleSort = useCallback((key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }, [])

  const startEdit = (user) => {
    setEditingUser(user.email)
    setEditForm({
      firstName: user.firstName,
      lastName: user.lastName,
      department: user.department,
      jobTitle: user.jobTitle || '',
      role: user.role,
      isManager: user.isManager,
      managerId: user.managerId || '',
      isActive: user.isActive,
      verified: user.verified,
      assignedLocationId: user.assignedLocationId || ''
    })
  }

  const saveEdit = () => {
    const userToUpdate = allUsers[editingUser]
    
    // Validation
    if (editForm.role === 'ceo' && editForm.managerId) {
      setEditForm(prev => ({ ...prev, managerId: '' }))
      return
    }
    
    if ((editForm.role === 'admin' || editForm.role === 'security') && editForm.isManager) {
      setEditForm(prev => ({ ...prev, isManager: false }))
      return
    }
    
    if (editForm.role !== 'ceo' && !editForm.managerId) {
      return // Don't save without manager
    }

    updateStaff(editingUser, editForm)
    setEditingUser(null)
    setEditForm({})
  }

  const cancelEdit = () => {
    setEditingUser(null)
    setEditForm({})
  }

  // HANDLE DEACTIVATION - CEO CHECK
  const handleDeactivateUser = async () => {
    const userToDeactivate = allUsers[showDeactivateModal.email]
    
    // CHECK IF CEO NEEDS REPLACEMENT
    if (userToDeactivate.role === 'ceo') {
      setShowCeoReplacementModal(showDeactivateModal)
      setShowDeactivateModal(null)
      return
    }

    // REGULAR USER DEACTIVATION
    if (!deactivateReason.trim()) {
      return // Don't proceed without reason
    }

    try {
      await deactivateUser(showDeactivateModal.email, deactivateReason)
      setShowDeactivateModal(null)
      setDeactivateReason('')
      // SUCCESS NOTIFICATION - NO BROWSER ALERT
    } catch (err) {
      console.error('Deactivation error:', err.message)
      // ERROR NOTIFICATION - NO BROWSER ALERT
    }
  }

  // CEO DEACTIVATION WITH REPLACEMENT
  const handleCeoDeactivation = async () => {
    if (!replacementCeoEmail) {
      return // Don't proceed without replacement
    }

    if (!deactivateReason.trim()) {
      return // Don't proceed without reason
    }

    try {
      await deactivateUser(showCeoReplacementModal.email, deactivateReason, replacementCeoEmail)
      setShowCeoReplacementModal(null)
      setReplacementCeoEmail('')
      setDeactivateReason('')
      // SUCCESS NOTIFICATION - NO BROWSER ALERT
    } catch (err) {
      console.error('CEO deactivation error:', err.message)
      // ERROR NOTIFICATION - NO BROWSER ALERT
    }
  }

  const handleReactivateUser = async (email) => {
    try {
      await reactivateUser(email)
      // SUCCESS NOTIFICATION - NO BROWSER ALERT
    } catch (err) {
      console.error('Reactivation error:', err.message)
      // ERROR NOTIFICATION - NO BROWSER ALERT
    }
  }

  const clearFilters = () => {
    const defaultFilters = {
      search: '',
      department: '',
      role: '',
      status: 'active',
      manager: ''
    }
    setFilters(defaultFilters)
    setCurrentPage(1)
    saveFilterState('admin-manage-staff', defaultFilters) // PERSIST CLEAR
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

  // Get potential managers for editing
  const getPotentialManagers = (role, department) => {
    const usersList = Object.values(allUsers)
    
    if (role === 'ceo') return []
    
    if (role === 'admin' || role === 'security') {
      return usersList.filter(user => 
        (user.role === 'admin' || user.role === 'ceo') && 
        user.isActive
      )
    }
    
    if (department) {
      const departmentManagers = usersList.filter(user => 
        user.department === department &&
        user.isManager && 
        user.role === 'staff' &&
        user.isActive
      )
      
      if (departmentManagers.length > 0) {
        return departmentManagers
      }
    }
    
    return usersList.filter(user => 
      user.isManager && user.isActive
    )
  }

  // Get potential CEO replacements (active staff who are managers)
  const getPotentialCeoReplacements = () => {
    return Object.entries(allUsers).filter(([email, user]) => 
      user.role === 'staff' && 
      user.isActive && 
      user.isManager
    )
  }

  // Statistics
  const stats = useMemo(() => {
    return {
      total: usersArray.length,
      active: usersArray.filter(u => u.isActive).length,
      inactive: usersArray.filter(u => !u.isActive).length,
      managers: usersArray.filter(u => u.isManager).length,
      unverified: usersArray.filter(u => !u.verified).length,
      onDuty: usersArray.filter(u => u.isClockedIn).length
    }
  }, [usersArray])

  return (
    <div>
      <div className="page-header">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h2 className="page-title">Manage Staff</h2>
            <p className="mb-0 text-muted">Showing {filteredAndSortedStaff.length} of {usersArray.length} staff members</p>
          </div>
        </div>
      </div>
      
      <div className="page-content">
        {/* Statistics Cards */}
        <div className="row g-3 mb-4">
          <div className="col-md-2">
            <div className="card text-center">
              <div className="card-body">
                <h4 className="text-primary">{stats.total}</h4>
                <p className="mb-0 small">Total Staff</p>
              </div>
            </div>
          </div>
          <div className="col-md-2">
            <div className="card text-center">
              <div className="card-body">
                <h4 className="text-success">{stats.active}</h4>
                <p className="mb-0 small">Active</p>
              </div>
            </div>
          </div>
          <div className="col-md-2">
            <div className="card text-center">
              <div className="card-body">
                <h4 className="text-danger">{stats.inactive}</h4>
                <p className="mb-0 small">Inactive</p>
              </div>
            </div>
          </div>
          <div className="col-md-2">
            <div className="card text-center">
              <div className="card-body">
                <h4 className="text-info">{stats.managers}</h4>
                <p className="mb-0 small">Managers</p>
              </div>
            </div>
          </div>
          <div className="col-md-2">
            <div className="card text-center">
              <div className="card-body">
                <h4 className="text-warning">{stats.unverified}</h4>
                <p className="mb-0 small">Unverified</p>
              </div>
            </div>
          </div>
          <div className="col-md-2">
            <div className="card text-center">
              <div className="card-body">
                <h4 className="text-secondary">{stats.onDuty}</h4>
                <p className="mb-0 small">On Duty</p>
              </div>
            </div>
          </div>
        </div>

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
                    placeholder="Name, email, or job title..."
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
                  {departmentsList.map(dept => (
                    <option key={dept.id} value={dept.name}>{dept.name}</option>
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
                    <option key={manager.id} value={manager.id}>
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
                  <option value="active">Active Users</option>
                  <option value="inactive">Inactive Users</option>
                  <option value="verified">Verified</option>
                  <option value="unverified">Unverified</option>
                  <option value="on_duty">On Duty</option>
                  <option value="managers">Managers Only</option>
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
                            Name & Job Title
                            <i className={getSortIcon('staffName')}></i>
                          </div>
                        </th>
                        <th 
                          role="button" 
                          onClick={() => handleSort('email')}
                          className="user-select-none"
                        >
                          <div className="d-flex justify-content-between align-items-center">
                            Contact
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
                        <th 
                          role="button" 
                          onClick={() => handleSort('managerName')}
                          className="user-select-none"
                        >
                          <div className="d-flex justify-content-between align-items-center">
                            Reports To
                            <i className={getSortIcon('managerName')}></i>
                          </div>
                        </th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedStaff.map(user => (
                        <tr key={user.email}>
                          <td>
                            {editingUser === user.email ? (
                              <div className="row g-2">
                                <div className="col-6">
                                  <input 
                                    className="form-control form-control-sm"
                                    placeholder="First Name"
                                    value={editForm.firstName || ''}
                                    onChange={(e) => setEditForm(prev => ({...prev, firstName: e.target.value}))}
                                  />
                                </div>
                                <div className="col-6">
                                  <input 
                                    className="form-control form-control-sm"
                                    placeholder="Last Name"
                                    value={editForm.lastName || ''}
                                    onChange={(e) => setEditForm(prev => ({...prev, lastName: e.target.value}))}
                                  />
                                </div>
                                <div className="col-12">
                                  <input 
                                    className="form-control form-control-sm"
                                    placeholder="Job Title"
                                    value={editForm.jobTitle || ''}
                                    onChange={(e) => setEditForm(prev => ({...prev, jobTitle: e.target.value}))}
                                  />
                                </div>
                              </div>
                            ) : (
                              <div>
                                <div className="fw-semibold">{user.staffName}</div>
                                {user.jobTitle && <div className="text-muted small">{user.jobTitle}</div>}
                                <div className="d-flex gap-1 mt-1">
                                  {user.isManager && <span className="badge bg-info">Manager</span>}
                                  {user.role === 'ceo' && <span className="badge bg-warning text-dark">CEO</span>}
                                </div>
                              </div>
                            )}
                          </td>
                          <td>
                            <div className="text-muted small">{user.email}</div>
                            <div className="text-muted small">{user.phone}</div>
                          </td>
                          <td>
                            {editingUser === user.email ? (
                              <select 
                                className="form-select form-select-sm"
                                value={editForm.department || ''}
                                onChange={(e) => setEditForm(prev => ({...prev, department: e.target.value}))}
                              >
                                <option value="">Select Department</option>
                                {departmentsList.map(dept => (
                                  <option key={dept.id} value={dept.name}>{dept.name}</option>
                                ))}
                              </select>
                            ) : (
                              <span className="badge bg-light text-dark">{user.department}</span>
                            )}
                          </td>
                          <td>
                            {editingUser === user.email ? (
                              <div>
                                <select 
                                  className="form-select form-select-sm mb-2"
                                  value={editForm.role || ''}
                                  onChange={(e) => setEditForm(prev => ({
                                    ...prev, 
                                    role: e.target.value,
                                    isManager: e.target.value === 'ceo' ? true : 
                                              (e.target.value === 'admin' || e.target.value === 'security') ? false : prev.isManager,
                                    managerId: e.target.value === 'ceo' ? '' : prev.managerId
                                  }))}
                                >
                                  <option value="staff">Staff</option>
                                  <option value="admin">Admin</option>
                                  <option value="security">Security</option>
                                  <option value="ceo">CEO</option>
                                </select>
                                {editForm.role === 'staff' && (
                                  <div className="form-check">
                                    <input 
                                      type="checkbox" 
                                      className="form-check-input"
                                      checked={editForm.isManager || false}
                                      onChange={(e) => setEditForm(prev => ({...prev, isManager: e.target.checked}))}
                                    />
                                    <label className="form-check-label small">Manager</label>
                                  </div>
                                )}
                              </div>
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
                                value={editForm.managerId || ''}
                                onChange={(e) => setEditForm(prev => ({...prev, managerId: e.target.value}))}
                                disabled={editForm.role === 'ceo'}
                              >
                                <option value="">{editForm.role === 'ceo' ? 'No Manager (CEO)' : 'Select Manager'}</option>
                                {getPotentialManagers(editForm.role, editForm.department).map(manager => (
                                  <option key={manager.id} value={manager.id}>
                                    {getFullName(manager)} ({manager.jobTitle || manager.role})
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <span className="text-muted small">{user.managerName}</span>
                            )}
                          </td>
                          <td>
                            <div className="d-flex flex-column gap-1">
                              {!user.isActive && <span className="badge bg-danger">Inactive</span>}
                              {!user.verified && <span className="badge bg-warning text-dark">Unverified</span>}
                              {user.isClockedIn && user.isActive && <span className="badge bg-success">On Duty</span>}
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
                              <div className="btn-group btn-group-sm">
                                <button 
                                  className="btn btn-outline-primary"
                                  onClick={() => startEdit(user)}
                                >
                                  <i className="fas fa-edit"></i>
                                </button>
                                {user.isActive ? (
                                  <button 
                                    className="btn btn-outline-danger"
                                    onClick={() => setShowDeactivateModal(user)}
                                    title="Deactivate User"
                                  >
                                    <i className="fas fa-ban"></i>
                                  </button>
                                ) : (
                                  <button 
                                    className="btn btn-outline-success"
                                    onClick={() => handleReactivateUser(user.email)}
                                    title="Reactivate User"
                                  >
                                    <i className="fas fa-user-check"></i>
                                  </button>
                                )}
                              </div>
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

        {/* REGULAR DEACTIVATE USER MODAL - REPLACES BROWSER ALERTS */}
        {showDeactivateModal && (
          <div className="modal show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    <i className="fas fa-exclamation-triangle text-warning me-2"></i>
                    Deactivate User
                  </h5>
                  <button 
                    type="button" 
                    className="btn-close"
                    onClick={() => setShowDeactivateModal(null)}
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="alert alert-warning">
                    <strong>Warning:</strong> This action will deactivate the user account for{' '}
                    <strong>{getFullName(showDeactivateModal)}</strong>.
                    The user will no longer be able to log in or access the system.
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Reason for Deactivation *</label>
                    <textarea 
                      className="form-control"
                      value={deactivateReason}
                      onChange={(e) => setDeactivateReason(e.target.value)}
                      rows="3"
                      placeholder="Please provide a reason for deactivating this user..."
                      required
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => setShowDeactivateModal(null)}
                  >
                    Cancel
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-danger"
                    onClick={handleDeactivateUser}
                    disabled={!deactivateReason.trim()}
                  >
                    <i className="fas fa-ban me-1"></i>
                    Deactivate User
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CEO REPLACEMENT MODAL - NEW FEATURE */}
        {showCeoReplacementModal && (
          <div className="modal show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    <i className="fas fa-crown text-warning me-2"></i>
                    CEO Deactivation - Replacement Required
                  </h5>
                  <button 
                    type="button" 
                    className="btn-close"
                    onClick={() => setShowCeoReplacementModal(null)}
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="alert alert-danger">
                    <strong>Critical Action:</strong> You are about to deactivate the CEO account for{' '}
                    <strong>{getFullName(showCeoReplacementModal)}</strong>.
                    A replacement CEO must be appointed before proceeding.
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Select Replacement CEO *</label>
                    <select 
                      className="form-select"
                      value={replacementCeoEmail}
                      onChange={(e) => setReplacementCeoEmail(e.target.value)}
                      required
                    >
                      <option value="">Select a manager to promote to CEO</option>
                      {getPotentialCeoReplacements().map(([email, user]) => (
                        <option key={user.id} value={email}>
                          {getFullName(user)} - {user.jobTitle || user.role} ({user.department})
                        </option>
                      ))}
                    </select>
                    <small className="text-muted">
                      Only active managers are eligible for CEO promotion
                    </small>
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Reason for CEO Change *</label>
                    <textarea 
                      className="form-control"
                      value={deactivateReason}
                      onChange={(e) => setDeactivateReason(e.target.value)}
                      rows="3"
                      placeholder="Please provide a reason for this CEO change..."
                      required
                    />
                  </div>

                  {replacementCeoEmail && (
                    <div className="alert alert-info">
                      <h6 className="alert-heading">
                        <i className="fas fa-info-circle me-2"></i>
                        Changes Summary:
                      </h6>
                      <ul className="mb-0">
                        <li><strong>Current CEO:</strong> {getFullName(showCeoReplacementModal)} will be deactivated</li>
                        <li><strong>New CEO:</strong> {getFullName(allUsers[replacementCeoEmail])} will be promoted to CEO</li>
                        <li>The new CEO will automatically become a manager with no superior</li>
                        <li>All CEO privileges will be transferred immediately</li>
                      </ul>
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => setShowCeoReplacementModal(null)}
                  >
                    Cancel
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-danger"
                    onClick={handleCeoDeactivation}
                    disabled={!replacementCeoEmail || !deactivateReason.trim()}
                  >
                    <i className="fas fa-exchange-alt me-1"></i>
                    Transfer CEO & Deactivate
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