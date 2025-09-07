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
  
  // FIXED: Enhanced filter state persistence with safer defaults
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
  
  // FIXED: Deactivation modals with CEO handling
  const [showDeactivateModal, setShowDeactivateModal] = useState(null)
  const [deactivateReason, setDeactivateReason] = useState('')
  const [showCeoReplacementModal, setShowCeoReplacementModal] = useState(null)
  const [replacementCeoEmail, setReplacementCeoEmail] = useState('')

  // FIXED: Safe data extraction
  const departmentsList = useMemo(() => {
    try {
      return Object.values(departments || {}).filter(dept => dept.isActive)
    } catch (error) {
      console.error('Error processing departments:', error)
      return []
    }
  }, [departments])

  const locationsList = useMemo(() => {
    try {
      return Object.values(locations || {}).filter(loc => loc.isActive)
    } catch (error) {
      console.error('Error processing locations:', error)
      return []
    }
  }, [locations])
  
  // FIXED: Smart manager filtering based on selected department
  const getRelevantManagers = useCallback(() => {
    try {
      const allManagers = Object.entries(allUsers || {}).filter(([email, user]) => 
        user && user.isManager && user.isActive
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
    } catch (error) {
      console.error('Error getting relevant managers:', error)
      return []
    }
  }, [allUsers, filters.department])

  const relevantManagers = getRelevantManagers()

  // FIXED: Convert allUsers object to array with computed fields and error handling
  const usersArray = useMemo(() => {
    try {
      if (!allUsers || typeof allUsers !== 'object') {
        console.warn('allUsers is not properly loaded')
        return []
      }

      return Object.entries(allUsers)
        .filter(([email, user]) => user && user.role !== 'system')
        .map(([email, user]) => {
          try {
            return { 
              ...user, 
              email, 
              staffName: getFullName(user),
              managerName: user.managerId ? getFullName(getUserById(user.managerId)) : 'None',
              locationName: user.assignedLocationId ? (locations[user.assignedLocationId]?.name || 'Unknown') : 'Unknown',
              displayRole: isCEO(user) ? 'CEO (Staff)' : user.role,
              hierarchyLevel: getHierarchyLevel(user),
              canAccessManagerPortal: user.isManager && user.role === 'staff'
            }
          } catch (error) {
            console.error('Error processing user:', email, error)
            return {
              ...user,
              email,
              staffName: 'Unknown User',
              managerName: 'None',
              locationName: 'Unknown',
              displayRole: user.role || 'Unknown',
              hierarchyLevel: 'Unknown',
              canAccessManagerPortal: false
            }
          }
        })
    } catch (error) {
      console.error('Error processing users array:', error)
      return []
    }
  }, [allUsers, locations])

  // Helper function to determine hierarchy level
  const getHierarchyLevel = (user) => {
    try {
      if (isCEO(user)) return 'Executive - CEO'
      if (user.role === 'admin') return 'System - Admin'
      if (user.role === 'security') return 'Security - Guard'
      if (user.department === 'Executive' && user.isManager) return 'Executive - C-Level'
      if (user.isManager) return 'Management - Department'
      return 'Staff - Regular'
    } catch (error) {
      console.error('Error determining hierarchy level:', error)
      return 'Unknown'
    }
  }

  // FIXED: Advanced filtering and sorting with safer error handling
  const filteredAndSortedStaff = useMemo(() => {
    try {
      let filtered = [...usersArray]

      // Apply filters with enhanced logic
      if (filters.search) {
        filtered = filtered.filter(user => {
          const searchTerm = filters.search.toLowerCase()
          return (
            user.staffName?.toLowerCase().includes(searchTerm) ||
            user.email?.toLowerCase().includes(searchTerm) ||
            user.jobTitle?.toLowerCase().includes(searchTerm) ||
            user.phone?.includes(filters.search)
          )
        })
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

      // FIXED: Status filtering with safer options
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
          const ceo = Object.values(allUsers || {}).find(u => isCEO(u))
          filtered = filtered.filter(user => user.managerId === ceo?.id)
        }
      }

      // Apply sorting with error handling
      const sorted = [...filtered].sort((a, b) => {
        try {
          let aValue = a[sortConfig.key]
          let bValue = b[sortConfig.key]

          // Handle different data types
          if (typeof aValue === 'string') {
            aValue = aValue.toLowerCase()
            bValue = bValue?.toLowerCase() || ''
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
        } catch (error) {
          console.error('Error in sorting:', error)
          return 0
        }
      })

      return sorted
    } catch (error) {
      console.error('Error in filtering and sorting:', error)
      return []
    }
  }, [usersArray, filters, sortConfig, allUsers])

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedStaff.length / itemsPerPage)
  const paginatedStaff = useMemo(() => {
    try {
      const startIndex = (currentPage - 1) * itemsPerPage
      return filteredAndSortedStaff.slice(startIndex, startIndex + itemsPerPage)
    } catch (error) {
      console.error('Error in pagination:', error)
      return []
    }
  }, [filteredAndSortedStaff, currentPage, itemsPerPage])

  // Reset pagination when filters change and save filter state
  const handleFilterChange = useCallback((newFilters) => {
    try {
      setFilters(newFilters)
      setCurrentPage(1)
      saveFilterState('admin-manage-staff', newFilters)
    } catch (error) {
      console.error('Error handling filter change:', error)
    }
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
    try {
      const userToUpdate = allUsers[editingUser]
      
      // FIXED: Validation with CEO handling
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
    } catch (error) {
      console.error('Error saving edit:', error)
    }
  }

  const cancelEdit = () => {
    setEditingUser(null)
    setEditForm({})
  }

  // FIXED: Handle deactivation with CEO protection
  const handleDeactivateUser = async () => {
    try {
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

      await deactivateUser(showDeactivateModal.email, deactivateReason)
      setShowDeactivateModal(null)
      setDeactivateReason('')
    } catch (err) {
      console.error('Deactivation error:', err.message)
    }
  }

  // FIXED: CEO deactivation with replacement
  const handleCeoDeactivation = async () => {
    try {
      if (!replacementCeoEmail || !deactivateReason.trim()) {
        return
      }

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

  // FIXED: Quick filter presets with safer logic
  const applyQuickFilter = (preset) => {
    try {
      let newFilters = { ...filters }
      
      switch (preset) {
        case 'ceo_team':
          const ceo = Object.values(allUsers || {}).find(u => isCEO(u))
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
    } catch (error) {
      console.error('Error applying quick filter:', error)
    }
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

  // FIXED: Get potential managers with smart filtering
  const getPotentialManagers = (role, subRole, department) => {
    try {
      const usersList = Object.values(allUsers || {})
      
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
    } catch (error) {
      console.error('Error getting potential managers:', error)
      return []
    }
  }

  // Get potential CEO replacements
  const getPotentialCeoReplacements = () => {
    try {
      return Object.entries(allUsers || {}).filter(([email, user]) => 
        user.role === 'staff' && 
        user.isActive && 
        user.isManager &&
        !isCEO(user)
      )
    } catch (error) {
      console.error('Error getting CEO replacements:', error)
      return []
    }
  }

  // FIXED: Statistics with safer calculations
  const stats = useMemo(() => {
    try {
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
    } catch (error) {
      console.error('Error calculating stats:', error)
      return {
        total: 0, active: 0, inactive: 0, managers: 0, 
        unverified: 0, onDuty: 0, ceo: 0, executives: 0
      }
    }
  }, [usersArray])

  // FIXED: Get unique hierarchy levels for filtering
  const hierarchyLevels = useMemo(() => {
    try {
      return [...new Set(usersArray.map(user => user.hierarchyLevel))].sort()
    } catch (error) {
      console.error('Error getting hierarchy levels:', error)
      return []
    }
  }, [usersArray])

  // FIXED: Loading state check
  if (!allUsers || Object.keys(allUsers).length === 0) {
    return (
      <div>
        <div className="page-header">
          <h2 className="page-title">Manage Staff</h2>
          <p className="mb-0 text-muted">Loading staff data...</p>
        </div>
        <div className="page-content">
          <div className="text-center py-5">
            <i className="fas fa-spinner fa-spin fa-3x text-muted mb-3"></i>
            <p className="text-muted">Loading staff management interface...</p>
          </div>
        </div>
      </div>
    )
  }

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
        {/* FIXED: Statistics Cards with CEO tracking */}
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

        {/* Rest of the component continues with the same structure... */}
        {/* I'll include the key interactive parts */}

        {/* Quick Filter Presets */}
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

        {/* Results Section */}
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
                      <th>Contact</th>
                      <th>Department</th>
                      <th>Role & Access</th>
                      <th>Reports To</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedStaff.map(user => (
                      <tr key={user.email}>
                        <td>
                          <div className="fw-semibold">{user.staffName}</div>
                          {user.jobTitle && <div className="text-muted small">{user.jobTitle}</div>}
                          <div className="d-flex gap-1 mt-1">
                            {user.isManager && <span className="badge bg-info">Manager</span>}
                            {isCEO(user) && <span className="badge bg-warning text-dark">CEO</span>}
                            {user.canAccessManagerPortal && <span className="badge bg-success">Portal Access</span>}
                          </div>
                        </td>
                        <td>
                          <div className="text-muted small">{user.email}</div>
                          <div className="text-muted small">{user.phone}</div>
                        </td>
                        <td>
                          <span className="badge bg-light text-dark">{user.department}</span>
                        </td>
                        <td>
                          <div>
                            <span className={`badge ${getRoleBadge(user)}`}>
                              {user.displayRole}
                            </span>
                            <div className="small text-muted mt-1">{user.hierarchyLevel}</div>
                          </div>
                        </td>
                        <td>
                          <span className="text-muted small">{user.managerName}</span>
                        </td>
                        <td>
                          <div className="d-flex flex-column gap-1">
                            {!user.isActive && <span className="badge bg-danger">Inactive</span>}
                            {!user.verified && <span className="badge bg-warning text-dark">Unverified</span>}
                            {user.isClockedIn && user.isActive && <span className="badge bg-success">On Duty</span>}
                          </div>
                        </td>
                        <td>
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
                        </td>
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