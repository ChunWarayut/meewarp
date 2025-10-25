import { Navigate, Route, Routes } from 'react-router-dom';
import WarpRedirect from './pages/WarpRedirect';
import MarketingLandingPage from './pages/MarketingLandingPage';
import TvLandingPage from './pages/TvLandingPage';
import SelfWarpPage from './pages/SelfWarpPage';
import PromptPayPage from './pages/PromptPayPage';
import QrLandingPage from './pages/QrLandingPage';
import SongRequestPage from './pages/SongRequestPage';
import { AuthProvider } from './contexts/AuthContext';
import { StoreProvider } from './contexts/StoreContext';
import AdminActivity from './pages/AdminActivity';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminLayout from './components/admin/AdminLayout';
import AdminGuard from './components/admin/AdminGuard';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminStatistics from './pages/admin/AdminStatistics';
import AdminRevenue from './pages/admin/AdminRevenue';
import AdminCustomers from './pages/admin/AdminCustomers';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';
import AdminPackagesPage from './pages/admin/AdminPackagesPage';
import AdminOrdersPage from './pages/admin/AdminOrdersPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminCreateWarpPage from './pages/admin/AdminCreateWarpPage';
import AdminSuperReport from './pages/admin/AdminSuperReport';
import AdminStoresPage from './pages/admin/AdminStoresPage';
import AdminSongRequestsPage from './pages/admin/AdminSongRequestsPage';

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<MarketingLandingPage />} />
    <Route path=":storeSlug" element={<MarketingLandingPage />} />
    <Route path="/tv" element={<TvLandingPage />} />
    <Route path=":storeSlug/tv" element={<TvLandingPage />} />
    <Route path="/admin/login" element={<AdminLoginPage />} />
    <Route element={<AdminGuard />}>
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="statistics" element={<AdminStatistics />} />
        <Route path="revenue" element={<AdminRevenue />} />
        <Route path="customers" element={<AdminCustomers />} />
        <Route path="packages" element={<AdminPackagesPage />} />
        <Route path="settings" element={<AdminSettingsPage />} />
        <Route path="orders" element={<AdminOrdersPage />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="create-warp" element={<AdminCreateWarpPage />} />
        <Route path="activity" element={<AdminActivity />} />
        <Route path="song-requests" element={<AdminSongRequestsPage />} />
        <Route path="super-report" element={<AdminSuperReport />} />
        <Route path="stores" element={<AdminStoresPage />} />
      </Route>
    </Route>
    <Route path="/start" element={<QrLandingPage />} />
    <Route path=":storeSlug/start" element={<QrLandingPage />} />
    <Route path="/self-warp" element={<SelfWarpPage />} />
    <Route path=":storeSlug/self-warp" element={<SelfWarpPage />} />
    <Route path="/song-request" element={<SongRequestPage />} />
    <Route path=":storeSlug/song-request" element={<SongRequestPage />} />
    <Route path="/promptpay" element={<PromptPayPage />} />
    <Route path=":storeSlug/promptpay" element={<PromptPayPage />} />
    <Route path="/warp/:code" element={<WarpRedirect />} />
    <Route path=":storeSlug/warp/:code" element={<WarpRedirect />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

const App = () => {
  return (
    <AuthProvider>
      <StoreProvider>
        <AppRoutes />
      </StoreProvider>
    </AuthProvider>
  );
};

export default App;
