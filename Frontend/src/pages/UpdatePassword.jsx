import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_URL = 'http://localhost:5001/api';

function UpdatePassword({ token }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // --- Client-side Validations ---
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('All password fields are required.');
      return;
    }

    if (newPassword.length < 8 || newPassword.length > 16) {
      setError('New password must be between 8 and 16 characters long.');
      return;
    }

    const hasUppercase = /[A-Z]/.test(newPassword);
    const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);
    if (!hasUppercase || !hasSpecial) {
      setError('New password must contain at least one uppercase letter and one special character.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    if (currentPassword === newPassword) {
      setError('New password cannot be the same as the current password.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/update-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Password update failed.');
      }

      setSuccess('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      // Redirect user back to home/dashboard page after 2 seconds
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
      <div className="auth-card" style={{ maxWidth: '420px', padding: '30px' }}>
        <div className="auth-header" style={{ marginBottom: '20px' }}>
          <h2 className="auth-title">Update Password</h2>
          <p className="auth-desc">Create a secure new password for your account</p>
        </div>

        {error && <div className="error-banner">{error}</div>}
        {success && <div className="success-banner">{success}</div>}

        <form onSubmit={handleUpdate}>
          {/* Current Password */}
          <div className="form-group">
            <label className="form-label" htmlFor="currentPassword">
              Current Password
            </label>
            <input
              id="currentPassword"
              type={showPassword ? 'text' : 'password'}
              className="form-input"
              placeholder="Enter current password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>

          {/* New Password */}
          <div className="form-group">
            <label className="form-label" htmlFor="newPassword">
              New Password (8-16 characters, 1 Uppercase, 1 Special)
            </label>
            <input
              id="newPassword"
              type={showPassword ? 'text' : 'password'}
              className="form-input"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>

          {/* Confirm New Password */}
          <div className="form-group">
            <label className="form-label" htmlFor="confirmPassword">
              Confirm New Password
            </label>
            <input
              id="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              className="form-input"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          {/* Show password check box inside form */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', cursor: 'pointer' }} onClick={() => setShowPassword(!showPassword)}>
            <input
              type="checkbox"
              id="show-password-check"
              checked={showPassword}
              onChange={() => {}} // handled by click div wrapper
              style={{ cursor: 'pointer' }}
            />
            <label htmlFor="show-password-check" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              Show Passwords
            </label>
          </div>

          {/* Submit Button */}
          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Updating Password...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default UpdatePassword;
