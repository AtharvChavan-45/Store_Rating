import React, { useState, useEffect } from 'react';

const API_URL = 'http://localhost:5001/api';

function AdminDashboard({ token }) {
  // Navigation tabs: 'stats', 'users', 'stores'
  const [activeTab, setActiveTab] = useState('stats');

  // Stats State
  const [stats, setStats] = useState({ totalUsers: 0, totalStores: 0, totalRatings: 0 });

  // Users Directory List, Filters & Sorting State
  const [users, setUsers] = useState([]);
  const [userFilters, setUserFilters] = useState({ name: '', email: '', address: '', role: '' });
  const [userSort, setUserSort] = useState({ sortBy: 'name', order: 'asc' });

  // Stores Directory List, Filters & Sorting State
  const [stores, setStores] = useState([]);
  const [storeFilters, setStoreFilters] = useState({ name: '', email: '', address: '' });
  const [storeSort, setStoreSort] = useState({ sortBy: 'name', order: 'asc' });

  // Unassigned Store Owners for Store Creation Dropdown
  const [unassignedOwners, setUnassignedOwners] = useState([]);

  // Forms State
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', address: '', role: 'user' });
  const [newStore, setNewStore] = useState({ name: '', email: '', address: '', owner_id: '' });

  // Status/Error notifications
  const [userFormStatus, setUserFormStatus] = useState({ success: '', error: '' });
  const [storeFormStatus, setStoreFormStatus] = useState({ success: '', error: '' });

  // Initial loads
  useEffect(() => {
    fetchStats();
    fetchUnassignedOwners();
  }, [token]);

  // Fetch users when filters or sorting change
  useEffect(() => {
    fetchUsers();
  }, [userFilters, userSort, token]);

  // Fetch stores when filters or sorting change
  useEffect(() => {
    fetchStores();
  }, [storeFilters, storeSort, token]);

  // --- API Fetch calls ---

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_URL}/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const fetchUnassignedOwners = async () => {
    try {
      const response = await fetch(`${API_URL}/admin/unassigned-owners`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setUnassignedOwners(data.owners);
      }
    } catch (err) {
      console.error('Error fetching unassigned owners:', err);
    }
  };

  const fetchUsers = async () => {
    try {
      const { name, email, address, role } = userFilters;
      const { sortBy, order } = userSort;
      const queryParams = new URLSearchParams({
        name,
        email,
        address,
        role,
        sortBy,
        order,
      }).toString();

      const response = await fetch(`${API_URL}/admin/users?${queryParams}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setUsers(data.users);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const fetchStores = async () => {
    try {
      const { name, email, address } = storeFilters;
      const { sortBy, order } = storeSort;
      const queryParams = new URLSearchParams({
        name,
        email,
        address,
        sortBy,
        order,
      }).toString();

      const response = await fetch(`${API_URL}/admin/stores?${queryParams}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setStores(data.stores);
      }
    } catch (err) {
      console.error('Error fetching stores:', err);
    }
  };

  // --- Handlers for User Creation ---

  const handleUserChange = (e) => {
    setNewUser({ ...newUser, [e.target.name]: e.target.value });
  };

  const handleAddUserSubmit = async (e) => {
    e.preventDefault();
    setUserFormStatus({ success: '', error: '' });

    // Client-side validations
    if (newUser.name.trim().length < 20 || newUser.name.trim().length > 60) {
      setUserFormStatus({ success: '', error: 'Name must be between 20 and 60 characters.' });
      return;
    }
    if (newUser.address.trim().length > 400) {
      setUserFormStatus({ success: '', error: 'Address cannot exceed 400 characters.' });
      return;
    }
    const passwordRegex = /^(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,16}$/;
    if (!passwordRegex.test(newUser.password)) {
      setUserFormStatus({
        success: '',
        error: 'Password must be 8-16 characters and contain at least one uppercase letter and one special character.',
      });
      return;
    }

    try {
      const response = await fetch(`${API_URL}/admin/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newUser),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create user.');
      }

      setUserFormStatus({ success: data.message, error: '' });
      setNewUser({ name: '', email: '', password: '', address: '', role: 'user' });

      // Refresh list, stats and owner dropdowns
      fetchStats();
      fetchUsers();
      fetchUnassignedOwners();
    } catch (err) {
      setUserFormStatus({ success: '', error: err.message });
    }
  };

  // --- Handlers for Store Creation ---

  const handleStoreChange = (e) => {
    setNewStore({ ...newStore, [e.target.name]: e.target.value });
  };

  const handleAddStoreSubmit = async (e) => {
    e.preventDefault();
    setStoreFormStatus({ success: '', error: '' });

    // Client-side validations
    if (newStore.name.trim().length < 3 || newStore.name.trim().length > 60) {
      setStoreFormStatus({ success: '', error: 'Store Name must be between 3 and 60 characters.' });
      return;
    }
    if (newStore.address.trim().length > 400) {
      setStoreFormStatus({ success: '', error: 'Store Address cannot exceed 400 characters.' });
      return;
    }

    const payload = {
      name: newStore.name,
      email: newStore.email,
      address: newStore.address,
      owner_id: newStore.owner_id || null,
    };

    try {
      const response = await fetch(`${API_URL}/admin/stores`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to register store.');
      }

      setStoreFormStatus({ success: data.message, error: '' });
      setNewStore({ name: '', email: '', address: '', owner_id: '' });

      // Refresh states
      fetchStats();
      fetchStores();
      fetchUnassignedOwners();
    } catch (err) {
      setStoreFormStatus({ success: '', error: err.message });
    }
  };

  // --- Sort Toggles ---

  const toggleUserSort = (field) => {
    const isAsc = userSort.sortBy === field && userSort.order === 'asc';
    setUserSort({ sortBy: field, order: isAsc ? 'desc' : 'asc' });
  };

  const toggleStoreSort = (field) => {
    const isAsc = storeSort.sortBy === field && storeSort.order === 'asc';
    setStoreSort({ sortBy: field, order: isAsc ? 'desc' : 'asc' });
  };

  return (
    <div>
      {/* Admin Title row */}
      <div className="dashboard-title-row">
        <h1>Admin Control Center</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setActiveTab('stats')}
            className={`btn ${activeTab === 'stats' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Dashboard Overview
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-secondary'}`}
          >
            User Directory
          </button>
          <button
            onClick={() => setActiveTab('stores')}
            className={`btn ${activeTab === 'stores' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Store Directory
          </button>
        </div>
      </div>

      {/* TAB 1: OVERVIEW & FORMS */}
      {activeTab === 'stats' && (
        <div>
          {/* Stats Display grid */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-info">
                <h3>Total Registered Users</h3>
                <div className="stat-number">{stats.totalUsers}</div>
              </div>
              <div className="stat-icon-wrapper">👤</div>
            </div>
            <div className="stat-card">
              <div className="stat-info">
                <h3>Total Active Stores</h3>
                <div className="stat-number">{stats.totalStores}</div>
              </div>
              <div className="stat-icon-wrapper">🏪</div>
            </div>
            <div className="stat-card">
              <div className="stat-info">
                <h3>Total Submitted Ratings</h3>
                <div className="stat-number">{stats.totalRatings}</div>
              </div>
              <div className="stat-icon-wrapper">⭐</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '30px' }}>
            {/* Form: Add New User */}
            <div className="section-card">
              <div className="section-header-row">
                <h2>Add User Account</h2>
              </div>
              {userFormStatus.error && <div className="error-banner">{userFormStatus.error}</div>}
              {userFormStatus.success && <div className="success-banner">{userFormStatus.success}</div>}
              <form onSubmit={handleAddUserSubmit}>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label" htmlFor="user-name">Full Name</label>
                    <input
                      id="user-name"
                      name="name"
                      type="text"
                      className="form-input"
                      placeholder="Min 20 characters"
                      value={newUser.name}
                      onChange={handleUserChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="user-email">Email Address</label>
                    <input
                      id="user-email"
                      name="email"
                      type="email"
                      className="form-input"
                      placeholder="user@example.com"
                      value={newUser.email}
                      onChange={handleUserChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label" htmlFor="user-password">Password</label>
                    <input
                      id="user-password"
                      name="password"
                      type="password"
                      className="form-input"
                      placeholder="8-16 chars, Uppercase & Special"
                      value={newUser.password}
                      onChange={handleUserChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="user-role">Account Role</label>
                    <select
                      id="user-role"
                      name="role"
                      className="form-input"
                      value={newUser.role}
                      onChange={handleUserChange}
                      required
                    >
                      <option value="user">Customer (Normal User)</option>
                      <option value="store_owner">Store Owner</option>
                      <option value="admin">System Administrator</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="user-address">Full Address</label>
                  <input
                    id="user-address"
                    name="address"
                    type="text"
                    className="form-input"
                    placeholder="Max 400 characters"
                    value={newUser.address}
                    onChange={handleUserChange}
                    required
                  />
                </div>

                <div className="action-row">
                  <button type="submit" className="btn btn-primary">Create User Account</button>
                </div>
              </form>
            </div>

            {/* Form: Add New Store */}
            <div className="section-card">
              <div className="section-header-row">
                <h2>Register New Store</h2>
              </div>
              {storeFormStatus.error && <div className="error-banner">{storeFormStatus.error}</div>}
              {storeFormStatus.success && <div className="success-banner">{storeFormStatus.success}</div>}
              <form onSubmit={handleAddStoreSubmit}>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label" htmlFor="store-name">Store Name</label>
                    <input
                      id="store-name"
                      name="name"
                      type="text"
                      className="form-input"
                      placeholder="Min 3 characters"
                      value={newStore.name}
                      onChange={handleStoreChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="store-email">Store Email</label>
                    <input
                      id="store-email"
                      name="email"
                      type="email"
                      className="form-input"
                      placeholder="store@example.com"
                      value={newStore.email}
                      onChange={handleStoreChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="store-owner">Assign Store Owner</label>
                  <select
                    id="store-owner"
                    name="owner_id"
                    className="form-input"
                    value={newStore.owner_id}
                    onChange={handleStoreChange}
                  >
                    <option value="">-- No Owner Assigned (Optional) --</option>
                    {unassignedOwners.map((owner) => (
                      <option key={owner.id} value={owner.id}>
                        {owner.name} ({owner.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="store-address">Store Address</label>
                  <input
                    id="store-address"
                    name="address"
                    type="text"
                    className="form-input"
                    placeholder="Max 400 characters"
                    value={newStore.address}
                    onChange={handleStoreChange}
                    required
                  />
                </div>

                <div className="action-row">
                  <button type="submit" className="btn btn-primary">Register Store</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: USER DIRECTORY */}
      {activeTab === 'users' && (
        <div className="section-card">
          <div className="section-header-row">
            <h2>User Account Records</h2>
          </div>

          {/* Filtering inputs */}
          <div className="filters-row">
            <div className="filter-item">
              <input
                type="text"
                placeholder="Search by Name"
                className="filter-input"
                value={userFilters.name}
                onChange={(e) => setUserFilters({ ...userFilters, name: e.target.value })}
              />
            </div>
            <div className="filter-item">
              <input
                type="text"
                placeholder="Search by Email"
                className="filter-input"
                value={userFilters.email}
                onChange={(e) => setUserFilters({ ...userFilters, email: e.target.value })}
              />
            </div>
            <div className="filter-item">
              <input
                type="text"
                placeholder="Search by Address"
                className="filter-input"
                value={userFilters.address}
                onChange={(e) => setUserFilters({ ...userFilters, address: e.target.value })}
              />
            </div>
            <div className="filter-item">
              <select
                className="filter-input"
                value={userFilters.role}
                onChange={(e) => setUserFilters({ ...userFilters, role: e.target.value })}
              >
                <option value="">-- All Roles --</option>
                <option value="user">Customer</option>
                <option value="store_owner">Store Owner</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          {/* Users Table */}
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="sortable" onClick={() => toggleUserSort('name')}>
                    Name {userSort.sortBy === 'name' ? (userSort.order === 'asc' ? '▲' : '▼') : ''}
                  </th>
                  <th className="sortable" onClick={() => toggleUserSort('email')}>
                    Email {userSort.sortBy === 'email' ? (userSort.order === 'asc' ? '▲' : '▼') : ''}
                  </th>
                  <th className="sortable" onClick={() => toggleUserSort('address')}>
                    Address {userSort.sortBy === 'address' ? (userSort.order === 'asc' ? '▲' : '▼') : ''}
                  </th>
                  <th className="sortable" onClick={() => toggleUserSort('role')}>
                    Role {userSort.sortBy === 'role' ? (userSort.order === 'asc' ? '▲' : '▼') : ''}
                  </th>
                  <th className="sortable" onClick={() => toggleUserSort('store_rating')}>
                    Associated Rating {userSort.sortBy === 'store_rating' ? (userSort.order === 'asc' ? '▲' : '▼') : ''}
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="no-data">No user accounts found matching current filter search.</td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id}>
                      <td style={{ fontWeight: '600' }}>{u.name}</td>
                      <td>{u.email}</td>
                      <td>{u.address}</td>
                      <td>
                        <span className={`badge badge-${u.role === 'store_owner' ? 'owner' : u.role}`}>
                          {u.role === 'store_owner' ? 'owner' : u.role === 'user' ? 'customer' : u.role}
                        </span>
                      </td>
                      <td>
                        {u.role === 'store_owner' ? (
                          u.store ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span className="rating-stars">
                                <span className="star filled">★</span>
                              </span>
                              <span>
                                {u.store.rating > 0 ? `${u.store.rating} / 5` : 'No ratings yet'} ({u.store.name})
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted">No store assigned</span>
                          )
                        ) : (
                          <span className="text-muted">N/A</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: STORE DIRECTORY */}
      {activeTab === 'stores' && (
        <div className="section-card">
          <div className="section-header-row">
            <h2>Registered Store Records</h2>
          </div>

          {/* Filtering inputs */}
          <div className="filters-row">
            <div className="filter-item">
              <input
                type="text"
                placeholder="Search Store Name"
                className="filter-input"
                value={storeFilters.name}
                onChange={(e) => setStoreFilters({ ...storeFilters, name: e.target.value })}
              />
            </div>
            <div className="filter-item">
              <input
                type="text"
                placeholder="Search Store Email"
                className="filter-input"
                value={storeFilters.email}
                onChange={(e) => setStoreFilters({ ...storeFilters, email: e.target.value })}
              />
            </div>
            <div className="filter-item">
              <input
                type="text"
                placeholder="Search Store Address"
                className="filter-input"
                value={storeFilters.address}
                onChange={(e) => setStoreFilters({ ...storeFilters, address: e.target.value })}
              />
            </div>
          </div>

          {/* Stores Table */}
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="sortable" onClick={() => toggleStoreSort('name')}>
                    Store Name {storeSort.sortBy === 'name' ? (storeSort.order === 'asc' ? '▲' : '▼') : ''}
                  </th>
                  <th className="sortable" onClick={() => toggleStoreSort('email')}>
                    Store Email {storeSort.sortBy === 'email' ? (storeSort.order === 'asc' ? '▲' : '▼') : ''}
                  </th>
                  <th className="sortable" onClick={() => toggleStoreSort('address')}>
                    Address {storeSort.sortBy === 'address' ? (storeSort.order === 'asc' ? '▲' : '▼') : ''}
                  </th>
                  <th>Assigned Owner</th>
                  <th className="sortable" onClick={() => toggleStoreSort('rating')}>
                    Overall Rating {storeSort.sortBy === 'rating' ? (storeSort.order === 'asc' ? '▲' : '▼') : ''}
                  </th>
                </tr>
              </thead>
              <tbody>
                {stores.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="no-data">No stores found matching current filter search.</td>
                  </tr>
                ) : (
                  stores.map((s) => (
                    <tr key={s.id}>
                      <td style={{ fontWeight: '600' }}>{s.name}</td>
                      <td>{s.email}</td>
                      <td>{s.address}</td>
                      <td>
                        {s.owner ? (
                          <div>
                            <strong>{s.owner.name}</strong>
                            <br />
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{s.owner.email}</span>
                          </div>
                        ) : (
                          <span className="text-muted">Unowned</span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span className="rating-stars">
                            <span className="star filled">★</span>
                          </span>
                          <span>
                            {s.rating > 0 ? `${s.rating} / 5` : 'No ratings yet'} 
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginLeft: '4px' }}>
                              ({s.totalRatings} rater{s.totalRatings !== 1 ? 's' : ''})
                            </span>
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
