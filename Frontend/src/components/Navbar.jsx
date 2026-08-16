import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

function Navbar({ user, onLogout }) {
  const navigate = useNavigate();

  const handleLogoutClick = () => {
    onLogout();
    navigate('/login');
  };

  // Determine dashboard link based on role
  const getDashboardPath = () => {
    if (user?.role === 'admin') return '/admin';
    if (user?.role === 'store_owner') return '/owner';
    return '/customer';
  };

  return (
    <nav className="navbar">
      {/* Brand logo block */}
      <div className="navbar-brand">
        <span>Store</span>
        <span className="logo-tag">Ratings</span>
      </div>

      {/* Menu links and user info */}
      <div className="navbar-menu">
        {/* Navigation links */}
        <div className="navbar-links">
          <NavLink 
            to={getDashboardPath()} 
            className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}
          >
            Dashboard
          </NavLink>
          <NavLink 
            to="/update-password" 
            className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}
          >
            Change Password
          </NavLink>
        </div>

        {/* User identification badge */}
        {user && (
          <div className="navbar-user-info">
            Welcome, <strong>{user.name.split(' ')[0]}</strong>
            <span className="role-badge">
              {user.role === 'store_owner' ? 'owner' : user.role === 'user' ? 'customer' : user.role}
            </span>
          </div>
        )}

        {/* Logout trigger button */}
        <button type="button" className="logout-btn" onClick={handleLogoutClick}>
          Log Out
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
