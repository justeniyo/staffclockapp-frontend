import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { 
  seedUsers, 
  seedLeaveRequests, 
  seedClockActivities, 
  getFullName,
  getUserById,
  getUserByEmail,
  getManagerHierarchy 
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
    localStorage.setItem('sc_active_otps', JSON.stringify(activeOTPs))
  }, [activeOTPs])

  // Backend-ready API simulation functions
  const apiCall = async (endpoint, options = {}) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // This will be replaced with actual API calls
    console.log(`API Call: ${endpoint}`, options)
    
    // For now, return success
    return { success: true }
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
    if (roleHint && record.role !== roleHint) throw new Error('Wrong portal for this user')
    
    const u = { ...record, email }
    setUser(u)
    
    // Backend API call simulation
    apiCall('/api/auth/login', {
      method: 'POST',
      body: { email, password, roleHint }
    })
    
    if (u.role === 'staff') navigate('/clock', { replace: true })
    if (u.role === 'admin') navigate('/admin-dashboard', { replace: true })
    if (u.role === 'security') navigate('/security-dashboard', { replace: true })
    if (u.role === 'ceo') navigate('/ceo-dashboard', { replace: true })
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

  const clockIn = () => {
    const activity = {
      id: `ca_${Date.now()}`,
      staffId: user.id, // Use ID instead of email
      action: 'clock_in', 
      timestamp: new Date().toISOString(),
      location: 'Main Office' // Default location, can be made dynamic
    }
    
    setClockActivities(prev => [activity, ...prev])
    setUser(prev => ({ ...prev, isClockedIn: true }))
    
    setAllUsers(prev => ({
      ...prev,
      [user.email]: { ...prev[user.email], isClockedIn: true }
    }))

    // Backend API call simulation
    apiCall('/api/clock/in', {
      method: 'POST',
      body: { staffId: user.id, location: activity.location }
    })
  }

  const clockOut = () => {
    const activity = {
      id: `ca_${Date.now()}`,
      staffId: user.id, // Use ID instead of email
      action: 'clock_out',
      timestamp: new Date().toISOString(), 
      location: 'Main Office' // Default location, can be made dynamic
    }
    
    setClockActivities(prev => [activity, ...prev])
    setUser(prev => ({ ...prev, isClockedIn: false }))
    
    setAllUsers(prev => ({
      ...prev,
      [user.email]: { ...prev[user.email], isClockedIn: false }
    }))

    // Backend API call simulation
    apiCall('/api/clock/out', {
      method: 'POST',
      body: { staffId: user.id, location: activity.location }
    })
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

  const processLeaveRequest = (requestId, status, notes = null) => {
    const request = leaveRequests.find(req => req.id === requestId)
    
    setLeaveRequests(prev => prev.map(req => 
      req.id === requestId 
        ? { 
            ...req, 
            status,
            processedBy: user.id, // Use ID instead of email
            processedDate: new Date().toISOString(),
            processingNotes: (request?.type === 'Emergency' || request?.type === 'Sick') ? notes : null
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
    const defaultPassword = 'password' // Will be hashed in backend
    
    const newUser = {
      id: `usr_${Date.now()}`, // Generate new ID
      email: email,
      password: defaultPassword,
      firstName: staffData.firstName,
      lastName: staffData.lastName,
      role: staffData.role || 'staff',
      department: staffData.department,
      phone: staffData.phone,
      jobTitle: staffData.jobTitle || '',
      isManager: staffData.isManager || false,
      managerId: staffData.managerId || null,
      verified: false, // User needs to verify
      isActive: true,
      isClockedIn: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    // Add directly to allUsers (no longer using pendingUsers)
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
    console.log(`Default password: ${defaultPassword}`)
    return { ...result, defaultPassword } // In production, don't return sensitive data
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
      
      return {
        ...activity,
        staffName: staff ? getFullName(staff) : 'Unknown Staff',
        staffEmail: staff ? staff.email : 'unknown@company.com',
        department: staff ? staff.department : 'Unknown'
      }
    })
  }

  // Helper to determine approval hierarchy
  const getApprovalHierarchy = (staffId) => {
    const hierarchy = getManagerHierarchy(staffId)
    return hierarchy.map(manager => ({
      id: manager.id,
      name: getFullName(manager),
      email: manager.email,
      jobTitle: manager.jobTitle || manager.role
    }))
  }

  // Security-specific helpers
  const getStaffForSite = (site) => {
    if (user?.role !== 'security') return []
    
    return Object.values(allUsers).filter(staff => 
      staff.role === 'staff' && 
      staff.isActive && 
      staff.isClockedIn
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
    isOnManager,
    leaveRequests: getEnrichedLeaveRequests(),
    clockActivities: getEnrichedClockActivities(),
    allUsers,
    activeOTPs,
    submitLeaveRequest,
    updateLeaveRequest,
    processLeaveRequest,
    registerStaff,
    updateStaff,
    getApprovalHierarchy,
    getStaffForSite,
    // Raw data for components that need it
    rawLeaveRequests: leaveRequests,
    rawClockActivities: clockActivities
  }),[user, isOnManager, leaveRequests, clockActivities, allUsers, activeOTPs])
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)