import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { seedUsers, seedLeaveRequests, seedClockActivities, getFullName } from '../config/seedUsers'

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
      [email]: { ...prev[email], password: newPassword }
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
      [email]: { ...prev[email], verified: true }
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
    const activity = {
      id: `ca_${Date.now()}`,
      staffId: user.email,
      staffName: getFullName(user),
      department: user.department,
      action: 'clock_in', 
      timestamp: new Date().toISOString(),
      location: 'Office',
      notes: ''
    }
    setClockActivities(prev => [activity, ...prev])
    setUser(prev => ({ ...prev, isClockedIn: true }))
    
    setAllUsers(prev => ({
      ...prev,
      [user.email]: { ...prev[user.email], isClockedIn: true }
    }))
  }

  const clockOut = () => {
    const activity = {
      id: `ca_${Date.now()}`,
      staffId: user.email,
      staffName: getFullName(user),
      department: user.department,
      action: 'clock_out',
      timestamp: new Date().toISOString(), 
      location: 'Office',
      notes: ''
    }
    setClockActivities(prev => [activity, ...prev])
    setUser(prev => ({ ...prev, isClockedIn: false }))
    
    setAllUsers(prev => ({
      ...prev,
      [user.email]: { ...prev[user.email], isClockedIn: false }
    }))
  }

  const submitLeaveRequest = (requestData) => {
    const newRequest = {
      id: `lr_${Date.now()}`,
      staffId: user.email,
      staffName: getFullName(user),
      department: user.department,
      manager: user.manager,
      ...requestData,
      status: 'pending',
      requestDate: new Date().toISOString(),
      processedBy: null,
      processedDate: null,
      notes: ''
    }
    setLeaveRequests(prev => [newRequest, ...prev])
    return newRequest
  }

  const processLeaveRequest = (requestId, status, notes = '') => {
    setLeaveRequests(prev => prev.map(req => 
      req.id === requestId 
        ? { 
            ...req, 
            status, 
            notes,
            processedBy: user.email,
            processedDate: new Date().toISOString()
          }
        : req
    ))
  }

  const registerStaff = (staffData) => {
    const email = staffData.email
    const defaultPassword = 'Welcome123!'
    
    const newUser = {
      ...staffData,
      password: defaultPassword,
      verified: false, // User needs to verify
      isActive: true,
      createdBy: user.email,
      createdAt: new Date().toISOString(),
      isClockedIn: false
    }
    
    // Add directly to allUsers (no longer using pendingUsers)
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
    setAllUsers(prev => ({
      ...prev,
      [email]: { ...prev[email], ...updates }
    }))
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
    processLeaveRequest,
    registerStaff,
    updateStaff
  }),[user, isOnManager, leaveRequests, clockActivities, allUsers, activeOTPs])
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)