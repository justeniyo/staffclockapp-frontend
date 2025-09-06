# StaffClock Backend-Ready Refactoring Summary

## Overview
The StaffClock project has been refactored to be backend-ready while maintaining the current functionality using seed data. All components now work with database-like structures that can easily be replaced with API calls.

## Key Changes Made

### 1. Data Structure Overhaul

#### **Users Table Structure**
```javascript
{
  id: "usr_001",                    // Primary key (UUID in production)
  email: "user@company.com",        // Unique identifier
  password: "password",             // Will be hashed (bcrypt/argon2)
  firstName: "John",
  lastName: "Doe", 
  role: "staff",                    // ceo, admin, security, staff
  department: "IT",
  phone: "+1-555-0123",
  jobTitle: "Senior Developer",
  isManager: false,
  managerId: "usr_006",             // References users.id (FK)
  verified: true,
  isActive: true,
  isClockedIn: false,
  assignedSite: "Main Office",      // For security role only
  createdAt: "2024-01-15T09:00:00Z",
  updatedAt: "2024-01-15T09:00:00Z"
}
```

#### **Leave Requests Structure**  
```javascript
{
  id: "lr_001",                     // Primary key
  staffId: "usr_011",               // References users.id (FK)
  type: "Emergency",                // Annual, Sick, Personal, Emergency
  startDate: "2025-09-15",
  endDate: "2025-09-17",
  reason: "Family emergency",       // Required for Emergency/Sick only
  status: "pending",                // pending, approved, rejected
  requestDate: "2025-09-01T10:30:00Z",
  processedBy: "usr_006",           // References users.id (FK)
  processedDate: "2025-09-02T08:30:00Z",
  processingNotes: "Approved immediately" // Required for Emergency/Sick only
}
```

#### **Clock Activities Structure**
```javascript
{
  id: "ca_001",                     // Primary key
  staffId: "usr_011",               // References users.id (FK)
  action: "clock_in",               // clock_in, clock_out
  timestamp: "2025-09-06T09:15:23Z",
  location: "Main Office"           // Dynamic location tracking
}
```

### 2. Organizational Hierarchy Implementation

#### **Hierarchy Rules**
- **CEO**: Top level, no manager, automatically isManager=true
- **Executives**: Report directly to CEO (CTO, CFO, etc.)
- **Department Managers**: Report to relevant executives or CEO
- **Staff**: Report to department managers
- **Admin**: System administrator, outside hierarchy, reports to CEO/admin
- **Security**: Third-party, reports to admin for system access

#### **Leave Approval Flow**
1. **Regular Staff** → Department Manager
2. **Department Manager** → Executive/CEO  
3. **Executive** → CEO
4. **CEO** → No approval needed
5. **Admin/Security** → Admin/CEO

### 3. Enhanced Leave Request System

#### **Reason Requirements**
- **Emergency Leave**: Reason required + Processing notes required
- **Sick Leave**: Reason required + Processing notes required  
- **Annual Leave**: No reason required
- **Personal Leave**: No reason required

#### **Processing Notes**
- Required when approving/rejecting Emergency or Sick leave
- Managers must provide notes explaining their decision
- Visible to staff members who submitted the request

### 4. Role-Specific Functionality

#### **CEO Role**
- Only one CEO allowed in system
- Cannot have a manager
- Automatically set as manager
- Can approve all leave requests

#### **Admin Role**
- System administrator with full access
- Cannot be a manager of staff
- Outside organizational hierarchy
- Manages system settings and user registration

#### **Security Role**  
- Third-party security guard
- Cannot be a manager
- Assigned to specific sites (assignedSite field)
- Limited view to their assigned location
- Reports to admin for system access

#### **Staff Role**
- Can be managers or regular employees
- Subject to leave limits (18 annual days/year)
- Must have a manager assigned

### 5. API Integration Points

#### **AuthContext API Simulation**
```javascript
const apiCall = async (endpoint, options = {}) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 100))
  
  // This will be replaced with actual API calls
  console.log(`API Call: ${endpoint}`, options)
  
  // For now, return success
  return { success: true }
}
```

#### **Backend Endpoints Structure**
```
POST   /api/auth/login
POST   /api/auth/logout  
POST   /api/auth/forgot-password
POST   /api/auth/reset-password
POST   /api/auth/verify-otp
POST   /api/auth/send-otp

GET    /api/users
POST   /api/users
PUT    /api/users/:id
DELETE /api/users/:id

GET    /api/leave-requests
POST   /api/leave-requests
PUT    /api/leave-requests/:id
POST   /api/leave-requests/:id/process

GET    /api/clock-activities
POST   /api/clock/in
POST   /api/clock/out

POST   /api/admin/register-staff
GET    /api/admin/staff
PUT    /api/admin/staff/:id
```

### 6. Database Schema (PostgreSQL)

```sql
-- Users table
CREATE TABLE users (
  id VARCHAR(50) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('ceo', 'admin', 'security', 'staff')),
  department VARCHAR(100),
  phone VARCHAR(20),
  job_title VARCHAR(100),
  is_manager BOOLEAN DEFAULT FALSE,
  manager_id VARCHAR(50) REFERENCES users(id),
  verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  is_clocked_in BOOLEAN DEFAULT FALSE,
  assigned_site VARCHAR(100), -- For security role
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Leave requests table  
CREATE TABLE leave_requests (
  id VARCHAR(50) PRIMARY KEY,
  staff_id VARCHAR(50) NOT NULL REFERENCES users(id),
  type VARCHAR(20) NOT NULL CHECK (type IN ('Annual', 'Sick', 'Personal', 'Emergency')),
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

-- Clock activities table
CREATE TABLE clock_activities (
  id VARCHAR(50) PRIMARY KEY,
  staff_id VARCHAR(50) NOT NULL REFERENCES users(id),
  action VARCHAR(20) NOT NULL CHECK (action IN ('clock_in', 'clock_out')),
  timestamp TIMESTAMP NOT NULL,
  location VARCHAR(100) NOT NULL,
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
```

### 7. Component Updates

#### **Updated Components**
1. **AuthContext**: API call simulation, ID-based relationships
2. **RequestLeave**: Reason validation, leave limit tracking
3. **LeaveRequests (Manager)**: Processing notes for Emergency/Sick
4. **ClockActivities**: Enhanced filtering, enriched data display
5. **RegisterStaff**: Hierarchy-aware manager selection
6. **ManageStaff**: Role-based editing, hierarchy display
7. **SecurityDashboard**: Site-specific monitoring

#### **Key Features Added**
- Multi-level approval hierarchy
- Reason requirements for specific leave types
- Processing notes for managers
- Annual leave limit tracking (18 days/year)
- Site-based security monitoring
- Enhanced role management
- Job title tracking
- Manager hierarchy visualization

### 8. Migration Strategy

#### **Phase 1: Backend Setup**
1. Set up PostgreSQL database
2. Create tables with proper relationships
3. Implement authentication with JWT tokens
4. Set up password hashing (bcrypt/argon2)

#### **Phase 2: API Development**
1. Replace `apiCall` simulation with actual HTTP requests
2. Implement all CRUD operations
3. Add proper error handling and validation
4. Set up email service for OTP delivery

#### **Phase 3: Real-time Features**
1. WebSocket integration for live updates
2. Push notifications for leave approvals
3. Real-time clock activity monitoring

### 9. Security Considerations

#### **Authentication**
- JWT tokens with refresh token rotation
- Password hashing with bcrypt (minimum 12 rounds)
- Rate limiting on login attempts
- Account lockout after failed attempts

#### **Authorization**
- Role-based access control (RBAC)
- Route-level permissions
- Data filtering based on user hierarchy
- API endpoint protection

#### **Data Protection**
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- CSRF tokens for state-changing operations

### 10. Benefits of New Structure

#### **Scalability**
- Proper database relationships
- Efficient querying with foreign keys
- Easy to add new roles and permissions

#### **Maintainability**  
- Clean separation of concerns
- Consistent data structure
- Easy to extend functionality

#### **Security**
- Proper user hierarchy enforcement
- Role-based data access
- Audit trail for all actions

#### **User Experience**
- Realistic leave approval workflow
- Manager hierarchy visualization
- Site-specific security monitoring

## Next Steps

1. **Backend Development**: Implement PostgreSQL database and REST API
2. **Frontend Integration**: Replace seed data with API calls
3. **Testing**: Unit tests, integration tests, end-to-end tests
4. **Deployment**: Docker containerization, CI/CD pipeline
5. **Monitoring**: Logging, metrics, error tracking

The refactored codebase is now ready for seamless backend integration while maintaining all existing functionality through the seed data system.