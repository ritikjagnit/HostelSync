import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();

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

  return (
    <header className="navbar-header" id="main-header">
      <div className="container navbar-container">
        <Link to="/" className="navbar-brand-link">
          <div className="navbar-brand">
            <div className="brand-logo-container">
              <svg className="brand-logo" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="48" height="48" rx="12" fill="#1E3A8A"/>
                <path d="M12 36V18L24 9L36 18V36H28V26H20V36H12Z" fill="#3B82F6"/>
                <circle cx="24" cy="20" r="3" fill="#FFFFFF"/>
                <path d="M30 32C33 32 35 30 35 27" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round"/>
                <path d="M18 16C15 16 13 18 13 21" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="brand-text">
              <span className="brand-title">HostelSync</span>
              <span className="brand-institute">Govt. Polytechnic Sakoli</span>
            </div>
          </div>
        </Link>

        <nav className="navbar-actions" aria-label="Main Navigation">
          <Link to="/" className="nav-link">
            Home
          </Link>

          {isAuthenticated ? (
            <div className="navbar-auth-group">
              <Link to={getPortalLink()} className="nav-link nav-portal-link">
                My Portal
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
              Sign In
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
