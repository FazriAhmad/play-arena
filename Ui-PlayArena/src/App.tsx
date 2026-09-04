import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { GuestRoute, ProtectedRoute, RoleRoute } from './components/ProtectedRoute';
import AppLayout from './layouts/AppLayout';
import ActivityLogPage from './pages/ActivityLogPage';
import AnalyticsPage from './pages/AnalyticsPage';
import AnnouncementsPage from './pages/AnnouncementsPage';
import BookingDetailPage from './pages/BookingDetailPage';
import Dashboard from './pages/Dashboard';
import ForgotPassword from './pages/ForgotPassword';
import Login from './pages/Login';
import ManageAnnouncementsPage from './pages/ManageAnnouncementsPage';
import ManageBookingsPage from './pages/ManageBookingsPage';
import ManageCustomersPage from './pages/ManageCustomersPage';
import ManageMembershipPage from './pages/ManageMembershipPage';
import ManagePromosPage from './pages/ManagePromosPage';
import ManageVenueDetailPage from './pages/ManageVenueDetailPage';
import ManageVenuesPage from './pages/ManageVenuesPage';
import MyBookingsPage from './pages/MyBookingsPage';
import Register from './pages/Register';
import ResetPassword from './pages/ResetPassword';
import RevenuePage from './pages/RevenuePage';
import SchedulePage from './pages/SchedulePage';
import SearchPage from './pages/SearchPage';
import StaffPage from './pages/StaffPage';
import VenueDetailPage from './pages/VenueDetailPage';
import { AuthProvider } from './store/AuthContext';
import { VenueProvider } from './store/VenueContext';

function App() {
  return (
    <AuthProvider>
      <VenueProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<GuestRoute />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Route>
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            <Route element={<AppLayout />}>
              <Route path="/" element={<SearchPage />} />
              <Route path="/venue/:id" element={<VenueDetailPage />} />

              <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/bookings" element={<MyBookingsPage />} />
                <Route path="/bookings/:id" element={<BookingDetailPage />} />
                <Route path="/announcements" element={<AnnouncementsPage />} />
                <Route element={<RoleRoute role="owner" />}>
                  <Route path="/staff" element={<StaffPage />} />
                  <Route path="/manage/promos" element={<ManagePromosPage />} />
                  <Route path="/manage/customers" element={<ManageCustomersPage />} />
                  <Route path="/manage/announcements" element={<ManageAnnouncementsPage />} />
                  <Route path="/manage/revenue" element={<RevenuePage />} />
                  <Route path="/manage/membership" element={<ManageMembershipPage />} />
                  <Route path="/manage/activity" element={<ActivityLogPage />} />
                </Route>
                {/* Analitik — Owner & Staff/Kasir saja. Petugas Lapangan dikeluarkan
                    atas keputusan user 2026-09-04 (membalik keputusan sebelumnya). */}
                <Route element={<RoleRoute role={['owner', 'staff']} />}>
                  <Route path="/manage/analytics" element={<AnalyticsPage />} />
                </Route>
                {/* Operasional harian — Petugas Lapangan ikut boleh. */}
                <Route element={<RoleRoute role={['owner', 'staff', 'petugas']} />}>
                  <Route path="/manage/venues" element={<ManageVenuesPage />} />
                  <Route path="/manage/venues/:id" element={<ManageVenueDetailPage />} />
                  <Route path="/manage/bookings" element={<ManageBookingsPage />} />
                  <Route path="/manage/schedule" element={<SchedulePage />} />
                </Route>
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </VenueProvider>
    </AuthProvider>
  );
}

export default App;
