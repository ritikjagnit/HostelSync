import React, { useState, useEffect, useCallback } from 'react';
import { getApiUrl } from '../config/api';
import './HostelRegistrationModal.css';

export default function AdmissionStatusModal({ isOpen, onClose, initialQuery = '' }) {
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [statusResult, setStatusResult] = useState(null);

  const fetchStatus = useCallback(async (query) => {
    if (!query || !query.trim()) {
      setError('Please enter your Application Reference Number or Enrollment Number.');
      return;
    }

    setLoading(true);
    setError('');
    setStatusResult(null);

    try {
      const res = await fetch(getApiUrl(`/api/admissions/status/${encodeURIComponent(query.trim())}`));
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'No application record found for this reference.');
      }

      setStatusResult(data);
    } catch (err) {
      setError(err.message || 'Unable to fetch status. Please verify your application number.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!initialQuery || !initialQuery.trim()) return;

    let isMounted = true;
    const clean = initialQuery.trim();

    fetch(getApiUrl(`/api/admissions/status/${encodeURIComponent(clean)}`))
      .then((res) => {
        if (!res.ok) throw new Error('No application record found for this reference.');
        return res.json();
      })
      .then((data) => {
        if (isMounted) setStatusResult(data);
      })
      .catch((err) => {
        if (isMounted) setError(err.message || 'Unable to fetch status.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [initialQuery]);

  if (!isOpen) return null;

  const handleSearch = (e) => {
    e.preventDefault();
    fetchStatus(searchQuery);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'SELECTED':
        return <span className="adm-status-badge selected">&#10003; SHORTLISTED FOR ADMISSION</span>;
      case 'ADMITTED':
        return <span className="adm-status-badge admitted">&#127881; ADMITTED & ROOM ALLOCATED</span>;
      case 'REJECTED':
        return <span className="adm-status-badge rejected">&#10007; NOT SHORTLISTED</span>;
      case 'PENDING':
      default:
        return <span className="adm-status-badge pending">&#9203; UNDER IN-CHARGE SCRUTINY</span>;
    }
  };

  return (
    <div className="adm-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="adm-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="adm-modal-header">
          <div className="adm-header-badge">
            <span className="adm-flag-strip"></span>
            <span className="adm-gov-label">GOVERNMENT POLYTECHNIC SAKOLI</span>
          </div>
          <button className="adm-close-btn" onClick={onClose} aria-label="Close modal">
            &times;
          </button>
          <h2 className="adm-title">Track Hostel Admission Status</h2>
          <p className="adm-subtitle">Real-time scrutiny, merit selection, and room allotment status</p>
        </div>

        <div className="adm-modal-body">
          {/* Search Form */}
          <form onSubmit={handleSearch} className="adm-track-search-form">
            <div className="adm-track-input-group">
              <label htmlFor="track-query">Application Reference Number or Enrollment Number</label>
              <div className="adm-track-input-wrap">
                <input
                  type="text"
                  id="track-query"
                  placeholder="e.g. HSA-2026-1021 or EN24109821"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setError('');
                  }}
                  required
                />
                <button type="submit" className="adm-btn adm-btn-primary" disabled={loading}>
                  {loading ? <span className="adm-spinner"></span> : '&#128269; Check Status'}
                </button>
              </div>
            </div>
          </form>

          {error && (
            <div className="adm-alert-error" role="alert" style={{ marginTop: '1rem' }}>
              <strong>Not Found:</strong> {error}
            </div>
          )}

          {/* Result Card */}
          {statusResult && (
            <div className="adm-track-result-box" style={{ marginTop: '1.25rem' }}>
              <div className="adm-track-header">
                <div>
                  <span className="adm-label">APPLICATION NUMBER</span>
                  <div className="adm-app-number">{statusResult.applicationNumber}</div>
                </div>
                <div>{getStatusBadge(statusResult.status)}</div>
              </div>

              <div className="adm-receipt-grid" style={{ marginTop: '1rem' }}>
                <div className="adm-receipt-item">
                  <span className="adm-label">Candidate Name:</span>
                  <span className="adm-val">{statusResult.fullName}</span>
                </div>
                <div className="adm-receipt-item">
                  <span className="adm-label">Enrollment Number:</span>
                  <span className="adm-val">{statusResult.enrollmentNumber}</span>
                </div>
                <div className="adm-receipt-item">
                  <span className="adm-label">Course / Branch:</span>
                  <span className="adm-val">{statusResult.course}</span>
                </div>
                <div className="adm-receipt-item">
                  <span className="adm-label">Hostel Category:</span>
                  <span className="adm-val">
                    {statusResult.gender === 'MALE' ? 'Sahyadri Boys Hostel' : 'Jijau Girls Hostel'} ({statusResult.category})
                  </span>
                </div>
                <div className="adm-receipt-item">
                  <span className="adm-label">Merit Marks:</span>
                  <span className="adm-val">{statusResult.meritPercentage}%</span>
                </div>
                <div className="adm-receipt-item">
                  <span className="adm-label">Application Date:</span>
                  <span className="adm-val">
                    {statusResult.appliedAt ? new Date(statusResult.appliedAt).toLocaleDateString('en-IN') : 'N/A'}
                  </span>
                </div>
              </div>

              {/* Status Specific Advice Box */}
              {statusResult.status === 'ADMITTED' && (
                <div className="adm-admitted-box">
                  <h4>&#127881; Congratulations! You have been officially admitted.</h4>
                  <div className="adm-allotment-details">
                    <p><strong>Allocated Hostel:</strong> {statusResult.allocatedHostelName || 'Hostel Block'}</p>
                    <p><strong>Allocated Room:</strong> Room {statusResult.allocatedRoomNumber || 'Assigned'}</p>
                  </div>
                  <p className="adm-note">
                    Your student portal account has been activated. You can now login at the Student Portal using your registered email and default password.
                  </p>
                </div>
              )}

              {statusResult.status === 'SELECTED' && (
                <div className="adm-selected-box">
                  <h4>&#10003; You have been Shortlisted in the Merit List!</h4>
                  <p>
                    The Hostel In-Charge is currently assigning vacant rooms in {statusResult.gender === 'MALE' ? 'Sahyadri Boys Hostel' : 'Jijau Girls Hostel'}. Please report to the Rector Office (Dr. K. N. Potode) with original documents for final room key handover.
                  </p>
                </div>
              )}

              {statusResult.status === 'PENDING' && (
                <div className="adm-pending-box">
                  <h4>&#9203; Application Scrutiny Underway</h4>
                  <p>
                    Your application is being verified against GP Sakoli merit and distance eligibility criteria. Merit lists are published regularly.
                  </p>
                </div>
              )}

              {statusResult.status === 'REJECTED' && (
                <div className="adm-rejected-box">
                  <h4>Application Not Selected</h4>
                  <p><strong>Reason:</strong> {statusResult.rejectionReason || 'Did not meet merit cutoff or capacity exceeded.'}</p>
                </div>
              )}
            </div>
          )}

          <div className="adm-form-footer">
            <button type="button" className="adm-btn adm-btn-secondary" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
