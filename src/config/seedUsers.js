// Backend-ready seed data structure with separate location model
// This mirrors the PostgreSQL database schema

// Separate locations model
export const seedLocations = {
  "loc_001": {
    id: "loc_001",
    name: "Main Office",
    address: "123 Business St, Downtown",
    type: "office",
    isActive: true,
    createdAt: "2024-01-15T09:00:00Z",
    updatedAt: "2024-01-15T09:00:00Z"
  },
  "loc_002": {
    id: "loc_002", 
    name: "Warehouse",
    address: "456 Industrial Ave, Warehouse District",
    type: "warehouse",
    isActive: true,
    createdAt: "2024-01-15T09:00:00Z",
    updatedAt: "2024-01-15T09:00:00Z"
  },
  "loc_003": {
    id: "loc_003",
    name: "Remote",
    address: "Various Locations",
    type: "remote",
    isActive: true,
    createdAt: "2024-01-15T09:00:00Z",
    updatedAt: "2024-01-15T09:00:00Z"
  },
  "loc_004": {
    id: "loc_004",
    name: "Branch Office",
    address: "789 Corporate Blvd, Uptown",
    type: "office", 
    isActive: true,
    createdAt: "2024-01-15T09:00:00Z",
    updatedAt: "2024-01-15T09:00:00Z"
  }
}

// Separate departments model
export const seedDepartments = {
  "dept_001": {
    id: "dept_001",
    name: "Executive",
    description: "C-Level leadership and strategic direction",
    isActive: true,
    createdAt: "2024-01-15T09:00:00Z",
    updatedAt: "2024-01-15T09:00:00Z"
  },
  "dept_002": {
    id: "dept_002",
    name: "IT",
    description: "Information Technology and Systems",
    isActive: true,
    createdAt: "2024-01-15T09:00:00Z",
    updatedAt: "2024-01-15T09:00:00Z"
  },
  "dept_003": {
    id: "dept_003",
    name: "HR",
    description: "Human Resources and People Operations",
    isActive: true,
    createdAt: "2024-01-15T09:00:00Z",
    updatedAt: "2024-01-15T09:00:00Z"
  },
  "dept_004": {
    id: "dept_004",
    name: "Sales",
    description: "Sales and Customer Relations",
    isActive: true,
    createdAt: "2024-01-15T09:00:00Z",
    updatedAt: "2024-01-15T09:00:00Z"
  },
  "dept_005": {
    id: "dept_005",
    name: "Operations",
    description: "Operations and Supply Chain",
    isActive: true,
    createdAt: "2024-01-15T09:00:00Z",
    updatedAt: "2024-01-15T09:00:00Z"
  },
  "dept_006": {
    id: "dept_006",
    name: "Finance",
    description: "Financial Management and Accounting",
    isActive: true,
    createdAt: "2024-01-15T09:00:00Z",
    updatedAt: "2024-01-15T09:00:00Z"
  },
  "dept_007": {
    id: "dept_007",
    name: "Administration",
    description: "System Administration and Support",
    isActive: true,
    createdAt: "2024-01-15T09:00:00Z",
    updatedAt: "2024-01-15T09:00:00Z"
  },
  "dept_008": {
    id: "dept_008",
    name: "Security",
    description: "Physical Security and Access Control",
    isActive: true,
    createdAt: "2024-01-15T09:00:00Z",
    updatedAt: "2024-01-15T09:00:00Z"
  }
}

export const seedUsers = {
  // CEO - Top of hierarchy, automatically a manager
  "ceo@company.com": { 
    id: "usr_001",
    password: "password", // Will be hashed in backend
    role: "ceo", 
    firstName: "Sarah", 
    lastName: "Chen",
    department: "Executive", 
    phone: "+1-555-0101", 
    isManager: true, // CEO is always a manager
    managerId: null, // CEO reports to no one
    verified: true, 
    isActive: true,
    isClockedIn: false,
    jobTitle: "Chief Executive Officer",
    assignedLocationId: "loc_001", // Main Office
    createdAt: "2024-01-15T09:00:00Z",
    updatedAt: "2024-01-15T09:00:00Z"
  },

  // System Administrator - Outside hierarchy
  "admin@company.com": { 
    id: "usr_002",
    password: "password", 
    role: "admin", 
    firstName: "Admin", 
    lastName: "User",
    department: "Administration", 
    phone: "+1-555-0100", 
    isManager: false,
    managerId: null, // Admin doesn't report to anyone
    verified: true, 
    isActive: true,
    isClockedIn: false,
    jobTitle: "System Administrator",
    assignedLocationId: "loc_001", // Main Office
    createdAt: "2024-01-15T09:00:00Z",
    updatedAt: "2024-01-15T09:00:00Z"
  },

  // Security Guard - Third party, reports to admin for system access
  "security@company.com": { 
    id: "usr_003",
    password: "password", 
    role: "security", 
    firstName: "Security", 
    lastName: "Officer",
    department: "Security", 
    phone: "+1-555-0102", 
    isManager: false,
    managerId: "usr_002", // Reports to admin for system management
    verified: true, 
    isActive: true,
    isClockedIn: true,
    jobTitle: "Security Officer",
    assignedLocationId: "loc_001", // Main Office assignment
    createdAt: "2024-01-15T09:00:00Z",
    updatedAt: "2024-01-15T09:00:00Z"
  },

  // C-Level Executives - Reports to CEO
  "cfo@company.com": {
    id: "usr_004",
    password: "password",
    role: "staff",
    firstName: "Michael",
    lastName: "Roberts",
    department: "Executive",
    phone: "+1-555-0104",
    isManager: true,
    managerId: "usr_001", // Reports to CEO
    verified: true,
    isActive: true,
    isClockedIn: false,
    jobTitle: "Chief Financial Officer",
    assignedLocationId: "loc_001", // Main Office
    createdAt: "2024-01-15T09:00:00Z",
    updatedAt: "2024-01-15T09:00:00Z"
  },

  "cto@company.com": {
    id: "usr_005",
    password: "password",
    role: "staff",
    firstName: "Jennifer",
    lastName: "Park",
    department: "Executive",
    phone: "+1-555-0105",
    isManager: true,
    managerId: "usr_001", // Reports to CEO
    verified: true,
    isActive: true,
    isClockedIn: false,
    jobTitle: "Chief Technology Officer",
    assignedLocationId: "loc_001", // Main Office
    createdAt: "2024-01-15T09:00:00Z",
    updatedAt: "2024-01-15T09:00:00Z"
  },

  "coo@company.com": {
    id: "usr_006",
    password: "password",
    role: "staff",
    firstName: "David",
    lastName: "Williams",
    department: "Executive",
    phone: "+1-555-0106",
    isManager: true,
    managerId: "usr_001", // Reports to CEO
    verified: true,
    isActive: true,
    isClockedIn: false,
    jobTitle: "Chief Operating Officer",
    assignedLocationId: "loc_001", // Main Office
    createdAt: "2024-01-15T09:00:00Z",
    updatedAt: "2024-01-15T09:00:00Z"
  },

  // Department Managers - Report to relevant C-Level Executives
  "it.manager@company.com": { 
    id: "usr_007",
    password: "password", 
    role: "staff", 
    firstName: "Mike", 
    lastName: "Johnson", 
    isManager: true,
    department: "IT", 
    phone: "+1-555-0201", 
    managerId: "usr_005", // Reports to CTO
    isClockedIn: false, 
    verified: true, 
    isActive: true,
    jobTitle: "IT Director",
    assignedLocationId: "loc_001", // Main Office
    createdAt: "2024-01-15T09:00:00Z",
    updatedAt: "2024-01-15T09:00:00Z"
  },

  "hr.manager@company.com": { 
    id: "usr_008",
    password: "password", 
    role: "staff", 
    firstName: "Lisa", 
    lastName: "Wang", 
    isManager: true,
    department: "HR", 
    phone: "+1-555-0301", 
    managerId: "usr_001", // Reports directly to CEO
    isClockedIn: false, 
    verified: true, 
    isActive: true,
    jobTitle: "HR Director",
    assignedLocationId: "loc_001", // Main Office
    createdAt: "2024-01-15T09:00:00Z",
    updatedAt: "2024-01-15T09:00:00Z"
  },

  "sales.manager@company.com": { 
    id: "usr_009",
    password: "password", 
    role: "staff", 
    firstName: "Robert", 
    lastName: "Davis", 
    isManager: true,
    department: "Sales", 
    phone: "+1-555-0401", 
    managerId: "usr_001", // Reports directly to CEO
    isClockedIn: true, 
    verified: true, 
    isActive: true,
    jobTitle: "Sales Director",
    assignedLocationId: "loc_001", // Main Office
    createdAt: "2024-01-15T09:00:00Z",
    updatedAt: "2024-01-15T09:00:00Z"
  },

  "operations.manager@company.com": { 
    id: "usr_010",
    password: "password", 
    role: "staff", 
    firstName: "Maria", 
    lastName: "Garcia", 
    isManager: true,
    department: "Operations", 
    phone: "+1-555-0501", 
    managerId: "usr_006", // Reports to COO
    isClockedIn: false, 
    verified: true, 
    isActive: true,
    jobTitle: "Operations Director",
    assignedLocationId: "loc_002", // Warehouse
    createdAt: "2024-01-15T09:00:00Z",
    updatedAt: "2024-01-15T09:00:00Z"
  },

  "finance.manager@company.com": {
    id: "usr_011",
    password: "password",
    role: "staff",
    firstName: "David",
    lastName: "Kim",
    isManager: true,
    department: "Finance",
    phone: "+1-555-0601",
    managerId: "usr_004", // Reports to CFO
    isClockedIn: false,
    verified: true,
    isActive: true,
    jobTitle: "Finance Director",
    assignedLocationId: "loc_001", // Main Office
    createdAt: "2024-01-15T09:00:00Z",
    updatedAt: "2024-01-15T09:00:00Z"
  },

  // Regular Staff
  "dev1@company.com": { 
    id: "usr_012",
    password: "password", 
    role: "staff", 
    firstName: "Alex", 
    lastName: "Rodriguez",
    department: "IT", 
    managerId: "usr_007", // Reports to IT Director
    phone: "+1-555-0202", 
    isClockedIn: true, 
    verified: true, 
    isActive: true,
    isManager: false,
    jobTitle: "Senior Developer",
    assignedLocationId: "loc_001", // Main Office
    createdAt: "2024-01-15T09:00:00Z",
    updatedAt: "2024-01-15T09:00:00Z"
  },

  "dev2@company.com": { 
    id: "usr_013",
    password: "password", 
    role: "staff", 
    firstName: "Emma", 
    lastName: "Thompson",
    department: "IT", 
    managerId: "usr_007", // Reports to IT Director
    phone: "+1-555-0203", 
    isClockedIn: false, 
    verified: true, 
    isActive: true,
    isManager: false,
    jobTitle: "Frontend Developer",
    assignedLocationId: "loc_003", // Remote
    createdAt: "2024-01-15T09:00:00Z",
    updatedAt: "2024-01-15T09:00:00Z"
  },

  "sysadmin@company.com": { 
    id: "usr_014",
    password: "password", 
    role: "staff", 
    firstName: "Carlos", 
    lastName: "Martinez",
    department: "IT", 
    managerId: "usr_007", // Reports to IT Director
    phone: "+1-555-0204", 
    isClockedIn: true, 
    verified: true, 
    isActive: true,
    isManager: false,
    jobTitle: "System Administrator",
    assignedLocationId: "loc_001", // Main Office
    createdAt: "2024-01-15T09:00:00Z",
    updatedAt: "2024-01-15T09:00:00Z"
  },

  "hr.specialist@company.com": { 
    id: "usr_015",
    password: "password", 
    role: "staff", 
    firstName: "James", 
    lastName: "Wilson",
    department: "HR", 
    managerId: "usr_008", // Reports to HR Director
    phone: "+1-555-0302", 
    isClockedIn: false, 
    verified: true, 
    isActive: true,
    isManager: false,
    jobTitle: "HR Specialist",
    assignedLocationId: "loc_001", // Main Office
    createdAt: "2024-01-15T09:00:00Z",
    updatedAt: "2024-01-15T09:00:00Z"
  },

  "sales1@company.com": { 
    id: "usr_016",
    password: "password", 
    role: "staff", 
    firstName: "Jennifer", 
    lastName: "Martinez",
    department: "Sales", 
    managerId: "usr_009", // Reports to Sales Director
    phone: "+1-555-0402", 
    isClockedIn: true, 
    verified: true, 
    isActive: true,
    isManager: false,
    jobTitle: "Sales Representative",
    assignedLocationId: "loc_001", // Main Office
    createdAt: "2024-01-15T09:00:00Z",
    updatedAt: "2024-01-15T09:00:00Z"
  },

  "sales2@company.com": { 
    id: "usr_017",
    password: "password", 
    role: "staff", 
    firstName: "Christopher", 
    lastName: "Lee",
    department: "Sales", 
    managerId: "usr_009", // Reports to Sales Director
    phone: "+1-555-0403", 
    isClockedIn: false, 
    verified: true, 
    isActive: true,
    isManager: false,
    jobTitle: "Account Executive",
    assignedLocationId: "loc_003", // Remote
    createdAt: "2024-01-15T09:00:00Z",
    updatedAt: "2024-01-15T09:00:00Z"
  },

  "ops1@company.com": { 
    id: "usr_018",
    password: "password", 
    role: "staff", 
    firstName: "Thomas", 
    lastName: "Anderson",
    department: "Operations", 
    managerId: "usr_010", // Reports to Operations Director
    phone: "+1-555-0502", 
    isClockedIn: true, 
    verified: true, 
    isActive: true,
    isManager: false,
    jobTitle: "Operations Coordinator",
    assignedLocationId: "loc_002", // Warehouse
    createdAt: "2024-01-15T09:00:00Z",
    updatedAt: "2024-01-15T09:00:00Z"
  },

  "finance1@company.com": {
    id: "usr_019",
    password: "password",
    role: "staff",
    firstName: "Sophie",
    lastName: "Brown",
    department: "Finance",
    managerId: "usr_011", // Reports to Finance Director
    phone: "+1-555-0602",
    isClockedIn: false,
    verified: true,
    isActive: true,
    isManager: false,
    jobTitle: "Financial Analyst",
    assignedLocationId: "loc_001", // Main Office
    createdAt: "2024-01-15T09:00:00Z",
    updatedAt: "2024-01-15T09:00:00Z"
  },

  // Inactive user example
  "former.employee@company.com": { 
    id: "usr_020",
    password: "password", 
    role: "staff", 
    firstName: "John", 
    lastName: "Former",
    department: "IT", 
    managerId: "usr_007",
    phone: "+1-555-0999", 
    isClockedIn: false, 
    verified: true, 
    isActive: false, // Inactive user
    isManager: false,
    jobTitle: "Former Developer",
    assignedLocationId: "loc_001", // Main Office
    createdAt: "2024-01-15T09:00:00Z",
    updatedAt: "2024-01-15T09:00:00Z"
  },

  // Unverified new user - needs verification then password reset
  "new.user@company.com": { 
    id: "usr_021",
    password: "password", 
    role: "staff", 
    firstName: "Jane", 
    lastName: "NewUser",
    department: "HR", 
    managerId: "usr_008",
    phone: "+1-555-1000", 
    isClockedIn: false, 
    verified: false, 
    isActive: true,
    isManager: false,
    jobTitle: "HR Assistant",
    assignedLocationId: "loc_001", // Main Office
    createdAt: "2024-09-01T09:00:00Z",
    updatedAt: "2024-09-01T09:00:00Z"
  }
}

// Updated leave requests - removed Personal leave type
export const seedLeaveRequests = [
  // Regular staff requesting annual leave
  {
    id: "lr_001",
    staffId: "usr_012", // Alex Rodriguez (dev1)
    type: "Annual",
    startDate: "2025-09-15",
    endDate: "2025-09-17", 
    reason: null, // Not required for Annual leave
    status: "pending",
    requestDate: "2025-09-01T10:30:00Z",
    processedBy: null,
    processedDate: null,
    processingNotes: null
  },

  // Manager requesting leave (approved by upper manager)
  {
    id: "lr_002",
    staffId: "usr_007", // IT Director requesting leave
    type: "Annual",
    startDate: "2025-09-20",
    endDate: "2025-09-22", 
    reason: null,
    status: "approved",
    requestDate: "2025-08-25T14:20:00Z",
    processedBy: "usr_005", // Approved by CTO
    processedDate: "2025-08-26T09:15:00Z",
    processingNotes: null
  },

  // Executive requesting leave (approved by CEO)
  {
    id: "lr_003",
    staffId: "usr_005", // CTO requesting leave  
    type: "Annual",
    startDate: "2025-10-01",
    endDate: "2025-10-03",
    reason: null,
    status: "approved", 
    requestDate: "2025-09-01T16:45:00Z",
    processedBy: "usr_001", // Approved by CEO
    processedDate: "2025-09-02T08:30:00Z",
    processingNotes: null
  },

  // Emergency leave with reason
  {
    id: "lr_004",
    staffId: "usr_015", // HR Specialist
    type: "Emergency",
    startDate: "2025-09-05",
    endDate: "2025-09-06", 
    reason: "Family emergency - hospitalization",
    status: "approved",
    requestDate: "2025-09-04T22:10:00Z",
    processedBy: "usr_008", // Approved by HR Director
    processedDate: "2025-09-05T07:00:00Z",
    processingNotes: "Approved immediately due to emergency nature. Hope family is well."
  },

  // Sick leave with reason
  {
    id: "lr_005",
    staffId: "usr_016", // Sales Rep
    type: "Sick",
    startDate: "2025-08-28",
    endDate: "2025-08-30", 
    reason: "Flu symptoms, doctor recommended rest",
    status: "approved",
    requestDate: "2025-08-27T08:15:00Z",
    processedBy: "usr_009", // Approved by Sales Director
    processedDate: "2025-08-27T14:20:00Z",
    processingNotes: "Get well soon. Medical certificate required for return."
  },

  // Rejected leave request
  {
    id: "lr_006",
    staffId: "usr_017", // Sales Account Executive
    type: "Annual",
    startDate: "2025-09-20",
    endDate: "2025-09-20", 
    reason: null,
    status: "rejected",
    requestDate: "2025-09-02T16:45:00Z",
    processedBy: "usr_009", // Rejected by Sales Director
    processedDate: "2025-09-02T18:30:00Z",
    processingNotes: "Cannot approve due to critical client presentation scheduled."
  },

  // Department manager requesting sick leave
  {
    id: "lr_007",
    staffId: "usr_008", // HR Director
    type: "Sick",
    startDate: "2025-09-10",
    endDate: "2025-09-12",
    reason: "Medical procedure scheduled",
    status: "approved",
    requestDate: "2025-08-30T11:20:00Z",
    processedBy: "usr_001", // Approved by CEO
    processedDate: "2025-08-30T15:45:00Z",
    processingNotes: "Take care of yourself. Delegate urgent matters to HR Specialist."
  },

  // Finance team leave
  {
    id: "lr_008",
    staffId: "usr_019", // Finance Analyst
    type: "Annual",
    startDate: "2025-09-25",
    endDate: "2025-09-27",
    reason: null,
    status: "pending",
    requestDate: "2025-09-03T09:30:00Z",
    processedBy: null,
    processedDate: null,
    processingNotes: null
  }
]

// Updated clock activities with location references
export const seedClockActivities = [
  {
    id: "ca_001",
    staffId: "usr_012", // Alex Rodriguez
    action: "clock_in",
    timestamp: "2025-09-06T09:15:23Z",
    locationId: "loc_001", // Main Office
    location: "Main Office" // Keep for backward compatibility
  },
  {
    id: "ca_002", 
    staffId: "usr_012", // Alex Rodriguez
    action: "clock_out",
    timestamp: "2025-09-05T17:30:45Z",
    locationId: "loc_001", // Main Office
    location: "Main Office"
  },
  {
    id: "ca_003",
    staffId: "usr_016", // Jennifer Martinez
    action: "clock_in", 
    timestamp: "2025-09-06T08:45:12Z",
    locationId: "loc_003", // Remote
    location: "Remote"
  },
  {
    id: "ca_004",
    staffId: "usr_018", // Thomas Anderson
    action: "clock_in",
    timestamp: "2025-09-06T07:00:00Z", 
    locationId: "loc_002", // Warehouse
    location: "Warehouse"
  },
  {
    id: "ca_005",
    staffId: "usr_014", // Carlos Martinez
    action: "clock_in",
    timestamp: "2025-09-06T09:30:15Z",
    locationId: "loc_001", // Main Office
    location: "Main Office"
  },
  {
    id: "ca_006",
    staffId: "usr_009", // Sales Director
    action: "clock_in",
    timestamp: "2025-09-06T08:00:00Z",
    locationId: "loc_001", // Main Office
    location: "Main Office"
  },
  {
    id: "ca_007",
    staffId: "usr_015", // HR Specialist
    action: "clock_out",
    timestamp: "2025-09-05T16:45:30Z",
    locationId: "loc_001", // Main Office
    location: "Main Office"
  },
  {
    id: "ca_008",
    staffId: "usr_003", // Security Officer
    action: "clock_in",
    timestamp: "2025-09-06T06:00:00Z",
    locationId: "loc_001", // Main Office
    location: "Main Office"
  }
]

// Helper functions remain the same but work with new structure
export const getFullName = (user) => {
  if (!user) return 'Unknown User'
  if (user.name) return user.name // Legacy support
  return `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown User'
}

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

// Helper function to get user by ID (for backend compatibility)
export const getUserById = (userId) => {
  return Object.values(seedUsers).find(user => user.id === userId)
}

// Helper function to get user by email (current key structure)
export const getUserByEmail = (email) => {
  return seedUsers[email]
}

// Helper function to get location by ID
export const getLocationById = (locationId) => {
  return seedLocations[locationId]
}

// Helper function to get department by ID  
export const getDepartmentById = (departmentId) => {
  return seedDepartments[departmentId]
}

// Helper function to get manager hierarchy
export const getManagerHierarchy = (userId) => {
  const user = getUserById(userId)
  if (!user || !user.managerId) return []
  
  const manager = getUserById(user.managerId)
  if (!manager) return []
  
  return [manager, ...getManagerHierarchy(manager.id)]
}

// Available leave types (removed Personal)
export const LEAVE_TYPES = ['Annual', 'Sick', 'Emergency']

// Database schema reference for backend implementation:
/*
-- Locations table
CREATE TABLE locations (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  address TEXT,
  type VARCHAR(50) NOT NULL CHECK (type IN ('office', 'warehouse', 'remote', 'field')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Departments table
CREATE TABLE departments (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users table (updated)
CREATE TABLE users (
  id VARCHAR(50) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('ceo', 'admin', 'security', 'staff')),
  department VARCHAR(100) REFERENCES departments(name),
  phone VARCHAR(20),
  job_title VARCHAR(100),
  is_manager BOOLEAN DEFAULT FALSE,
  manager_id VARCHAR(50) REFERENCES users(id),
  verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  is_clocked_in BOOLEAN DEFAULT FALSE,
  assigned_location_id VARCHAR(50) REFERENCES locations(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Leave requests table (updated)
CREATE TABLE leave_requests (
  id VARCHAR(50) PRIMARY KEY,
  staff_id VARCHAR(50) NOT NULL REFERENCES users(id),
  type VARCHAR(20) NOT NULL CHECK (type IN ('Annual', 'Sick', 'Emergency')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT, -- Only for Emergency and Sick
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  request_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  processed_by VARCHAR(50) REFERENCES users(id),
  processed_date TIMESTAMP,
  processing_notes TEXT, -- Only for Emergency and Sick
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Clock activities table (updated)
CREATE TABLE clock_activities (
  id VARCHAR(50) PRIMARY KEY,
  staff_id VARCHAR(50) NOT NULL REFERENCES users(id),
  action VARCHAR(20) NOT NULL CHECK (action IN ('clock_in', 'clock_out')),
  timestamp TIMESTAMP NOT NULL,
  location_id VARCHAR(50) REFERENCES locations(id),
  location VARCHAR(100) NOT NULL, -- For backward compatibility
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- OTP table for verification
CREATE TABLE otps (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  otp VARCHAR(6) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('verification', 'password_reset')),
  expires_at TIMESTAMP NOT NULL,
  attempts INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
*/