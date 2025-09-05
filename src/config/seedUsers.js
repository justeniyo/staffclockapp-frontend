// src/config/seedUsers.js - Refactored for PostgreSQL backend compatibility

export const seedUsers = {
  // === CEO (Top of hierarchy) ===
  "ceo@company.com": { 
    id: "usr_001",
    password: "password123", 
    role: "ceo", 
    firstName: "Sarah", 
    lastName: "Chen",
    email: "ceo@company.com",
    department: "Executive", 
    phone: "+1-555-0101", 
    verified: true, 
    isActive: true,
    isClockedIn: false,
    isManager: true,
    manager: null, // CEO has no manager
    createdAt: "2024-01-15T08:00:00Z",
    updatedAt: "2024-01-15T08:00:00Z"
  },

  // === C-Level Executives (Report to CEO) ===
  "cto@company.com": { 
    id: "usr_002",
    password: "password123", 
    role: "staff", 
    firstName: "Michael", 
    lastName: "Torres",
    email: "cto@company.com",
    department: "IT", 
    phone: "+1-555-0201", 
    verified: true, 
    isActive: true,
    isClockedIn: false,
    isManager: true,
    manager: "ceo@company.com",
    jobTitle: "Chief Technology Officer",
    createdAt: "2024-01-15T08:00:00Z",
    updatedAt: "2024-01-15T08:00:00Z"
  },
  
  "chro@company.com": { 
    id: "usr_003",
    password: "password123", 
    role: "staff", 
    firstName: "Linda", 
    lastName: "Washington",
    email: "chro@company.com",
    department: "HR", 
    phone: "+1-555-0301", 
    verified: true, 
    isActive: true,
    isClockedIn: false,
    isManager: true,
    manager: "ceo@company.com",
    jobTitle: "Chief HR Officer",
    createdAt: "2024-01-15T08:00:00Z",
    updatedAt: "2024-01-15T08:00:00Z"
  },

  "cso@company.com": { 
    id: "usr_004",
    password: "password123", 
    role: "staff", 
    firstName: "Robert", 
    lastName: "Martinez",
    email: "cso@company.com",
    department: "Sales", 
    phone: "+1-555-0401", 
    verified: true, 
    isActive: true,
    isClockedIn: true,
    isManager: true,
    manager: "ceo@company.com",
    jobTitle: "Chief Sales Officer",
    createdAt: "2024-01-15T08:00:00Z",
    updatedAt: "2024-01-15T08:00:00Z"
  },

  "coo@company.com": { 
    id: "usr_005",
    password: "password123", 
    role: "staff", 
    firstName: "Maria", 
    lastName: "Rodriguez",
    email: "coo@company.com",
    department: "Operations", 
    phone: "+1-555-0501", 
    verified: true, 
    isActive: true,
    isClockedIn: false,
    isManager: true,
    manager: "ceo@company.com",
    jobTitle: "Chief Operations Officer",
    createdAt: "2024-01-15T08:00:00Z",
    updatedAt: "2024-01-15T08:00:00Z"
  },

  // === Department Managers (Report to C-Level) ===
  "it.manager@company.com": { 
    id: "usr_006",
    password: "password123", 
    role: "staff", 
    firstName: "Mike", 
    lastName: "Johnson",
    email: "it.manager@company.com",
    department: "IT", 
    phone: "+1-555-0202", 
    verified: true, 
    isActive: true,
    isClockedIn: false,
    isManager: true,
    manager: "cto@company.com",
    jobTitle: "IT Manager",
    createdAt: "2024-01-15T08:00:00Z",
    updatedAt: "2024-01-15T08:00:00Z"
  },

  "hr.manager@company.com": { 
    id: "usr_007",
    password: "password123", 
    role: "staff", 
    firstName: "Lisa", 
    lastName: "Wang",
    email: "hr.manager@company.com",
    department: "HR", 
    phone: "+1-555-0302", 
    verified: true, 
    isActive: true,
    isClockedIn: false,
    isManager: true,
    manager: "chro@company.com",
    jobTitle: "HR Manager",
    createdAt: "2024-01-15T08:00:00Z",
    updatedAt: "2024-01-15T08:00:00Z"
  },

  "sales.manager@company.com": { 
    id: "usr_008",
    password: "password123", 
    role: "staff", 
    firstName: "Jennifer", 
    lastName: "Davis",
    email: "sales.manager@company.com",
    department: "Sales", 
    phone: "+1-555-0402", 
    verified: true, 
    isActive: true,
    isClockedIn: true,
    isManager: true,
    manager: "cso@company.com",
    jobTitle: "Sales Manager",
    createdAt: "2024-01-15T08:00:00Z",
    updatedAt: "2024-01-15T08:00:00Z"
  },

  "ops.manager@company.com": { 
    id: "usr_009",
    password: "password123", 
    role: "staff", 
    firstName: "Thomas", 
    lastName: "Anderson",
    email: "ops.manager@company.com",
    department: "Operations", 
    phone: "+1-555-0502", 
    verified: true, 
    isActive: true,
    isClockedIn: true,
    isManager: true,
    manager: "coo@company.com",
    jobTitle: "Operations Manager",
    createdAt: "2024-01-15T08:00:00Z",
    updatedAt: "2024-01-15T08:00:00Z"
  },

  // === Regular Staff ===
  // IT Department Staff
  "dev1@company.com": { 
    id: "usr_010",
    password: "password123", 
    role: "staff", 
    firstName: "Alex", 
    lastName: "Rodriguez",
    email: "dev1@company.com",
    department: "IT", 
    phone: "+1-555-0203", 
    verified: true, 
    isActive: true,
    isClockedIn: true,
    isManager: false,
    manager: "it.manager@company.com",
    jobTitle: "Senior Developer",
    createdAt: "2024-01-15T08:00:00Z",
    updatedAt: "2024-01-15T08:00:00Z"
  },

  "dev2@company.com": { 
    id: "usr_011",
    password: "password123", 
    role: "staff", 
    firstName: "Emma", 
    lastName: "Thompson",
    email: "dev2@company.com",
    department: "IT", 
    phone: "+1-555-0204", 
    verified: true, 
    isActive: true,
    isClockedIn: false,
    isManager: false,
    manager: "it.manager@company.com",
    jobTitle: "Frontend Developer",
    createdAt: "2024-01-15T08:00:00Z",
    updatedAt: "2024-01-15T08:00:00Z"
  },

  "sysadmin@company.com": { 
    id: "usr_012",
    password: "password123", 
    role: "staff", 
    firstName: "David", 
    lastName: "Kim",
    email: "sysadmin@company.com",
    department: "IT", 
    phone: "+1-555-0205", 
    verified: true, 
    isActive: true,
    isClockedIn: true,
    isManager: false,
    manager: "it.manager@company.com",
    jobTitle: "System Administrator",
    createdAt: "2024-01-15T08:00:00Z",
    updatedAt: "2024-01-15T08:00:00Z"
  },

  // HR Department Staff
  "hr.specialist@company.com": { 
    id: "usr_013",
    password: "password123", 
    role: "staff", 
    firstName: "James", 
    lastName: "Wilson",
    email: "hr.specialist@company.com",
    department: "HR", 
    phone: "+1-555-0303", 
    verified: true, 
    isActive: true,
    isClockedIn: false,
    isManager: false,
    manager: "hr.manager@company.com",
    jobTitle: "HR Specialist",
    createdAt: "2024-01-15T08:00:00Z",
    updatedAt: "2024-01-15T08:00:00Z"
  },

  "hr.coordinator@company.com": { 
    id: "usr_014",
    password: "password123", 
    role: "staff", 
    firstName: "Sophie", 
    lastName: "Brown",
    email: "hr.coordinator@company.com",
    department: "HR", 
    phone: "+1-555-0304", 
    verified: true, 
    isActive: true,
    isClockedIn: false,
    isManager: false,
    manager: "hr.manager@company.com",
    jobTitle: "HR Coordinator",
    createdAt: "2024-01-15T08:00:00Z",
    updatedAt: "2024-01-15T08:00:00Z"
  },

  // Sales Department Staff
  "sales1@company.com": { 
    id: "usr_015",
    password: "password123", 
    role: "staff", 
    firstName: "Christopher", 
    lastName: "Lee",
    email: "sales1@company.com",
    department: "Sales", 
    phone: "+1-555-0403", 
    verified: true, 
    isActive: true,
    isClockedIn: true,
    isManager: false,
    manager: "sales.manager@company.com",
    jobTitle: "Sales Representative",
    createdAt: "2024-01-15T08:00:00Z",
    updatedAt: "2024-01-15T08:00:00Z"
  },

  "sales2@company.com": { 
    id: "usr_016",
    password: "password123", 
    role: "staff", 
    firstName: "Amanda", 
    lastName: "Clark",
    email: "sales2@company.com",
    department: "Sales", 
    phone: "+1-555-0404", 
    verified: true, 
    isActive: true,
    isClockedIn: false,
    isManager: false,
    manager: "sales.manager@company.com",
    jobTitle: "Account Executive",
    createdAt: "2024-01-15T08:00:00Z",
    updatedAt: "2024-01-15T08:00:00Z"
  },

  // Operations Department Staff
  "ops1@company.com": { 
    id: "usr_017",
    password: "password123", 
    role: "staff", 
    firstName: "Kevin", 
    lastName: "Garcia",
    email: "ops1@company.com",
    department: "Operations", 
    phone: "+1-555-0503", 
    verified: true, 
    isActive: true,
    isClockedIn: true,
    isManager: false,
    manager: "ops.manager@company.com",
    jobTitle: "Operations Coordinator",
    createdAt: "2024-01-15T08:00:00Z",
    updatedAt: "2024-01-15T08:00:00Z"
  },

  "ops2@company.com": { 
    id: "usr_018",
    password: "password123", 
    role: "staff", 
    firstName: "Rachel", 
    lastName: "Moore",
    email: "ops2@company.com",
    department: "Operations", 
    phone: "+1-555-0504", 
    verified: true, 
    isActive: true,
    isClockedIn: false,
    isManager: false,
    manager: "ops.manager@company.com",
    jobTitle: "Operations Analyst",
    createdAt: "2024-01-15T08:00:00Z",
    updatedAt: "2024-01-15T08:00:00Z"
  },

  // === System Roles (Outside hierarchy) ===
  "admin@company.com": { 
    id: "usr_019",
    password: "password123", 
    role: "admin", 
    firstName: "Admin", 
    lastName: "User",
    email: "admin@company.com",
    department: "Administration", 
    phone: "+1-555-0100", 
    verified: true, 
    isActive: true,
    isClockedIn: false,
    isManager: false,
    manager: null, // Admin is outside hierarchy
    jobTitle: "System Administrator",
    createdAt: "2024-01-15T08:00:00Z",
    updatedAt: "2024-01-15T08:00:00Z"
  },

  "security@company.com": { 
    id: "usr_020",
    password: "password123", 
    role: "security", 
    firstName: "Security", 
    lastName: "Officer",
    email: "security@company.com",
    department: "Security", 
    phone: "+1-555-0102", 
    verified: true, 
    isActive: true,
    isClockedIn: false,
    isManager: false,
    manager: null, // Security is outside hierarchy
    jobTitle: "Security Guard",
    assignedLocation: "Main Office", // Security-specific field
    createdAt: "2024-01-15T08:00:00Z",
    updatedAt: "2024-01-15T08:00:00Z"
  },

  // === Test Users ===
  "inactive.user@company.com": { 
    id: "usr_021",
    password: "password123", 
    role: "staff", 
    firstName: "John", 
    lastName: "Former",
    email: "inactive.user@company.com",
    department: "IT", 
    phone: "+1-555-0999", 
    verified: true, 
    isActive: false, // Inactive user
    isClockedIn: false,
    isManager: false,
    manager: "it.manager@company.com",
    jobTitle: "Former Employee",
    createdAt: "2024-01-15T08:00:00Z",
    updatedAt: "2024-08-15T08:00:00Z"
  },

  "unverified.user@company.com": { 
    id: "usr_022",
    password: "Welcome123!", 
    role: "staff", 
    firstName: "Jane", 
    lastName: "NewUser",
    email: "unverified.user@company.com",
    department: "HR", 
    phone: "+1-555-1000", 
    verified: false, // Unverified user
    isActive: true,
    isClockedIn: false,
    isManager: false,
    manager: "hr.manager@company.com",
    jobTitle: "New Hire",
    createdAt: "2024-09-01T08:00:00Z",
    updatedAt: "2024-09-01T08:00:00Z"
  }
}

// Hierarchical leave requests with multi-level approvals
export const seedLeaveRequests = [
  // === Regular Staff Leave Requests (Approved by Department Managers) ===
  {
    id: "lr_001",
    staffId: "dev1@company.com", 
    staffName: "Alex Rodriguez",
    department: "IT",
    manager: "it.manager@company.com",
    type: "Annual",
    startDate: "2025-09-15",
    endDate: "2025-09-17", 
    status: "pending",
    requestDate: "2025-09-01T10:30:00Z",
    processedBy: null,
    processedDate: null,
    createdAt: "2025-09-01T10:30:00Z",
    updatedAt: "2025-09-01T10:30:00Z"
  },
  {
    id: "lr_002",
    staffId: "dev2@company.com", 
    staffName: "Emma Thompson",
    department: "IT",
    manager: "it.manager@company.com",
    type: "Sick",
    startDate: "2025-08-28",
    endDate: "2025-08-30", 
    status: "approved",
    requestDate: "2025-08-27T08:15:00Z",
    processedBy: "it.manager@company.com",
    processedDate: "2025-08-27T14:20:00Z",
    createdAt: "2025-08-27T08:15:00Z",
    updatedAt: "2025-08-27T14:20:00Z"
  },
  {
    id: "lr_003",
    staffId: "sales1@company.com", 
    staffName: "Christopher Lee",
    department: "Sales",
    manager: "sales.manager@company.com",
    type: "Personal",
    startDate: "2025-09-20",
    endDate: "2025-09-20", 
    status: "rejected",
    requestDate: "2025-09-02T16:45:00Z",
    processedBy: "sales.manager@company.com",
    processedDate: "2025-09-02T18:30:00Z",
    createdAt: "2025-09-02T16:45:00Z",
    updatedAt: "2025-09-02T18:30:00Z"
  },
  {
    id: "lr_004",
    staffId: "hr.specialist@company.com", 
    staffName: "James Wilson",
    department: "HR",
    manager: "hr.manager@company.com",
    type: "Emergency",
    startDate: "2025-09-05",
    endDate: "2025-09-06", 
    status: "approved",
    requestDate: "2025-09-04T22:10:00Z",
    processedBy: "hr.manager@company.com",
    processedDate: "2025-09-05T07:00:00Z",
    createdAt: "2025-09-04T22:10:00Z",
    updatedAt: "2025-09-05T07:00:00Z"
  },

  // === Department Manager Leave Requests (Approved by C-Level Executives) ===
  {
    id: "lr_005",
    staffId: "it.manager@company.com", 
    staffName: "Mike Johnson",
    department: "IT",
    manager: "cto@company.com", // IT Manager reports to CTO
    type: "Annual",
    startDate: "2025-09-10",
    endDate: "2025-09-12", 
    status: "approved",
    requestDate: "2025-08-25T09:00:00Z",
    processedBy: "cto@company.com",
    processedDate: "2025-08-25T15:30:00Z",
    createdAt: "2025-08-25T09:00:00Z",
    updatedAt: "2025-08-25T15:30:00Z"
  },
  {
    id: "lr_006",
    staffId: "hr.manager@company.com", 
    staffName: "Lisa Wang",
    department: "HR",
    manager: "chro@company.com", // HR Manager reports to CHRO
    type: "Personal",
    startDate: "2025-09-25",
    endDate: "2025-09-27", 
    status: "pending",
    requestDate: "2025-09-03T14:20:00Z",
    processedBy: null,
    processedDate: null,
    createdAt: "2025-09-03T14:20:00Z",
    updatedAt: "2025-09-03T14:20:00Z"
  },

  // === C-Level Executive Leave Requests (Approved by CEO) ===
  {
    id: "lr_007",
    staffId: "cto@company.com", 
    staffName: "Michael Torres",
    department: "IT",
    manager: "ceo@company.com", // CTO reports to CEO
    type: "Annual",
    startDate: "2025-10-01",
    endDate: "2025-10-05", 
    status: "approved",
    requestDate: "2025-08-30T11:00:00Z",
    processedBy: "ceo@company.com",
    processedDate: "2025-08-30T16:45:00Z",
    createdAt: "2025-08-30T11:00:00Z",
    updatedAt: "2025-08-30T16:45:00Z"
  },
  {
    id: "lr_008",
    staffId: "cso@company.com", 
    staffName: "Robert Martinez",
    department: "Sales",
    manager: "ceo@company.com", // CSO reports to CEO
    type: "Personal",
    startDate: "2025-09-18",
    endDate: "2025-09-19", 
    status: "pending",
    requestDate: "2025-09-04T08:30:00Z",
    processedBy: null,
    processedDate: null,
    createdAt: "2025-09-04T08:30:00Z",
    updatedAt: "2025-09-04T08:30:00Z"
  },

  // === Additional Regular Staff Requests ===
  {
    id: "lr_009",
    staffId: "ops1@company.com", 
    staffName: "Kevin Garcia",
    department: "Operations",
    manager: "ops.manager@company.com",
    type: "Sick",
    startDate: "2025-09-08",
    endDate: "2025-09-08", 
    status: "approved",
    requestDate: "2025-09-07T22:00:00Z",
    processedBy: "ops.manager@company.com",
    processedDate: "2025-09-08T07:30:00Z",
    createdAt: "2025-09-07T22:00:00Z",
    updatedAt: "2025-09-08T07:30:00Z"
  },
  {
    id: "lr_010",
    staffId: "sales2@company.com", 
    staffName: "Amanda Clark",
    department: "Sales",
    manager: "sales.manager@company.com",
    type: "Annual",
    startDate: "2025-09-22",
    endDate: "2025-09-24", 
    status: "pending",
    requestDate: "2025-09-05T13:15:00Z",
    processedBy: null,
    processedDate: null,
    createdAt: "2025-09-05T13:15:00Z",
    updatedAt: "2025-09-05T13:15:00Z"
  }
]

// Simplified clock activities (removed notes and isManual)
export const seedClockActivities = [
  {
    id: "ca_001",
    staffId: "dev1@company.com",
    staffName: "Alex Rodriguez", 
    department: "IT",
    action: "clock_in",
    timestamp: "2025-09-05T09:15:23Z",
    location: "Main Office",
    createdAt: "2025-09-05T09:15:23Z"
  },
  {
    id: "ca_002", 
    staffId: "dev1@company.com",
    staffName: "Alex Rodriguez", 
    department: "IT", 
    action: "clock_out",
    timestamp: "2025-09-04T17:30:45Z",
    location: "Main Office",
    createdAt: "2025-09-04T17:30:45Z"
  },
  {
    id: "ca_003",
    staffId: "sales1@company.com",
    staffName: "Christopher Lee", 
    department: "Sales",
    action: "clock_in", 
    timestamp: "2025-09-05T08:45:12Z",
    location: "Remote",
    createdAt: "2025-09-05T08:45:12Z"
  },
  {
    id: "ca_004",
    staffId: "ops1@company.com", 
    staffName: "Kevin Garcia",
    department: "Operations",
    action: "clock_in",
    timestamp: "2025-09-05T07:00:00Z", 
    location: "Warehouse Site",
    createdAt: "2025-09-05T07:00:00Z"
  },
  {
    id: "ca_005",
    staffId: "sysadmin@company.com",
    staffName: "David Kim", 
    department: "IT",
    action: "clock_in",
    timestamp: "2025-09-05T09:30:15Z",
    location: "Main Office", 
    createdAt: "2025-09-05T09:30:15Z"
  },
  {
    id: "ca_006",
    staffId: "sales.manager@company.com",
    staffName: "Jennifer Davis", 
    department: "Sales",
    action: "clock_in",
    timestamp: "2025-09-05T08:00:00Z",
    location: "Main Office", 
    createdAt: "2025-09-05T08:00:00Z"
  },
  {
    id: "ca_007",
    staffId: "cso@company.com",
    staffName: "Robert Martinez", 
    department: "Sales",
    action: "clock_in",
    timestamp: "2025-09-05T07:45:00Z",
    location: "Main Office", 
    createdAt: "2025-09-05T07:45:00Z"
  },
  {
    id: "ca_008",
    staffId: "ops.manager@company.com",
    staffName: "Thomas Anderson", 
    department: "Operations",
    action: "clock_in",
    timestamp: "2025-09-05T07:30:00Z",
    location: "Warehouse Site", 
    createdAt: "2025-09-05T07:30:00Z"
  }
]

// Helper function to get full name (unchanged)
export const getFullName = (user) => {
  if (!user) return 'Unknown User'
  if (user.name) return user.name // Legacy support
  return `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown User'
}

// Helper function to get initials (unchanged)
export const getUserInitials = (user) => {
  if (!user) return 'U'
  
  // Legacy support
  if (user.name && !user.firstName && !user.lastName) {
    const words = user.name.split(' ')
    if (words.length === 1) return words[0].charAt(0).toUpperCase()
    return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase()
  }
  
  // New structure
  const firstName = user.firstName || ''
  const lastName = user.lastName || ''
  
  if (!firstName && !lastName) return 'U'
  if (!lastName) return firstName.charAt(0).toUpperCase()
  
  return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase()
}

// Helper function to get user's manager (for hierarchical approvals)
export const getUserManager = (userEmail) => {
  const user = seedUsers[userEmail]
  return user?.manager || null
}

// Helper function to check if user can approve leave for another user
export const canApproveLeave = (approverEmail, requestingUserEmail) => {
  const requestingUser = seedUsers[requestingUserEmail]
  if (!requestingUser) return false
  
  // Check if approver is the direct manager of requesting user
  return requestingUser.manager === approverEmail
}

// Helper function to get all direct reports for a manager
export const getDirectReports = (managerEmail) => {
  return Object.entries(seedUsers)
    .filter(([email, user]) => user.manager === managerEmail)
    .map(([email, user]) => ({ ...user, email }))
}

// Helper function to get user hierarchy level (for org chart)
export const getUserLevel = (userEmail) => {
  const user = seedUsers[userEmail]
  if (!user) return -1
  
  if (user.role === 'ceo') return 0
  if (user.manager === 'ceo@company.com') return 1 // C-Level
  if (user.isManager && user.manager?.includes('@company.com')) return 2 // Department Managers
  return 3 // Regular Staff
}