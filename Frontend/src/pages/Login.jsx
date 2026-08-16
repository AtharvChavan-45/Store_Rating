import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const API_URL = 'http://localhost:5001/api';

function Login({ onLogin }) {
  const [role, setRole] = useState('user'); // Default role is Customer ('user')
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, role }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed. Please check your credentials.');
      }

      // Successful login
      onLogin(data.user, data.token);

      // Redirect based on role
      if (data.user.role === 'admin') {
        navigate('/admin');
      } else if (data.user.role === 'store_owner') {
        navigate('/owner');
      } else {
        navigate('/customer');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-card">
        {/* Top Header */}
        <div className="auth-header">
          <div className="auth-logo-placeholder">★</div>
          <h2 className="auth-title">Store Rating Portal</h2>
          <p className="auth-desc">Secure access for Customers, Store Owners and Admins</p>
        </div>

        {/* Tab Selection for Role */}
        <div className="role-tabs">
          <button
            type="button"
            className={`role-tab-btn ${role === 'user' ? 'active' : ''}`}
            onClick={() => setRole('user')}
          >
            Customer
          </button>
          <button
            type="button"
            className={`role-tab-btn ${role === 'store_owner' ? 'active' : ''}`}
            onClick={() => setRole('store_owner')}
          >
            Store Owner
          </button>
          <button
            type="button"
            className={`role-tab-btn ${role === 'admin' ? 'active' : ''}`}
            onClick={() => setRole('admin')}
          >
            Admin
          </button>
        </div>

        {error && <div className="error-banner">{error}</div>}

        <form onSubmit={handleSubmit}>
          {/* Email field */}
          <div className="form-group">
            <label className="form-label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              className="form-input"
              placeholder="Enter your registered email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* Password field */}
          <div className="form-group">
            <div className="form-label-row">
              <label className="form-label" htmlFor="password">
                Password
              </label>
            </div>
            <div className="input-wrapper">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        {/* Signup Link */}
        <div className="auth-footer-text">
          Need a new account? <Link to="/register">Sign up</Link>
        </div>
      </div>
    </div>
  );
}

export default Login;
