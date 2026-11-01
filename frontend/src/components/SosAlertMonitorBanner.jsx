import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import './SosAlertMonitorBanner.css';

export default function SosAlertMonitorBanner({ role = 'WARDEN' }) {
  const { authFetch } = useAuth();

  const [activeAlerts, setActiveAlerts] = useState([]);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [actionStatus, setActionStatus] = useState('ACKNOWLEDGED');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchActiveSos = useCallback(async () => {
    try {
      const res = await authFetch('/api/warden/sos');
      if (res.ok) {
        const data = await res.json();
        setActiveAlerts(Array.isArray(data) ? data : []);
      }
    } catch {
      // Silently ignore network poll blips
    }
  }, [authFetch]);

  useEffect(() => {
    fetchActiveSos();
    const interval = setInterval(fetchActiveSos, 15000);
    return () => clearInterval(interval);
  }, [fetchActiveSos]);

  const handleResolveSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAlert) return;

    setSaving(true);
    setError('');
    try {
      const res = await authFetch(`/api/warden/sos/${selectedAlert.id}/resolve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: actionStatus,
          resolutionNotes: resolutionNotes.trim() || (actionStatus === 'ACKNOWLEDGED' ? 'Wardens dispatched to room.' : 'Incident resolved.')
        })
      });

      if (!res.ok) {
        throw new Error('Failed to update SOS alert status');
      }

      setSelectedAlert(null);
      setResolutionNotes('');
      fetchActiveSos();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (activeAlerts.length === 0) return null;

  const primaryAlert = activeAlerts[0];

  return (
    <>
      {/* Flashing Top Siren Banner */}
      <div className="sos-siren-banner">
        <div className="siren-banner-left">
          <span className="siren-pulsing-badge">🚨 CRITICAL SOS ALERT ({activeAlerts.length})</span>
          <div className="siren-banner-text">
            <strong>Room {primaryAlert.roomNumber || 'N/A'}</strong> ({primaryAlert.hostelName}) &bull;{' '}
            <span>{primaryAlert.studentName} ({primaryAlert.enrollmentNumber})</span> &bull;{' '}
            <span className="alert-type-tag">{primaryAlert.alertType.replace('_', ' ')}</span>: {primaryAlert.description}
          </div>
        </div>

        <div className="siren-banner-actions">
          <button
            type="button"
            className="btn-respond-sos"
            onClick={() => {
              setSelectedAlert(primaryAlert);
              setActionStatus(primaryAlert.status === 'ACTIVE' ? 'ACKNOWLEDGED' : 'RESOLVED');
            }}
          >
            ⚡ Attend &bull; Take Action
          </button>
        </div>
      </div>

      {/* SOS Action & Resolution Modal */}
      {selectedAlert && (
        <div className="sos-action-backdrop" onClick={() => setSelectedAlert(null)}>
          <div className="sos-action-card" onClick={(e) => e.stopPropagation()}>
            <div className="action-modal-header">
              <div className="action-title-group">
                <span className="action-badge">🚨 EMERGENCY RESPONSE DISPATCH</span>
                <h3 className="action-student-name">
                  {selectedAlert.studentName} &bull; Room {selectedAlert.roomNumber}
                </h3>
                <span className="action-hostel">{selectedAlert.hostelName} &bull; {selectedAlert.enrollmentNumber}</span>
              </div>
              <button className="action-close-btn" onClick={() => setSelectedAlert(null)}>&times;</button>
            </div>

            <form onSubmit={handleResolveSubmit} className="action-modal-body">
              {error && <div className="action-error">⚠️ {error}</div>}

              {/* Direct Calling Strip */}
              <div className="quick-call-strip">
                <span className="call-strip-lbl">Immediate Resident Contact:</span>
                <a href={`tel:${selectedAlert.studentPhone}`} className="btn-call-student">
                  📞 Call Student: <strong>{selectedAlert.studentPhone || 'N/A'}</strong>
                </a>
              </div>

              <div className="alert-details-box">
                <div className="detail-row">
                  <span className="lbl">Emergency Nature:</span>
                  <span className="val font-bold text-red">{selectedAlert.alertType}</span>
                </div>
                <div className="detail-row">
                  <span className="lbl">Current Status:</span>
                  <span className="val badge-pill">{selectedAlert.status}</span>
                </div>
                <div className="detail-row">
                  <span className="lbl">Reported Situation:</span>
                  <span className="val">{selectedAlert.description || 'Emergency SOS triggered from resident portal'}</span>
                </div>
                <div className="detail-row">
                  <span className="lbl">Trigger Time:</span>
                  <span className="val">{new Date(selectedAlert.triggeredAt).toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="action-form-section">
                <label className="form-lbl">Update Action / Operational Status *</label>
                <div className="status-selector-row">
                  <label className={`radio-pill ${actionStatus === 'ACKNOWLEDGED' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="sosStatus"
                      value="ACKNOWLEDGED"
                      checked={actionStatus === 'ACKNOWLEDGED'}
                      onChange={() => setActionStatus('ACKNOWLEDGED')}
                    />
                    <span>🏃 Acknowledged (Warden Dispatched)</span>
                  </label>

                  <label className={`radio-pill ${actionStatus === 'RESOLVED' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="sosStatus"
                      value="RESOLVED"
                      checked={actionStatus === 'RESOLVED'}
                      onChange={() => setActionStatus('RESOLVED')}
                    />
                    <span>✅ Emergency Resolved &amp; Safe</span>
                  </label>
                </div>

                <div className="action-notes-group">
                  <label className="form-lbl">Warden / Superintendent Action Log Notes</label>
                  <textarea
                    rows="2"
                    className="action-notes-input"
                    placeholder="e.g. Attended room at 10:15 PM, provided oral rehydration, ambulance arrived..."
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                  ></textarea>
                </div>
              </div>

              <div className="action-modal-footer">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setSelectedAlert(null)}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-confirm-action"
                  disabled={saving}
                >
                  {saving ? 'Updating...' : 'Save & Update Emergency Status'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

