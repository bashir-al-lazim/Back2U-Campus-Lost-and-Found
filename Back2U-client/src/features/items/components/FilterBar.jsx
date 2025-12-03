// ========================
// FILTER BAR COMPONENT
// ========================
import React, { useState } from 'react';
import '../styles/FilterBar.css';

const FilterBar = ({ filters, onFilterChange }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const categories = [
    'All',
    'Electronics',
    'Books',
    'Clothing',
    'Accessories',
    'ID Cards',
    'Keys',
    'Bags',
    'Sports Equipment',
    'Others',
  ];

  const statuses = ['All', 'Open', 'Claimed', 'Resolved'];

  const handleInputChange = (field, value) => {
    onFilterChange({ [field]: value });
  };

  const handleReset = () => {
    onFilterChange({
      keyword: '',
      category: 'All',
      status: 'All',
      dateFrom: '',
      dateTo: '',
    });
  };

  return (
    <div className="filter-bar">
      <div className="filter-bar-main">
        {/* Search Input */}
        <div className="filter-search">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search by keyword..."
            value={filters.keyword}
            onChange={(e) => handleInputChange('keyword', e.target.value)}
          />
        </div>

        {/* Category Filter */}
        <div className="filter-select">
          <select
            value={filters.category}
            onChange={(e) => handleInputChange('category', e.target.value)}
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="filter-select">
          <select
            value={filters.status}
            onChange={(e) => handleInputChange('status', e.target.value)}
          >
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        {/* Toggle Advanced Filters */}
        <button
          className="btn btn-outline btn-sm"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? '🔼 Less' : '🔽 More Filters'}
        </button>
      </div>

      {/* Advanced Filters */}
      {isExpanded && (
        <div className="filter-bar-advanced">
          <div className="filter-date-range">
            <div className="filter-date">
              <label>From Date</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleInputChange('dateFrom', e.target.value)}
              />
            </div>
            <div className="filter-date">
              <label>To Date</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleInputChange('dateTo', e.target.value)}
              />
            </div>
          </div>

          <button className="btn btn-secondary btn-sm" onClick={handleReset}>
            🔄 Reset Filters
          </button>
        </div>
      )}
    </div>
  );
};

export default FilterBar;
