import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { StoreProvider } from './store/StoreContext';
import { ToastProvider } from './components/ui';
import { CustomerLayout } from './layouts/CustomerLayout';
import { AdminLayout } from './layouts/AdminLayout';

import { HomePage } from './pages/customer/HomePage';
import { SearchPage } from './pages/customer/SearchPage';
import { VenueDetailPage } from './pages/customer/VenueDetailPage';
import { BookingPage } from './pages/customer/BookingPage';
import { MyBookingsPage } from './pages/customer/MyBookingsPage';
import { MembershipPage } from './pages/customer/MembershipPage';

import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminVenuesPage } from './pages/admin/AdminVenuesPage';
import { AdminCourtsPage } from './pages/admin/AdminCourtsPage';
import { AdminSchedulePage } from './pages/admin/AdminSchedulePage';
import { AdminBookingsPage } from './pages/admin/AdminBookingsPage';
import { AdminPaymentsPage } from './pages/admin/AdminPaymentsPage';
import { AdminReportsPage } from './pages/admin/AdminReportsPage';
import { AdminCustomersPage } from './pages/admin/AdminCustomersPage';
import { AdminBroadcastPage } from './pages/admin/AdminBroadcastPage';
import { AdminStaffPage } from './pages/admin/AdminStaffPage';

function App() {
  return (
    <StoreProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<CustomerLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/cari" element={<SearchPage />} />
              <Route path="/venue/:id" element={<VenueDetailPage />} />
              <Route path="/lapangan/:courtId" element={<BookingPage />} />
              <Route path="/booking-saya" element={<MyBookingsPage />} />
              <Route path="/membership" element={<MembershipPage />} />
            </Route>

            <Route element={<AdminLayout />}>
              <Route path="/admin" element={<AdminDashboardPage />} />
              <Route path="/admin/venue" element={<AdminVenuesPage />} />
              <Route path="/admin/lapangan" element={<AdminCourtsPage />} />
              <Route path="/admin/jadwal" element={<AdminSchedulePage />} />
              <Route path="/admin/booking" element={<AdminBookingsPage />} />
              <Route path="/admin/pembayaran" element={<AdminPaymentsPage />} />
              <Route path="/admin/laporan" element={<AdminReportsPage />} />
              <Route path="/admin/pelanggan" element={<AdminCustomersPage />} />
              <Route path="/admin/broadcast" element={<AdminBroadcastPage />} />
              <Route path="/admin/staff" element={<AdminStaffPage />} />
            </Route>

            <Route path="*" element={<HomePage />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </StoreProvider>
  );
}

export default App;
