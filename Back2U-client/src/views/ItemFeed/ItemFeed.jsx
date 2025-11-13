// ========================
// ITEM FEED VIEW
// ========================
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import itemService from '../../services/itemService';
import ItemCard from '../../components/ItemCard/ItemCard';
import FilterBar from '../../components/FilterBar/FilterBar';
import Pagination from '../../components/Pagination/Pagination';
import './ItemFeed.css';

const ItemFeed = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
  });

  const [filters, setFilters] = useState({
    keyword: '',
    category: 'All',
    status: 'All',
    dateFrom: '',
    dateTo: '',
    page: 1,
    limit: 12,
  });

  // Fetch items when filters change
  useEffect(() => {
    fetchItems();
  }, [filters]);

  const fetchItems = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await itemService.getAllItems(filters);
      setItems(response.data);
      setPagination(response.pagination);
    } catch (err) {
      setError(err.message || 'Failed to load items');
      console.error('Error fetching items:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
      page: 1, // Reset to first page when filters change
    }));
  };

  const handlePageChange = (page) => {
    setFilters((prev) => ({ ...prev, page }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleItemClick = (itemId) => {
    navigate(`/items/${itemId}`);
  };

  return (
    <div className="item-feed">
      <div className="container">
        {/* Header */}
        <div className="feed-header">
          <h1>Lost & Found Items</h1>
          <p className="subtitle">Browse through items found on campus</p>
        </div>

        {/* Filter Bar */}
        <FilterBar filters={filters} onFilterChange={handleFilterChange} />

        {/* Results Count */}
        {!loading && (
          <div className="results-info">
            <p>
              Showing <strong>{items.length}</strong> of{' '}
              <strong>{pagination.totalItems}</strong> items
            </p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="loading">
            <div className="spinner"></div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="error-message">
            <p>⚠️ {error}</p>
            <button className="btn btn-primary btn-sm" onClick={fetchItems}>
              Try Again
            </button>
          </div>
        )}

        {/* Items Grid */}
        {!loading && !error && (
          <>
            {items.length > 0 ? (
              <div className="items-grid">
                {items.map((item) => (
                  <ItemCard
                    key={item._id}
                    item={item}
                    onClick={() => handleItemClick(item._id)}
                  />
                ))}
              </div>
            ) : (
              <div className="no-results">
                <div className="no-results-icon">🔍</div>
                <h3>No items found</h3>
                <p>Try adjusting your filters to find what you're looking for</p>
              </div>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <Pagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                onPageChange={handlePageChange}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ItemFeed;
