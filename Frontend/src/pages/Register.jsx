import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const API_URL = 'http://localhost:5001/api';

function Register() {
  const [role, setRole] = useState('user'); // Default role is Customer ('user')
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // --- Client-side Form Validations ---

    // 1. Name: Min 20, Max 60 characters
    if (name.trim().length < 20 || name.trim().length > 60) {
      setError('Validation Error: Name must be between 20 and 60 characters long.');
      return;
    }

    // 2. Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Validation Error: Please enter a valid email address.');
      return;
    }

    // 3. Address: Max 400 characters
    if (address.trim().length === 0) {
      setError('Validation Error: Address is required.');
      return;
    }
    if (address.trim().length > 400) {
      setError('Validation Error: Address cannot exceed 400 characters.');
      return;
    }

    // 4. Password: 8-16 characters
    if (password.length < 8 || password.length > 16) {
      setError('Validation Error: Password must be between 8 and 16 characters.');
      return;
    }

    // 5. Password: Must contain at least one uppercase letter and one special character
    const hasUppercase = /[A-Z]/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);
    if (!hasUppercase || !hasSpecial) {
      setError('Validation Error: Password must contain at least one uppercase letter and one special character.');
      return;
    }

    // 6. Match Passwords
    if (password !== confirmPassword) {
      setError('Validation Error: Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, address, password, role }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed.');
      }

      setSuccess(`${role === 'store_owner' ? 'Store Owner' : role === 'admin' ? 'Admin' : 'Customer'} registration successful! Redirecting to login page...`);
      setName('');
      setEmail('');
      setAddress('');
      setPassword('');
      setConfirmPassword('');

      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-card">
        {/* Header styling matching login */}
        <div className="auth-header">
          <div className="auth-logo-placeholder">★</div>
          <h2 className="auth-title">
            {role === 'user' ? 'Customer Registration' : role === 'store_owner' ? 'Store Owner Registration' : 'Admin Signup'}
          </h2>
          <p className="auth-desc">
            {role === 'user' 
              ? 'Sign up to submit ratings for registered stores' 
              : role === 'store_owner' 
              ? 'Sign up to manage ratings and details for your store' 
              : 'Sign up to manage directories, stores and users'}
          </p>
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
        {success && <div className="success-banner">{success}</div>}

        <form onSubmit={handleRegister}>
          {/* Full Name field with character counter/indicator */}
          <div className="form-group">
            <div className="form-label-row">
              <label className="form-label" htmlFor="name">
                Full Name
              </label>
              <span style={{ fontSize: '0.75rem', color: name.trim().length >= 20 && name.trim().length <= 60 ? 'green' : 'gray' }}>
                {name.trim().length}/60 (Min 20)
              </span>
            </div>
            <input
              id="name"
              type="text"
              className="form-input"
              placeholder="Min 20 characters, Max 60 characters"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          {/* Email field */}
          <div className="form-group">
            <label className="form-label" htmlFor="email">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              className="form-input"
              placeholder="e.g. customer@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* Address field with character counter */}
          <div className="form-group">
            <div className="form-label-row">
              <label className="form-label" htmlFor="address">
                Full Address
              </label>
              <span style={{ fontSize: '0.75rem', color: address.trim().length <= 400 ? 'green' : 'red' }}>
                {address.trim().length}/400
              </span>
            </div>
            <textarea
              id="address"
              className="form-input"
              style={{ minHeight: '80px', resize: 'vertical' }}
              placeholder="Enter your street address, city, and pincode (Max 400 characters)"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
            />
          </div>

          {/* Password field */}
          <div className="form-group">
            <label className="form-label" htmlFor="password">
              Password (8-16 chars, 1 Uppercase, 1 Special)
            </label>
            <div className="input-wrapper">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="Enter password"
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

          {/* Confirm Password field */}
          <div className="form-group">
            <label className="form-label" htmlFor="confirmPassword">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              className="form-input"
              placeholder="Re-enter password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          {/* Submit button */}
          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Creating Account...' : 'Register'}
          </button>
        </form>

        {/* Back to Login Link */}
        <div className="auth-footer-text">
          Already have an account? <Link to="/login">Login here</Link>
        </div>
      </div>
    </div>
  );
}

export default Register;
