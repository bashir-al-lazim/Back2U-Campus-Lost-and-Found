// ========================
// ITEM DETAIL VIEW
// ========================
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import '../styles/ItemDetail.css'
import ShareActions from '../../post_sharing/components/ShareActions';
import MiniFlyer from '../../post_sharing/components/MiniFlyer';

const ItemDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const flyerRef = useRef(null);

  useEffect(() => {
    fetchItemDetail();
  }, [id]);

  const fetchItemDetail = async () => {
    setLoading(true);
    setError(null);

    try {
      // Call backend API
      const response = await fetch(`http://localhost:5000/api/items/${id}`);
      const data = await response.json();

      if (data.success) {
        setItem(data.data);
      } else {
        throw new Error(data.message || 'Failed to load item details');
      }
    } catch (err) {
      setError(err.message || 'Failed to load item details');
      console.error('Error fetching item:', err);
    } finally {
      setLoading(false);
    }
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

  if (!item) {
    return (
      <div className="container">
        <div className="error-message">
          <p>Item not found</p>
          <button className="btn btn-primary" onClick={() => navigate('/items')}>
            Back to Items
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="item-detail">
      <div className="container">
        {/* Back Button */}
        <div className='flex  mt-12 gap-6'>
          <button className="btn btn-outline btn-md back-btn" onClick={() => navigate(-1)}>
            ← Back
          </button>
          <div>
            <ShareActions item={item} flyerRef={flyerRef} />
            <MiniFlyer ref={flyerRef} item={item} />
          </div>
        </div>
        <div className="detail-grid">
          {/* Image Section */}
          <div className="detail-image-section">
            <div className="detail-image-wrapper">
              <img src={item.photoUrl || item.photo} alt={item.title} className="detail-image" />
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
                    <p className="info-value">{item.locationText || item.location}</p>
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
