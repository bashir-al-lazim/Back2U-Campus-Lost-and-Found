// ========================
// ITEM CARD COMPONENT
// ========================
import React from 'react';
import { format } from 'date-fns';
import './ItemCard.css';

const ItemCard = ({ item, onClick }) => {
  const formatDate = (date) => {
    return format(new Date(date), 'MMM dd, yyyy');
  };

  const getStatusClass = (status) => {
    return `badge badge-${status.toLowerCase()}`;
  };

  return (
    <div className="item-card" onClick={onClick}>
      {/* Image */}
      <div className="item-card-image">
        <img src={item.photo} alt={item.title} />
        <span className={getStatusClass(item.status)}>{item.status}</span>
      </div>

      {/* Content */}
      <div className="item-card-content">
        <div className="item-card-header">
          <h3 className="item-card-title">{item.title}</h3>
          <span className="item-card-category">{item.category}</span>
        </div>

        <p className="item-card-description">
          {item.description.length > 100
            ? `${item.description.substring(0, 100)}...`
            : item.description}
        </p>

        <div className="item-card-footer">
          <div className="item-card-location">
            <span className="icon">📍</span>
            <span>{item.location}</span>
          </div>
          <div className="item-card-date">
            <span className="icon">📅</span>
            <span>{formatDate(item.dateFound)}</span>
          </div>
        </div>

        {item.postedBy && (
          <div className="item-card-user">
            <img
              src={item.postedBy.avatar || '/default-avatar.png'}
              alt={item.postedBy.name}
              className="user-avatar"
            />
            <span className="user-name">{item.postedBy.name}</span>
            <span className="user-role badge badge-open">{item.postedBy.role}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ItemCard;
