import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <span className="spinner" style={{ width: '32px', height: '32px' }}></span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return (
      <div className="container" style={{ margin: '4rem auto', maxWidth: '600px' }}>
        <div className="card" style={{ borderTop: '4px solid var(--accent-red)', textAlign: 'center' }}>
          <h2 style={{ color: 'var(--accent-red)', marginBottom: '0.75rem' }}>Access Denied (403)</h2>
          <p style={{ color: 'var(--slate-600)', marginBottom: '1.5rem' }}>
            Your account role <strong>({user?.role})</strong> is not authorized to access this administrative portal.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <Link to={user?.role === 'ADMIN' ? '/admin' : user?.role === 'WARDEN' ? '/warden' : '/student'} className="btn btn-primary">
              Return to Your Portal
            </Link>
            <Link to="/" className="btn btn-secondary">
              Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return children;
}
