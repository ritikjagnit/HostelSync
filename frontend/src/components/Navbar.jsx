import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();

  const getPortalLink = () => {
    if (!user) return '/';
    switch (user.role) {
      case 'ADMIN':
        return '/admin';
      case 'WARDEN':
        return '/warden';
      case 'STUDENT':
      default:
        return '/student';
    }
  };

  const isHome = location.pathname === '/';

  return (
    <header className="navbar-header" id="main-header">
      {/* Official Government of Maharashtra Top Bar */}
      <div className="gov-official-top-bar">
        <div className="container gov-official-container">
          <div className="gov-official-left">
            <span className="gov-tricolor-strip" aria-hidden="true"></span>
            <span className="gov-dept-name">महाराष्ट्र शासन &bull; Government of Maharashtra</span>
            <span className="gov-bar-divider">|</span>
            <span className="gov-code-tag">DTE Institute Code: <strong>04008</strong></span>
          </div>
          <div className="gov-official-right">
            <span>Sendurwafa, Sakoli, Dist. Bhandara - 441802</span>
            <span className="gov-bar-divider">|</span>
            <span>Helpline: <strong>07186-295112</strong></span>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="container navbar-container">
        <Link to="/" className="navbar-brand-link">
          <div className="navbar-brand">
            <div className="brand-logo-container">
              <svg className="brand-logo" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="48" height="48" rx="12" fill="#0b192c"/>
                <path d="M12 36V18L24 9L36 18V36H28V26H20V36H12Z" fill="#0284c7"/>
                <circle cx="24" cy="20" r="3" fill="#FFFFFF"/>
                <path d="M30 32C33 32 35 30 35 27" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round"/>
                <path d="M18 16C15 16 13 18 13 21" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="brand-text">
              <span className="brand-title">HostelSync</span>
              <span className="brand-institute">Govt. Polytechnic Sakoli &bull; Residential System</span>
            </div>
          </div>
        </Link>

        <nav className="navbar-actions" aria-label="Main Navigation">
          <Link to="/" className={`nav-link ${isHome ? 'active' : ''}`}>
            Home
          </Link>

          {isHome && (
            <>
              <a href="#hostel-admissions" className="nav-link nav-link-sec">
                Admissions
              </a>
              <a href="#hostel-facilities" className="nav-link nav-link-sec">
                Facilities
              </a>
              <a href="#hostel-rules" className="nav-link nav-link-sec">
                Rules &amp; Timings
              </a>
              <a href="#hostel-administration" className="nav-link nav-link-sec">
                Administration
              </a>
            </>
          )}

          {isAuthenticated ? (
            <div className="navbar-auth-group">
              <Link to={getPortalLink()} className="nav-link nav-portal-link">
                My Portal &rarr;
              </Link>
              <div className="navbar-user-chip">
                <span className="user-name">{user?.fullName?.split(' ')[0]}</span>
                <span className="badge badge-primary user-role-badge">{user?.role}</span>
              </div>
              <button
                id="btn-navbar-logout"
                onClick={logout}
                className="btn btn-secondary btn-sm"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <Link to="/login" id="btn-navbar-login" className="btn btn-primary btn-sm">
              Sign In to Portal
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
