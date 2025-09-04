import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { seedUsers, seedLeaveRequests, seedClockActivities } from '../config/seedUsers'

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

  const [pendingUsers, setPendingUsers] = useState(()=>{
    const saved = localStorage.getItem('sc_pending_users')
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
    localStorage.setItem('sc_pending_users', JSON.stringify(pendingUsers))
  }, [pendingUsers])

  const login = ({ email, password, roleHint }) => {
    const record = allUsers[email]
    if (!record || record.password !== password) throw new Error('Invalid credentials')
    if (!record.verified) throw new Error('Account not verified. Please check your email for OTP.')
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

  const clockIn = () => {
    const activity = {
      id: `ca_${Date.now()}`,
      staffId: user.email,
      staffName: user.name,
      department: user.department,
      action: 'clock_in', 
      timestamp: new Date().toISOString(),
      location: 'Office',
      notes: ''
    }
    setClockActivities(prev => [activity, ...prev])
    setUser(prev => ({ ...prev, isClockedIn: true }))
    
    // Update user in allUsers as well
    setAllUsers(prev => ({
      ...prev,
      [user.email]: { ...prev[user.email], isClockedIn: true }
    }))
  }

  const clockOut = () => {
    const activity = {
      id: `ca_${Date.now()}`,
      staffId: user.email,
      staffName: user.name,
      department: user.department,
      action: 'clock_out',
      timestamp: new Date().toISOString(), 
      location: 'Office',
      notes: ''
    }
    setClockActivities(prev => [activity, ...prev])
    setUser(prev => ({ ...prev, isClockedIn: false }))
    
    // Update user in allUsers as well  
    setAllUsers(prev => ({
      ...prev,
      [user.email]: { ...prev[user.email], isClockedIn: false }
    }))
  }

  const submitLeaveRequest = (requestData) => {
    const newRequest = {
      id: `lr_${Date.now()}`,
      staffId: user.email,
      staffName: user.name,
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
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const defaultPassword = 'Welcome123!' // Default password for new users
    
    const newUser = {
      ...staffData,
      password: defaultPassword, // Set default password
      verified: false,
      createdBy: user.email,
      createdAt: new Date().toISOString(),
      isClockedIn: false
    }
    
    setPendingUsers(prev => ({
      ...prev,
      [email]: { ...newUser, otp, otpExpires: Date.now() + 300000 } // 5 min
    }))
    
    // Simulate email sending
    console.log(`OTP sent to ${email}: ${otp}`)
    console.log(`Default password for ${email}: ${defaultPassword}`)
    return { success: true, otp, defaultPassword } // In production, don't return OTP
  }

  const verifyOTP = (email, otp) => {
    const pendingUser = pendingUsers[email]
    if (!pendingUser) throw new Error('No pending verification found')
    if (pendingUser.otp !== otp) throw new Error('Invalid OTP')
    if (Date.now() > pendingUser.otpExpires) throw new Error('OTP expired')
    
    const { otp: _, otpExpires: __, ...userData } = pendingUser
    
    // Add verified user to allUsers immediately
    setAllUsers(prev => ({
      ...prev,
      [email]: { ...userData, verified: true }
    }))
    
    setPendingUsers(prev => {
      const newPending = { ...prev }
      delete newPending[email]
      return newPending
    })
    
    return true
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
    clockIn, 
    clockOut, 
    isOnManager,
    leaveRequests,
    clockActivities,
    allUsers,
    pendingUsers,
    submitLeaveRequest,
    processLeaveRequest,
    registerStaff,
    verifyOTP,
    updateStaff
  }),[user, isOnManager, leaveRequests, clockActivities, allUsers, pendingUsers])
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
