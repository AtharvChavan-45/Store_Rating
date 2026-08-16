import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import CustomerDashboard from './pages/CustomerDashboard';
import StoreOwnerDashboard from './pages/StoreOwnerDashboard';
import UpdatePassword from './pages/UpdatePassword';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session from localStorage on application load
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      setToken(storedToken);
    }
    setLoading(false);
  }, []);

  const loginUser = (userData, userToken) => {
    setUser(userData);
    setToken(userToken);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', userToken);
  };

  const logoutUser = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading Store Rating Portal...</p>
      </div>
    );
  }

  // Protected Route Component with Role check
  const ProtectedRoute = ({ children, allowedRoles }) => {
    if (!token) {
      return <Navigate to="/login" replace />;
    }
    if (allowedRoles && !allowedRoles.includes(user?.role)) {
      // Redirect to correct dashboard based on actual user role
      if (user?.role === 'admin') return <Navigate to="/admin" replace />;
      if (user?.role === 'store_owner') return <Navigate to="/owner" replace />;
      return <Navigate to="/customer" replace />;
    }
    return (
      <>
        <Navbar user={user} onLogout={logoutUser} />
        <div className="main-content-wrapper">{children}</div>
      </>
    );
  };

  return (
    <Router>
      <Routes>
        {/* Public Routes - Auto redirects to dashboards if already logged in */}
        <Route
          path="/login"
          element={
            token ? (
              user?.role === 'admin' ? (
                <Navigate to="/admin" replace />
              ) : user?.role === 'store_owner' ? (
                <Navigate to="/owner" replace />
              ) : (
                <Navigate to="/customer" replace />
              )
            ) : (
              <Login onLogin={loginUser} />
            )
          }
        />
        <Route
          path="/register"
          element={
            token ? (
              user?.role === 'admin' ? (
                <Navigate to="/admin" replace />
              ) : user?.role === 'store_owner' ? (
                <Navigate to="/owner" replace />
              ) : (
                <Navigate to="/customer" replace />
              )
            ) : (
              <Register />
            )
          }
        />

        {/* Protected Dashboard Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard token={token} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/customer"
          element={
            <ProtectedRoute allowedRoles={['user']}>
              <CustomerDashboard token={token} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/owner"
          element={
            <ProtectedRoute allowedRoles={['store_owner']}>
              <StoreOwnerDashboard token={token} />
            </ProtectedRoute>
          }
        />

        {/* Shared Protected Route */}
        <Route
          path="/update-password"
          element={
            <ProtectedRoute>
              <UpdatePassword token={token} />
            </ProtectedRoute>
          }
        />

        {/* Catch-all route */}
        <Route
          path="*"
          element={
            token ? (
              user?.role === 'admin' ? (
                <Navigate to="/admin" replace />
              ) : user?.role === 'store_owner' ? (
                <Navigate to="/owner" replace />
              ) : (
                <Navigate to="/customer" replace />
              )
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
