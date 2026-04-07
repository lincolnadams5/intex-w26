import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Landing } from './pages/Landing'
import { AdminLayout } from './pages/(admin)/AdminLayout'
import { Dashboard } from './pages/(admin)/dashboard/Dashboard'
import { DonorsPage } from './pages/(admin)/donors/DonorsPage'
import { ResidentsPage } from './pages/(admin)/residents/ResidentsPage'
import { SocialPage } from './pages/(admin)/social/SocialPage'
import { MLPage } from './pages/(admin)/ml/MLPage'
import { ImpactDashboard } from './pages/ImpactDashboard'
import Donors from './pages/Donors'
import PrivacyPolicy from './pages/PrivacyPolicy'
import CookieBanner from "./components/CookieBanner"
import { getCookie } from "./utils/cookies"
import { useEffect } from 'react'
import ProcessRecording from './pages/ProcessRecording'

function App() {
  useEffect(() => {
    const consent = getCookie("cookie_consent");

    if (consent === "accepted") {
      console.log("Tracking ENABLED");

      // Example: set a real analytics cookie
      document.cookie = "analytics=true; path=/";

    } else {
      console.log("Tracking BLOCKED");
    }
  }, []);

  return (
    <BrowserRouter>
      <CookieBanner />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/impact" element={<ImpactDashboard />} />
        <Route path="/donor" element={<Donors />} /> 
        <Route path="/privacy" element={<PrivacyPolicy />} />
        {/* Admin portal — auth guard goes here once auth is wired */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="donors" element={<DonorsPage />} />
          <Route path="residents" element={<ResidentsPage />} />
          <Route path="social" element={<SocialPage />} />
          <Route path="ml" element={<MLPage />} />
          <Route path="process-recording" element={<ProcessRecording />} />
        </Route>
        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App