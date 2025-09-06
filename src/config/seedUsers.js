export const seedUsers = {
  // CEO
  "ceo@company.com": { 
    password: "password123", role: "ceo", firstName: "Sarah", lastName: "Chen",
    department: "Executive", phone: "+1-555-0101", verified: true, isActive: true
  },

  // Admin
  "admin@company.com": { 
    password: "password123", role: "admin", firstName: "Admin", lastName: "User",
    department: "Administration", phone: "+1-555-0100", verified: true, isActive: true
  },

  // Security
  "security@company.com": { 
    password: "password123", role: "security", firstName: "Security", lastName: "Officer",
    department: "Security", phone: "+1-555-0102", verified: true, isActive: true
  },

  // IT Department
  "it.manager@company.com": { 
    password: "password123", role: "staff", firstName: "Mike", lastName: "Johnson", isManager: true,
    department: "IT", phone: "+1-555-0201", isClockedIn: false, verified: true, isActive: true
  },
  "dev1@company.com": { 
    password: "password123", role: "staff", firstName: "Alex", lastName: "Rodriguez",
    department: "IT", manager: "it.manager@company.com", phone: "+1-555-0202", 
    isClockedIn: true, verified: true, isActive: true
  },
  "dev2@company.com": { 
    password: "password123", role: "staff", firstName: "Emma", lastName: "Thompson",
    department: "IT", manager: "it.manager@company.com", phone: "+1-555-0203", 
    isClockedIn: false, verified: true, isActive: true
  },
  "sysadmin@company.com": { 
    password: "password123", role: "staff", firstName: "David", lastName: "Kim",
    department: "IT", manager: "it.manager@company.com", phone: "+1-555-0204", 
    isClockedIn: true, verified: true, isActive: true
  },

  // HR Department
  "hr.manager@company.com": { 
    password: "password123", role: "staff", firstName: "Lisa", lastName: "Wang", isManager: true,
    department: "HR", phone: "+1-555-0301", isClockedIn: false, verified: true, isActive: true
  },
  "hr.specialist@company.com": { 
    password: "password123", role: "staff", firstName: "James", lastName: "Wilson",
    department: "HR", manager: "hr.manager@company.com", phone: "+1-555-0302", 
    isClockedIn: false, verified: true, isActive: true
  },

  // Sales Department
  "sales.manager@company.com": { 
    password: "password123", role: "staff", firstName: "Robert", lastName: "Davis", isManager: true,
    department: "Sales", phone: "+1-555-0401", isClockedIn: true, verified: true, isActive: true
  },
  "sales1@company.com": { 
    password: "password123", role: "staff", firstName: "Jennifer", lastName: "Martinez",
    department: "Sales", manager: "sales.manager@company.com", phone: "+1-555-0402", 
    isClockedIn: true, verified: true, isActive: true
  },
  "sales2@company.com": { 
    password: "password123", role: "staff", firstName: "Christopher", lastName: "Lee",
    department: "Sales", manager: "sales.manager@company.com", phone: "+1-555-0403", 
    isClockedIn: false, verified: true, isActive: true
  },

  // Operations Department  
  "ops.manager@company.com": { 
    password: "password123", role: "staff", firstName: "Maria", lastName: "Garcia", isManager: true,
    department: "Operations", phone: "+1-555-0501", isClockedIn: false, verified: true, isActive: true
  },
  "ops1@company.com": { 
    password: "password123", role: "staff", firstName: "Thomas", lastName: "Anderson",
    department: "Operations", manager: "ops.manager@company.com", phone: "+1-555-0502", 
    isClockedIn: true, verified: true, isActive: true
  },

  // Inactive former employee (example)
  "former.employee@company.com": { 
    password: "password123", role: "staff", firstName: "John", lastName: "Former",
    department: "IT", manager: "it.manager@company.com", phone: "+1-555-0999", 
    isClockedIn: false, verified: true, isActive: false
  },

  // Unverified new user (example)
  "new.user@company.com": { 
    password: "Welcome123!", role: "staff", firstName: "Jane", lastName: "NewUser",
    department: "HR", manager: "hr.manager@company.com", phone: "+1-555-1000", 
    isClockedIn: false, verified: false, isActive: true
  }
}

// Sample leave requests (simplified - no reason/notes)
export const seedLeaveRequests = [
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
    processedDate: null
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
    processedDate: "2025-08-27T14:20:00Z"
  },
  {
    id: "lr_003",
    staffId: "sales1@company.com", 
    staffName: "Jennifer Martinez",
    department: "Sales",
    manager: "sales.manager@company.com",
    type: "Personal",
    startDate: "2025-09-20",
    endDate: "2025-09-20", 
    status: "rejected",
    requestDate: "2025-09-02T16:45:00Z",
    processedBy: "sales.manager@company.com",
    processedDate: "2025-09-02T18:30:00Z"
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
    processedDate: "2025-09-05T07:00:00Z"
  }
]

// Sample clock activities (updated with new name structure)
export const seedClockActivities = [
  {
    id: "ca_001",
    staffId: "dev1@company.com",
    staffName: "Alex Rodriguez", 
    department: "IT",
    action: "clock_in",
    timestamp: "2025-09-03T09:15:23Z",
    location: "Office",
    notes: ""
  },
  {
    id: "ca_002", 
    staffId: "dev1@company.com",
    staffName: "Alex Rodriguez", 
    department: "IT", 
    action: "clock_out",
    timestamp: "2025-09-02T17:30:45Z",
    location: "Office",
    notes: "Completed project milestone"
  },
  {
    id: "ca_003",
    staffId: "sales1@company.com",
    staffName: "Jennifer Martinez", 
    department: "Sales",
    action: "clock_in", 
    timestamp: "2025-09-03T08:45:12Z",
    location: "Remote",
    notes: "Working from home today"
  },
  {
    id: "ca_004",
    staffId: "ops1@company.com", 
    staffName: "Thomas Anderson",
    department: "Operations",
    action: "clock_in",
    timestamp: "2025-09-03T07:00:00Z", 
    location: "Field",
    notes: "Site inspection at warehouse"
  },
  {
    id: "ca_005",
    staffId: "sysadmin@company.com",
    staffName: "David Kim", 
    department: "IT",
    action: "clock_in",
    timestamp: "2025-09-03T09:30:15Z",
    location: "Office", 
    notes: "Server maintenance scheduled"
  }
]

// Helper function to get full name
export const getFullName = (user) => {
  if (!user) return 'Unknown User'
  if (user.name) return user.name // Legacy support
  return `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown User'
}

// Helper function to get initials
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