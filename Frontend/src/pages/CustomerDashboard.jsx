import React, { useState, useEffect } from 'react';

const API_URL = 'http://localhost:5001/api';

function CustomerDashboard({ token }) {
  const [stores, setStores] = useState([]);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [order, setOrder] = useState('asc');
  
  // Rating widget interaction states (tracked per store_id)
  const [hoveredRatings, setHoveredRatings] = useState({}); // { storeId: starValue }
  const [selectedRatings, setSelectedRatings] = useState({}); // { storeId: starValue }
  
  const [statusMessage, setStatusMessage] = useState({ success: '', error: '' });

  useEffect(() => {
    fetchStores();
  }, [search, sortBy, order, token]);

  const fetchStores = async () => {
    try {
      const queryParams = new URLSearchParams({
        search,
        sortBy,
        order
      }).toString();

      const response = await fetch(`${API_URL}/stores/customer?${queryParams}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const data = await response.json();
      if (response.ok) {
        setStores(data.stores);
        
        // Initialize the selected ratings state with what the user has already rated
        const initialSelected = {};
        data.stores.forEach(s => {
          if (s.userRating) {
            initialSelected[s.id] = s.userRating;
          }
        });
        setSelectedRatings(initialSelected);
      }
    } catch (err) {
      console.error('Error fetching stores:', err);
    }
  };

  // --- Handlers for Submit/Modify Rating ---

  const handleRatingSubmit = async (storeId) => {
    setStatusMessage({ success: '', error: '' });
    const ratingValue = selectedRatings[storeId];

    if (!ratingValue) {
      setStatusMessage({ success: '', error: 'Please select a rating star first.' });
      return;
    }

    try {
      const response = await fetch(`${API_URL}/ratings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ store_id: storeId, rating: ratingValue })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit rating.');
      }

      setStatusMessage({ success: data.message, error: '' });
      fetchStores(); // Refresh store ratings
    } catch (err) {
      setStatusMessage({ success: '', error: err.message });
    }
  };

  const handleRatingModify = async (storeId) => {
    setStatusMessage({ success: '', error: '' });
    const ratingValue = selectedRatings[storeId];

    if (!ratingValue) {
      setStatusMessage({ success: '', error: 'Please select a rating star first.' });
      return;
    }

    try {
      const response = await fetch(`${API_URL}/ratings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ store_id: storeId, rating: ratingValue })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to modify rating.');
      }

      setStatusMessage({ success: data.message, error: '' });
      fetchStores(); // Refresh store ratings
    } catch (err) {
      setStatusMessage({ success: '', error: err.message });
    }
  };

  // --- Hover and click helpers for Star Selector ---

  const handleStarHover = (storeId, value) => {
    setHoveredRatings({ ...hoveredRatings, [storeId]: value });
  };

  const handleStarLeave = (storeId) => {
    const updatedHover = { ...hoveredRatings };
    delete updatedHover[storeId];
    setHoveredRatings(updatedHover);
  };

  const handleStarClick = (storeId, value) => {
    setSelectedRatings({ ...selectedRatings, [storeId]: value });
  };

  const toggleSort = (field) => {
    const isAsc = sortBy === field && order === 'asc';
    setSortBy(field);
    setOrder(isAsc ? 'desc' : 'asc');
  };

  return (
    <div className="section-card">
      <div className="dashboard-title-row">
        <h1>Store Ratings & Directory</h1>
      </div>

      {statusMessage.error && <div className="error-banner">{statusMessage.error}</div>}
      {statusMessage.success && <div className="success-banner">{statusMessage.success}</div>}

      {/* Search and Filters */}
      <div className="search-container">
        <div className="search-wrapper">
          <input
            type="text"
            className="search-input"
            placeholder="Search stores by Name or Address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="clear-search-btn" onClick={() => setSearch('')}>
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Stores Directory Table */}
      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th className="sortable" onClick={() => toggleSort('name')}>
                Store Name {sortBy === 'name' ? (order === 'asc' ? '▲' : '▼') : ''}
              </th>
              <th className="sortable" onClick={() => toggleSort('address')}>
                Address {sortBy === 'address' ? (order === 'asc' ? '▲' : '▼') : ''}
              </th>
              <th className="sortable" onClick={() => toggleSort('rating')}>
                Overall Rating {sortBy === 'rating' ? (order === 'asc' ? '▲' : '▼') : ''}
              </th>
              <th>My Submitted Rating</th>
              <th style={{ width: '320px' }}>Rate & Actions</th>
            </tr>
          </thead>
          <tbody>
            {stores.length === 0 ? (
              <tr>
                <td colSpan="5" className="no-data">No stores found matching your search.</td>
              </tr>
            ) : (
              stores.map((s) => {
                const currentHover = hoveredRatings[s.id] || 0;
                const currentSelect = selectedRatings[s.id] || 0;
                const hasRatedBefore = s.userRating !== null;

                return (
                  <tr key={s.id}>
                    <td style={{ fontWeight: '600' }}>{s.name}</td>
                    <td>{s.address}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className="rating-stars">
                          <span className="star filled">★</span>
                        </span>
                        <strong>{s.rating > 0 ? `${s.rating} / 5` : 'No ratings'}</strong>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          ({s.totalRatings} rater{s.totalRatings !== 1 ? 's' : ''})
                        </span>
                      </div>
                    </td>
                    <td>
                      {hasRatedBefore ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span className="rating-stars">
                            {Array.from({ length: s.userRating }).map((_, i) => (
                              <span key={i} className="star filled">★</span>
                            ))}
                            {Array.from({ length: 5 - s.userRating }).map((_, i) => (
                              <span key={i} className="star">★</span>
                            ))}
                          </span>
                          <span>({s.userRating} stars)</span>
                        </div>
                      ) : (
                        <span className="text-muted">Not rated yet</span>
                      )}
                    </td>
                    <td>
                      <div className="rating-action-panel">
                        {/* Interactive Star Selector */}
                        <div 
                          className="rating-stars"
                          onMouseLeave={() => handleStarLeave(s.id)}
                        >
                          {[1, 2, 3, 4, 5].map((val) => {
                            const isFilled = currentHover >= val || (!currentHover && currentSelect >= val);
                            return (
                              <span
                                key={val}
                                className={`star-interactive ${isFilled ? 'filled' : ''}`}
                                onMouseEnter={() => handleStarHover(s.id, val)}
                                onClick={() => handleStarClick(s.id, val)}
                              >
                                ★
                              </span>
                            );
                          })}
                        </div>

                        {/* Submit or Modify Action Button */}
                        <div>
                          {hasRatedBefore ? (
                            <button
                              type="button"
                              className="btn btn-secondary"
                              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                              disabled={currentSelect === s.userRating}
                              onClick={() => handleRatingModify(s.id)}
                            >
                              Modify
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="btn btn-primary"
                              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                              disabled={!currentSelect}
                              onClick={() => handleRatingSubmit(s.id)}
                            >
                              Submit
                            </button>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default CustomerDashboard;
