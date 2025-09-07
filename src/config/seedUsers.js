// Backend-ready seed data structure for Sequelize ORM integration
// This structure matches PostgreSQL database schema with proper relationships

// Locations Model
export const seedLocations = [
  {
    id: "loc_001",
    name: "Main Office",
    address: "123 Business St, Downtown",
    type: "office",
    isActive: true,
    createdAt: new Date("2024-01-15T09:00:00Z"),
    updatedAt: new Date("2024-01-15T09:00:00Z")
  },
  {
    id: "loc_002", 
    name: "Warehouse",
    address: "456 Industrial Ave, Warehouse District",
    type: "warehouse",
    isActive: true,
    createdAt: new Date("2024-01-15T09:00:00Z"),
    updatedAt: new Date("2024-01-15T09:00:00Z")
  },
  {
    id: "loc_003",
    name: "Remote",
    address: "Various Locations",
    type: "remote",
    isActive: true,
    createdAt: new Date("2024-01-15T09:00:00Z"),
    updatedAt: new Date("2024-01-15T09:00:00Z")
  },
  {
    id: "loc_004",
    name: "Branch Office",
    address: "789 Corporate Blvd, Uptown",
    type: "office", 
    isActive: true,
    createdAt: new Date("2024-01-15T09:00:00Z"),
    updatedAt: new Date("2024-01-15T09:00:00Z")
  },
  {
    id: "loc_005",
    name: "Client Site A",
    address: "321 Client Plaza, Business District",
    type: "field",
    isActive: true,
    createdAt: new Date("2024-01-15T09:00:00Z"),
    updatedAt: new Date("2024-01-15T09:00:00Z")
  }
]

// Departments Model
export const seedDepartments = [
  {
    id: "dept_001",
    name: "Executive",
    description: "C-Level leadership and strategic direction",
    isActive: true,
    createdAt: new Date("2024-01-15T09:00:00Z"),
    updatedAt: new Date("2024-01-15T09:00:00Z")
  },
  {
    id: "dept_002",
    name: "IT",
    description: "Information Technology and Systems",
    isActive: true,
    createdAt: new Date("2024-01-15T09:00:00Z"),
    updatedAt: new Date("2024-01-15T09:00:00Z")
  },
  {
    id: "dept_003",
    name: "HR",
    description: "Human Resources and People Operations",
    isActive: true,
    createdAt: new Date("2024-01-15T09:00:00Z"),
    updatedAt: new Date("2024-01-15T09:00:00Z")
  },
  {
    id: "dept_004",
    name: "Sales",
    description: "Sales and Customer Relations",
    isActive: true,
    createdAt: new Date("2024-01-15T09:00:00Z"),
    updatedAt: new Date("2024-01-15T09:00:00Z")
  },
  {
    id: "dept_005",
    name: "Operations",
    description: "Operations and Supply Chain",
    isActive: true,
    createdAt: new Date("2024-01-15T09:00:00Z"),
    updatedAt: new Date("2024-01-15T09:00:00Z")
  },
  {
    id: "dept_006",
    name: "Finance",
    description: "Financial Management and Accounting",
    isActive: true,
    createdAt: new Date("2024-01-15T09:00:00Z"),
    updatedAt: new Date("2024-01-15T09:00:00Z")
  },
  {
    id: "dept_007",
    name: "Administration",
    description: "System Administration and Support",
    isActive: true,
    createdAt: new Date("2024-01-15T09:00:00Z"),
    updatedAt: new Date("2024-01-15T09:00:00Z")
  },
  {
    id: "dept_008",
    name: "Security",
    description: "Physical Security and Access Control",
    isActive: true,
    createdAt: new Date("2024-01-15T09:00:00Z"),
    updatedAt: new Date("2024-01-15T09:00:00Z")
  }
]

// Users Model - Structured for Sequelize with proper relationships
export const seedUsers = [
  // CEO - Dual role: CEO with Staff capabilities for leave management
  {
    id: "usr_001",
    email: "ceo@company.com",
    passwordHash: "$2b$12$hashplaceholder", // Will be bcrypt hashed
    firstName: "Sarah", 
    lastName: "Chen",
    role: "staff", // Changed to staff to enable manager capabilities
    subRole: "ceo", // Special field to maintain CEO status
    departmentId: "dept_001",
    phone: "+1-555-0101", 
    isManager: true,
    managerId: null, // CEO reports to no one
    verified: true, 
    isActive: true,
    isClockedIn: false,
    jobTitle: "Chief Executive Officer",
    assignedLocationId: "loc_001",
    allowedLocationIds: ["loc_001", "loc_003", "loc_004"], // CEO can work from multiple locations
    currentLocationIds: [], // Currently active locations (empty when clocked out)
    createdAt: new Date("2024-01-15T09:00:00Z"),
    updatedAt: new Date("2024-01-15T09:00:00Z")
  },

  // System Administrator - Outside hierarchy
  {
    id: "usr_002",
    email: "admin@company.com",
    passwordHash: "$2b$12$hashplaceholder",
    firstName: "Admin", 
    lastName: "User",
    role: "admin",
    subRole: null,
    departmentId: "dept_007",
    phone: "+1-555-0100", 
    isManager: false,
    managerId: null,
    verified: true, 
    isActive: true,
    isClockedIn: false,
    jobTitle: "System Administrator",
    assignedLocationId: "loc_001",
    allowedLocationIds: ["loc_001"],
    currentLocationIds: [],
    createdAt: new Date("2024-01-15T09:00:00Z"),
    updatedAt: new Date("2024-01-15T09:00:00Z")
  },

  // Security Guard - Third party
  {
    id: "usr_003",
    email: "security@company.com",
    passwordHash: "$2b$12$hashplaceholder",
    firstName: "Security", 
    lastName: "Officer",
    role: "security",
    subRole: null,
    departmentId: "dept_008",
    phone: "+1-555-0102", 
    isManager: false,
    managerId: "usr_002",
    verified: true, 
    isActive: true,
    isClockedIn: true,
    jobTitle: "Security Officer",
    assignedLocationId: "loc_001",
    allowedLocationIds: ["loc_001"],
    currentLocationIds: ["loc_001"],
    createdAt: new Date("2024-01-15T09:00:00Z"),
    updatedAt: new Date("2024-01-15T09:00:00Z")
  },

  // C-Level Executives - Reports to CEO
  {
    id: "usr_004",
    email: "cfo@company.com",
    passwordHash: "$2b$12$hashplaceholder",
    firstName: "Michael",
    lastName: "Roberts",
    role: "staff",
    subRole: "executive",
    departmentId: "dept_006",
    phone: "+1-555-0104",
    isManager: true,
    managerId: "usr_001", // Reports to CEO
    verified: true,
    isActive: true,
    isClockedIn: false,
    jobTitle: "Chief Financial Officer",
    assignedLocationId: "loc_001",
    allowedLocationIds: ["loc_001", "loc_003"],
    currentLocationIds: [],
    createdAt: new Date("2024-01-15T09:00:00Z"),
    updatedAt: new Date("2024-01-15T09:00:00Z")
  },

  {
    id: "usr_005",
    email: "cto@company.com",
    passwordHash: "$2b$12$hashplaceholder",
    firstName: "Jennifer",
    lastName: "Park",
    role: "staff",
    subRole: "executive",
    departmentId: "dept_002",
    phone: "+1-555-0105",
    isManager: true,
    managerId: "usr_001", // Reports to CEO
    verified: true,
    isActive: true,
    isClockedIn: false,
    jobTitle: "Chief Technology Officer",
    assignedLocationId: "loc_001",
    allowedLocationIds: ["loc_001", "loc_003"],
    currentLocationIds: [],
    createdAt: new Date("2024-01-15T09:00:00Z"),
    updatedAt: new Date("2024-01-15T09:00:00Z")
  },

  {
    id: "usr_006",
    email: "coo@company.com",
    passwordHash: "$2b$12$hashplaceholder",
    firstName: "David",
    lastName: "Williams",
    role: "staff",
    subRole: "executive",
    departmentId: "dept_005",
    phone: "+1-555-0106",
    isManager: true,
    managerId: "usr_001", // Reports to CEO
    verified: true,
    isActive: true,
    isClockedIn: false,
    jobTitle: "Chief Operating Officer",
    assignedLocationId: "loc_001",
    allowedLocationIds: ["loc_001", "loc_002"],
    currentLocationIds: [],
    createdAt: new Date("2024-01-15T09:00:00Z"),
    updatedAt: new Date("2024-01-15T09:00:00Z")
  },

  // Department Managers
  {
    id: "usr_007",
    email: "it.manager@company.com",
    passwordHash: "$2b$12$hashplaceholder",
    firstName: "Mike", 
    lastName: "Johnson", 
    role: "staff",
    subRole: "manager",
    isManager: true,
    departmentId: "dept_002",
    phone: "+1-555-0201", 
    managerId: "usr_005", // Reports to CTO
    isClockedIn: false, 
    verified: true, 
    isActive: true,
    jobTitle: "IT Director",
    assignedLocationId: "loc_001",
    allowedLocationIds: ["loc_001", "loc_003"],
    currentLocationIds: [],
    createdAt: new Date("2024-01-15T09:00:00Z"),
    updatedAt: new Date("2024-01-15T09:00:00Z")
  },

  {
    id: "usr_008",
    email: "hr.manager@company.com",
    passwordHash: "$2b$12$hashplaceholder",
    firstName: "Lisa", 
    lastName: "Wang", 
    role: "staff",
    subRole: "manager",
    isManager: true,
    departmentId: "dept_003",
    phone: "+1-555-0301", 
    managerId: "usr_001", // Reports directly to CEO
    isClockedIn: false, 
    verified: true, 
    isActive: true,
    jobTitle: "HR Director",
    assignedLocationId: "loc_001",
    allowedLocationIds: ["loc_001"],
    currentLocationIds: [],
    createdAt: new Date("2024-01-15T09:00:00Z"),
    updatedAt: new Date("2024-01-15T09:00:00Z")
  },

  {
    id: "usr_009",
    email: "sales.manager@company.com",
    passwordHash: "$2b$12$hashplaceholder",
    firstName: "Robert", 
    lastName: "Davis", 
    role: "staff",
    subRole: "manager",
    isManager: true,
    departmentId: "dept_004",
    phone: "+1-555-0401", 
    managerId: "usr_001", // Reports directly to CEO
    isClockedIn: true, 
    verified: true, 
    isActive: true,
    jobTitle: "Sales Director",
    assignedLocationId: "loc_001",
    allowedLocationIds: ["loc_001", "loc_003", "loc_005"],
    currentLocationIds: ["loc_001"],
    createdAt: new Date("2024-01-15T09:00:00Z"),
    updatedAt: new Date("2024-01-15T09:00:00Z")
  },

  {
    id: "usr_010",
    email: "operations.manager@company.com",
    passwordHash: "$2b$12$hashplaceholder",
    firstName: "Maria", 
    lastName: "Garcia", 
    role: "staff",
    subRole: "manager",
    isManager: true,
    departmentId: "dept_005",
    phone: "+1-555-0501", 
    managerId: "usr_006", // Reports to COO
    isClockedIn: false, 
    verified: true, 
    isActive: true,
    jobTitle: "Operations Director",
    assignedLocationId: "loc_002",
    allowedLocationIds: ["loc_002", "loc_001"],
    currentLocationIds: [],
    createdAt: new Date("2024-01-15T09:00:00Z"),
    updatedAt: new Date("2024-01-15T09:00:00Z")
  },

  {
    id: "usr_011",
    email: "finance.manager@company.com",
    passwordHash: "$2b$12$hashplaceholder",
    firstName: "David",
    lastName: "Kim",
    role: "staff",
    subRole: "manager",
    isManager: true,
    departmentId: "dept_006",
    phone: "+1-555-0601",
    managerId: "usr_004", // Reports to CFO
    isClockedIn: false,
    verified: true,
    isActive: true,
    jobTitle: "Finance Director",
    assignedLocationId: "loc_001",
    allowedLocationIds: ["loc_001"],
    currentLocationIds: [],
    createdAt: new Date("2024-01-15T09:00:00Z"),
    updatedAt: new Date("2024-01-15T09:00:00Z")
  },

  // Regular Staff
  {
    id: "usr_012",
    email: "dev1@company.com",
    passwordHash: "$2b$12$hashplaceholder",
    firstName: "Alex", 
    lastName: "Rodriguez",
    role: "staff",
    subRole: null,
    departmentId: "dept_002",
    managerId: "usr_007", // Reports to IT Director
    phone: "+1-555-0202", 
    isClockedIn: true, 
    verified: true, 
    isActive: true,
    isManager: false,
    jobTitle: "Senior Developer",
    assignedLocationId: "loc_001",
    allowedLocationIds: ["loc_001", "loc_003"],
    currentLocationIds: ["loc_001", "loc_003"], // Working from multiple locations
    createdAt: new Date("2024-01-15T09:00:00Z"),
    updatedAt: new Date("2024-01-15T09:00:00Z")
  },

  {
    id: "usr_013",
    email: "dev2@company.com",
    passwordHash: "$2b$12$hashplaceholder",
    firstName: "Emma", 
    lastName: "Thompson",
    role: "staff",
    subRole: null,
    departmentId: "dept_002",
    managerId: "usr_007", // Reports to IT Director
    phone: "+1-555-0203", 
    isClockedIn: false, 
    verified: true, 
    isActive: true,
    isManager: false,
    jobTitle: "Frontend Developer",
    assignedLocationId: "loc_003",
    allowedLocationIds: ["loc_003", "loc_001"],
    currentLocationIds: [],
    createdAt: new Date("2024-01-15T09:00:00Z"),
    updatedAt: new Date("2024-01-15T09:00:00Z")
  },

  // Additional staff members for better testing
  {
    id: "usr_014",
    email: "sysadmin@company.com",
    passwordHash: "$2b$12$hashplaceholder",
    firstName: "Carlos", 
    lastName: "Martinez",
    role: "staff",
    subRole: null,
    departmentId: "dept_002",
    managerId: "usr_007",
    phone: "+1-555-0204", 
    isClockedIn: true, 
    verified: true, 
    isActive: true,
    isManager: false,
    jobTitle: "System Administrator",
    assignedLocationId: "loc_001",
    allowedLocationIds: ["loc_001", "loc_002"],
    currentLocationIds: ["loc_001"],
    createdAt: new Date("2024-01-15T09:00:00Z"),
    updatedAt: new Date("2024-01-15T09:00:00Z")
  }
]

// User Location Assignments Model (Many-to-Many relationship)
export const seedUserLocations = [
  // CEO can access multiple locations
  { userId: "usr_001", locationId: "loc_001", isActive: true },
  { userId: "usr_001", locationId: "loc_003", isActive: true },
  { userId: "usr_001", locationId: "loc_004", isActive: true },
  
  // Executives
  { userId: "usr_004", locationId: "loc_001", isActive: true },
  { userId: "usr_004", locationId: "loc_003", isActive: true },
  { userId: "usr_005", locationId: "loc_001", isActive: true },
  { userId: "usr_005", locationId: "loc_003", isActive: true },
  { userId: "usr_006", locationId: "loc_001", isActive: true },
  { userId: "usr_006", locationId: "loc_002", isActive: true },
  
  // Managers
  { userId: "usr_007", locationId: "loc_001", isActive: true },
  { userId: "usr_007", locationId: "loc_003", isActive: true },
  { userId: "usr_009", locationId: "loc_001", isActive: true },
  { userId: "usr_009", locationId: "loc_003", isActive: true },
  { userId: "usr_009", locationId: "loc_005", isActive: true },
  
  // Staff with multiple location access
  { userId: "usr_012", locationId: "loc_001", isActive: true },
  { userId: "usr_012", locationId: "loc_003", isActive: true },
  { userId: "usr_013", locationId: "loc_003", isActive: true },
  { userId: "usr_013", locationId: "loc_001", isActive: true },
  { userId: "usr_014", locationId: "loc_001", isActive: true },
  { userId: "usr_014", locationId: "loc_002", isActive: true }
]

// Leave Requests Model
export const seedLeaveRequests = [
  {
    id: "lr_001",
    staffId: "usr_012", // Alex Rodriguez
    type: "Annual",
    startDate: new Date("2025-09-15"),
    endDate: new Date("2025-09-17"), 
    reason: null,
    status: "pending",
    requestDate: new Date("2025-09-01T10:30:00Z"),
    processedBy: null,
    processedDate: null,
    processingNotes: null,
    createdAt: new Date("2025-09-01T10:30:00Z"),
    updatedAt: new Date("2025-09-01T10:30:00Z")
  },
  {
    id: "lr_002",
    staffId: "usr_007", // IT Director requesting leave
    type: "Annual",
    startDate: new Date("2025-09-20"),
    endDate: new Date("2025-09-22"), 
    reason: null,
    status: "approved",
    requestDate: new Date("2025-08-25T14:20:00Z"),
    processedBy: "usr_005", // Approved by CTO
    processedDate: new Date("2025-08-26T09:15:00Z"),
    processingNotes: null,
    createdAt: new Date("2025-08-25T14:20:00Z"),
    updatedAt: new Date("2025-08-26T09:15:00Z")
  },
  // CEO leave request (should be handled by board/auto-approved)
  {
    id: "lr_003",
    staffId: "usr_001", // CEO requesting leave  
    type: "Annual",
    startDate: new Date("2025-10-01"),
    endDate: new Date("2025-10-03"),
    reason: null,
    status: "approved", 
    requestDate: new Date("2025-09-01T16:45:00Z"),
    processedBy: null, // Auto-approved for CEO
    processedDate: new Date("2025-09-01T16:45:00Z"),
    processingNotes: "Auto-approved for CEO",
    createdAt: new Date("2025-09-01T16:45:00Z"),
    updatedAt: new Date("2025-09-01T16:45:00Z")
  }
]

// Clock Activities Model with multi-location support
export const seedClockActivities = [
  // Multi-location staff activities
  {
    id: "ca_001",
    staffId: "usr_012", // Alex Rodriguez
    action: "clock_in",
    timestamp: new Date("2025-09-06T09:15:23Z"),
    locationId: "loc_001",
    createdAt: new Date("2025-09-06T09:15:23Z")
  },
  {
    id: "ca_002",
    staffId: "usr_012",
    action: "location_add", // New action type for adding locations
    timestamp: new Date("2025-09-06T14:30:00Z"),
    locationId: "loc_003", // Added remote work
    createdAt: new Date("2025-09-06T14:30:00Z")
  },
  {
    id: "ca_003",
    staffId: "usr_014", // Carlos Martinez
    action: "clock_in",
    timestamp: new Date("2025-09-06T09:30:15Z"),
    locationId: "loc_001",
    createdAt: new Date("2025-09-06T09:30:15Z")
  },
  {
    id: "ca_004",
    staffId: "usr_009", // Sales Director
    action: "clock_in",
    timestamp: new Date("2025-09-06T08:00:00Z"),
    locationId: "loc_001",
    createdAt: new Date("2025-09-06T08:00:00Z")
  },
  {
    id: "ca_005",
    staffId: "usr_003", // Security Officer
    action: "clock_in",
    timestamp: new Date("2025-09-06T06:00:00Z"),
    locationId: "loc_001",
    createdAt: new Date("2025-09-06T06:00:00Z")
  }
]

// Helper functions for Sequelize integration
export const getUserById = (userId, users = seedUsers) => {
  return users.find(user => user.id === userId)
}

export const getUserByEmail = (email, users = seedUsers) => {
  return users.find(user => user.email === email)
}

export const getLocationById = (locationId, locations = seedLocations) => {
  return locations.find(location => location.id === locationId)
}

export const getDepartmentById = (departmentId, departments = seedDepartments) => {
  return departments.find(dept => dept.id === departmentId)
}

export const getFullName = (user) => {
  if (!user) return 'Unknown User'
  return `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown User'
}

export const getUserInitials = (user) => {
  if (!user) return 'U'
  const firstName = user.firstName || ''
  const lastName = user.lastName || ''
  
  if (!firstName && !lastName) return 'U'
  if (!lastName) return firstName.charAt(0).toUpperCase()
  
  return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase()
}

// CEO role detection helper
export const isCEO = (user) => {
  return user?.subRole === 'ceo' || user?.role === 'ceo'
}

export const isExecutive = (user) => {
  return user?.subRole === 'executive' || isCEO(user)
}

// Available leave types
export const LEAVE_TYPES = ['Annual', 'Sick', 'Emergency']

/* 
Sequelize Model Definitions for Backend:

// Location Model
const Location = sequelize.define('Location', {
  id: { type: DataTypes.STRING, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  address: DataTypes.TEXT,
  type: { 
    type: DataTypes.ENUM('office', 'warehouse', 'remote', 'field'),
    allowNull: false 
  },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true }
}, { timestamps: true })

// Department Model  
const Department = sequelize.define('Department', {
  id: { type: DataTypes.STRING, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  description: DataTypes.TEXT,
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true }
}, { timestamps: true })

// User Model
const User = sequelize.define('User', {
  id: { type: DataTypes.STRING, primaryKey: true },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  passwordHash: { type: DataTypes.STRING, allowNull: false },
  firstName: { type: DataTypes.STRING, allowNull: false },
  lastName: { type: DataTypes.STRING, allowNull: false },
  role: { 
    type: DataTypes.ENUM('admin', 'security', 'staff'),
    allowNull: false 
  },
  subRole: {
    type: DataTypes.ENUM('ceo', 'executive', 'manager'),
    allowNull: true
  },
  phone: DataTypes.STRING,
  jobTitle: DataTypes.STRING,
  isManager: { type: DataTypes.BOOLEAN, defaultValue: false },
  verified: { type: DataTypes.BOOLEAN, defaultValue: false },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  isClockedIn: { type: DataTypes.BOOLEAN, defaultValue: false },
  assignedLocationId: {
    type: DataTypes.STRING,
    references: { model: Location, key: 'id' }
  },
  allowedLocationIds: {
    type: DataTypes.JSON, // Array of location IDs
    defaultValue: []
  },
  currentLocationIds: {
    type: DataTypes.JSON, // Array of currently active location IDs
    defaultValue: []
  }
}, { timestamps: true })

// Associations
User.belongsTo(Department, { foreignKey: 'departmentId' })
User.belongsTo(User, { as: 'Manager', foreignKey: 'managerId' })
User.hasMany(User, { as: 'Reports', foreignKey: 'managerId' })
User.belongsTo(Location, { as: 'AssignedLocation', foreignKey: 'assignedLocationId' })

// Many-to-Many: Users can access multiple locations
User.belongsToMany(Location, { 
  through: 'UserLocations',
  foreignKey: 'userId',
  otherKey: 'locationId'
})
Location.belongsToMany(User, {
  through: 'UserLocations', 
  foreignKey: 'locationId',
  otherKey: 'userId'
})
*/