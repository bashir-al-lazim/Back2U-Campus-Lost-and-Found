// ========================
// ITEM DETAIL VIEW
// ========================
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import itemService from '../../services/itemService';
import authService from '../../services/authService';
import './ItemDetail.css';

const ItemDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const currentUser = authService.getCurrentUserFromStorage();

  useEffect(() => {
    fetchItemDetail();
  }, [id]);

  const fetchItemDetail = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await itemService.getItemById(id);
      setItem(response.data);
    } catch (err) {
      setError(err.message || 'Failed to load item details');
      console.error('Error fetching item:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClaimItem = () => {
    navigate(`/claims/new/${id}`);
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="error-message">
          <p>⚠️ {error}</p>
          <button className="btn btn-primary" onClick={() => navigate('/items')}>
            Back to Items
          </button>
        </div>
      </div>
    );
  }

  if (!item) return null;

  return (
    <div className="item-detail">
      <div className="container">
        {/* Back Button */}
        <button className="btn btn-outline btn-sm back-btn" onClick={() => navigate(-1)}>
          ← Back
        </button>

        <div className="detail-grid">
          {/* Image Section */}
          <div className="detail-image-section">
            <div className="detail-image-wrapper">
              <img src={item.photo} alt={item.title} className="detail-image" />
              <span className={`badge badge-${item.status.toLowerCase()} detail-badge`}>
                {item.status}
              </span>
            </div>
          </div>

          {/* Content Section */}
          <div className="detail-content-section">
            <div className="detail-header">
              <div>
                <h1 className="detail-title">{item.title}</h1>
                <span className="detail-category">{item.category}</span>
              </div>
            </div>

            {/* Description */}
            <div className="detail-section">
              <h3 className="section-title">Description</h3>
              <p className="detail-description">{item.description}</p>
            </div>

            {/* Item Info */}
            <div className="detail-section">
              <h3 className="section-title">Item Information</h3>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-icon">📍</span>
                  <div>
                    <p className="info-label">Location Found</p>
                    <p className="info-value">{item.location}</p>
                  </div>
                </div>
                <div className="info-item">
                  <span className="info-icon">📅</span>
                  <div>
                    <p className="info-label">Date Found</p>
                    <p className="info-value">
                      {format(new Date(item.dateFound), 'MMMM dd, yyyy')}
                    </p>
                  </div>
                </div>
                <div className="info-item">
                  <span className="info-icon">⏰</span>
                  <div>
                    <p className="info-label">Posted On</p>
                    <p className="info-value">
                      {format(new Date(item.createdAt), 'MMMM dd, yyyy - hh:mm a')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Posted By */}
            {item.postedBy && (
              <div className="detail-section">
                <h3 className="section-title">Posted By</h3>
                <div className="user-info">
                  <img
                    src={item.postedBy.avatar || '/default-avatar.png'}
                    alt={item.postedBy.name}
                    className="user-avatar-large"
                  />
                  <div>
                    <p className="user-name-large">{item.postedBy.name}</p>
                    <p className="user-email">{item.postedBy.email}</p>
                    <span className={`badge badge-open`}>{item.postedBy.role}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Claimed By */}
            {item.status === 'Claimed' && item.claimedBy && (
              <div className="detail-section claimed-section">
                <h3 className="section-title">Claimed By</h3>
                <div className="user-info">
                  <img
                    src={item.claimedBy.avatar || '/default-avatar.png'}
                    alt={item.claimedBy.name}
                    className="user-avatar-large"
                  />
                  <div>
                    <p className="user-name-large">{item.claimedBy.name}</p>
                    <p className="user-email">{item.claimedBy.email}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {/* Claim functionality disabled - no login required for browsing */}
            {/* {item.status === 'Open' && currentUser?.role === 'Student' && (
              <div className="detail-actions">
                <button className="btn btn-primary btn-lg" onClick={handleClaimItem}>
                  🏷️ Claim This Item
                </button>
              </div>
            )} */}

            {item.status === 'Resolved' && (
              <div className="resolved-message">
                <span className="resolved-icon">✅</span>
                <p>This item has been successfully returned to its owner!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemDetail;
