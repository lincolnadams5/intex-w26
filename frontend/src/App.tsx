import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { HomeLayout } from './pages/HomeLayout'
import { Landing } from './pages/(home)/Landing'
import { AdminLayout } from './pages/(admin)/AdminLayout'
import { StaffLayout } from './pages/(staff)/StaffLayout'
import { Dashboard } from './pages/(admin)/dashboard/Dashboard'
import { DonorsPage } from './pages/(admin)/donors/DonorsPage'
import { ResidentsPage } from './pages/(admin)/residents/Residents'
import { SafehousePage } from './pages/(admin)/safehouses/SafehousePage'
import { SocialPage } from './pages/(admin)/social/SocialPage'
import { MLPage } from './pages/(admin)/ml/MLPage'
import { UsersPage } from './pages/(admin)/users/UsersPage'
import { ImpactDashboard } from './pages/(home)/ImpactDashboard'
import Donors from './pages/(home)/Donors'
import PrivacyPolicy from './pages/(home)/PrivacyPolicy'
import Login from './pages/login/Login'
import Register from './pages/login/Register'
import ForgotPassword from './pages/login/ForgotPassword'
import ResetPassword from './pages/login/ResetPassword'
import Unauthorized from './pages/(home)/Unauthorized'
import DonorDashboard from './pages/(home)/donor/DonorDashboard'
import DonatePage from './pages/(home)/donor/DonatePage'
import CookieBanner from './components/CookieBanner'
import { ProtectedRoute } from './components/ProtectedRoute'
import { getCookie } from './utils/cookies'
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { trackPageView } from './utils/analytics'
import ProcessRecording from './pages/(admin)/dashboard/process-recording/ProcessRecording'
import HomeVisits from './pages/(admin)/dashboard/home-visitation/HomeVisits'
import About from './pages/(home)/About'

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
        {/* ── Home layout — shared header ── */}
        <Route element={<HomeLayout />}>
          <Route path="/" element={<Landing />} />
          <Route path="/impact" element={<ImpactDashboard />} />
          <Route path="/donor" element={<Donors />} />
          <Route path="/about" element={<About />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="/donate" element={<DonatePage />} />
          <Route
            path="/my-donations"
            element={
              <ProtectedRoute allowedRoles={['Donor', 'Admin', 'Staff']}>
                <DonorDashboard />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* ── Login routes ── */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

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
            <Route path="dashboard/process-recording" element={<ProcessRecording />} />
            <Route path="dashboard/home-visits" element={<HomeVisits />} />
          <Route path="donors" element={<DonorsPage />} />
          <Route path="residents" element={<ResidentsPage />} />
          <Route path="safehouses" element={<SafehousePage />} />
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
          <Route path="residents" element={<ResidentsPage />} />
          <Route path="ml" element={<MLPage />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
