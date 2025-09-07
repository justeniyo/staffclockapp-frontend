import { useState, useMemo, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import { getFullName, getUserById, isCEO } from '../../config/seedUsers'

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
  
  // ENHANCED: Filter state persistence with intelligent defaults
  const savedFilters = getFilterState('admin-manage-staff') || {
    search: '',
    department: '',
    role: '',
    status: 'active',
    manager: '',
    location: '',
    accessLevel: '',
    hierarchy: ''
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
  
  // ENHANCED: Deactivation modals with CEO handling
  const [showDeactivateModal, setShowDeactivateModal] = useState(null)
  const [deactivateReason, setDeactivateReason] = useState('')
  const [showCeoReplacementModal, setShowCeoReplacementModal] = useState(null)
  const [replacementCeoEmail, setReplacementCeoEmail] = useState('')

  const departmentsList = Object.values(departments).filter(dept => dept.isActive)
  const locationsList = Object.values(locations).filter(loc => loc.isActive)
  
  // ENHANCED: Smart manager filtering based on selected department
  const getRelevantManagers = () => {
    const allManagers = Object.entries(allUsers).filter(([email, user]) => 
      user.isManager && user.isActive
    )
    
    if (filters.department) {
      // First show managers from the same department
      const sameDeptManagers = allManagers.filter(([email, user]) => 
        user.department === filters.department
      )
      
      // Then add executives and CEO
      const executives = allManagers.filter(([email, user]) => 
        user.department === 'Executive' || isCEO(user)
      )
      
      // Combine and deduplicate
      const combined = [...sameDeptManagers, ...executives]
      const unique = combined.filter((item, index, self) => 
        index === self.findIndex(t => t[1].id === item[1].id)
      )
      
      return unique
    }
    
    return allManagers
  }

  const relevantManagers = getRelevantManagers()

  // ENHANCED: Convert allUsers object to array with computed fields and CEO handling
  const usersArray = useMemo(() => {
    return Object.entries(allUsers)
      .filter(([email, user]) => user.role !== 'system')
      .map(([email, user]) => ({ 
        ...user, 
        email, 
        staffName: getFullName(user),
        managerName: user.managerId ? getFullName(getUserById(user.managerId)) : 'None',
        locationName: user.assignedLocationId ? locations[user.assignedLocationId]?.name : 'Unknown',
        displayRole: isCEO(user) ? 'CEO (Staff)' : user.role,
        hierarchyLevel: getHierarchyLevel(user),
        canAccessManagerPortal: user.isManager && user.role === 'staff'
      }))
  }, [allUsers, locations])

  // Helper function to determine hierarchy level
  const getHierarchyLevel = (user) => {
    if (isCEO(user)) return 'Executive - CEO'
    if (user.role === 'admin') return 'System - Admin'
    if (user.role === 'security') return 'Security - Guard'
    if (user.department === 'Executive' && user.isManager) return 'Executive - C-Level'
    if (user.isManager) return 'Management - Department'
    return 'Staff - Regular'
  }

  // ENHANCED: Advanced filtering and sorting with intelligent logic
  const filteredAndSortedStaff = useMemo(() => {
    let filtered = usersArray

    // Apply filters with enhanced logic
    if (filters.search) {
      filtered = filtered.filter(user => 
        user.staffName.toLowerCase().includes(filters.search.toLowerCase()) ||
        user.email.toLowerCase().includes(filters.search.toLowerCase()) ||
        user.jobTitle?.toLowerCase().includes(filters.search.toLowerCase()) ||
        user.phone?.includes(filters.search)
      )
    }

    if (filters.department) {
      filtered = filtered.filter(user => user.department === filters.department)
    }

    if (filters.role) {
      if (filters.role === 'ceo') {
        filtered = filtered.filter(user => isCEO(user))
      } else {
        filtered = filtered.filter(user => user.role === filters.role && !isCEO(user))
      }
    }

    if (filters.manager) {
      filtered = filtered.filter(user => user.managerId === filters.manager)
    }

    if (filters.location) {
      filtered = filtered.filter(user => user.assignedLocationId === filters.location)
    }

    if (filters.accessLevel) {
      if (filters.accessLevel === 'ceo') {
        filtered = filtered.filter(user => isCEO(user))
      } else if (filters.accessLevel === 'executive') {
        filtered = filtered.filter(user => user.department === 'Executive' && !isCEO(user))
      } else if (filters.accessLevel === 'manager') {
        filtered = filtered.filter(user => user.isManager && user.role === 'staff' && !isCEO(user))
      } else if (filters.accessLevel === 'staff') {
        filtered = filtered.filter(user => !user.isManager && user.role === 'staff')
      }
    }

    if (filters.hierarchy) {
      filtered = filtered.filter(user => user.hierarchyLevel === filters.hierarchy)
    }

    // ENHANCED: Status filtering with more options
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
      } else if (filters.status === 'ceo_reports') {
        const ceo = Object.values(allUsers).find(u => isCEO(u))
        filtered = filtered.filter(user => user.managerId === ceo?.id)
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
      subRole: user.subRole || '',
      isManager: user.isManager,
      managerId: user.managerId || '',
      isActive: user.isActive,
      verified: user.verified,
      assignedLocationId: user.assignedLocationId || ''
    })
  }

  const saveEdit = () => {
    const userToUpdate = allUsers[editingUser]
    
    // ENHANCED: Validation with CEO handling
    if (editForm.subRole === 'ceo' && editForm.managerId) {
      setEditForm(prev => ({ ...prev, managerId: '' }))
      return
    }
    
    if ((editForm.role === 'admin' || editForm.role === 'security') && editForm.isManager) {
      setEditForm(prev => ({ ...prev, isManager: false }))
      return
    }
    
    if (editForm.role !== 'admin' && editForm.role !== 'security' && editForm.subRole !== 'ceo' && !editForm.managerId) {
      return // Don't save without manager
    }

    // CEO gets automatic manager privileges
    if (editForm.subRole === 'ceo') {
      editForm.isManager = true
      editForm.department = 'Executive'
    }

    updateStaff(editingUser, editForm)
    setEditingUser(null)
    setEditForm({})
  }

  const cancelEdit = () => {
    setEditingUser(null)
    setEditForm({})
  }

  // ENHANCED: Handle deactivation with CEO protection
  const handleDeactivateUser = async () => {
    const userToDeactivate = allUsers[showDeactivateModal.email]
    
    // CHECK IF CEO NEEDS REPLACEMENT
    if (isCEO(userToDeactivate)) {
      setShowCeoReplacementModal(showDeactivateModal)
      setShowDeactivateModal(null)
      return
    }

    if (!deactivateReason.trim()) {
      return
    }

    try {
      await deactivateUser(showDeactivateModal.email, deactivateReason)
      setShowDeactivateModal(null)
      setDeactivateReason('')
    } catch (err) {
      console.error('Deactivation error:', err.message)
    }
  }

  // ENHANCED: CEO deactivation with replacement
  const handleCeoDeactivation = async () => {
    if (!replacementCeoEmail || !deactivateReason.trim()) {
      return
    }

    try {
      await deactivateUser(showCeoReplacementModal.email, deactivateReason, replacementCeoEmail)
      setShowCeoReplacementModal(null)
      setReplacementCeoEmail('')
      setDeactivateReason('')
    } catch (err) {
      console.error('CEO deactivation error:', err.message)
    }
  }

  const handleReactivateUser = async (email) => {
    try {
      await reactivateUser(email)
    } catch (err) {
      console.error('Reactivation error:', err.message)
    }
  }

  const clearFilters = () => {
    const defaultFilters = {
      search: '',
      department: '',
      role: '',
      status: 'active',
      manager: '',
      location: '',
      accessLevel: '',
      hierarchy: ''
    }
    setFilters(defaultFilters)
    setCurrentPage(1)
    saveFilterState('admin-manage-staff', defaultFilters)
  }

  // ENHANCED: Quick filter presets
  const applyQuickFilter = (preset) => {
    let newFilters = { ...filters }
    
    switch (preset) {
      case 'ceo_team':
        const ceo = Object.values(allUsers).find(u => isCEO(u))
        newFilters = { ...filters, manager: ceo?.id || '', status: 'active' }
        break
      case 'managers':
        newFilters = { ...filters, status: 'managers', role: '' }
        break
      case 'unverified':
        newFilters = { ...filters, status: 'unverified' }
        break
      case 'executives':
        newFilters = { ...filters, department: 'Executive', status: 'active' }
        break
      case 'on_duty':
        newFilters = { ...filters, status: 'on_duty' }
        break
      default:
        break
    }
    
    handleFilterChange(newFilters)
  }

  const getRoleBadge = (user) => {
    if (isCEO(user)) return 'bg-warning text-dark'
    
    const badges = {
      staff: 'bg-primary',
      admin: 'bg-danger',
      security: 'bg-info'
    }
    return badges[user.role] || 'bg-secondary'
  }

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return 'fas fa-sort text-muted'
    return sortConfig.direction === 'asc' ? 'fas fa-sort-up text-primary' : 'fas fa-sort-down text-primary'
  }

  // ENHANCED: Get potential managers with smart filtering
  const getPotentialManagers = (role, subRole, department) => {
    const usersList = Object.values(allUsers)
    
    if (subRole === 'ceo') return []
    
    if (role === 'admin' || role === 'security') {
      return usersList.filter(user => 
        (user.role === 'admin' || isCEO(user)) && 
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

  // Get potential CEO replacements
  const getPotentialCeoReplacements = () => {
    return Object.entries(allUsers).filter(([email, user]) => 
      user.role === 'staff' && 
      user.isActive && 
      user.isManager &&
      !isCEO(user)
    )
  }

  // ENHANCED: Statistics with CEO and hierarchy awareness
  const stats = useMemo(() => {
    return {
      total: usersArray.length,
      active: usersArray.filter(u => u.isActive).length,
      inactive: usersArray.filter(u => !u.isActive).length,
      managers: usersArray.filter(u => u.isManager).length,
      unverified: usersArray.filter(u => !u.verified).length,
      onDuty: usersArray.filter(u => u.isClockedIn).length,
      ceo: usersArray.filter(u => isCEO(u)).length,
      executives: usersArray.filter(u => u.department === 'Executive' && !isCEO(u)).length
    }
  }, [usersArray])

  // ENHANCED: Get unique hierarchy levels for filtering
  const hierarchyLevels = [...new Set(usersArray.map(user => user.hierarchyLevel))].sort()

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
        {/* ENHANCED: Statistics Cards with CEO tracking */}
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
                <h4 className="text-warning">{stats.ceo}</h4>
                <p className="mb-0 small">CEO</p>
              </div>
            </div>
          </div>
          <div className="col-md-2">
            <div className="card text-center">
              <div className="card-body">
                <h4 className="text-info">{stats.executives}</h4>
                <p className="mb-0 small">Executives</p>
              </div>
            </div>
          </div>
          <div className="col-md-2">
            <div className="card text-center">
              <div className="card-body">
                <h4 className="text-secondary">{stats.managers}</h4>
                <p className="mb-0 small">Managers</p>
              </div>
            </div>
          </div>
          <div className="col-md-2">
            <div className="card text-center">
              <div className="card-body">
                <h4 className="text-danger">{stats.unverified}</h4>
                <p className="mb-0 small">Unverified</p>
              </div>
            </div>
          </div>
        </div>

        {/* ENHANCED: Quick Filter Presets */}
        <div className="card mb-4">
          <div className="card-header">
            <h6 className="mb-0">Quick Filters</h6>
          </div>
          <div className="card-body">
            <div className="d-flex flex-wrap gap-2">
              <button 
                className="btn btn-sm btn-outline-warning"
                onClick={() => applyQuickFilter('ceo_team')}
              >
                <i className="fas fa-crown me-1"></i>
                CEO's Team
              </button>
              <button 
                className="btn btn-sm btn-outline-primary"
                onClick={() => applyQuickFilter('executives')}
              >
                <i className="fas fa-users-cog me-1"></i>
                Executives
              </button>
              <button 
                className="btn btn-sm btn-outline-info"
                onClick={() => applyQuickFilter('managers')}
              >
                <i className="fas fa-user-tie me-1"></i>
                All Managers
              </button>
              <button 
                className="btn btn-sm btn-outline-success"
                onClick={() => applyQuickFilter('on_duty')}
              >
                <i className="fas fa-user-check me-1"></i>
                On Duty
              </button>
              <button 
                className="btn btn-sm btn-outline-danger"
                onClick={() => applyQuickFilter('unverified')}
              >
                <i className="fas fa-user-clock me-1"></i>
                Unverified
              </button>
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

        {/* ENHANCED: Advanced Filters with intelligent options */}
        <div className="card mb-4">
          <div className="card-header">
            <div className="d-flex justify-content-between align-items-center">
              <h6 className="mb-0">Advanced Filters</h6>
              <small className="text-muted">
                {filters.department && `Managers filtered for ${filters.department}`}
              </small>
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
                    placeholder="Name, email, phone, or job title..."
                  />
                </div>
              </div>
              <div className="col-lg-2 col-md-6">
                <label className="form-label">Department</label>
                <select 
                  className="form-select"
                  value={filters.department}
                  onChange={(e) => handleFilterChange({...filters, department: e.target.value, manager: ''})}
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
                  <option value="ceo">CEO</option>
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                  <option value="security">Security</option>
                </select>
              </div>
              <div className="col-lg-2 col-md-6">
                <label className="form-label">
                  Manager
                  {filters.department && (
                    <small className="text-info ms-1">({filters.department})</small>
                  )}
                </label>
                <select 
                  className="form-select"
                  value={filters.manager}
                  onChange={(e) => handleFilterChange({...filters, manager: e.target.value})}
                >
                  <option value="">All Managers</option>
                  {relevantManagers.map(([email, manager]) => (
                    <option key={manager.id} value={manager.id}>
                      {getFullName(manager)} {isCEO(manager) && '(CEO)'}
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
                  <option value="ceo_reports">CEO's Direct Reports</option>
                </select>
              </div>
              
              {/* Additional filter row */}
              <div className="col-lg-3 col-md-6">
                <label className="form-label">Location</label>
                <select 
                  className="form-select"
                  value={filters.location}
                  onChange={(e) => handleFilterChange({...filters, location: e.target.value})}
                >
                  <option value="">All Locations</option>
                  {locationsList.map(loc => (
                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                  ))}
                </select>
              </div>
              <div className="col-lg-3 col-md-6">
                <label className="form-label">Access Level</label>
                <select 
                  className="form-select"
                  value={filters.accessLevel}
                  onChange={(e) => handleFilterChange({...filters, accessLevel: e.target.value})}
                >
                  <option value="">All Access Levels</option>
                  <option value="ceo">CEO Level</option>
                  <option value="executive">Executive Level</option>
                  <option value="manager">Manager Level</option>
                  <option value="staff">Staff Level</option>
                </select>
              </div>
              <div className="col-lg-6 col-md-6">
                <label className="form-label">Hierarchy Level</label>
                <select 
                  className="form-select"
                  value={filters.hierarchy}
                  onChange={(e) => handleFilterChange({...filters, hierarchy: e.target.value})}
                >
                  <option value="">All Hierarchy Levels</option>
                  {hierarchyLevels.map(level => (
                    <option key={level} value={level}>{level}</option>
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
                            Name & Details
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
                          onClick={() => handleSort('displayRole')}
                          className="user-select-none"
                        >
                          <div className="d-flex justify-content-between align-items-center">
                            Role & Access
                            <i className={getSortIcon('displayRole')}></i>
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
                                  {isCEO(user) && <span className="badge bg-warning text-dark">CEO</span>}
                                  {user.canAccessManagerPortal && <span className="badge bg-success">Portal Access</span>}
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
                                onChange={(e) => setEditForm(prev => ({...prev, department: e.target.value, managerId: ''}))}
                                disabled={editForm.subRole === 'ceo'}
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
                                    subRole: (e.target.value !== 'staff') ? '' : prev.subRole,
                                    isManager: (e.target.value === 'admin' || e.target.value === 'security') ? false : prev.isManager,
                                    managerId: (e.target.value === 'staff' && prev.subRole === 'ceo') ? '' : prev.managerId
                                  }))}
                                >
                                  <option value="staff">Staff</option>
                                  <option value="admin">Admin</option>
                                  <option value="security">Security</option>
                                </select>
                                {editForm.role === 'staff' && (
                                  <>
                                    <select 
                                      className="form-select form-select-sm mb-2"
                                      value={editForm.subRole || ''}
                                      onChange={(e) => setEditForm(prev => ({
                                        ...prev, 
                                        subRole: e.target.value,
                                        isManager: e.target.value === 'ceo' ? true : prev.isManager,
                                        managerId: e.target.value === 'ceo' ? '' : prev.managerId,
                                        department: e.target.value === 'ceo' ? 'Executive' : prev.department
                                      }))}
                                    >
                                      <option value="">Regular Staff</option>
                                      <option value="ceo">CEO</option>
                                    </select>
                                    {editForm.subRole !== 'ceo' && (
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
                                  </>
                                )}
                              </div>
                            ) : (
                              <div>
                                <span className={`badge ${getRoleBadge(user)}`}>
                                  {user.displayRole}
                                </span>
                                <div className="small text-muted mt-1">{user.hierarchyLevel}</div>
                              </div>
                            )}
                          </td>
                          <td>
                            {editingUser === user.email ? (
                              <select 
                                className="form-select form-select-sm"
                                value={editForm.managerId || ''}
                                onChange={(e) => setEditForm(prev => ({...prev, managerId: e.target.value}))}
                                disabled={editForm.subRole === 'ceo'}
                              >
                                <option value="">{editForm.subRole === 'ceo' ? 'No Manager (CEO)' : 'Select Manager'}</option>
                                {getPotentialManagers(editForm.role, editForm.subRole, editForm.department).map(manager => (
                                  <option key={manager.id} value={manager.id}>
                                    {getFullName(manager)} ({manager.jobTitle || manager.role})
                                    {isCEO(manager) && ' (CEO)'}
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

        {/* REGULAR DEACTIVATE USER MODAL */}
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
                    <strong>{getFullName(showDeactivateModal)}</strong>
                    {isCEO(showDeactivateModal) && ' (CEO)'}.
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

        {/* ENHANCED: CEO REPLACEMENT MODAL */}
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
                        <li>The new CEO will get access to both executive and manager portals</li>
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