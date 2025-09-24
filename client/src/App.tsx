import { Navigate, Route, Routes } from 'react-router-dom';
import AdminForm from './components/AdminForm';
import AdminLogin from './components/AdminLogin';
import WarpRedirect from './pages/WarpRedirect';
import LandingPage from './pages/LandingPage';
import SelfWarpPage from './pages/SelfWarpPage';
import LineCallback from './pages/LineCallback';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LineAuthProvider } from './contexts/LineAuthContext';
import AdminActivity from './pages/AdminActivity';

const AdminShell = () => {
  const { token, setToken } = useAuth();

  const handleLoginSuccess = (newToken: string) => {
    setToken(newToken);
  };

  const handleLogout = () => {
    setToken(null);
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-100 p-6">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">meeWarp Admin</h1>
        {token ? (
          <div className="flex gap-3">
            <a
              href="/admin/activity"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
            >
              Activity Log
            </a>
          </div>
        ) : null}
      </header>
      <main className="flex flex-1 items-center justify-center">
        {token ? (
          <AdminForm authToken={token} onLogout={handleLogout} />
        ) : (
          <AdminLogin onSuccess={handleLoginSuccess} />
        )}
      </main>
    </div>
  );
};

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<LandingPage />} />
    <Route path="/admin" element={<AdminShell />} />
    <Route path="/admin/activity" element={<AdminActivity />} />
    <Route path="/self-warp" element={<SelfWarpPage />} />
    <Route path="/warp/:code" element={<WarpRedirect />} />
    <Route path="/line/callback" element={<LineCallback />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

const App = () => {
  return (
    <AuthProvider>
      <LineAuthProvider>
        <AppRoutes />
      </LineAuthProvider>
    </AuthProvider>
  );
};

export default App;
