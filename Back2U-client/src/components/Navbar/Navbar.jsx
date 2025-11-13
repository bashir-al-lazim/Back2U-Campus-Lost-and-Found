// ========================
// NAVBAR COMPONENT
// ========================
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="container navbar-container">
        <Link to="/" className="navbar-logo">
          <span className="logo-icon">🔍</span>
          <span className="logo-text">Back2U</span>
        </Link>

        <div className="navbar-menu">
          <Link to="/items" className="nav-link">
            Browse Items
          </Link>
          {/* Optional: Show login only if you need it later */}
          {/* {isAuthenticated ? (
            <>
              <div className="navbar-user">
                <img
                  src={user?.avatar || '/default-avatar.png'}
                  alt={user?.name}
                  className="user-avatar-nav"
                />
                <span className="user-name-nav">{user?.name}</span>
                <button className="btn btn-outline btn-sm" onClick={handleLogout}>
                  Logout
                </button>
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-outline btn-sm">
                Login
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                Sign Up
              </Link>
            </>
          )} */}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
