import { Routes, Route, Navigate } from 'react-router-dom';
import { Spin } from 'antd';
import { useEffect, useState } from 'react';
import { useAuthStore } from './store/authStore';

// Layout
import MainLayout from './components/layout/MainLayout';

// Components
import { OfflineIndicator } from './components/common/OfflineIndicator';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Analytics from './pages/Analytics';
import Products from './pages/Products';
import Sales from './pages/Sales';
import Channels from './pages/Channels';
import Profile from './pages/Profile';
import Plans from './pages/Plans';
import Upload from './pages/Upload';
import Competitors from './pages/Competitors';
import Forecasting from './pages/Forecasting';

// Protected Route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="loading-container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// Public Route wrapper (redirects to dashboard if authenticated)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function App() {
  const { token, user, fetchUser } = useAuthStore();
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);

  useEffect(() => {
    // On mount, verify token if we have one but no user (e.g., after page refresh)
    const verifyAuth = async () => {
      if (token && !user) {
        // We have a token but no user data - verify the token
        try {
          await fetchUser();
        } catch (error) {
          // Token invalid - fetchUser will clear auth state
        }
      }
      setHasCheckedAuth(true);
    };

    verifyAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Show loading spinner while checking auth (only if we need to verify token)
  if (!hasCheckedAuth && token && !user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <>
      <OfflineIndicator />
      <Routes>
      {/* Public routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />

      {/* Protected routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="products" element={<Products />} />
        <Route path="sales" element={<Sales />} />
        <Route path="upload" element={<Upload />} />
        <Route path="channels" element={<Channels />} />
        <Route path="competitors" element={<Competitors />} />
        <Route path="forecasting" element={<Forecasting />} />
        <Route path="profile" element={<Profile />} />
        <Route path="plans" element={<Plans />} />
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
    </>
  );
}

export default App;

