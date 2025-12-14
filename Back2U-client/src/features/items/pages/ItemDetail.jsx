// ========================
// ITEM DETAIL VIEW
// ========================
<<<<<<< HEAD
import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import "../styles/ItemDetail.css";
import ShareActions from "../../post_sharing/components/ShareActions";
import MiniFlyer from "../../post_sharing/components/MiniFlyer";
=======
import React, { useState, useEffect, useRef, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import '../styles/ItemDetail.css';
import ShareActions from '../../post_sharing/components/ShareActions';
import MiniFlyer from '../../post_sharing/components/MiniFlyer';
import CommentsSection from '../components/CommentsSection';
import { AuthContext } from '../../../app/providers/createProvider';
import { createReport } from '../../moderation/api/moderationApi';
import { toast } from 'react-toastify';
>>>>>>> origin/development

const ItemDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState(null);
  const { user, role } = useContext(AuthContext);

  const flyerRef = useRef(null);

  // ---- report modal state ----
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);

  // open modal (with login check)
  const openReportModal = () => {
    if (!user) {
      toast.error('You must be logged in to report an item.');
      return;
    }
    setIsReportOpen(true);
  };

  const closeReportModal = () => {
    if (reportSubmitting) return;
    setIsReportOpen(false);
    setReportReason('');
  };

  const handleSubmitReport = async () => {
    if (!user) {
      toast.error('You must be logged in to report an item.');
      return;
    }

    if (!reportReason.trim()) {
      toast.error('Please provide a reason for reporting.');
      return;
    }

    try {
      setReportSubmitting(true);
      await createReport({
        targetType: 'item',
        targetId: item._id,
        reason: reportReason.trim(),
        reporter: {
          email: user.email,
          name: user.displayName || user.email,
          role,
        },
      });
      toast.success('Report submitted to moderators.');
      closeReportModal();
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Failed to submit report');
    } finally {
      setReportSubmitting(false);
    }
  };

  useEffect(() => {
    fetchItemDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchItemDetail = async () => {
    setLoading(true);
    setError(null);
    setItem(null);

    try {
      const response = await fetch(`http://localhost:5000/api/items/${id}`);

      // Feature 13: if item is deleted OR not found, backend returns 404
      if (response.status === 404) {
        setError(
          "This item is not available. It may have been deleted or the link is invalid."
        );
        return;
      }

      // ✅ handle other server errors
      if (!response.ok) {
        setError(`Failed to load item details (status ${response.status})`);
        return;
      }

      // ✅ safe JSON parse
      const data = await response.json();

      if (data?.success && data?.data) {
        setItem(data.data);
      } else {
        setError(data?.message || "Failed to load item details");
      }
    } catch (err) {
      console.error("Error fetching item:", err);
      setError(err?.message || "Failed to load item details");
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

  // Feature 13 friendly UI for deleted/not found (404)
  if (error) {
    return (
<<<<<<< HEAD
      <div className="container">
        <div className="error-message">
          <p>⚠️ {error}</p>

          {/* ✅ FIX: your app items route is /app/items (not /items) */}
          <button className="btn btn-primary" onClick={() => navigate("/app/items")}>
=======
      <div className="min-h-[calc(100vh-16.325rem)] m-auto px-12 sm:px-0 mx-auto pt-36">
        <div className="grid grid-cols-1 justify-items-center space-y-4">
          <p className='text-red-500 font-bold text-2xl'>⚠️ {error}</p>
          <button
            className="btn bg-black text-white"
            onClick={() => navigate('/app/items')}
          >
>>>>>>> origin/development
            Back to Items
          </button>
        </div>
      </div>
    );
  }

<<<<<<< HEAD
  // Extra safety (should rarely happen now)
  if (!item) {
    return (
      <div className="container">
        <div className="error-message">
          <p>Item not found</p>
          <button className="btn btn-primary" onClick={() => navigate("/app/items")}>
            Back to Items
          </button>
        </div>
      </div>
    );
  }
=======
  // if (!item) {
  //   return (
  //     <div className="pt-9">
  //       <div className="error-message">
  //         <p>Item not found</p>
  //         <button
  //           className="btn btn-primary"
  //           onClick={() => navigate('/app/items')}
  //         >
  //           Back to Items
  //         </button>
  //       </div>
  //     </div>
  //   );
  // }
>>>>>>> origin/development

  return (
    <div className="item-detail">
      <div className="container">
<<<<<<< HEAD
        {/* Back Button */}
        <div className="flex mt-12 gap-6">
          <button className="btn btn-outline btn-md back-btn" onClick={() => navigate(-1)}>
            ← Back
          </button>

          <div>
            <ShareActions item={item} flyerRef={flyerRef} />
            <MiniFlyer ref={flyerRef} item={item} />
=======
        {/* Back + actions */}
        <div className="flex mt-12 gap-6 justify-between flex-wrap">
          <div className="flex gap-4 ">
            <button
              className="btn btn-outline btn-md back-btn"
              onClick={() => navigate(-1)}
            >
              ← Back
            </button>
            <div>
              <ShareActions item={item} flyerRef={flyerRef} />
              <MiniFlyer ref={flyerRef} item={item} />
            </div>
>>>>>>> origin/development
          </div>

          <button
            className="btn btn-error btn-md text-white"
            onClick={openReportModal}
          >
            🚩 Report Item
          </button>
        </div>

        <div className="detail-grid">
          {/* Image Section */}
          <div className="detail-image-section">
            <div className="detail-image-wrapper">
              <img
                src={item.photoUrl || item.photo}
<<<<<<< HEAD
                alt={item.title || "Item"}
                className="detail-image"
              />
              <span className={`badge badge-${(item.status || "open").toLowerCase()} detail-badge`}>
=======
                alt={item.title}
                className="detail-image"
              />
              <span
                className={`badge badge-${item.status.toLowerCase()} detail-badge`}
              >
>>>>>>> origin/development
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
                    <p className="info-value">
                      {item.locationText || item.location}
                    </p>
                  </div>
                </div>

                <div className="info-item">
                  <span className="info-icon">📅</span>
                  <div>
                    <p className="info-label">Date Found</p>
                    <p className="info-value">
                      {item.dateFound ? format(new Date(item.dateFound), "MMMM dd, yyyy") : "-"}
                    </p>
                  </div>
                </div>

                <div className="info-item">
                  <span className="info-icon">⏰</span>
                  <div>
                    <p className="info-label">Posted On</p>
                    <p className="info-value">
<<<<<<< HEAD
                      {item.createdAt
                        ? format(new Date(item.createdAt), "MMMM dd, yyyy - hh:mm a")
                        : "-"}
=======
                      {format(
                        new Date(item.createdAt),
                        'MMMM dd, yyyy - hh:mm a'
                      )}
>>>>>>> origin/development
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
                    src={item.postedBy.avatar || "/default-avatar.png"}
                    alt={item.postedBy.name || "User"}
                    className="user-avatar-large"
                  />
                  <div>
                    <p className="user-name-large">{item.postedBy.name}</p>
                    <p className="user-email">{item.postedBy.email}</p>
<<<<<<< HEAD
                    <span className="badge badge-open">{item.postedBy.role}</span>
=======
                    <span className="badge badge-open">
                      {item.postedBy.role}
                    </span>
>>>>>>> origin/development
                  </div>
                </div>
              </div>
            )}

            {/* Claimed By */}
            {item.status === "Claimed" && item.claimedBy && (
              <div className="detail-section claimed-section">
                <h3 className="section-title">Claimed By</h3>
                <div className="user-info">
                  <img
                    src={item.claimedBy.avatar || "/default-avatar.png"}
                    alt={item.claimedBy.name || "User"}
                    className="user-avatar-large"
                  />
                  <div>
                    <p className="user-name-large">{item.claimedBy.name}</p>
                    <p className="user-email">{item.claimedBy.email}</p>
                  </div>
                </div>
              </div>
            )}

            {item.status === "Resolved" && (
              <div className="resolved-message">
                <span className="resolved-icon">✅</span>
                <p>This item has been successfully returned to its owner!</p>
              </div>
            )}
          </div>
        </div>

        {/* Comments */}
        <CommentsSection item={item} />
      </div>

      {/* Report Item Modal */}
      {isReportOpen && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Report this item</h3>
            <p className="py-2 text-sm text-gray-500">
              Briefly explain what’s wrong with this listing. Staff will review
              your report.
            </p>

            <textarea
              className="textarea textarea-bordered w-full mt-2"
              rows={4}
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="Reason for reporting..."
            />

            <div className="modal-action">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={closeReportModal}
                disabled={reportSubmitting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-error"
                onClick={handleSubmitReport}
                disabled={reportSubmitting}
              >
                {reportSubmitting ? 'Sending...' : 'Submit Report'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ItemDetail;