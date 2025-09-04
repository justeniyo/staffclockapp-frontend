import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from '../components/Layout/Layout'

// Auth
import LoginStaff from '../pages/LoginStaff'
import LoginAdmin from '../pages/LoginAdmin'
import LoginSecurity from '../pages/LoginSecurity'
import LoginCEO from '../pages/LoginCEO'

// Protected
import { RequireAuth } from './RequireAuth'
import Clock from '../pages/Staff/Clock'
import StaffDashboard from '../pages/Staff/Dashboard'
import RequestLeave from '../pages/Staff/RequestLeave'
import ManagerDashboard from '../pages/Manager/Dashboard'
import LeaveRequests from '../pages/Manager/LeaveRequests'
import AdminDashboard from '../pages/Admin/Dashboard'
import RegisterStaff from '../pages/Admin/RegisterStaff'
import ManageStaff from '../pages/Admin/ManageStaff'
import ClockActivities from '../pages/Admin/ClockActivities'
import SecurityDashboard from '../pages/Security/Dashboard'
import CEODashboard from '../pages/CEO/Dashboard'

export default function AppRouter() {
  return (
    <Routes>
      {/* Redirect root to staff login */}
      <Route path="/" element={<Navigate to="/staff" replace />} />

      {/* Logins */}
      <Route path="/staff" element={<LoginStaff />} />
      <Route path="/admin" element={<LoginAdmin />} />
      <Route path="/security" element={<LoginSecurity />} />
      <Route path="/ceo" element={<LoginCEO />} />

      {/* Staff (includes managers) */}
      <Route element={<RequireAuth roles={['staff']} />}>
        <Route path="/clock" element={<Layout><Clock /></Layout>} />
        <Route path="/staff-dashboard" element={<Layout><StaffDashboard /></Layout>} />
        <Route path="/staff/request-leave" element={<Layout><RequestLeave /></Layout>} />
        <Route path="/manager-dashboard" element={<Layout variant="manager"><ManagerDashboard /></Layout>} />
        <Route path="/manager/leave-requests" element={<Layout variant="manager"><LeaveRequests /></Layout>} />
      </Route>

      {/* Admin */}
      <Route element={<RequireAuth roles={['admin']} />}>
        <Route path="/admin-dashboard" element={<Layout><AdminDashboard /></Layout>} />
        <Route path="/admin/register-staff" element={<Layout><RegisterStaff /></Layout>} />
        <Route path="/admin/manage-staff" element={<Layout><ManageStaff /></Layout>} />
        <Route path="/admin/clock-activities" element={<Layout><ClockActivities /></Layout>} />
      </Route>

      {/* Security */}
      <Route element={<RequireAuth roles={['security']} />}>
        <Route path="/security-dashboard" element={<Layout><SecurityDashboard /></Layout>} />
      </Route>

      {/* CEO */}
      <Route element={<RequireAuth roles={['ceo']} />}>
        <Route path="/ceo-dashboard" element={<Layout><CEODashboard /></Layout>} />
      </Route>
    </Routes>
  )
}