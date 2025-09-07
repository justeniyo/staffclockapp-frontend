import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { 
  seedUsers, 
  seedLeaveRequests, 
  seedClockActivities,
  seedLocations,
  seedDepartments,
  getFullName,
  getUserById,
  getUserByEmail,
  getLocationById,
  getDepartmentById,
  LEAVE_TYPES
} from '../config/seedUsers'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const navigate = useNavigate()
  const location = useLocation()
  
  const [user, setUser] = useState(()=>{
    const saved = localStorage.getItem('sc_user')
    return saved ? JSON.parse(saved) : null
  })

  const [leaveRequests, setLeaveRequests] = useState(()=>{
    const saved = localStorage.getItem('sc_leave_requests')
    return saved ? JSON.parse(saved) : seedLeaveRequests
  })

  const [clockActivities, setClockActivities] = useState(()=>{
    const saved = localStorage.getItem('sc_clock_activities')
    return saved ? JSON.parse(saved) : seedClockActivities
  })

  // Convert array-based seed data to object format for backward compatibility
  const [allUsers, setAllUsers] = useState(()=>{
    const saved = localStorage.getItem('sc_all_users')
    if (saved) {
      return JSON.parse(saved)
    }
    // Convert array to object with email as key
    const usersObject = {}
    seedUsers.forEach(user => {
      usersObject[user.email] = user
    })
    return usersObject
  })

  // Convert array-based location data to object format
  const [locations, setLocations] = useState(()=>{
    const saved = localStorage.getItem('sc_locations')
    if (saved) {
      return JSON.parse(saved)
    }
    // Convert array to object with id as key
    const locationsObject = {}
    seedLocations.forEach(location => {
      locationsObject[location.id] = location
    })
    return locationsObject
  })

  // Convert array-based department data to object format
  const [departments, setDepartments] = useState(()=>{
    const saved = localStorage.getItem('sc_departments')
    if (saved) {
      return JSON.parse(saved)
    }
    // Convert array to object with id as key
    const departmentsObject = {}
    seedDepartments.forEach(dept => {
      departmentsObject[dept.id] = dept
    })
    return departmentsObject
  })

  // Filter state persistence
  const [filterStates, setFilterStates] = useState(()=>{
    const saved = localStorage.getItem('sc_filter_states')
    return saved ? JSON.parse(saved) : {}
  })

  // OTP storage for both verification and password reset
  const [activeOTPs, setActiveOTPs] = useState(()=>{
    const saved = localStorage.getItem('sc_active_otps')
    return saved ? JSON.parse(saved) : {}
  })

  // Save to localStorage on changes
  useEffect(()=>{
    if (user) localStorage.setItem('sc_user', JSON.stringify(user))
    else localStorage.removeItem('sc_user')
  }, [user])

  useEffect(()=>{
    localStorage.setItem('sc_leave_requests', JSON.stringify(leaveRequests))
  }, [leaveRequests])

  useEffect(()=>{
    localStorage.setItem('sc_clock_activities', JSON.stringify(clockActivities))
  }, [clockActivities])

  useEffect(()=>{
    localStorage.setItem('sc_all_users', JSON.stringify(allUsers))
  }, [allUsers])

  useEffect(()=>{
    localStorage.setItem('sc_locations', JSON.stringify(locations))
  }, [locations])

  useEffect(()=>{
    localStorage.setItem('sc_departments', JSON.stringify(departments))
  }, [departments])

  useEffect(()=>{
    localStorage.setItem('sc_active_otps', JSON.stringify(activeOTPs))
  }, [activeOTPs])

  useEffect(()=>{
    localStorage.setItem('sc_filter_states', JSON.stringify(filterStates))
  }, [filterStates])

  // Backend-ready API simulation functions
  const apiCall = async (endpoint, options = {}) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // This will be replaced with actual API calls
    console.log(`API Call: ${endpoint}`, options)
    
    // For now, return success
    return { success: true }
  }

  // Filter state management
  const saveFilterState = (page, filters) => {
    setFilterStates(prev => ({
      ...prev,
      [page]: filters
    }))
  }

  const getFilterState = (page) => {
    return filterStates[page] || {}
  }

  const login = ({ email, password, roleHint }) => {
    const record = allUsers[email]
    if (!record || record.password !== password) throw new Error('Invalid credentials')
    if (!record.isActive) throw new Error('Account is deactivated. Please contact administrator.')
    if (!record.verified) {
      // Generate new OTP for unverified user trying to login
      generateOTP(email, 'verification')
      throw new Error(`Account not verified. OTP sent to ${email}.||verify-account?email=${email}`)
    }
    
    // Handle role hint for CEO (special case: CEO has role='staff' but subRole='ceo')
    const userRole = record.subRole === 'ceo' ? 'ceo' : record.role
    if (roleHint && userRole !== roleHint) throw new Error('Wrong portal for this user')
    
    const u = { ...record, email }
    setUser(u)
    
    // Backend API call simulation
    apiCall('/api/auth/login', {
      method: 'POST',
      body: { email, password, roleHint }
    })
    
    // REDIRECT LOGIC - Always redirect to appropriate dashboard
    if (userRole === 'staff') navigate('/clock', { replace: true })
    else if (userRole === 'admin') navigate('/admin-dashboard', { replace: true })
    else if (userRole === 'security') navigate('/security-dashboard', { replace: true })
    else if (userRole === 'ceo') navigate('/ceo-dashboard', { replace: true })
  }

  const logout = () => { 
    setUser(null)
    // Backend API call simulation
    apiCall('/api/auth/logout', { method: 'POST' })
    navigate('/staff', { replace: true })
  }

  // Helper function to generate OTP
  const generateOTP = (email, type) => {
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const expires = Date.now() + 300000 // 5 minutes
    
    setActiveOTPs(prev => ({
      ...prev,
      [email]: {
        otp,
        expires,
        type, // 'verification' or 'password_reset'
        attempts: 0
      }
    }))

    // Backend API call simulation
    apiCall('/api/auth/send-otp', {
      method: 'POST',
      body: { email, type, otp }
    })

    // Simulate email sending
    console.log(`${type === 'verification' ? 'Verification' : 'Password Reset'} OTP sent to ${email}: ${otp}`)
    return { success: true, otp } // In production, don't return OTP
  }

  const forgotPassword = async (email) => {
    const existingUser = allUsers[email]
    if (!existingUser) {
      throw new Error('No account found with this email address')
    }

    // Backend API call simulation
    await apiCall('/api/auth/forgot-password', {
      method: 'POST',
      body: { email }
    })

    return generateOTP(email, 'password_reset')
  }

  const resetPassword = async (email, otp, newPassword) => {
    const otpData = activeOTPs[email]
    
    if (!otpData || otpData.type !== 'password_reset') {
      throw new Error('No password reset request found for this email')
    }

    if (otpData.otp !== otp) {
      // Increment failed attempts
      setActiveOTPs(prev => ({
        ...prev,
        [email]: { ...prev[email], attempts: prev[email].attempts + 1 }
      }))
      throw new Error('Invalid verification code')
    }

    if (Date.now() > otpData.expires) {
      throw new Error('Verification code has expired. Please request a new one.')
    }

    // Update password in allUsers
    setAllUsers(prev => ({
      ...prev,
      [email]: { ...prev[email], password: newPassword }
    }))

    // Remove used OTP
    setActiveOTPs(prev => {
      const updated = { ...prev }
      delete updated[email]
      return updated
    })

    // Backend API call simulation
    await apiCall('/api/auth/reset-password', {
      method: 'POST',
      body: { email, otp, newPassword }
    })

    console.log(`Password updated successfully for ${email}`)
    return { success: true }
  }

  const resendOTP = async (email, type = 'verification') => {
    const user = allUsers[email]
    if (!user) {
      throw new Error('No account found for this email')
    }

    if (type === 'verification' && user.verified) {
      throw new Error('Account is already verified')
    }

    return generateOTP(email, type)
  }

  const verifyOTP = (email, otp) => {
    const otpData = activeOTPs[email]
    const user = allUsers[email]
    
    if (!otpData) throw new Error('No verification code found for this email')
    if (!user) throw new Error('No account found for this email')
    if (otpData.otp !== otp) {
      // Increment failed attempts
      setActiveOTPs(prev => ({
        ...prev,
        [email]: { ...prev[email], attempts: prev[email].attempts + 1 }
      }))
      throw new Error('Invalid verification code')
    }
    if (Date.now() > otpData.expires) throw new Error('Verification code has expired')
    
    // Mark user as verified
    setAllUsers(prev => ({
      ...prev,
      [email]: { ...prev[email], verified: true }
    }))
    
    // Remove used OTP
    setActiveOTPs(prev => {
      const updated = { ...prev }
      delete updated[email]
      return updated
    })
    
    // Backend API call simulation
    apiCall('/api/auth/verify-otp', {
      method: 'POST',
      body: { email, otp }
    })
    
    return true
  }

  // UPDATED: Multi-location clock in/out system
  const clockIn = (locationId = null) => {
    // Default to user's assigned location or main office
    const selectedLocationId = locationId || user.assignedLocationId || 'loc_001'
    const selectedLocation = getLocationById(selectedLocationId, locations)
    
    const activity = {
      id: `ca_${Date.now()}`,
      staffId: user.id, // Use ID instead of email
      action: 'clock_in', 
      timestamp: new Date().toISOString(),
      locationId: selectedLocationId,
      location: selectedLocation?.name || 'Unknown Location' // Backward compatibility
    }
    
    setClockActivities(prev => [activity, ...prev])
    
    // Set current location as array (multi-location support)
    const currentLocationIds = [selectedLocationId]
    setUser(prev => ({ 
      ...prev, 
      isClockedIn: true, 
      currentLocationId: selectedLocationId,
      currentLocationIds: currentLocationIds
    }))
    
    setAllUsers(prev => ({
      ...prev,
      [user.email]: { 
        ...prev[user.email], 
        isClockedIn: true, 
        currentLocationId: selectedLocationId,
        currentLocationIds: currentLocationIds
      }
    }))

    // Backend API call simulation
    apiCall('/api/clock/in', {
      method: 'POST',
      body: { staffId: user.id, locationId: selectedLocationId }
    })
  }

  const clockOut = () => {
    // Clock out from all locations
    const activities = user.currentLocationIds?.map((locationId, index) => {
      const selectedLocation = getLocationById(locationId, locations)
      return {
        id: `ca_${Date.now() + index}`,
        staffId: user.id,
        action: 'clock_out',
        timestamp: new Date(Date.now() + index * 1000).toISOString(), // Ensure unique timestamps
        locationId: locationId,
        location: selectedLocation?.name || 'Unknown Location'
      }
    }) || []
    
    if (activities.length > 0) {
      setClockActivities(prev => [...activities, ...prev])
    }
    
    setUser(prev => ({ 
      ...prev, 
      isClockedIn: false, 
      currentLocationId: null,
      currentLocationIds: []
    }))
    
    setAllUsers(prev => ({
      ...prev,
      [user.email]: { 
        ...prev[user.email], 
        isClockedIn: false, 
        currentLocationId: null,
        currentLocationIds: []
      }
    }))

    // Backend API call simulation
    apiCall('/api/clock/out', {
      method: 'POST',
      body: { staffId: user.id }
    })
  }

  // NEW: Add location while on duty
  const addLocation = (locationId) => {
    if (!user.isClockedIn) {
      throw new Error('Cannot add location while not clocked in')
    }

    const newLocation = getLocationById(locationId, locations)
    if (!newLocation) {
      throw new Error('Invalid location')
    }

    // Check if user has access to this location
    if (!user.allowedLocationIds?.includes(locationId)) {
      throw new Error('You do not have access to this location')
    }

    // Check if already active at this location
    if (user.currentLocationIds?.includes(locationId)) {
      throw new Error('Already active at this location')
    }

    const activity = {
      id: `ca_${Date.now()}`,
      staffId: user.id,
      action: 'clock_in',
      timestamp: new Date().toISOString(),
      locationId: locationId,
      location: newLocation.name
    }

    setClockActivities(prev => [activity, ...prev])

    const updatedLocationIds = [...(user.currentLocationIds || []), locationId]
    setUser(prev => ({ 
      ...prev, 
      currentLocationIds: updatedLocationIds
    }))
    
    setAllUsers(prev => ({
      ...prev,
      [user.email]: { 
        ...prev[user.email], 
        currentLocationIds: updatedLocationIds
      }
    }))

    // Backend API call simulation
    apiCall('/api/clock/add-location', {
      method: 'POST',
      body: { staffId: user.id, locationId }
    })

    return { success: true, location: newLocation.name }
  }

  // NEW: Remove location while on duty
  const removeLocation = (locationId) => {
    if (!user.isClockedIn) {
      throw new Error('Cannot remove location while not clocked in')
    }

    if (!user.currentLocationIds?.includes(locationId)) {
      throw new Error('Not currently active at this location')
    }

    // Cannot remove if it's the only location
    if (user.currentLocationIds.length <= 1) {
      throw new Error('Cannot remove the only active location. Use Clock Out instead.')
    }

    const location = getLocationById(locationId, locations)
    const activity = {
      id: `ca_${Date.now()}`,
      staffId: user.id,
      action: 'clock_out',
      timestamp: new Date().toISOString(),
      locationId: locationId,
      location: location?.name || 'Unknown Location'
    }

    setClockActivities(prev => [activity, ...prev])

    const updatedLocationIds = user.currentLocationIds.filter(id => id !== locationId)
    setUser(prev => ({ 
      ...prev, 
      currentLocationIds: updatedLocationIds,
      // Update primary location if we removed it
      currentLocationId: updatedLocationIds[0] || null
    }))
    
    setAllUsers(prev => ({
      ...prev,
      [user.email]: { 
        ...prev[user.email], 
        currentLocationIds: updatedLocationIds,
        currentLocationId: updatedLocationIds[0] || null
      }
    }))

    // Backend API call simulation
    apiCall('/api/clock/remove-location', {
      method: 'POST',
      body: { staffId: user.id, locationId }
    })

    return { success: true, location: location?.name }
  }

  const submitLeaveRequest = (requestData) => {
    // Get manager information for approval routing
    const userRecord = allUsers[user.email]
    const manager = userRecord.managerId ? getUserById(userRecord.managerId) : null
    
    const newRequest = {
      id: `lr_${Date.now()}`,
      staffId: user.id, // Use ID instead of email
      type: requestData.type,
      startDate: requestData.startDate,
      endDate: requestData.endDate,
      reason: (requestData.type === 'Emergency' || requestData.type === 'Sick') ? requestData.reason : null,
      status: 'pending',
      requestDate: new Date().toISOString(),
      processedBy: null,
      processedDate: null,
      processingNotes: null
    }
    
    setLeaveRequests(prev => [newRequest, ...prev])

    // Backend API call simulation
    apiCall('/api/leave-requests', {
      method: 'POST',
      body: newRequest
    })

    return newRequest
  }

  const updateLeaveRequest = (requestId, updatedData) => {
    setLeaveRequests(prev => prev.map(req => 
      req.id === requestId 
        ? { 
            ...req, 
            ...updatedData,
            // Reset processing info when edited
            status: 'pending',
            processedBy: null,
            processedDate: null,
            processingNotes: null
          }
        : req
    ))

    // Backend API call simulation
    apiCall(`/api/leave-requests/${requestId}`, {
      method: 'PUT',
      body: updatedData
    })
  }

  // UPDATED: Require notes for rejections
  const processLeaveRequest = (requestId, status, notes = null) => {
    const request = leaveRequests.find(req => req.id === requestId)
    
    // REQUIRE REJECTION REASON
    if (status === 'rejected' && !notes?.trim()) {
      throw new Error('Rejection reason is required')
    }
    
    setLeaveRequests(prev => prev.map(req => 
      req.id === requestId 
        ? { 
            ...req, 
            status,
            processedBy: user.id, // Use ID instead of email
            processedDate: new Date().toISOString(),
            processingNotes: (request?.type === 'Emergency' || request?.type === 'Sick' || status === 'rejected') ? notes : null
          }
        : req
    ))

    // Backend API call simulation
    apiCall(`/api/leave-requests/${requestId}/process`, {
      method: 'POST',
      body: { status, processedBy: user.id, notes }
    })
  }

  const registerStaff = (staffData) => {
    const email = staffData.email
    const defaultPassword = 'temp123' // Temporary password for new users
    
    const newUser = {
      id: `usr_${Date.now()}`, // Generate new ID
      email: email,
      password: defaultPassword,
      firstName: staffData.firstName,
      lastName: staffData.lastName,
      role: staffData.role || 'staff',
      subRole: staffData.role === 'ceo' ? 'ceo' : staffData.subRole || null,
      departmentId: staffData.departmentId,
      department: staffData.department, // Keep for backward compatibility
      phone: staffData.phone,
      jobTitle: staffData.jobTitle || '',
      isManager: staffData.role === 'ceo' ? true : (staffData.isManager || false),
      managerId: staffData.role === 'ceo' ? null : (staffData.managerId || null),
      verified: false,
      isActive: true,
      isClockedIn: false,
      assignedLocationId: staffData.assignedLocationId || 'loc_001',
      allowedLocationIds: staffData.allowedLocationIds || [staffData.assignedLocationId || 'loc_001'],
      currentLocationIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    // Add directly to allUsers
    setAllUsers(prev => ({
      ...prev,
      [email]: newUser
    }))
    
    // Generate verification OTP
    const result = generateOTP(email, 'verification')

    // Backend API call simulation
    apiCall('/api/admin/register-staff', {
      method: 'POST',
      body: newUser
    })
    
    console.log(`Staff registered: ${email}`)
    console.log(`Temporary password: ${defaultPassword}`)
    console.log(`User must verify account then set new password`)
    return { ...result, defaultPassword }
  }

  const updateStaff = (email, updates) => {
    setAllUsers(prev => ({
      ...prev,
      [email]: { 
        ...prev[email], 
        ...updates,
        updatedAt: new Date().toISOString()
      }
    }))

    // Backend API call simulation
    const userToUpdate = allUsers[email]
    if (userToUpdate) {
      apiCall(`/api/admin/staff/${userToUpdate.id}`, {
        method: 'PUT',
        body: updates
      })
    }
  }

  const deactivateUser = async (email, reason = '', replacementCeoEmail = null) => {
    const userToDeactivate = allUsers[email]
    if (!userToDeactivate) throw new Error('User not found')
    
    // If deactivating CEO, ensure replacement is provided
    if (userToDeactivate.subRole === 'ceo') {
      if (!replacementCeoEmail) {
        throw new Error('Must appoint a replacement CEO before deactivating current CEO')
      }
      
      const replacementUser = allUsers[replacementCeoEmail]
      if (!replacementUser) {
        throw new Error('Replacement CEO not found')
      }
      
      if (!replacementUser.isActive) {
        throw new Error('Replacement CEO must be an active user')
      }

      // Promote replacement to CEO
      setAllUsers(prev => ({
        ...prev,
        [replacementCeoEmail]: {
          ...prev[replacementCeoEmail],
          role: 'staff',
          subRole: 'ceo',
          isManager: true,
          managerId: null,
          updatedAt: new Date().toISOString()
        }
      }))
    }
    
    setAllUsers(prev => ({
      ...prev,
      [email]: { 
        ...prev[email], 
        isActive: false,
        deactivatedAt: new Date().toISOString(),
        deactivationReason: reason,
        updatedAt: new Date().toISOString()
      }
    }))

    // Backend API call simulation
    await apiCall(`/api/admin/staff/${userToDeactivate.id}/deactivate`, {
      method: 'POST',
      body: { reason, replacementCeoEmail }
    })

    return { success: true }
  }

  const reactivateUser = async (email) => {
    const user = allUsers[email]
    if (!user) throw new Error('User not found')
    
    setAllUsers(prev => ({
      ...prev,
      [email]: { 
        ...prev[email], 
        isActive: true,
        reactivatedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    }))

    // Backend API call simulation
    await apiCall(`/api/admin/staff/${user.id}/reactivate`, {
      method: 'POST'
    })

    return { success: true }
  }

  const createDepartment = async (departmentData) => {
    const newDept = {
      id: `dept_${Date.now()}`,
      name: departmentData.name,
      description: departmentData.description || '',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    setDepartments(prev => ({
      ...prev,
      [newDept.id]: newDept
    }))

    // Backend API call simulation
    await apiCall('/api/admin/departments', {
      method: 'POST',
      body: newDept
    })

    return newDept
  }

  const updateDepartment = async (deptId, updates) => {
    setDepartments(prev => ({
      ...prev,
      [deptId]: {
        ...prev[deptId],
        ...updates,
        updatedAt: new Date().toISOString()
      }
    }))

    // Backend API call simulation
    await apiCall(`/api/admin/departments/${deptId}`, {
      method: 'PUT',
      body: updates
    })

    return { success: true }
  }

  const deactivateDepartment = async (deptId) => {
    const dept = departments[deptId]
    if (!dept) throw new Error('Department not found')

    // Check if any active users are in this department
    const activeUsersInDept = Object.values(allUsers).filter(user => 
      user.departmentId === deptId && user.isActive
    )

    if (activeUsersInDept.length > 0) {
      throw new Error(`Cannot deactivate department. ${activeUsersInDept.length} active user(s) are assigned to this department.`)
    }

    setDepartments(prev => ({
      ...prev,
      [deptId]: {
        ...prev[deptId],
        isActive: false,
        deactivatedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    }))

    // Backend API call simulation
    await apiCall(`/api/admin/departments/${deptId}/deactivate`, {
      method: 'POST'
    })

    return { success: true }
  }

  const createLocation = async (locationData) => {
    const newLocation = {
      id: `loc_${Date.now()}`,
      name: locationData.name,
      address: locationData.address || '',
      type: locationData.type || 'office',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    setLocations(prev => ({
      ...prev,
      [newLocation.id]: newLocation
    }))

    // Backend API call simulation
    await apiCall('/api/admin/locations', {
      method: 'POST',
      body: newLocation
    })

    return newLocation
  }

  const updateLocation = async (locationId, updates) => {
    setLocations(prev => ({
      ...prev,
      [locationId]: {
        ...prev[locationId],
        ...updates,
        updatedAt: new Date().toISOString()
      }
    }))

    // Backend API call simulation
    await apiCall(`/api/admin/locations/${locationId}`, {
      method: 'PUT',
      body: updates
    })

    return { success: true }
  }

  const deactivateLocation = async (locationId) => {
    const location = locations[locationId]
    if (!location) throw new Error('Location not found')

    // Check if any active users are assigned to this location
    const activeUsersInLocation = Object.values(allUsers).filter(user => 
      user.assignedLocationId === locationId && user.isActive
    )

    if (activeUsersInLocation.length > 0) {
      throw new Error(`Cannot deactivate location. ${activeUsersInLocation.length} active user(s) are assigned to this location.`)
    }

    setLocations(prev => ({
      ...prev,
      [locationId]: {
        ...prev[locationId],
        isActive: false,
        deactivatedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    }))

    // Backend API call simulation
    await apiCall(`/api/admin/locations/${locationId}/deactivate`, {
      method: 'POST'
    })

    return { success: true }
  }

  // Helper to get enriched leave requests with staff names
  const getEnrichedLeaveRequests = () => {
    return leaveRequests.map(request => {
      const staff = getUserById(request.staffId)
      const processor = request.processedBy ? getUserById(request.processedBy) : null
      
      return {
        ...request,
        staffName: staff ? getFullName(staff) : 'Unknown Staff',
        staffEmail: staff ? staff.email : 'unknown@company.com',
        department: staff ? (staff.department || getDepartmentById(staff.departmentId)?.name) : 'Unknown',
        manager: staff ? staff.managerId : null,
        processedByName: processor ? getFullName(processor) : null
      }
    })
  }

  // Helper to get enriched clock activities with staff names  
  const getEnrichedClockActivities = () => {
    return clockActivities.map(activity => {
      const staff = getUserById(activity.staffId)
      const location = getLocationById(activity.locationId, locations)
      
      return {
        ...activity,
        staffName: staff ? getFullName(staff) : 'Unknown Staff',
        staffEmail: staff ? staff.email : 'unknown@company.com',
        department: staff ? (staff.department || getDepartmentById(staff.departmentId)?.name) : 'Unknown',
        locationName: location ? location.name : (activity.location || 'Unknown Location')
      }
    })
  }

  // Helper to determine approval hierarchy - using ID-based relationships
  const getApprovalHierarchy = (staffId) => {
    const staff = getUserById(staffId)
    if (!staff) return []
    
    const hierarchy = []
    let currentManager = staff.managerId ? getUserById(staff.managerId) : null
    
    while (currentManager && hierarchy.length < 5) { // Prevent infinite loops
      hierarchy.push({
        id: currentManager.id,
        name: getFullName(currentManager),
        email: currentManager.email,
        jobTitle: currentManager.jobTitle || currentManager.role
      })
      currentManager = currentManager.managerId ? getUserById(currentManager.managerId) : null
    }
    
    return hierarchy
  }

  // UPDATED: Security-specific helpers - restrict to assigned location only
  const getStaffForSite = (locationId) => {
    if (user?.role !== 'security') return []
    
    // Security can only see their assigned location
    if (user.assignedLocationId !== locationId) return []
    
    return Object.values(allUsers).filter(staff => 
      staff.role === 'staff' && 
      staff.isActive && 
      staff.isClockedIn &&
      staff.assignedLocationId === locationId
    )
  }

  const isOnManager = location.pathname.startsWith('/manager')

  const value = useMemo(()=>({ 
    user, 
    login, 
    logout, 
    forgotPassword,
    resetPassword,
    resendOTP,
    verifyOTP,
    clockIn, 
    clockOut,
    addLocation, // NEW: Multi-location support
    removeLocation, // NEW: Multi-location support
    isOnManager,
    leaveRequests: getEnrichedLeaveRequests(),
    clockActivities: getEnrichedClockActivities(),
    allUsers,
    locations,
    departments,
    activeOTPs,
    filterStates,
    saveFilterState,
    getFilterState,
    submitLeaveRequest,
    updateLeaveRequest,
    processLeaveRequest,
    registerStaff,
    updateStaff,
    deactivateUser,
    reactivateUser,
    createDepartment,
    updateDepartment,
    deactivateDepartment,
    createLocation,
    updateLocation,
    deactivateLocation,
    getApprovalHierarchy,
    getStaffForSite,
    // Raw data for components that need it
    rawLeaveRequests: leaveRequests,
    rawClockActivities: clockActivities,
    // Constants
    LEAVE_TYPES
  }),[user, isOnManager, leaveRequests, clockActivities, allUsers, locations, departments, activeOTPs, filterStates])
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)