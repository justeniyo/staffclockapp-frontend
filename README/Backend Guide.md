# StaffClock Backend Implementation Guide

## Project Overview

StaffClock has been successfully refactored from a local storage-based application to a backend-ready system with proper hierarchical organization structure. The application now supports multi-level leave approvals, role-based access control, and location-based security monitoring.

## Architecture Summary

### Frontend (React)
- **Framework**: React 19.1.1 with React Router DOM
- **UI Components**: React Bootstrap with custom SCSS
- **State Management**: React Context API (ready for backend integration)
- **Authentication**: JWT-ready authentication context
- **Icons**: Font Awesome 6.0.0

### Backend Requirements (To Be Implemented)
- **Runtime**: Node.js with Express.js
- **Database**: PostgreSQL with proper normalization
- **Authentication**: JWT tokens with bcrypt password hashing
- **Authorization**: Role-based access control (RBAC)
- **API**: RESTful API with proper validation

## Database Schema (PostgreSQL)

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('staff', 'admin', 'security', 'ceo')),
  department VARCHAR(100),
  job_title VARCHAR(100),
  phone VARCHAR(20),
  is_manager BOOLEAN DEFAULT FALSE,
  manager_id UUID REFERENCES users(id),
  is_active BOOLEAN DEFAULT TRUE,
  is_verified BOOLEAN DEFAULT FALSE,
  is_clocked_in BOOLEAN DEFAULT FALSE,
  assigned_location VARCHAR(100), -- For security guards
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id)
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_manager ON users(manager_id);
CREATE INDEX idx_users_department ON users(department);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(is_active);
```

### Leave Requests Table
```sql
CREATE TABLE leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES users(id),
  manager_id UUID NOT NULL REFERENCES users(id),
  type VARCHAR(20) NOT NULL CHECK (type IN ('Annual', 'Sick', 'Personal', 'Emergency')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  processed_by UUID REFERENCES users(id),
  processed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_leave_requests_staff ON leave_requests(staff_id);
CREATE INDEX idx_leave_requests_manager ON leave_requests(manager_id);
CREATE INDEX idx_leave_requests_status ON leave_requests(status);
CREATE INDEX idx_leave_requests_start_date ON leave_requests(start_date);
CREATE INDEX idx_leave_requests_created_at ON leave_requests(created_at);
```

### Clock Activities Table
```sql
CREATE TABLE clock_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES users(id),
  action VARCHAR(20) NOT NULL CHECK (action IN ('clock_in', 'clock_out')),
  timestamp TIMESTAMP NOT NULL,
  location VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_clock_activities_staff ON clock_activities(staff_id);
CREATE INDEX idx_clock_activities_timestamp ON clock_activities(timestamp);
CREATE INDEX idx_clock_activities_location ON clock_activities(location);
```

### OTP Verification Table
```sql
CREATE TABLE otp_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  otp_code VARCHAR(6) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('verification', 'password_reset')),
  expires_at TIMESTAMP NOT NULL,
  attempts INT DEFAULT 0,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_otp_email ON otp_verifications(email);
CREATE INDEX idx_otp_expires ON otp_verifications(expires_at);
```

## API Endpoints Structure

### Authentication Endpoints
```javascript
// POST /api/auth/login
{
  email: "user@company.com",
  password: "password123",
  roleHint?: "staff|admin|security|ceo"
}

// POST /api/auth/logout
// Headers: Authorization: Bearer <token>

// POST /api/auth/forgot-password
{
  email: "user@company.com"
}

// POST /api/auth/reset-password
{
  email: "user@company.com",
  otp: "123456",
  newPassword: "newpassword123"
}

// POST /api/auth/verify-otp
{
  email: "user@company.com",
  otp: "123456",
  type: "verification|password_reset"
}

// POST /api/auth/resend-otp
{
  email: "user@company.com",
  type: "verification|password_reset"
}
```

### User Management Endpoints
```javascript
// GET /api/users
// Query params: department, role, isActive, isManager
// Response: Paginated list of users

// GET /api/users/:id
// Response: User details

// PUT /api/users/:id
// Body: User update data
// Authorization: Admin or self

// POST /api/users
// Body: New user data
// Authorization: Admin only

// GET /api/users/:id/direct-reports
// Response: List of direct reports for managers

// GET /api/users/hierarchy
// Response: Complete organization hierarchy
```

### Leave Request Endpoints
```javascript
// GET /api/leave-requests
// Query params: status, type, startDate, endDate, staffId
// Response: Leave requests (filtered by user permissions)

// POST /api/leave-requests
{
  type: "Annual|Sick|Personal|Emergency",
  startDate: "2025-09-15",
  endDate: "2025-09-17"
}

// PUT /api/leave-requests/:id
// Body: Updated leave request data
// Authorization: Owner and status is pending

// POST /api/leave-requests/:id/approve
// Authorization: Manager of requesting user

// POST /api/leave-requests/:id/reject
// Authorization: Manager of requesting user

// GET /api/leave-requests/pending-approvals
// Response: Requests pending current user's approval
```

### Clock Activity Endpoints
```javascript
// GET /api/clock-activities
// Query params: startDate, endDate, location, staffId
// Response: Clock activities (filtered by user permissions)

// POST /api/clock-activities/clock-in
{
  location?: "Main Office|Remote|Warehouse Site"
}

// POST /api/clock-activities/clock-out
{
  location?: "Main Office|Remote|Warehouse Site"
}

// GET /api/clock-activities/export
// Query params: format, filters
// Response: CSV/Excel export of activities
```

## Authentication & Authorization Flow

### JWT Token Structure
```javascript
{
  "sub": "user-uuid",
  "email": "user@company.com",
  "role": "staff|admin|security|ceo",
  "isManager": true|false,
  "department": "IT",
  "iat": 1693123456,
  "exp": 1693210456
}
```

### Role-Based Permissions

#### Staff Role
- Clock in/out at any location
- View own activities and leave requests
- Submit leave requests
- Edit pending leave requests
- If manager: approve team leave requests, view team activities

#### Admin Role
- All staff permissions
- Manage all users (CRUD operations)
- View all clock activities
- Register new staff members
- System configuration
- **Cannot approve leave requests** (outside hierarchy)

#### Security Role
- Clock in/out at assigned location
- View activities at assigned location or all locations
- Export activity reports
- Monitor real-time access
- **Cannot approve leave requests** (outside hierarchy)

#### CEO Role
- All permissions
- Approve C-level executive leave requests
- View executive dashboard with company-wide insights
- Access organizational analytics

### Hierarchical Leave Approval Matrix
```
Request From          → Approved By
Regular Staff         → Department Manager
Department Manager    → C-Level Executive  
C-Level Executive     → CEO
CEO                   → Auto-approved or Board
```

## Express.js Middleware Structure

### Authentication Middleware
```javascript
const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'Access denied' })
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded
    next()
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' })
  }
}
```

### Authorization Middleware
```javascript
const requireRole = (roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Insufficient permissions' })
  }
  next()
}

const requireManager = (req, res, next) => {
  if (!req.user.isManager) {
    return res.status(403).json({ error: 'Manager access required' })
  }
  next()
}

const canApproveLeave = async (req, res, next) => {
  const leaveRequest = await LeaveRequest.findById(req.params.id)
  if (leaveRequest.manager_id !== req.user.sub) {
    return res.status(403).json({ error: 'Cannot approve this request' })
  }
  next()
}
```

## Frontend Integration Changes

### API Service Layer
```javascript
// src/services/api.js
class ApiService {
  constructor() {
    this.baseURL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api'
    this.token = localStorage.getItem('authToken')
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` })
      },
      ...options
    }

    const response = await fetch(url, config)
    
    if (response.status === 401) {
      this.logout()
      throw new Error('Session expired')
    }

    return response.json()
  }

  // Auth methods
  login = (credentials) => this.request('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials)
  })

  // User methods
  getUsers = (params) => this.request(`/users?${new URLSearchParams(params)}`)
  
  // Leave request methods
  getLeaveRequests = (params) => this.request(`/leave-requests?${new URLSearchParams(params)}`)
  
  // Clock activity methods
  clockIn = (data) => this.request('/clock-activities/clock-in', {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

export default new ApiService()
```

### Updated AuthContext
```javascript
// src/context/AuthContext.jsx
const login = async ({ email, password, roleHint }) => {
  try {
    const response = await ApiService.login({ email, password, roleHint })
    const { token, user } = response
    
    localStorage.setItem('authToken', token)
    ApiService.token = token
    setUser(user)
    
    // Navigate based on role
    if (user.role === 'staff') navigate('/clock', { replace: true })
    // ... other role navigation
  } catch (error) {
    throw new Error(error.message)
  }
}
```

## Environment Configuration

### Development Environment
```bash
# .env.development
REACT_APP_API_BASE_URL=http://localhost:3001/api
REACT_APP_ENVIRONMENT=development
REACT_APP_VERSION=1.0.0
```

### Production Environment
```bash
# .env.production
REACT_APP_API_BASE_URL=https://api.staffclock.company.com/api
REACT_APP_ENVIRONMENT=production
REACT_APP_VERSION=1.0.0
```

### Backend Environment
```bash
# Backend .env
NODE_ENV=production
PORT=3001
JWT_SECRET=your-super-secure-jwt-secret-key
JWT_EXPIRES_IN=24h

DATABASE_URL=postgresql://username:password@localhost:5432/staffclock
DB_HOST=localhost
DB_PORT=5432
DB_NAME=staffclock
DB_USER=staffclock_user
DB_PASS=secure_password

SMTP_HOST=smtp.company.com
SMTP_PORT=587
SMTP_USER=noreply@company.com
SMTP_PASS=smtp_password

REDIS_URL=redis://localhost:6379 # For session storage

# Security
BCRYPT_ROUNDS=12
OTP_EXPIRES_MINUTES=5
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_DURATION_MINUTES=15
```

## Deployment Strategy

### Database Migration
1. Create PostgreSQL database
2. Run migration scripts to create tables
3. Seed initial data (CEO user, basic settings)
4. Set up database backups

### Backend Deployment
1. Deploy Node.js/Express API
2. Configure environment variables
3. Set up Redis for session storage
4. Configure SMTP for email notifications
5. Set up monitoring and logging

### Frontend Deployment
1. Build React application
2. Deploy to CDN or static hosting
3. Configure environment variables
4. Set up domain and SSL

### Security Checklist
- [ ] Enable HTTPS everywhere
- [ ] Implement rate limiting
- [ ] Set up CORS properly
- [ ] Enable SQL injection protection
- [ ] Implement XSS protection
- [ ] Set up CSP headers
- [ ] Enable audit logging
- [ ] Regular security updates

## Testing Strategy

### Unit Tests
- Authentication functions
- Authorization middleware
- Business logic functions
- API service methods

### Integration Tests
- API endpoint testing
- Database operations
- Authentication flows
- Leave approval workflows

### End-to-End Tests
- Complete user workflows
- Multi-user scenarios
- Role-based access testing
- Mobile responsiveness

## Monitoring & Analytics

### Key Metrics to Track
- Active users by department
- Clock-in/out patterns
- Leave request approval times
- System performance metrics
- Security access patterns

### Alerts Setup
- Failed login attempts
- System errors
- Database performance issues
- Unusual access patterns

## Future Enhancements

### Phase 2 Features
- Advanced reporting and analytics
- Mobile app (React Native)
- Biometric clock-in integration
- Geofencing for location verification
- Slack/Teams integration
- Calendar system integration

### Phase 3 Features
- AI-powered insights
- Predictive analytics
- Advanced workforce planning
- Integration with payroll systems
- Multi-tenant support

This comprehensive guide provides everything needed to transform StaffClock from a frontend-only application to a full-stack enterprise solution with proper backend infrastructure, security, and scalability.