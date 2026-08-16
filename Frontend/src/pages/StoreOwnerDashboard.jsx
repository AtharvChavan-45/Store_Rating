import React, { useState, useEffect } from 'react';

const API_URL = 'http://localhost:5001/api';

function StoreOwnerDashboard({ token }) {
  const [hasStore, setHasStore] = useState(false);
  const [store, setStore] = useState(null);
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Sorting state for customer raters list
  const [sortBy, setSortBy] = useState('date');
  const [order, setOrder] = useState('desc'); // Default to newest ratings first

  useEffect(() => {
    fetchDashboardData();
  }, [sortBy, order, token]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        sortBy,
        order
      }).toString();

      const response = await fetch(`${API_URL}/stores/owner?${queryParams}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setHasStore(data.hasStore);
        if (data.hasStore) {
          setStore(data.store);
          setRatings(data.ratings);
        }
      }
    } catch (err) {
      console.error('Error fetching store owner dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleSort = (field) => {
    const isAsc = sortBy === field && order === 'asc';
    setSortBy(field);
    setOrder(isAsc ? 'desc' : 'asc');
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '50px' }}>Loading Dashboard Data...</div>;
  }

  // Fallback if the admin has not assigned a store to this store owner yet
  if (!hasStore) {
    return (
      <div className="section-card" style={{ textAlign: 'center', padding: '40px 20px' }}>
        <h2 style={{ color: 'var(--error-color)', marginBottom: '15px' }}>Access Pending</h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto' }}>
          Your store owner account is registered, but there is no store currently associated with it. 
          Please contact the <strong>System Administrator</strong> to register your store and link it to your profile.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Store Owner Title Row */}
      <div className="dashboard-title-row">
        <h1>Store Owner Portal</h1>
      </div>

      {/* Store Profile & Rating Overview */}
      <div className="section-card" style={{ marginBottom: '30px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '20px' }}>
          
          {/* Metadata Block */}
          <div className="store-meta-block">
            <div className="rating-summary-circle">
              <span className="rating-summary-value">{store.averageRating > 0 ? store.averageRating : '0'}</span>
              <span className="rating-summary-label">Avg Rating</span>
            </div>
            
            <div className="store-detail-info">
              <h2>{store.name}</h2>
              <p>🏪 <strong>Address:</strong> {store.address}</p>
              <p>✉️ <strong>Contact Email:</strong> {store.email}</p>
            </div>
          </div>

          {/* Rating Count box */}
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '600' }}>
              Total Feedbacks
            </p>
            <span style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--primary-color)' }}>
              {store.totalRatings}
            </span>
          </div>

        </div>
      </div>

      {/* Customers List Section */}
      <div className="section-card">
        <div className="section-header-row">
          <h2>Customer Feedback Directory</h2>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th className="sortable" onClick={() => toggleSort('name')}>
                  Customer Name {sortBy === 'name' ? (order === 'asc' ? '▲' : '▼') : ''}
                </th>
                <th className="sortable" onClick={() => toggleSort('email')}>
                  Customer Email {sortBy === 'email' ? (order === 'asc' ? '▲' : '▼') : ''}
                </th>
                <th>Customer Address</th>
                <th className="sortable" onClick={() => toggleSort('rating')}>
                  Rating Given {sortBy === 'rating' ? (order === 'asc' ? '▲' : '▼') : ''}
                </th>
                <th className="sortable" onClick={() => toggleSort('date')}>
                  Submitted Date {sortBy === 'date' ? (order === 'asc' ? '▲' : '▼') : ''}
                </th>
              </tr>
            </thead>
            <tbody>
              {ratings.length === 0 ? (
                <tr>
                  <td colSpan="5" className="no-data">No customers have rated your store yet.</td>
                </tr>
              ) : (
                ratings.map((r, index) => (
                  <tr key={index}>
                    <td style={{ fontWeight: '600' }}>{r.customerName}</td>
                    <td>{r.customerEmail}</td>
                    <td>{r.customerAddress}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className="rating-stars">
                          {Array.from({ length: r.rating }).map((_, i) => (
                            <span key={i} className="star filled">★</span>
                          ))}
                          {Array.from({ length: 5 - r.rating }).map((_, i) => (
                            <span key={i} className="star">★</span>
                          ))}
                        </span>
                        <strong>({r.rating} stars)</strong>
                      </div>
                    </td>
                    <td>
                      {new Date(r.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default StoreOwnerDashboard;
