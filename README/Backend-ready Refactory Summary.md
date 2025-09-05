# StaffClock Backend-Ready Refactoring Summary

## Overview
The StaffClock project has been refactored to be backend-ready with a proper hierarchical organizational structure supporting multi-level leave approvals. The seed data now reflects a realistic corporate hierarchy while maintaining compatibility with future PostgreSQL database integration.

## Key Structural Changes

### 1. Hierarchical Organization Structure

**New Corporate Hierarchy:**
```
CEO (Sarah Chen)
├── CTO (Michael Torres) - IT Department
│   └── IT Manager (Mike Johnson)
│       ├── Senior Developer (Alex Rodriguez)
│       ├── Frontend Developer (Emma Thompson)
│       └── System Administrator (David Kim)
├── CHRO (Linda Washington) - HR Department
│   └── HR Manager (Lisa Wang)
│       ├── HR Specialist (James Wilson)
│       └── HR Coordinator (Sophie Brown)
├── CSO (Robert Martinez) - Sales Department
│   └── Sales Manager (Jennifer Davis)
│       ├── Sales Representative (Christopher Lee)
│       └── Account Executive (Amanda Clark)
└── COO (Maria Rodriguez) - Operations Department
    └── Operations Manager (Thomas Anderson)
        ├── Operations Coordinator (Kevin Garcia)
        └── Operations Analyst (Rachel Moore)

Admin (System Administrator) - Outside hierarchy
Security (Security Guard) - Outside hierarchy, location-based
```

### 2. Multi-Level Leave Approval System

**Approval Flow:**
- **Regular Staff** → Request approved by **Department Manager**
- **Department Managers** → Request approved by **C-Level Executive**
- **C-Level Executives** → Request approved by **CEO**
- **CEO** → No approval needed (auto-approved or board-level)
- **Admin/Security** → Outside hierarchy (special handling)

### 3. Enhanced Data Structure (PostgreSQL Ready)

**User Model Changes:**
```javascript
{
  id: "usr_001",                    // Unique identifier (ready for UUID)
  email: "user@company.com",        // Primary key
  password: "password123",          // Will be hashed in production
  role: "staff|admin|security|ceo", // Simplified role system
  firstName: "John",
  lastName: "Doe",
  department: "IT",
  jobTitle: "Senior Developer",     // NEW: Professional title
  phone: "+1-555-0123",
  isManager: true|false,
  manager: "manager@company.com",   // Hierarchical reference
  verified: true|false,
  isActive: true|false,
  isClockedIn: true|false,
  assignedLocation: "Main Office",  // NEW: For security guards
  createdAt: "2024-01-15T08:00:00Z",// NEW: Timestamp
  updatedAt: "2024-01-15T08:00:00Z" // NEW: Timestamp
}
```

**Leave Request Model Changes:**
```javascript
{
  id: "lr_001",                     // Unique identifier
  staffId: "user@company.com",      // Foreign key to users
  staffName: "John Doe",            // Denormalized for quick access
  department: "IT",
  manager: "manager@company.com",   // Who can approve this request
  type: "Annual|Sick|Personal|Emergency",
  startDate: "2025-09-15",
  endDate: "2025-09-17",
  status: "pending|approved|rejected",
  requestDate: "2025-09-01T10:30:00Z",
  processedBy: "manager@company.com", // Who processed the request
  processedDate: "2025-09-01T15:30:00Z",
  createdAt: "2025-09-01T10:30:00Z",
  updatedAt: "2025-09-01T15:30:00Z"
  // REMOVED: reason, notes, comments
}
```

**Clock Activity Model Changes:**
```javascript
{
  id: "ca_001",                     // Unique identifier
  staffId: "user@company.com",      // Foreign key to users
  staffName: "John Doe",            // Denormalized for quick access
  department: "IT",
  action: "clock_in|clock_out",
  timestamp: "2025-09-05T09:15:23Z",
  location: "Main Office",
  createdAt: "2025-09-05T09:15:23Z"
  // REMOVED: notes, isManual, reason
}
```

## Removed Fields and Features

### From User Model:
- `lastLogin` - Not needed for core functionality
- Complex role permissions - Simplified to basic roles

### From Leave Requests:
- `reason` - Simplified approval process
- `notes` - Removed processing notes
- `comments` - Removed request comments

### From Clock Activities:
- `notes` - Removed manual notes
- `isManual` - Removed manual entry flag
- Complex location tracking - Simplified to basic location

## New Helper Functions

### Hierarchical Operations:
```javascript
// Check if user can approve another user's leave
canApproveLeave(approverEmail, requestingUserEmail)

// Get all direct reports for a manager
getDirectReports(managerEmail)

// Get user's immediate manager
getUserManager(userEmail)

// Get user's level in hierarchy (0=CEO, 1=C-Level, 2=Manager, 3=Staff)
getUserLevel(userEmail)
```

### Context Enhancements:
```javascript
// Get manager's direct reports
getMyDirectReports()

// Get leave requests requiring approval
getPendingLeaveRequestsForApproval()

// Get team's clock activities
getMyTeamClockActivities()

// Security-specific function
getLocationClockActivities(location)
```

## Role Clarifications

### CEO (`role: "ceo"`)
- Top of organizational hierarchy
- Can approve C-level executive leave requests
- Has access to executive dashboard with company-wide insights

### Staff (`role: "staff"`)
- Includes regular employees, managers, and C-level executives
- Distinguished by `isManager` flag and hierarchy level
- C-level executives are still "staff" but report to CEO

### Admin (`role: "admin"`)
- System administrator outside organizational hierarchy
- Manages user accounts, system configuration
- Cannot approve leave requests (outside hierarchy)

### Security (`role: "security"`)
- Third-party security guards
- Monitors clock activities at assigned locations
- Outside organizational hierarchy
- Has `assignedLocation` field for location-based monitoring

## Database Migration Readiness

### Primary Keys:
- All entities have unique `id` fields ready for UUID implementation
- Email addresses serve as natural keys for users

### Foreign Keys:
- `manager` field in users table references other users
- `staffId` in leave requests and clock activities references users
- `processedBy` in leave requests references users

### Indexes Needed:
```sql
-- User lookups
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_manager ON users(manager);
CREATE INDEX idx_users_department ON users(department);

-- Leave request queries
CREATE INDEX idx_leave_requests_staff_id ON leave_requests(staff_id);
CREATE INDEX idx_leave_requests_manager ON leave_requests(manager);
CREATE INDEX idx_leave_requests_status ON leave_requests(status);
CREATE INDEX idx_leave_requests_start_date ON leave_requests(start_date);

-- Clock activity queries
CREATE INDEX idx_clock_activities_staff_id ON clock_activities(staff_id);
CREATE INDEX idx_clock_activities_timestamp ON clock_activities(timestamp);
CREATE INDEX idx_clock_activities_location ON clock_activities(location);
```

### Relationships:
```sql
-- Foreign key constraints
ALTER TABLE users ADD CONSTRAINT fk_users_manager 
  FOREIGN KEY (manager) REFERENCES users(email);

ALTER TABLE leave_requests ADD CONSTRAINT fk_leave_requests_staff 
  FOREIGN KEY (staff_id) REFERENCES users(email);

ALTER TABLE clock_activities ADD CONSTRAINT fk_clock_activities_staff 
  FOREIGN KEY (staff_id) REFERENCES users(email);
```

## API Endpoints Structure (Future Implementation)

### Authentication:
- `POST /auth/login`
- `POST /auth/logout`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`
- `POST /auth/verify-otp`

### Users:
- `GET /users` - List users (admin only)
- `GET /users/:id` - Get user details
- `PUT /users/:id` - Update user
- `POST /users` - Create user (admin only)
- `GET /users/:id/direct-reports` - Get manager's team

### Leave Requests:
- `GET /leave-requests` - Get user's requests or team requests if manager
- `POST /leave-requests` - Submit new leave request
- `PUT /leave-requests/:id` - Update pending request
- `POST /leave-requests/:id/approve` - Approve request (managers only)
- `POST /leave-requests/:id/reject` - Reject request (managers only)

### Clock Activities:
- `GET /clock-activities` - Get activities (filtered by role)
- `POST /clock-activities/clock-in` - Clock in
- `POST /clock-activities/clock-out` - Clock out

## Security Considerations

### Authentication:
- Passwords will be hashed using bcrypt
- JWT tokens for session management
- OTP verification for password reset

### Authorization:
- Role-based access control (RBAC)
- Hierarchical permissions for leave approvals
- Location-based access for security role

### Data Protection:
- Personal information encryption
- Audit trails for sensitive operations
- GDPR compliance considerations

## Next Steps for Backend Implementation

1. **Database Setup:**
   - Create PostgreSQL database
   - Run migration scripts for table creation
   - Seed database with provided data

2. **API Development:**
   - Implement REST API endpoints
   - Add authentication middleware
   - Implement authorization checks

3. **Frontend Integration:**
   - Replace local storage with API calls
   - Add loading states and error handling
   - Implement proper session management

4. **Testing:**
   - Unit tests for business logic
   - Integration tests for API endpoints
   - End-to-end testing for user workflows

This refactored structure provides a solid foundation for backend development while maintaining the existing frontend functionality through seed data.