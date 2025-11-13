// ========================
// HOME PAGE VIEW
// ========================
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Home.css';

const Home = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="home">
      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <h1 className="hero-title">
              Lost Something?
              <br />
              <span className="gradient-text">We'll Help You Find It!</span>
            </h1>
            <p className="hero-subtitle">
              Back2U is your campus lost and found solution. Browse found items, report
              lost belongings, and reunite with your valuables.
            </p>
            <div className="hero-actions">
              {isAuthenticated ? (
                <Link to="/items" className="btn btn-primary btn-lg">
                  🔍 Browse Items
                </Link>
              ) : (
                <>
                  <Link to="/register" className="btn btn-primary btn-lg">
                    Get Started
                  </Link>
                  <Link to="/login" className="btn btn-outline btn-lg">
                    Sign In
                  </Link>
                </>
              )}
            </div>
          </div>

          <div className="hero-image">
            <div className="floating-card card-1">📱</div>
            <div className="floating-card card-2">🎒</div>
            <div className="floating-card card-3">🔑</div>
            <div className="floating-card card-4">📚</div>
            <div className="hero-circle"></div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="container">
          <h2 className="section-title">How It Works</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🔍</div>
              <h3>Browse Items</h3>
              <p>
                Search through found items with powerful filters by category, date, and
                location.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🏷️</div>
              <h3>Claim Items</h3>
              <p>
                Found your item? Submit a claim with proof and staff will verify your
                ownership.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📝</div>
              <h3>Report Lost Items</h3>
              <p>
                Can't find what you're looking for? File a lost report and get notified
                when it's found.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">✅</div>
              <h3>Quick Returns</h3>
              <p>
                Once verified, coordinate with staff to retrieve your item safely and
                securely.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats">
        <div className="container">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-number">500+</div>
              <div className="stat-label">Items Found</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">350+</div>
              <div className="stat-label">Items Returned</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">1000+</div>
              <div className="stat-label">Happy Students</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">95%</div>
              <div className="stat-label">Success Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <div className="container">
          <div className="cta-content">
            <h2>Ready to Find Your Lost Items?</h2>
            <p>Join our community and never lose track of your belongings again.</p>
            {!isAuthenticated && (
              <Link to="/register" className="btn btn-primary btn-lg">
                Create Account
              </Link>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
