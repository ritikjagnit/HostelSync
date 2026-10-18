import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './PortalCommon.css';

export default function WardenPortal() {
  const { user, logout, authFetch } = useAuth();
  const [apiResponse, setApiResponse] = useState(null);
  const [loadingCheck, setLoadingCheck] = useState(true);

  useEffect(() => {
    let isMounted = true;
    authFetch('/api/warden/overview')
      .then((res) => res.json())
      .then((data) => {
        if (isMounted) setApiResponse(data);
      })
      .catch((err) => {
        if (isMounted) setApiResponse({ error: err.message });
      })
      .finally(() => {
        if (isMounted) setLoadingCheck(false);
      });

    return () => {
      isMounted = false;
    };
  }, [authFetch]);

  return (
    <div className="portal-wrapper">
      <div className="container">
        <div className="card portal-header-card">
          <div>
            <span className="badge badge-primary" style={{ marginBottom: '0.5rem' }}>
              Hostel Operations
            </span>
            <h1 className="portal-title">Warden Operations Portal</h1>
            <p className="portal-subtitle">
              Government Polytechnic Sakoli &bull; Hostel Superintendents & Wardens
            </p>
          </div>

          <button id="btn-warden-logout" onClick={logout} className="btn btn-secondary">
            Sign Out
          </button>
        </div>

        <div className="portal-grid">
          <div className="card">
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--primary-900)' }}>
              Verified Warden Identity
            </h2>
            <div className="portal-info-item">
              <span className="info-label">Full Name:</span>
              <span className="info-value">{user?.fullName}</span>
            </div>
            <div className="portal-info-item">
              <span className="info-label">Email:</span>
              <span className="info-value">{user?.email}</span>
            </div>
            <div className="portal-info-item">
              <span className="info-label">Role Authority:</span>
              <span className="info-value">
                <span className="badge badge-primary">{user?.role}</span>
              </span>
            </div>
            <div className="portal-info-item">
              <span className="info-label">Account Status:</span>
              <span className="info-value">
                <span className="badge badge-success">ACTIVE</span>
              </span>
            </div>
          </div>

          <div className="card">
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--primary-900)' }}>
              Backend RBAC Verification
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--slate-600)', marginBottom: '0.75rem' }}>
              Real-time verification of role authorization against protected endpoint <code>GET /api/warden/overview</code>:
            </p>
            {loadingCheck ? (
              <span className="spinner"></span>
            ) : (
              <pre className="api-verify-box">{JSON.stringify(apiResponse, null, 2)}</pre>
            )}
          </div>
        </div>

        <div className="card" style={{ borderLeft: '4px solid var(--accent-gold)' }}>
          <h2 style={{ fontSize: '1.125rem', color: 'var(--slate-800)', marginBottom: '0.5rem' }}>
            Phase 2C Operational Status
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--slate-600)', lineHeight: '1.6' }}>
            Warden credentials authenticated successfully. Daily bed inspection, gate pass reviews, and grievance management workflows will be activated in upcoming development phases.
          </p>
        </div>
      </div>
    </div>
  );
}
