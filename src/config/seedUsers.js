// Enhanced seed data structure - Sequelize ORM compatible
// This mirrors PostgreSQL database schema with proper foreign key relationships

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
  },
  "loc_005": {
    id: "loc_005",
    name: "Field Operations",
    address: "Mobile Operations Base",
    type: "field",
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
  // UPDATED: CEO with dual role (Staff + CEO) for manager portal access
  "ceo@company.com": { 
    id: "usr_001",
    email: "ceo@company.com",
    password: "password",
    role: "staff", // CEO is a staff member to access staff/manager portals
    subRole: "ceo", // Track CEO status separately
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
    currentLocationIds: [], // Multi-location support
    accessLevel: "ceo",
    createdAt: "2024-01-15T09:00:00Z",
    updatedAt: "2024-01-15T09:00:00Z"
  },

  // System Administrator - Outside hierarchy
  "admin@company.com": { 
    id: "usr_002",
    email: "admin@company.com",
    password: "password", 
    role: "admin", 
    firstName: "Admin", 
    lastName: "User",
    department: "Administration", 
    phone: "+1-555-0100", 
    isManager: false,
    managerId: null,
    verified: true, 
    isActive: true,
    isClockedIn: false,
    jobTitle: "System Administrator",
    assignedLocationId: "loc_001",
    currentLocationIds: [],
    accessLevel: "admin",
    createdAt: "2024-01-15T09:00:00Z",
    updatedAt: "2024-01-15T09:00:00Z"
  },

  // Security Guard
  "security@company.com": { 
    id: "usr_003",
    email: "security@company.com",
    password: "password", 
    role: "security", 
    firstName: "Security", 
    lastName: "Officer",
    department: "Security", 
    phone: "+1-555-0102", 
    isManager: false,
    managerId: "usr_002",
    verified: true, 
    isActive: true,
    isClockedIn: true,
    jobTitle: "Security Officer",
    assignedLocationId: "loc_001",
    currentLocationIds: ["loc_001"],
    accessLevel: "security",
    createdAt: "2024-01-15T09:00:00Z",
    updatedAt: "2024-01-15T09:00:00Z"
  },

  // C-Level Executives - Reports to CEO
  "cfo@company.com": {
    id: "usr_004",
    email: "cfo@company.com",
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
    assignedLocationId: "loc_001",
    currentLocationIds: [],
    accessLevel: "executive",
    createdAt: "2024-01-15T09:00:00Z",
    updatedAt: "2024-01-15T09:00:00Z"
  },

  "cto@company.com": {
    id: "usr_005",
    email: "cto@company.com",
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
    assignedLocationId: "loc_001",
    currentLocationIds: [],
    accessLevel: "executive",
    createdAt: "2024-01-15T09:00:00Z",
    updatedAt: "2024-01-15T09:00:00Z"
  },

  "coo@company.com": {
    id: "usr_006",
    email: "coo@company.com",
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
    assignedLocationId: "loc_001",
    currentLocationIds: [],
    accessLevel: "executive",
    createdAt: "2024-01-15T09:00:00Z",
    updatedAt: "2024-01-15T09:00:00Z"
  },

  // Department Managers - Report to relevant C-Level Executives
  "it.manager@company.com": { 
    id: "usr_007",
    email: "it.manager@company.com",
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
    assignedLocationId: "loc_001",
    currentLocationIds: [],
    accessLevel: "manager",
    createdAt: "2024-01-15T09:00:00Z",
    updatedAt: "2024-01-15T09:00:00Z"
  },

  "hr.manager@company.com": { 
    id: "usr_008",
    email: "hr.manager@company.com",
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
    assignedLocationId: "loc_001",
    currentLocationIds: [],
    accessLevel: "manager",
    createdAt: "2024-01-15T09:00:00Z",
    updatedAt: "2024-01-15T09:00:00Z"
  },

  "sales.manager@company.com": { 
    id: "usr_009",
    email: "sales.manager@company.com",
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
    assignedLocationId: "loc_001",
    currentLocationIds: ["loc_001"],
    accessLevel: "manager",
    createdAt: "2024-01-15T09:00:00Z",
    updatedAt: "2024-01-15T09:00:00Z"
  },

  "operations.manager@company.com": { 
    id: "usr_010",
    email: "operations.manager@company.com",
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
    assignedLocationId: "loc_002",
    currentLocationIds: [],
    accessLevel: "manager",
    createdAt: "2024-01-15T09:00:00Z",
    updatedAt: "2024-01-15T09:00:00Z"
  },

  "finance.manager@company.com": {
    id: "usr_011",
    email: "finance.manager@company.com",
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
    assignedLocationId: "loc_001",
    currentLocationIds: [],
    accessLevel: "manager",
    createdAt: "2024-01-15T09:00:00Z",
    updatedAt: "2024-01-15T09:00:00Z"
  },

  // UPDATED: Regular Staff with multi-location support
  "dev1@company.com": { 
    id: "usr_012",
    email: "dev1@company.com",
    password: "password", 
    role: "staff", 
    firstName: "Alex", 
    lastName: "Rodriguez",
    department: "IT", 
    managerId: "usr_007",
    phone: "+1-555-0202", 
    isClockedIn: true, 
    verified: true, 
    isActive: true,
    isManager: false,
    jobTitle: "Senior Developer",
    assignedLocationId: "loc_001",
    currentLocationIds: ["loc_001", "loc_003"], // Working at multiple locations
    accessLevel: "staff",
    createdAt: "2024-01-15T09:00:00Z",
    updatedAt: "2024-01-15T09:00:00Z"
  },

  "dev2@company.com": { 
    id: "usr_013",
    email: "dev2@company.com",
    password: "password", 
    role: "staff", 
    firstName: "Emma", 
    lastName: "Thompson",
    department: "IT", 
    managerId: "usr_007",
    phone: "+1-555-0203", 
    isClockedIn: false, 
    verified: true, 
    isActive: true,
    isManager: false,
    jobTitle: "Frontend Developer",
    assignedLocationId: "loc_003",
    currentLocationIds: [],
    accessLevel: "staff",
    createdAt: "2024-01-15T09:00:00Z",
    updatedAt: "2024-01-15T09:00:00Z"
  },

  "sysadmin@company.com": { 
    id: "usr_014",
    email: "sysadmin@company.com",
    password: "password", 
    role: "staff", 
    firstName: "Carlos", 
    lastName: "Martinez",
    department: "IT", 
    managerId: "usr_007",
    phone: "+1-555-0204", 
    isClockedIn: true, 
    verified: true, 
    isActive: true,
    isManager: false,
    jobTitle: "System Administrator",
    assignedLocationId: "loc_001",
    currentLocationIds: ["loc_001", "loc_002"], // Working at office and warehouse
    accessLevel: "staff",
    createdAt: "2024-01-15T09:00:00Z",
    updatedAt: "2024-01-15T09:00:00Z"
  },

  "hr.specialist@company.com": { 
    id: "usr_015",
    email: "hr.specialist@company.com",
    password: "password", 
    role: "staff", 
    firstName: "James", 
    lastName: "Wilson",
    department: "HR", 
    managerId: "usr_008",
    phone: "+1-555-0302", 
    isClockedIn: false, 
    verified: true, 
    isActive: true,
    isManager: false,
    jobTitle: "HR Specialist",
    assignedLocationId: "loc_001",
    currentLocationIds: [],
    accessLevel: "staff",
    createdAt: "2024-01-15T09:00:00Z",
    updatedAt: "2024-01-15T09:00:00Z"
  },

  "sales1@company.com": { 
    id: "usr_016",
    email: "sales1@company.com",
    password: "password", 
    role: "staff", 
    firstName: "Jennifer", 
    lastName: "Martinez",
    department: "Sales", 
    managerId: "usr_009",
    phone: "+1-555-0402", 
    isClockedIn: true, 
    verified: true, 
    isActive: true,
    isManager: false,
    jobTitle: "Sales Representative",
    assignedLocationId: "loc_001",
    currentLocationIds: ["loc_001"],
    accessLevel: "staff",
    createdAt: "2024-01-15T09:00:00Z",
    updatedAt: "2024-01-15T09:00:00Z"
  },

  "sales2@company.com": { 
    id: "usr_017",
    email: "sales2@company.com",
    password: "password", 
    role: "staff", 
    firstName: "Christopher", 
    lastName: "Lee",
    department: "Sales", 
    managerId: "usr_009",
    phone: "+1-555-0403", 
    isClockedIn: false, 
    verified: true, 
    isActive: true,
    isManager: false,
    jobTitle: "Account Executive",
    assignedLocationId: "loc_003",
    currentLocationIds: [],
    accessLevel: "staff",
    createdAt: "2024-01-15T09:00:00Z",
    updatedAt: "2024-01-15T09:00:00Z"
  },

  "ops1@company.com": { 
    id: "usr_018",
    email: "ops1@company.com",
    password: "password", 
    role: "staff", 
    firstName: "Thomas", 
    lastName: "Anderson",
    department: "Operations", 
    managerId: "usr_010",
    phone: "+1-555-0502", 
    isClockedIn: true, 
    verified: true, 
    isActive: true,
    isManager: false,
    jobTitle: "Operations Coordinator",
    assignedLocationId: "loc_002",
    currentLocationIds: ["loc_002", "loc_005"], // Working at warehouse and field
    accessLevel: "staff",
    createdAt: "2024-01-15T09:00:00Z",
    updatedAt: "2024-01-15T09:00:00Z"
  },

  "finance1@company.com": {
    id: "usr_019",
    email: "finance1@company.com",
    password: "password",
    role: "staff",
    firstName: "Sophie",
    lastName: "Brown",
    department: "Finance",
    managerId: "usr_011",
    phone: "+1-555-0602",
    isClockedIn: false,
    verified: true,
    isActive: true,
    isManager: false,
    jobTitle: "Financial Analyst",
    assignedLocationId: "loc_001",
    currentLocationIds: [],
    accessLevel: "staff",
    createdAt: "2024-01-15T09:00:00Z",
    updatedAt: "2024-01-15T09:00:00Z"
  },

  // Inactive user example
  "former.employee@company.com": { 
    id: "usr_020",
    email: "former.employee@company.com",
    password: "password", 
    role: "staff", 
    firstName: "John", 
    lastName: "Former",
    department: "IT", 
    managerId: "usr_007",
    phone: "+1-555-0999", 
    isClockedIn: false, 
    verified: true, 
    isActive: false,
    isManager: false,
    jobTitle: "Former Developer",
    assignedLocationId: "loc_001",
    currentLocationIds: [],
    accessLevel: "staff",
    createdAt: "2024-01-15T09:00:00Z",
    updatedAt: "2024-01-15T09:00:00Z"
  },

  // Unverified new user
  "new.user@company.com": { 
    id: "usr_021",
    email: "new.user@company.com",
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
    assignedLocationId: "loc_001",
    currentLocationIds: [],
    accessLevel: "staff",
    createdAt: "2024-09-01T09:00:00Z",
    updatedAt: "2024-09-01T09:00:00Z"
  }
}

// UPDATED: Enhanced leave requests with CEO team requests  
export const seedLeaveRequests = [
  // CEO team requests - CEO can approve these as a manager
  {
    id: "lr_001",
    staffId: "usr_004", // CFO requesting leave from CEO
    type: "Annual",
    startDate: "2025-09-15",
    endDate: "2025-09-17", 
    reason: null,
    status: "pending",
    requestDate: "2025-09-01T10:30:00Z",
    processedBy: null,
    processedDate: null,
    processingNotes: null
  },

  {
    id: "lr_002",
    staffId: "usr_005", // CTO requesting leave from CEO
    type: "Emergency",
    startDate: "2025-09-20",
    endDate: "2025-09-22", 
    reason: "Family emergency requiring immediate attention",
    status: "pending",
    requestDate: "2025-09-02T14:20:00Z",
    processedBy: null,
    processedDate: null,
    processingNotes: null
  },

  {
    id: "lr_003",
    staffId: "usr_012", // Alex Rodriguez (dev1)
    type: "Annual",
    startDate: "2025-09-25",
    endDate: "2025-09-27", 
    reason: null,
    status: "pending",
    requestDate: "2025-09-01T10:30:00Z",
    processedBy: null,
    processedDate: null,
    processingNotes: null
  },

  {
    id: "lr_004",
    staffId: "usr_007", // IT Director requesting leave
    type: "Annual",
    startDate: "2025-10-01",
    endDate: "2025-10-03", 
    reason: null,
    status: "approved",
    requestDate: "2025-08-25T14:20:00Z",
    processedBy: "usr_005", // Approved by CTO
    processedDate: "2025-08-26T09:15:00Z",
    processingNotes: null
  }
]

// UPDATED: Enhanced clock activities with multi-location support
export const seedClockActivities = [
  {
    id: "ca_001",
    staffId: "usr_012", // Alex Rodriguez - multi-location
    action: "clock_in",
    timestamp: "2025-09-06T09:15:23Z",
    locationId: "loc_001",
    location: "Main Office"
  },
  {
    id: "ca_002",
    staffId: "usr_012", // Alex Rodriguez - adding remote location
    action: "location_add",
    timestamp: "2025-09-06T11:30:00Z",
    locationId: "loc_003",
    location: "Remote"
  },
  {
    id: "ca_003",
    staffId: "usr_014", // Carlos Martinez - multi-location
    action: "clock_in", 
    timestamp: "2025-09-06T08:45:12Z",
    locationId: "loc_001",
    location: "Main Office"
  },
  {
    id: "ca_004",
    staffId: "usr_014", // Carlos Martinez - adding warehouse
    action: "location_add",
    timestamp: "2025-09-06T13:15:00Z",
    locationId: "loc_002",
    location: "Warehouse"
  },
  {
    id: "ca_005",
    staffId: "usr_018", // Thomas Anderson - field work
    action: "clock_in",
    timestamp: "2025-09-06T07:00:00Z", 
    locationId: "loc_002",
    location: "Warehouse"
  },
  {
    id: "ca_006",
    staffId: "usr_018", // Thomas Anderson - adding field location
    action: "location_add",
    timestamp: "2025-09-06T14:30:00Z",
    locationId: "loc_005",
    location: "Field Operations"
  }
]

// Helper functions with CEO support
export const getFullName = (user) => {
  if (!user) return 'Unknown User'
  if (user.name) return user.name // Legacy support
  return `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown User'
}

export const getUserInitials = (user) => {
  if (!user) return 'U'
  
  if (user.name && !user.firstName && !user.lastName) {
    const words = user.name.split(' ')
    if (words.length === 1) return words[0].charAt(0).toUpperCase()
    return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase()
  }
  
  const firstName = user.firstName || ''
  const lastName = user.lastName || ''
  
  if (!firstName && !lastName) return 'U'
  if (!lastName) return firstName.charAt(0).toUpperCase()
  
  return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase()
}

// UPDATED: Helper function to check if user is CEO
export const isCEO = (user) => {
  return user?.subRole === 'ceo' || user?.accessLevel === 'ceo'
}

// UPDATED: Helper function to check if user can access manager portal
export const canAccessManagerPortal = (user) => {
  return user?.isManager && user?.role === 'staff'
}

// Helper function to get user by ID
export const getUserById = (userId) => {
  return Object.values(seedUsers).find(user => user.id === userId)
}

// Helper function to get user by email
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

// NEW: Helper function to get manager hierarchy
export const getManagerHierarchy = (staffId) => {
  const hierarchy = []
  let currentUser = getUserById(staffId)
  
  while (currentUser && currentUser.managerId) {
    const manager = getUserById(currentUser.managerId)
    if (manager) {
      hierarchy.push(manager)
      currentUser = manager
    } else {
      break
    }
  }
  
  return hierarchy
}

// Available leave types
export const LEAVE_TYPES = ['Annual', 'Sick', 'Emergency']
// Sequelize Model Definitions for Backend Reference
/*
const User = sequelize.define('User', {
  id: { type: DataTypes.STRING, primaryKey: true },
  email: { type: DataTypes.STRING, unique: true, allowNull: false },
  password: { type: DataTypes.STRING, allowNull: false },
  firstName: { type: DataTypes.STRING, allowNull: false },
  lastName: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.ENUM('admin', 'security', 'staff'), allowNull: false },
  subRole: { type: DataTypes.STRING, allowNull: true }, // For CEO
  department: { type: DataTypes.STRING, allowNull: false },
  phone: { type: DataTypes.STRING, allowNull: true },
  jobTitle: { type: DataTypes.STRING, allowNull: true },
  isManager: { type: DataTypes.BOOLEAN, defaultValue: false },
  managerId: { type: DataTypes.STRING, allowNull: true },
  verified: { type: DataTypes.BOOLEAN, defaultValue: false },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  isClockedIn: { type: DataTypes.BOOLEAN, defaultValue: false },
  assignedLocationId: { type: DataTypes.STRING, allowNull: false },
  currentLocationIds: { type: DataTypes.JSON, defaultValue: [] },
  accessLevel: { type: DataTypes.STRING, allowNull: true }
}, {
  timestamps: true
});

const Location = sequelize.define('Location', {
  id: { type: DataTypes.STRING, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  address: { type: DataTypes.TEXT, allowNull: true },
  type: { type: DataTypes.ENUM('office', 'warehouse', 'remote', 'field'), allowNull: false },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true }
}, {
  timestamps: true
});

const Department = sequelize.define('Department', {
  id: { type: DataTypes.STRING, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true }
}, {
  timestamps: true
});

const ClockActivity = sequelize.define('ClockActivity', {
  id: { type: DataTypes.STRING, primaryKey: true },
  staffId: { type: DataTypes.STRING, allowNull: false },
  action: { type: DataTypes.ENUM('clock_in', 'clock_out', 'location_add', 'location_remove'), allowNull: false },
  timestamp: { type: DataTypes.DATE, allowNull: false },
  locationId: { type: DataTypes.STRING, allowNull: false },
  location: { type: DataTypes.STRING, allowNull: false } // Backward compatibility
}, {
  timestamps: true
});

// Associations
User.belongsTo(User, { as: 'Manager', foreignKey: 'managerId' });
User.hasMany(User, { as: 'DirectReports', foreignKey: 'managerId' });
User.belongsTo(Location, { as: 'AssignedLocation', foreignKey: 'assignedLocationId' });
ClockActivity.belongsTo(User, { as: 'Staff', foreignKey: 'staffId' });
ClockActivity.belongsTo(Location, { foreignKey: 'locationId' });
*/