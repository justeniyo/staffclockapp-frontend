// src/context/AuthContext.jsx - Updated for hierarchical leave approvals

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { 
  seedUsers, 
  seedLeaveRequests, 
  seedClockActivities, 
  getFullName,
  canApproveLeave,
  getDirectReports,
  getUserManager
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
    
    if (u.role === 'staff') navigate('/clock', { replace: true })
    if (u.role === 'admin') navigate('/admin-dashboard', { replace: true })
    if (u.role === 'security') navigate('/security-dashboard', { replace: true })
    if (u.role === 'ceo') navigate('/ceo-dashboard', { replace: true })
  }

  const logout = () => { 
    setUser(null)
    navigate('/staff', { replace: true })
  }

  // Helper function to generate OTP (unchanged)
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

    // Simulate email sending
    console.log(`${type === 'verification' ? 'Verification' : 'Password Reset'} OTP sent to ${email}: ${otp}`)
    return { success: true, otp } // In production, don't return OTP
  }

  const forgotPassword = async (email) => {
    const existingUser = allUsers[email]
    if (!existingUser) {
      throw new Error('No account found with this email address')
    }

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
      [email]: { ...prev[email], password: newPassword, updatedAt: new Date().toISOString() }
    }))

    // Remove used OTP
    setActiveOTPs(prev => {
      const updated = { ...prev }
      delete updated[email]
      return updated
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
      [email]: { 
        ...prev[email], 
        verified: true,
        updatedAt: new Date().toISOString()
      }
    }))
    
    // Remove used OTP
    setActiveOTPs(prev => {
      const updated = { ...prev }
      delete updated[email]
      return updated
    })
    
    return true
  }

  const clockIn = () => {
    const timestamp = new Date().toISOString()
    const activity = {
      id: `ca_${Date.now()}`,
      staffId: user.email,
      staffName: getFullName(user),
      department: user.department,
      action: 'clock_in', 
      timestamp,
      location: user.assignedLocation || 'Main Office', // Use assigned location for security guards
      createdAt: timestamp
    }
    setClockActivities(prev => [activity, ...prev])
    setUser(prev => ({ ...prev, isClockedIn: true, updatedAt: timestamp }))
    
    setAllUsers(prev => ({
      ...prev,
      [user.email]: { 
        ...prev[user.email], 
        isClockedIn: true,
        updatedAt: timestamp
      }
    }))
  }

  const clockOut = () => {
    const timestamp = new Date().toISOString()
    const activity = {
      id: `ca_${Date.now()}`,
      staffId: user.email,
      staffName: getFullName(user),
      department: user.department,
      action: 'clock_out',
      timestamp,
      location: user.assignedLocation || 'Main Office',
      createdAt: timestamp
    }
    setClockActivities(prev => [activity, ...prev])
    setUser(prev => ({ ...prev, isClockedIn: false, updatedAt: timestamp }))
    
    setAllUsers(prev => ({
      ...prev,
      [user.email]: { 
        ...prev[user.email], 
        isClockedIn: false,
        updatedAt: timestamp
      }
    }))
  }

  // Enhanced leave request submission with proper hierarchy
  const submitLeaveRequest = (requestData) => {
    const timestamp = new Date().toISOString()
    const userManager = getUserManager(user.email)
    
    if (!userManager) {
      throw new Error('No manager assigned. Cannot submit leave request.')
    }

    const newRequest = {
      id: `lr_${Date.now()}`,
      staffId: user.email,
      staffName: getFullName(user),
      department: user.department,
      manager: userManager,
      ...requestData,
      status: 'pending',
      requestDate: timestamp,
      processedBy: null,
      processedDate: null,
      createdAt: timestamp,
      updatedAt: timestamp
    }
    setLeaveRequests(prev => [newRequest, ...prev])
    return newRequest
  }

  const updateLeaveRequest = (requestId, updatedData) => {
    const timestamp = new Date().toISOString()
    setLeaveRequests(prev => prev.map(req => 
      req.id === requestId 
        ? { 
            ...req, 
            ...updatedData,
            // Reset processing info when edited
            status: 'pending',
            processedBy: null,
            processedDate: null,
            updatedAt: timestamp
          }
        : req
    ))
  }

  // Enhanced leave request processing with hierarchy validation
  const processLeaveRequest = (requestId, status) => {
    const request = leaveRequests.find(req => req.id === requestId)
    if (!request) {
      throw new Error('Leave request not found')
    }

    // Validate that current user can approve this request
    if (!canApproveLeave(user.email, request.staffId)) {
      throw new Error('You are not authorized to process this leave request')
    }

    const timestamp = new Date().toISOString()
    setLeaveRequests(prev => prev.map(req => 
      req.id === requestId 
        ? { 
            ...req, 
            status,
            processedBy: user.email,
            processedDate: timestamp,
            updatedAt: timestamp
          }
        : req
    ))

    console.log(`Leave request ${requestId} ${status} by ${getFullName(user)}`)
  }

  // Enhanced staff registration with proper timestamps
  const registerStaff = (staffData) => {
    const email = staffData.email
    const defaultPassword = 'Welcome123!'
    const timestamp = new Date().toISOString()
    
    const newUser = {
      id: `usr_${Date.now()}`,
      ...staffData,
      email,
      password: defaultPassword,
      verified: false, // User needs to verify
      isActive: true,
      createdBy: user.email,
      createdAt: timestamp,
      updatedAt: timestamp,
      isClockedIn: false
    }
    
    // Add directly to allUsers
    setAllUsers(prev => ({
      ...prev,
      [email]: newUser
    }))
    
    // Generate verification OTP
    const result = generateOTP(email, 'verification')
    
    console.log(`Staff registered: ${email}`)
    console.log(`Default password: ${defaultPassword}`)
    return { ...result, defaultPassword } // In production, don't return sensitive data
  }

  const updateStaff = (email, updates) => {
    const timestamp = new Date().toISOString()
    setAllUsers(prev => ({
      ...prev,
      [email]: { 
        ...prev[email], 
        ...updates,
        updatedAt: timestamp
      }
    }))
  }

  // Helper functions for hierarchical operations
  const getMyDirectReports = () => {
    if (!user?.isManager) return []
    return getDirectReports(user.email)
  }

  const getMyLeaveRequests = () => {
    return leaveRequests.filter(req => req.staffId === user.email)
  }

  const getPendingLeaveRequestsForApproval = () => {
    if (!user?.isManager) return []
    return leaveRequests.filter(req => 
      req.status === 'pending' && 
      canApproveLeave(user.email, req.staffId)
    )
  }

  const getMyTeamClockActivities = () => {
    if (!user?.isManager) return []
    const teamEmails = getDirectReports(user.email).map(member => member.email)
    teamEmails.push(user.email) // Include manager's own activities
    return clockActivities.filter(activity => teamEmails.includes(activity.staffId))
  }

  // Security-specific functions
  const getLocationClockActivities = (location) => {
    if (user?.role !== 'security') return []
    return clockActivities.filter(activity => 
      activity.location === location ||
      (location === 'all' && true) // Security can see all if needed
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
    leaveRequests,
    clockActivities,
    allUsers,
    activeOTPs,
    submitLeaveRequest,
    updateLeaveRequest,
    processLeaveRequest,
    registerStaff,
    updateStaff,
    // New hierarchical helper functions
    getMyDirectReports,
    getMyLeaveRequests,
    getPendingLeaveRequestsForApproval,
    getMyTeamClockActivities,
    getLocationClockActivities
  }),[user, isOnManager, leaveRequests, clockActivities, allUsers, activeOTPs])
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)