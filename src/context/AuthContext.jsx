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
  isCEO,
  canAccessManagerPortal,
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

  const [allUsers, setAllUsers] = useState(()=>{
    const saved = localStorage.getItem('sc_all_users')
    return saved ? JSON.parse(saved) : seedUsers
  })

  const [locations, setLocations] = useState(()=>{
    const saved = localStorage.getItem('sc_locations')
    return saved ? JSON.parse(saved) : seedLocations
  })

  const [departments, setDepartments] = useState(()=>{
    const saved = localStorage.getItem('sc_departments')
    return saved ? JSON.parse(saved) : seedDepartments
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
    await new Promise(resolve => setTimeout(resolve, 100))
    console.log(`API Call: ${endpoint}`, options)
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

  // FIXED: CEO login logic
  const login = ({ email, password, roleHint }) => {
    const record = allUsers[email]
    if (!record || record.password !== password) throw new Error('Invalid credentials')
    if (!record.isActive) throw new Error('Account is deactivated. Please contact administrator.')
    if (!record.verified) {
      generateOTP(email, 'verification')
      throw new Error(`Account not verified. OTP sent to ${email}.||verify-account?email=${email}`)
    }
    
    // FIXED: Handle CEO and role validation properly
    if (roleHint) {
      if (roleHint === 'ceo') {
        // For CEO portal, user must be CEO
        if (!isCEO(record)) {
          throw new Error('Wrong portal for this user')
        }
      } else if (roleHint === 'staff') {
        // For staff portal, user must be staff role (includes CEO since CEO has role='staff')
        if (record.role !== 'staff') {
          throw new Error('Wrong portal for this user')
        }
      } else {
        // For other portals (admin, security), check role directly
        if (roleHint !== record.role) {
          throw new Error('Wrong portal for this user')
        }
      }
    }
    
    const u = { ...record, email }
    setUser(u)
    
    apiCall('/api/auth/login', {
      method: 'POST',
      body: { email, password, roleHint }
    })
    
    // FIXED: CEO login redirects to CEO dashboard, but they can access staff/manager portals
    if (isCEO(u)) navigate('/ceo-dashboard', { replace: true })
    else if (u.role === 'staff') navigate('/clock', { replace: true })
    else if (u.role === 'admin') navigate('/admin-dashboard', { replace: true })
    else if (u.role === 'security') navigate('/security-dashboard', { replace: true })
  }

  const logout = () => { 
    setUser(null)
    apiCall('/api/auth/logout', { method: 'POST' })
    navigate('/staff', { replace: true })
  }

  // FIXED: Helper function to generate OTP with proper expiration
  const generateOTP = (email, type) => {
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const expires = Date.now() + 300000 // 5 minutes from now
    
    setActiveOTPs(prev => ({
      ...prev,
      [email]: {
        otp,
        expires,
        type,
        attempts: 0,
        generatedAt: Date.now() // Track when generated for debugging
      }
    }))

    apiCall('/api/auth/send-otp', {
      method: 'POST',
      body: { email, type, otp }
    })

    console.log(`${type === 'verification' ? 'Verification' : 'Password Reset'} OTP sent to ${email}: ${otp} (expires: ${new Date(expires).toLocaleString()})`)
    return { success: true, otp }
  }

  const forgotPassword = async (email) => {
    const existingUser = allUsers[email]
    if (!existingUser) {
      throw new Error('No account found with this email address')
    }

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
      setActiveOTPs(prev => ({
        ...prev,
        [email]: { ...prev[email], attempts: prev[email].attempts + 1 }
      }))
      throw new Error('Invalid verification code')
    }

    if (Date.now() > otpData.expires) {
      throw new Error('Verification code has expired. Please request a new one.')
    }

    setAllUsers(prev => ({
      ...prev,
      [email]: { ...prev[email], password: newPassword }
    }))

    setActiveOTPs(prev => {
      const updated = { ...prev }
      delete updated[email]
      return updated
    })

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

  // FIXED: OTP verification with better error handling
  const verifyOTP = (email, otp) => {
    const otpData = activeOTPs[email]
    const user = allUsers[email]
    
    console.log('Verifying OTP:', { email, providedOTP: otp, storedData: otpData, currentTime: Date.now() })
    
    if (!otpData) throw new Error('No verification code found for this email')
    if (!user) throw new Error('No account found for this email')
    
    // FIXED: Proper string comparison and debugging
    if (otpData.otp.toString() !== otp.toString()) {
      setActiveOTPs(prev => ({
        ...prev,
        [email]: { ...prev[email], attempts: prev[email].attempts + 1 }
      }))
      console.log('OTP mismatch:', { provided: otp, expected: otpData.otp })
      throw new Error('Invalid verification code')
    }
    
    if (Date.now() > otpData.expires) {
      console.log('OTP expired:', { currentTime: Date.now(), expires: otpData.expires })
      throw new Error('Verification code has expired')
    }
    
    setAllUsers(prev => ({
      ...prev,
      [email]: { ...prev[email], verified: true }
    }))
    
    setActiveOTPs(prev => {
      const updated = { ...prev }
      delete updated[email]
      return updated
    })
    
    apiCall('/api/auth/verify-otp', {
      method: 'POST',
      body: { email, otp }
    })
    
    return true
  }

  // FIXED: Multi-location clock functions
  const clockIn = (locationId = null) => {
    const selectedLocationId = locationId || user.assignedLocationId || 'loc_001'
    const selectedLocation = getLocationById(selectedLocationId)
    
    const activity = {
      id: `ca_${Date.now()}`,
      staffId: user.id,
      action: 'clock_in', 
      timestamp: new Date().toISOString(),
      locationId: selectedLocationId,
      location: selectedLocation?.name || 'Unknown Location'
    }
    
    setClockActivities(prev => [activity, ...prev])
    
    // FIXED: Start with selected location only
    setUser(prev => ({ 
      ...prev, 
      isClockedIn: true, 
      currentLocationIds: [selectedLocationId] // Start with one location
    }))
    
    setAllUsers(prev => ({
      ...prev,
      [user.email]: { 
        ...prev[user.email], 
        isClockedIn: true, 
        currentLocationIds: [selectedLocationId]
      }
    }))

    apiCall('/api/clock/in', {
      method: 'POST',
      body: { staffId: user.id, locationId: selectedLocationId }
    })
  }

  const clockOut = () => {
    // Clock out from all locations
    const currentLocations = user.currentLocationIds || []
    
    // Create clock out activities for all current locations
    const activities = currentLocations.map((locationId, index) => {
      const location = getLocationById(locationId)
      return {
        id: `ca_${Date.now() + index}`,
        staffId: user.id,
        action: 'clock_out',
        timestamp: new Date(Date.now() + index * 1000).toISOString(),
        locationId: locationId,
        location: location?.name || 'Unknown Location'
      }
    })
    
    setClockActivities(prev => [...activities, ...prev])
    
    setUser(prev => ({ 
      ...prev, 
      isClockedIn: false, 
      currentLocationIds: [] 
    }))
    
    setAllUsers(prev => ({
      ...prev,
      [user.email]: { 
        ...prev[user.email], 
        isClockedIn: false, 
        currentLocationIds: [] 
      }
    }))

    apiCall('/api/clock/out', {
      method: 'POST',
      body: { staffId: user.id, locationIds: currentLocations }
    })
  }

  // FIXED: Add location while on duty - but user can only be at one location at a time
  const addLocation = (locationId) => {
    if (!user.isClockedIn) {
      throw new Error('Cannot add location while not clocked in')
    }

    const currentLocations = user.currentLocationIds || []
    if (currentLocations.includes(locationId)) {
      throw new Error('Already active at this location')
    }

    // FIXED: User can only be present at one location at a time
    // Remove from previous location and add to new location
    const previousLocation = currentLocations[0] // Get current location
    const newLocation = getLocationById(locationId)
    
    // Create activities for location change
    const activities = []
    
    if (previousLocation) {
      const prevLoc = getLocationById(previousLocation)
      activities.push({
        id: `ca_${Date.now()}`,
        staffId: user.id,
        action: 'location_remove',
        timestamp: new Date().toISOString(),
        locationId: previousLocation,
        location: prevLoc?.name || 'Unknown Location'
      })
    }
    
    activities.push({
      id: `ca_${Date.now() + 1}`,
      staffId: user.id,
      action: 'location_add',
      timestamp: new Date(Date.now() + 1000).toISOString(),
      locationId: locationId,
      location: newLocation?.name || 'Unknown Location'
    })

    setClockActivities(prev => [...activities, ...prev])
    
    // FIXED: Set current location to only the new location
    const newLocationIds = [locationId] // Only one location at a time
    setUser(prev => ({ ...prev, currentLocationIds: newLocationIds }))
    
    setAllUsers(prev => ({
      ...prev,
      [user.email]: { ...prev[user.email], currentLocationIds: newLocationIds }
    }))

    apiCall('/api/clock/change-location', {
      method: 'POST',
      body: { staffId: user.id, fromLocationId: previousLocation, toLocationId: locationId }
    })

    return { success: true, location: newLocation?.name, previousLocation: previousLocation ? getLocationById(previousLocation)?.name : null }
  }

  // FIXED: Remove location - since user can only be at one location, this should clock out
  const removeLocation = (locationId) => {
    if (!user.isClockedIn) {
      throw new Error('Cannot remove location while not clocked in')
    }

    const currentLocations = user.currentLocationIds || []
    if (!currentLocations.includes(locationId)) {
      throw new Error('Not currently active at this location')
    }

    // FIXED: Since user can only be at one location, removing it means clocking out
    clockOut()

    return { success: true, location: getLocationById(locationId)?.name }
  }

  const submitLeaveRequest = (requestData) => {
    const userRecord = allUsers[user.email]
    const manager = userRecord.managerId ? getUserById(userRecord.managerId) : null
    
    const newRequest = {
      id: `lr_${Date.now()}`,
      staffId: user.id,
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
            status: 'pending',
            processedBy: null,
            processedDate: null,
            processingNotes: null
          }
        : req
    ))

    apiCall(`/api/leave-requests/${requestId}`, {
      method: 'PUT',
      body: updatedData
    })
  }

  const processLeaveRequest = (requestId, status, notes = null) => {
    const request = leaveRequests.find(req => req.id === requestId)
    
    if (status === 'rejected' && !notes?.trim()) {
      throw new Error('Rejection reason is required')
    }
    
    setLeaveRequests(prev => prev.map(req => 
      req.id === requestId 
        ? { 
            ...req, 
            status,
            processedBy: user.id,
            processedDate: new Date().toISOString(),
            processingNotes: (request?.type === 'Emergency' || request?.type === 'Sick' || status === 'rejected') ? notes : null
          }
        : req
    ))

    apiCall(`/api/leave-requests/${requestId}/process`, {
      method: 'POST',
      body: { status, processedBy: user.id, notes }
    })
  }

  const registerStaff = (staffData) => {
    const email = staffData.email
    const defaultPassword = 'temp123'
    
    const newUser = {
      id: `usr_${Date.now()}`,
      email: email,
      password: defaultPassword,
      firstName: staffData.firstName,
      lastName: staffData.lastName,
      role: staffData.role || 'staff',
      subRole: staffData.subRole || '', // For CEO tracking
      department: staffData.department,
      phone: staffData.phone,
      jobTitle: staffData.jobTitle || '',
      isManager: staffData.subRole === 'ceo' ? true : (staffData.isManager || false),
      managerId: staffData.subRole === 'ceo' ? null : (staffData.managerId || null),
      verified: false,
      isActive: true,
      isClockedIn: false,
      assignedLocationId: staffData.assignedLocationId || 'loc_001',
      currentLocationIds: [], // Multi-location support
      accessLevel: staffData.subRole === 'ceo' ? 'ceo' : (staffData.accessLevel || 'staff'),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    setAllUsers(prev => ({
      ...prev,
      [email]: newUser
    }))
    
    const result = generateOTP(email, 'verification')

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
    
    if (isCEO(userToDeactivate)) {
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

      setAllUsers(prev => ({
        ...prev,
        [replacementCeoEmail]: {
          ...prev[replacementCeoEmail],
          subRole: 'ceo',
          isManager: true,
          managerId: null,
          accessLevel: 'ceo',
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

    await apiCall(`/api/admin/departments/${deptId}`, {
      method: 'PUT',
      body: updates
    })

    return { success: true }
  }

  const deactivateDepartment = async (deptId) => {
    const dept = departments[deptId]
    if (!dept) throw new Error('Department not found')

    const activeUsersInDept = Object.values(allUsers).filter(user => 
      user.department === dept.name && user.isActive
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

    await apiCall(`/api/admin/locations/${locationId}`, {
      method: 'PUT',
      body: updates
    })

    return { success: true }
  }

  const deactivateLocation = async (locationId) => {
    const location = locations[locationId]
    if (!location) throw new Error('Location not found')

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
        department: staff ? staff.department : 'Unknown',
        manager: staff ? staff.managerId : null,
        processedByName: processor ? getFullName(processor) : null
      }
    })
  }

  // Helper to get enriched clock activities with staff names  
  const getEnrichedClockActivities = () => {
    return clockActivities.map(activity => {
      const staff = getUserById(activity.staffId)
      const location = getLocationById(activity.locationId)
      
      return {
        ...activity,
        staffName: staff ? getFullName(staff) : 'Unknown Staff',
        staffEmail: staff ? staff.email : 'unknown@company.com',
        department: staff ? staff.department : 'Unknown',
        locationName: location ? location.name : (activity.location || 'Unknown Location')
      }
    })
  }

  const getStaffForSite = (locationId) => {
    if (user?.role !== 'security') return []
    
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
    addLocation, // FIXED: Change location function
    removeLocation, // FIXED: Clock out since only one location allowed
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
    getStaffForSite,
    rawLeaveRequests: leaveRequests,
    rawClockActivities: clockActivities,
    LEAVE_TYPES
  }),[user, isOnManager, leaveRequests, clockActivities, allUsers, locations, departments, activeOTPs, filterStates])
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)