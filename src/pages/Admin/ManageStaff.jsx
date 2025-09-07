import { useState, useMemo, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import { getFullName, getUserById, isCEO, isExecutive } from '../../config/seedUsers'

export default function ManageStaff(){
  const { 
    allUsers, 
    updateStaff, 
    deactivateUser, 
    reactivateUser, 
    locations, 
    departments,
    saveFilterState,
    getFilterState,
    rawLeaveRequests,
    clockActivities
  } = useAuth()
  
  // ENHANCED FILTER STATE PERSISTENCE
  const savedFilters = getFilterState('admin-manage-staff') || {
    search: '',
    department: '',
    role: '',
    subRole: '',
    status: 'active',
    manager: '',
    location: '',
    verificationType: 'all',
    managerStatus: 'all',
    accessLevel: 'all'
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
  
  // ENHANCED EXPORT MODAL
  const [showExportModal, setShowExportModal] = useState(false)
  const [exportConfig, setExportConfig] = useState({
    format: 'csv',
    includeInactive: false,
    includePersonalInfo: true,
    includeLocationAccess: true,
    includeManagerHierarchy: true,
    includeActivityData: false,
    includeLeaveData: false,
    customFields: []
  })
  
  // DEACTIVATION MODALS
  const [showDeactivateModal, setShowDeactivateModal] = useState(null)
  const [deactivateReason, setDeactivateReason] = useState('')
  const [showCeoReplacementModal, setShowCeoReplacementModal] = useState(null)
  const [replacementCeoEmail, setReplacementCeoEmail] = useState('')

  const departmentsList = Object.values(departments).filter(dept => dept.isActive)
  const locationsList = Object.values(locations).filter(loc => loc.isActive)
  
  // Get managers with enhanced filtering
  const managers = Object.entries(allUsers).filter(([email, user]) => 
    user.isManager && user.isActive
  )

  // Convert allUsers object to array with computed fields and enriched data
  const usersArray = useMemo(() => {
    return Object.entries(allUsers)
      .filter(([email, user]) => user.role !== 'system')
      .map(([email, user]) => {
        const manager = user.managerId ? getUserById(user.managerId) : null
        const location = user.assignedLocationId ? locations[user.assignedLocationId] : null
        const department = user.departmentId ? departments[user.departmentId] : 
                          departmentsList.find(d => d.name === user.department)
        
        // Activity statistics
        const userActivities = clockActivities.filter(activity => activity.staffId === user.id)
        const userLeaveRequests = rawLeaveRequests.filter(req => req.staffId === user.id)
        
        // Multi-location access count
        const locationAccessCount = user.allowedLocationIds?.length || 1
        
        return { 
          ...user, 
          email, 
          staffName: getFullName(user),
          managerName: manager ? getFullName(manager) : 'None',
          managerEmail: manager?.email || null,
          locationName: location?.name || 'Unknown',
          locationCount: locationAccessCount,
          departmentName: department?.name || user.department || 'Unknown',
          displayRole: isCEO(user) ? 'CEO' : isExecutive(user) ? 'Executive' : user.role,
          activityCount: userActivities.length,
          leaveRequestCount: userLeaveRequests.length,
          lastActivity: userActivities.length > 0 ? 
            new Date(Math.max(...userActivities.map(a => new Date(a.timestamp)))).toLocaleDateString() : 'Never'
        }
      })
  }, [allUsers, locations, departments, departmentsList, clockActivities, rawLeaveRequests])

  // ENHANCED FILTERING LOGIC WITH SMART DEPENDENCIES
  const filteredAndSortedStaff = useMemo(() => {
    let filtered = usersArray

    // Apply filters with enhanced logic
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(user => 
        user.staffName.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower) ||
        user.jobTitle?.toLowerCase().includes(searchLower) ||
        user.phone?.toLowerCase().includes(searchLower) ||
        user.id.toLowerCase().includes(searchLower)
      )
    }

    if (filters.department) {
      filtered = filtered.filter(user => user.departmentName === filters.department)
    }

    if (filters.role) {
      if (filters.role === 'ceo') {
        filtered = filtered.filter(user => isCEO(user))
      } else if (filters.role === 'executive') {
        filtered = filtered.filter(user => isExecutive(user))
      } else {
        filtered = filtered.filter(user => user.role === filters.role)
      }
    }

    if (filters.subRole) {
      filtered = filtered.filter(user => user.subRole === filters.subRole)
    }

    if (filters.manager) {
      filtered = filtered.filter(user => user.managerId === filters.manager)
    }

    if (filters.location) {
      filtered = filtered.filter(user => 
        user.assignedLocationId === filters.location ||
        user.allowedLocationIds?.includes(filters.location)
      )
    }

    // Enhanced status filtering
    if (filters.status !== 'all') {
      switch (filters.status) {
        case 'verified':
          filtered = filtered.filter(user => user.verified === true)
          break
        case 'unverified':
          filtered = filtered.filter(user => user.verified === false)
          break
        case 'active':
          filtered = filtered.filter(user => user.isActive === true)
          break
        case 'inactive':
          filtered = filtered.filter(user => user.isActive === false)
          break
        case 'on_duty':
          filtered = filtered.filter(user => user.isClockedIn === true)
          break
        case 'multi_location':
          filtered = filtered.filter(user => user.locationCount > 1)
          break
      }
    }

    if (filters.verificationType !== 'all') {
      switch (filters.verificationType) {
        case 'verified_active':
          filtered = filtered.filter(user => user.verified && user.isActive)
          break
        case 'unverified_active':
          filtered = filtered.filter(user => !user.verified && user.isActive)
          break
        case 'inactive_any':
          filtered = filtered.filter(user => !user.isActive)
          break
      }
    }

    if (filters.managerStatus !== 'all') {
      switch (filters.managerStatus) {
        case 'managers_only':
          filtered = filtered.filter(user => user.isManager)
          break
        case 'non_managers':
          filtered = filtered.filter(user => !user.isManager)
          break
        case 'ceo_executives':
          filtered = filtered.filter(user => isCEO(user) || isExecutive(user))
          break
      }
    }

    if (filters.accessLevel !== 'all') {
      switch (filters.accessLevel) {
        case 'single_location':
          filtered = filtered.filter(user => user.locationCount === 1)
          break
        case 'multi_location':
          filtered = filtered.filter(user => user.locationCount > 1)
          break
        case 'remote_access':
          filtered = filtered.filter(user => 
            user.allowedLocationIds?.some(id => locations[id]?.type === 'remote')
          )
          break
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
      } else if (typeof aValue === 'number') {
        // Keep as numbers
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
  }, [usersArray, filters, sortConfig, locations])

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedStaff.length / itemsPerPage)
  const paginatedStaff = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredAndSortedStaff.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredAndSortedStaff, currentPage, itemsPerPage])

  // Enhanced filter change handler
  const handleFilterChange = useCallback((newFilters) => {
    setFilters(newFilters)
    setCurrentPage(1)
    saveFilterState('admin-manage-staff', newFilters)
  }, [saveFilterState])

  // Sorting handler
  const handleSort = useCallback((key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }, [])

  // ENHANCED EXPORT FUNCTIONALITY
  const handleExport = () => {
    const dataToExport = exportConfig.includeInactive ? 
      usersArray : 
      filteredAndSortedStaff

    if (exportConfig.format === 'csv') {
      exportToCSV(dataToExport)
    } else if (exportConfig.format === 'json') {
      exportToJSON(dataToExport)
    }
    
    setShowExportModal(false)
  }

  const exportToCSV = (data) => {
    const headers = []
    const rows = []

    // Build headers based on export configuration
    if (exportConfig.includePersonalInfo) {
      headers.push('ID', 'First Name', 'Last Name', 'Email', 'Phone', 'Job Title')
    }
    
    headers.push('Role', 'Sub Role', 'Department', 'Is Manager', 'Status', 'Verified')

    if (exportConfig.includeLocationAccess) {
      headers.push('Primary Location', 'Additional Locations Count', 'Location Access List')
    }

    if (exportConfig.includeManagerHierarchy) {
      headers.push('Manager Name', 'Manager Email', 'Manager Department')
    }

    if (exportConfig.includeActivityData) {
      headers.push('Total Activities', 'Last Activity', 'Currently Clocked In')
    }

    if (exportConfig.includeLeaveData) {
      headers.push('Total Leave Requests', 'Pending Requests')
    }

    headers.push('Created Date', 'Last Updated')

    // Build rows
    data.forEach(user => {
      const row = []
      
      if (exportConfig.includePersonalInfo) {
        row.push(
          user.id,
          user.firstName,
          user.lastName, 
          user.email,
          user.phone || '',
          user.jobTitle || ''
        )
      }

      row.push(
        user.displayRole,
        user.subRole || '',
        user.departmentName,
        user.isManager ? 'Yes' : 'No',
        user.isActive ? 'Active' : 'Inactive',
        user.verified ? 'Verified' : 'Unverified'
      )

      if (exportConfig.includeLocationAccess) {
        const additionalLocations = user.allowedLocationIds?.filter(id => id !== user.assignedLocationId) || []
        const locationNames = additionalLocations.map(id => locations[id]?.name).filter(Boolean).join('; ')
        
        row.push(
          user.locationName,
          additionalLocations.length,
          locationNames
        )
      }

      if (exportConfig.includeManagerHierarchy) {
        const manager = user.managerId ? getUserById(user.managerId) : null
        row.push(
          user.managerName,
          user.managerEmail || '',
          manager?.department || manager?.departmentId && departments[manager.departmentId]?.name || ''
        )
      }

      if (exportConfig.includeActivityData) {
        row.push(
          user.activityCount,
          user.lastActivity,
          user.isClockedIn ? 'Yes' : 'No'
        )
      }

      if (exportConfig.includeLeaveData) {
        const pendingRequests = rawLeaveRequests.filter(req => 
          req.staffId === user.id && req.status === 'pending'
        ).length
        
        row.push(
          user.leaveRequestCount,
          pendingRequests
        )
      }

      row.push(
        user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '',
        user.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : ''
      )

      rows.push(row)
    })

    // Create CSV content
    const csvContent = [
      headers.map(h => `"${h}"`).join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    // Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `staff_export_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const exportToJSON = (data) => {
    const exportData = data.map(user => {
      const exportUser = {}
      
      if (exportConfig.includePersonalInfo) {
        exportUser.personal = {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          jobTitle: user.jobTitle
        }
      }

      exportUser.organizational = {
        role: user.displayRole,
        subRole: user.subRole,
        department: user.departmentName,
        departmentId: user.departmentId,
        isManager: user.isManager,
        status: user.isActive ? 'active' : 'inactive',
        verified: user.verified
      }

      if (exportConfig.includeLocationAccess) {
        exportUser.locations = {
          primary: user.locationName,
          primaryId: user.assignedLocationId,
          additional: user.allowedLocationIds?.filter(id => id !== user.assignedLocationId)
            .map(id => ({ id, name: locations[id]?.name })).filter(l => l.name) || [],
          totalAccess: user.locationCount
        }
      }

      if (exportConfig.includeManagerHierarchy) {
        const manager = user.managerId ? getUserById(user.managerId) : null
        exportUser.hierarchy = {
          manager: user.managerName,
          managerEmail: user.managerEmail,
          managerId: user.managerId,
          managerDepartment: manager?.department || (manager?.departmentId && departments[manager.departmentId]?.name)
        }
      }

      if (exportConfig.includeActivityData) {
        exportUser.activity = {
          totalActivities: user.activityCount,
          lastActivity: user.lastActivity,
          currentlyOnDuty: user.isClockedIn
        }
      }

      if (exportConfig.includeLeaveData) {
        const pendingRequests = rawLeaveRequests.filter(req => 
          req.staffId === user.id && req.status === 'pending'
        ).length

        exportUser.leave = {
          totalRequests: user.leaveRequestCount,
          pendingRequests
        }
      }

      exportUser.timestamps = {
        created: user.createdAt,
        updated: user.updatedAt
      }

      return exportUser
    })

    const jsonContent = JSON.stringify(exportData, null, 2)
    const blob = new Blob([jsonContent], { type: 'application/json' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `staff_export_${new Date().toISOString().split('T')[0]}.json`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Edit handlers
  const startEdit = (user) => {
    setEditingUser(user.email)
    setEditForm({
      firstName: user.firstName,
      lastName: user.lastName,
      departmentId: user.departmentId || '',
      department: user.departmentName, // Keep for backward compatibility
      jobTitle: user.jobTitle || '',
      role: user.role,
      subRole: user.subRole || '',
      isManager: user.isManager,
      managerId: user.managerId || '',
      isActive: user.isActive,
      verified: user.verified,
      assignedLocationId: user.assignedLocationId || '',
      allowedLocationIds: user.allowedLocationIds || []
    })
  }

  const saveEdit = () => {
    const userToUpdate = allUsers[editingUser]
    
    // Validation
    if (editForm.role === 'ceo' && editForm.managerId) {
      setEditForm(prev => ({ ...prev, managerId: '' }))
      return
    }
    
    // Update department name for backward compatibility
    const dept = departments[editForm.departmentId]
    const updateData = {
      ...editForm,
      department: dept?.name || editForm.department
    }
    
    updateStaff(editingUser, updateData)
    setEditingUser(null)
    setEditForm({})
  }

  const cancelEdit = () => {
    setEditingUser(null)
    setEditForm({})
  }

  // Deactivation handlers
  const handleDeactivateUser = async () => {
    if (!showDeactivateModal) return
    
    try {
      if (isCEO(showDeactivateModal) && !replacementCeoEmail) {
        setShowCeoReplacementModal(showDeactivateModal)
        setShowDeactivateModal(null)
        return
      }
      
      await deactivateUser(showDeactivateModal.email, deactivateReason, replacementCeoEmail)
      setShowDeactivateModal(null)
      setDeactivateReason('')
      setReplacementCeoEmail('')
    } catch (error) {
      alert(error.message)
    }
  }

  const handleReactivateUser = async (email) => {
    try {
      await reactivateUser(email)
    } catch (error) {
      alert(error.message)
    }
  }

  const clearFilters = () => {
    const defaultFilters = {
      search: '',
      department: '',
      role: '',
      subRole: '',
      status: 'active',
      manager: '',
      location: '',
      verificationType: 'all',
      managerStatus: 'all',
      accessLevel: 'all'
    }
    setFilters(defaultFilters)
    setCurrentPage(1)
    saveFilterState('admin-manage-staff', defaultFilters)
  }

  const getRoleBadge = (user) => {
    if (isCEO(user)) return 'bg-warning text-dark'
    if (isExecutive(user)) return 'bg-success'
    
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

  // Statistics
  const stats = useMemo(() => {
    return {
      total: usersArray.length,
      active: usersArray.filter(u => u.isActive).length,
      inactive: usersArray.filter(u => !u.isActive).length,
      managers: usersArray.filter(u => u.isManager).length,
      unverified: usersArray.filter(u => !u.verified).length,
      onDuty: usersArray.filter(u => u.isClockedIn).length,
      multiLocation: usersArray.filter(u => u.locationCount > 1).length,
      executives: usersArray.filter(u => isExecutive(u)).length
    }
  }, [usersArray])

  return (
    <div>
      <div className="page-header">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h2 className="page-title">Enhanced Staff Management</h2>
            <p className="mb-0 text-muted">
              Showing {filteredAndSortedStaff.length} of {usersArray.length} staff members
            </p>
          </div>
          <button 
            className="btn btn-warning"
            onClick={() => setShowExportModal(true)}
          >
            <i className="fas fa-download me-2"></i>
            Enhanced Export
          </button>
        </div>
      </div>
      
      <div className="page-content">
        {/* Enhanced Statistics Cards */}
        <div className="row g-3 mb-4">
          <div className="col-xl-2 col-md-3 col-6">
            <div className="card text-center">
              <div className="card-body py-3">
                <h5 className="text-primary">{stats.total}</h5>
                <p className="mb-0 small">Total Staff</p>
              </div>
            </div>
          </div>
          <div className="col-xl-2 col-md-3 col-6">
            <div className="card text-center">
              <div className="card-body py-3">
                <h5 className="text-success">{stats.active}</h5>
                <p className="mb-0 small">Active</p>
              </div>
            </div>
          </div>
          <div className="col-xl-2 col-md-3 col-6">
            <div className="card text-center">
              <div className="card-body py-3">
                <h5 className="text-warning">{stats.executives}</h5>
                <p className="mb-0 small">Executives</p>
              </div>
            </div>
          </div>
          <div className="col-xl-2 col-md-3 col-6">
            <div className="card text-center">
              <div className="card-body py-3">
                <h5 className="text-info">{stats.managers}</h5>
                <p className="mb-0 small">Managers</p>
              </div>
            </div>
          </div>
          <div className="col-xl-2 col-md-3 col-6">
            <div className="card text-center">
              <div className="card-body py-3">
                <h5 className="text-danger">{stats.multiLocation}</h5>
                <p className="mb-0 small">Multi-Location</p>
              </div>
            </div>
          </div>
          <div className="col-xl-2 col-md-3 col-6">
            <div className="card text-center">
              <div className="card-body py-3">
                <h5 className="text-secondary">{stats.onDuty}</h5>
                <p className="mb-0 small">On Duty</p>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Smart Filters */}
        <div className="card mb-4">
          <div className="card-header">
            <div className="d-flex justify-content-between align-items-center">
              <h6 className="mb-0">
                <i className="fas fa-filter me-2"></i>
                Smart Filters & Search
              </h6>
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
            {/* Primary Filters Row */}
            <div className="row g-3 mb-3">
              <div className="col-xl-3 col-lg-4 col-md-6">
                <label className="form-label">Search Staff</label>
                <div className="input-group">
                  <span className="input-group-text"><i className="fas fa-search"></i></span>
                  <input 
                    type="text" 
                    className="form-control"
                    value={filters.search}
                    onChange={(e) => handleFilterChange({...filters, search: e.target.value})}
                    placeholder="Name, email, ID, phone..."
                  />
                </div>
              </div>
              <div className="col-xl-2 col-lg-3 col-md-6">
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
              <div className="col-xl-2 col-lg-3 col-md-6">
                <label className="form-label">Role Type</label>
                <select 
                  className="form-select"
                  value={filters.role}
                  onChange={(e) => handleFilterChange({...filters, role: e.target.value})}
                >
                  <option value="">All Roles</option>
                  <option value="ceo">CEO</option>
                  <option value="executive">Executives</option>
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                  <option value="security">Security</option>
                </select>
              </div>
              <div className="col-xl-2 col-lg-3 col-md-6">
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
                  <option value="on_duty">Currently On Duty</option>
                  <option value="multi_location">Multi-Location Access</option>
                </select>
              </div>
              <div className="col-xl-3 col-lg-4 col-md-6">
                <label className="form-label">Manager</label>
                <select 
                  className="form-select"
                  value={filters.manager}
                  onChange={(e) => handleFilterChange({...filters, manager: e.target.value})}
                >
                  <option value="">All Managers</option>
                  {managers.map(([email, manager]) => (
                    <option key={manager.id} value={manager.id}>
                      {getFullName(manager)} ({manager.departmentName || manager.department})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Advanced Filters Row */}
            <div className="row g-3">
              <div className="col-xl-2 col-lg-3 col-md-6">
                <label className="form-label">Location Access</label>
                <select 
                  className="form-select"
                  value={filters.location}
                  onChange={(e) => handleFilterChange({...filters, location: e.target.value})}
                >
                  <option value="">All Locations</option>
                  {locationsList.map(loc => (
                    <option key={loc.id} value={loc.id}>{loc.name} ({loc.type})</option>
                  ))}
                </select>
              </div>
              <div className="col-xl-2 col-lg-3 col-md-6">
                <label className="form-label">Manager Status</label>
                <select 
                  className="form-select"
                  value={filters.managerStatus}
                  onChange={(e) => handleFilterChange({...filters, managerStatus: e.target.value})}
                >
                  <option value="all">All Types</option>
                  <option value="managers_only">Managers Only</option>
                  <option value="non_managers">Non-Managers</option>
                  <option value="ceo_executives">CEO & Executives</option>
                </select>
              </div>
              <div className="col-xl-2 col-lg-3 col-md-6">
                <label className="form-label">Access Level</label>
                <select 
                  className="form-select"
                  value={filters.accessLevel}
                  onChange={(e) => handleFilterChange({...filters, accessLevel: e.target.value})}
                >
                  <option value="all">All Access</option>
                  <option value="single_location">Single Location</option>
                  <option value="multi_location">Multi-Location</option>
                  <option value="remote_access">Remote Capable</option>
                </select>
              </div>
              <div className="col-xl-2 col-lg-3 col-md-6">
                <label className="form-label">Verification Type</label>
                <select 
                  className="form-select"
                  value={filters.verificationType}
                  onChange={(e) => handleFilterChange({...filters, verificationType: e.target.value})}
                >
                  <option value="all">All Types</option>
                  <option value="verified_active">Verified & Active</option>
                  <option value="unverified_active">Unverified but Active</option>
                  <option value="inactive_any">Inactive (Any)</option>
                </select>
              </div>
              <div className="col-xl-4 col-lg-6 col-md-12">
                <label className="form-label">Quick Filters</label>
                <div className="d-flex gap-2 flex-wrap">
                  <button 
                    className={`btn btn-sm ${filters.status === 'unverified' ? 'btn-warning' : 'btn-outline-warning'}`}
                    onClick={() => handleFilterChange({...filters, status: filters.status === 'unverified' ? 'all' : 'unverified'})}
                  >
                    Unverified ({stats.unverified})
                  </button>
                  <button 
                    className={`btn btn-sm ${filters.managerStatus === 'managers_only' ? 'btn-info' : 'btn-outline-info'}`}
                    onClick={() => handleFilterChange({...filters, managerStatus: filters.managerStatus === 'managers_only' ? 'all' : 'managers_only'})}
                  >
                    Managers ({stats.managers})
                  </button>
                  <button 
                    className={`btn btn-sm ${filters.accessLevel === 'multi_location' ? 'btn-success' : 'btn-outline-success'}`}
                    onClick={() => handleFilterChange({...filters, accessLevel: filters.accessLevel === 'multi_location' ? 'all' : 'multi_location'})}
                  >
                    Multi-Location ({stats.multiLocation})
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Results Table */}
        <div className="card">
          <div className="card-header">
            <div className="d-flex justify-content-between align-items-center">
              <h6 className="mb-0">Staff Directory</h6>
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
                  Clear All Filters
                </button>
              </div>
            ) : (
              <>
                {/* Enhanced Responsive Table */}
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
                            Name & Title
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
                          onClick={() => handleSort('departmentName')}
                          className="user-select-none"
                        >
                          <div className="d-flex justify-content-between align-items-center">
                            Department
                            <i className={getSortIcon('departmentName')}></i>
                          </div>
                        </th>
                        <th 
                          role="button" 
                          onClick={() => handleSort('displayRole')}
                          className="user-select-none"
                        >
                          <div className="d-flex justify-content-between align-items-center">
                            Role & Level
                            <i className={getSortIcon('displayRole')}></i>
                          </div>
                        </th>
                        <th 
                          role="button" 
                          onClick={() => handleSort('locationCount')}
                          className="user-select-none"
                        >
                          <div className="d-flex justify-content-between align-items-center">
                            Location Access
                            <i className={getSortIcon('locationCount')}></i>
                          </div>
                        </th>
                        <th>Status & Verification</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedStaff.map(user => (
                        <tr key={user.email}>
                          <td>
                            <div>
                              <div className="fw-semibold">{user.staffName}</div>
                              {user.jobTitle && <div className="text-muted small">{user.jobTitle}</div>}
                              <div className="d-flex gap-1 mt-1">
                                {user.isManager && <span className="badge bg-info">Manager</span>}
                                {isCEO(user) && <span className="badge bg-warning text-dark">CEO</span>}
                                {isExecutive(user) && !isCEO(user) && <span className="badge bg-success">Executive</span>}
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="text-muted small">{user.email}</div>
                            <div className="text-muted small">{user.phone}</div>
                            <div className="text-muted small">ID: {user.id}</div>
                          </td>
                          <td>
                            <span className="badge bg-light text-dark">{user.departmentName}</span>
                            {user.managerName !== 'None' && (
                              <div className="text-muted small mt-1">
                                Reports to: {user.managerName}
                              </div>
                            )}
                          </td>
                          <td>
                            <span className={`badge ${getRoleBadge(user)}`}>
                              {user.displayRole.charAt(0).toUpperCase() + user.displayRole.slice(1)}
                            </span>
                            {user.subRole && (
                              <div className="text-muted small mt-1">
                                {user.subRole.charAt(0).toUpperCase() + user.subRole.slice(1)}
                              </div>
                            )}
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              <span className="badge bg-primary me-2">{user.locationCount}</span>
                              <div>
                                <div className="fw-semibold small">{user.locationName}</div>
                                {user.locationCount > 1 && (
                                  <div className="text-muted small">
                                    +{user.locationCount - 1} additional
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="d-flex flex-column gap-1">
                              {!user.isActive && <span className="badge bg-danger">Inactive</span>}
                              {user.isActive && (
                                <span className="badge bg-success">Active</span>
                              )}
                              {!user.verified && <span className="badge bg-warning text-dark">Unverified</span>}
                              {user.isClockedIn && user.isActive && <span className="badge bg-info">On Duty</span>}
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

        {/* ENHANCED EXPORT MODAL */}
        {showExportModal && (
          <div className="modal show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    <i className="fas fa-download me-2"></i>
                    Enhanced Export Configuration
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
                      <h6>Export Format</h6>
                      <div className="form-check">
                        <input 
                          type="radio" 
                          className="form-check-input"
                          name="format"
                          value="csv"
                          checked={exportConfig.format === 'csv'}
                          onChange={(e) => setExportConfig(prev => ({...prev, format: e.target.value}))}
                        />
                        <label className="form-check-label">
                          <strong>CSV</strong> - Excel compatible spreadsheet
                        </label>
                      </div>
                      <div className="form-check">
                        <input 
                          type="radio" 
                          className="form-check-input"
                          name="format"
                          value="json"
                          checked={exportConfig.format === 'json'}
                          onChange={(e) => setExportConfig(prev => ({...prev, format: e.target.value}))}
                        />
                        <label className="form-check-label">
                          <strong>JSON</strong> - Structured data format
                        </label>
                      </div>
                    </div>

                    <div className="col-md-6">
                      <h6>Data Scope</h6>
                      <div className="form-check">
                        <input 
                          type="checkbox" 
                          className="form-check-input"
                          checked={exportConfig.includeInactive}
                          onChange={(e) => setExportConfig(prev => ({...prev, includeInactive: e.target.checked}))}
                        />
                        <label className="form-check-label">
                          Include inactive users ({stats.inactive} users)
                        </label>
                      </div>
                      <small className="text-muted">
                        {exportConfig.includeInactive 
                          ? `Will export all ${stats.total} users`
                          : `Will export ${filteredAndSortedStaff.length} filtered users`
                        }
                      </small>
                    </div>

                    <div className="col-12">
                      <h6>Data Categories</h6>
                      <div className="row g-3">
                        <div className="col-md-6">
                          <div className="form-check">
                            <input 
                              type="checkbox" 
                              className="form-check-input"
                              checked={exportConfig.includePersonalInfo}
                              onChange={(e) => setExportConfig(prev => ({...prev, includePersonalInfo: e.target.checked}))}
                            />
                            <label className="form-check-label">
                              <strong>Personal Information</strong><br />
                              <small className="text-muted">Names, email, phone, job titles</small>
                            </label>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="form-check">
                            <input 
                              type="checkbox" 
                              className="form-check-input"
                              checked={exportConfig.includeLocationAccess}
                              onChange={(e) => setExportConfig(prev => ({...prev, includeLocationAccess: e.target.checked}))}
                            />
                            <label className="form-check-label">
                              <strong>Location Access</strong><br />
                              <small className="text-muted">Primary & additional location permissions</small>
                            </label>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="form-check">
                            <input 
                              type="checkbox" 
                              className="form-check-input"
                              checked={exportConfig.includeManagerHierarchy}
                              onChange={(e) => setExportConfig(prev => ({...prev, includeManagerHierarchy: e.target.checked}))}
                            />
                            <label className="form-check-label">
                              <strong>Manager Hierarchy</strong><br />
                              <small className="text-muted">Reporting structure & manager details</small>
                            </label>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="form-check">
                            <input 
                              type="checkbox" 
                              className="form-check-input"
                              checked={exportConfig.includeActivityData}
                              onChange={(e) => setExportConfig(prev => ({...prev, includeActivityData: e.target.checked}))}
                            />
                            <label className="form-check-label">
                              <strong>Activity Data</strong><br />
                              <small className="text-muted">Clock in/out history & current status</small>
                            </label>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="form-check">
                            <input 
                              type="checkbox" 
                              className="form-check-input"
                              checked={exportConfig.includeLeaveData}
                              onChange={(e) => setExportConfig(prev => ({...prev, includeLeaveData: e.target.checked}))}
                            />
                            <label className="form-check-label">
                              <strong>Leave Request Data</strong><br />
                              <small className="text-muted">Total requests & pending approvals</small>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 p-3 bg-light rounded">
                    <h6 className="text-primary mb-2">
                      <i className="fas fa-info-circle me-2"></i>
                      Export Preview
                    </h6>
                    <div className="small">
                      <strong>Format:</strong> {exportConfig.format.toUpperCase()}<br />
                      <strong>Records:</strong> {exportConfig.includeInactive ? stats.total : filteredAndSortedStaff.length} users<br />
                      <strong>Categories:</strong> {
                        [
                          exportConfig.includePersonalInfo && 'Personal Info',
                          exportConfig.includeLocationAccess && 'Location Access',
                          exportConfig.includeManagerHierarchy && 'Manager Hierarchy',
                          exportConfig.includeActivityData && 'Activity Data',
                          exportConfig.includeLeaveData && 'Leave Data'
                        ].filter(Boolean).join(', ') || 'Basic info only'
                      }
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => setShowExportModal(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-warning"
                    onClick={handleExport}
                  >
                    <i className="fas fa-download me-1"></i>
                    Export Data ({exportConfig.includeInactive ? stats.total : filteredAndSortedStaff.length} records)
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