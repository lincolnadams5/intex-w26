import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Landing } from './pages/Landing'
import { AdminLayout } from './pages/(admin)/AdminLayout'
import { StaffLayout } from './pages/(staff)/StaffLayout'
import { Dashboard } from './pages/(admin)/dashboard/Dashboard'
import { DonorsPage } from './pages/(admin)/donors/DonorsPage'
import { HomeVisitation } from './pages/(admin)/dashboard/home-visitation/HomeVisitation'
import { SocialPage } from './pages/(admin)/social/SocialPage'
import { MLPage } from './pages/(admin)/ml/MLPage'
import { UsersPage } from './pages/(admin)/users/UsersPage'
import { ImpactDashboard } from './pages/ImpactDashboard'
import Donors from './pages/Donors'
import PrivacyPolicy from './pages/PrivacyPolicy'
import Login from './pages/login/Login'
import Register from './pages/login/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Unauthorized from './pages/Unauthorized'
import DonorDashboard from './pages/donor/DonorDashboard'
import DonatePage from './pages/donor/DonatePage'
import CookieBanner from './components/CookieBanner'
import { ProtectedRoute } from './components/ProtectedRoute'
import { getCookie } from './utils/cookies'
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { trackPageView } from './utils/analytics'
import ProcessRecording from './pages/(admin)/dashboard/process-recording/ProcessRecording'
import HomeVisits from './pages/(admin)/visits/HomeVisits'

function AnalyticsTracker() {
  const location = useLocation()

  useEffect(() => {
    const consent = getCookie('cookie_consent')
    if (consent === 'accepted') {
      document.cookie = 'analytics=true; path=/'
    }
    trackPageView(location.pathname)
  }, [location.pathname])

  return null
}

function App() {
  return (
    <BrowserRouter>
      <AnalyticsTracker />
      <CookieBanner />
      <Routes>
        {/* ── Public routes — no auth required ── */}
        <Route path="/" element={<Landing />} />
        <Route path="/impact" element={<ImpactDashboard />} />
        <Route path="/donor" element={<Donors />} /> 
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* ── Donor dashboard — any authenticated user (non-admin/staff will use this) ── */}
        <Route
          path="/my-donations"
          element={
            <ProtectedRoute allowedRoles={['Donor', 'Admin', 'Staff']}>
              <DonorDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/donate"
          element={
            <ProtectedRoute allowedRoles={['Donor', 'Admin', 'Staff']}>
              <DonatePage />
            </ProtectedRoute>
          }
        />

        {/* ── Admin portal — requires Admin role ── */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
            {/* Admin dashboard has multiple sub-pages for different functionalities */}
            <Route path="/admin/dashboard/process-recording" element={<ProcessRecording />} />
            <Route path="/admin/dashboard/home-visits" element={<HomeVisits />} />
          <Route path="donors" element={<DonorsPage />} />
          <Route path="residents" element={<HomeVisitation />} />
          <Route path="social" element={<SocialPage />} />
          <Route path="ml" element={<MLPage />} />
          <Route path="users" element={<UsersPage />} />
        </Route>

        {/* ── Staff portal — requires Staff role ── */}
        <Route
          path="/staff"
          element={
            <ProtectedRoute allowedRoles={['Staff']}>
              <StaffLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/staff/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="residents" element={<HomeVisitation />} />
          <Route path="ml" element={<MLPage />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
