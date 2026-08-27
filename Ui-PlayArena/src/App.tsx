import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { GuestRoute, ProtectedRoute, RoleRoute } from './components/ProtectedRoute';
import AppLayout from './layouts/AppLayout';
import BookingDetailPage from './pages/BookingDetailPage';
import Dashboard from './pages/Dashboard';
import ForgotPassword from './pages/ForgotPassword';
import Login from './pages/Login';
import ManageBookingsPage from './pages/ManageBookingsPage';
import ManageVenueDetailPage from './pages/ManageVenueDetailPage';
import ManageVenuesPage from './pages/ManageVenuesPage';
import MyBookingsPage from './pages/MyBookingsPage';
import Register from './pages/Register';
import ResetPassword from './pages/ResetPassword';
import SearchPage from './pages/SearchPage';
import StaffPage from './pages/StaffPage';
import VenueDetailPage from './pages/VenueDetailPage';
import { AuthProvider } from './store/AuthContext';

function App() {
  return (
    <AuthProvider>
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
              <Route element={<RoleRoute role="owner" />}>
                <Route path="/staff" element={<StaffPage />} />
              </Route>
              <Route element={<RoleRoute role={['owner', 'staff']} />}>
                <Route path="/manage/venues" element={<ManageVenuesPage />} />
                <Route path="/manage/venues/:id" element={<ManageVenueDetailPage />} />
                <Route path="/manage/bookings" element={<ManageBookingsPage />} />
              </Route>
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
