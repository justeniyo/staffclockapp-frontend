import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from '../components/Layout/Layout'

// Auth
import LoginStaff from '../pages/LoginStaff'
import LoginAdmin from '../pages/LoginAdmin'
import LoginSecurity from '../pages/LoginSecurity'
import LoginCEO from '../pages/LoginCEO'
import ForgotPassword from '../pages/ForgotPassword'
import VerifyResetOTP from '../pages/VerifyResetOTP'
import ResetPassword from '../pages/ResetPassword'
import VerifyAccount from '../pages/VerifyAccount'
import NotFound from '../pages/NotFound'

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
      {/* Staff login redirects to root */}
      <Route path="/staff" element={<Navigate to="/" replace />} />

      {/* Public Auth Routes */}
      <Route path="/" element={<LoginStaff />} />
      <Route path="/admin" element={<LoginAdmin />} />
      <Route path="/security" element={<LoginSecurity />} />
      <Route path="/ceo" element={<LoginCEO />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/verify-reset-otp" element={<VerifyResetOTP />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/verify-account" element={<VerifyAccount />} />

      {/* UPDATED: Staff routes (includes managers and CEO dual role) */}
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

      {/* UPDATED: CEO routes (CEO can access via staff role with subRole='ceo') */}
      <Route element={<RequireAuth roles={['staff']} requireCEO={true} />}>
        <Route path="/ceo-dashboard" element={<Layout><CEODashboard /></Layout>} />
      </Route>

      {/* 404 Not Found - must be last */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}