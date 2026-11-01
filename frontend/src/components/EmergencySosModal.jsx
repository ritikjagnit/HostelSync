import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './EmergencySosModal.css';

const EMERGENCY_CONTACTS = [
  { name: 'Sub-District Hospital Sakoli', role: 'Medical Emergency / Ambulance', phone: '07186-295112', icon: '🏥' },
  { name: 'National Emergency Ambulance', role: 'Toll-Free 24x7', phone: '108', icon: '🚑' },
  { name: 'Sakoli Police Station', role: 'Law & Order / Security', phone: '07186-236133', alt: '112', icon: '🚓' },
  { name: 'Chief Hostel Warden', role: 'Campus Hostel Superintendent', phone: '9876543210', icon: '👨‍🏫' },
  { name: 'Rector / Principal Office', role: 'Govt. Polytechnic Sakoli', phone: '07186-295112', icon: '🏛️' },
  { name: 'Girls Hostel Matron / Warden', role: 'Kaveri Girls Hostel Cell', phone: '9876543211', icon: '👩‍🏫' }
];

export default function EmergencySosModal({ isOpen, onClose }) {
  const { authFetch, user } = useAuth();

  const [alertType, setAlertType] = useState('MEDICAL_EMERGENCY');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleTriggerSos = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await authFetch('/api/student/sos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alertType,
          description: description.trim() || 'Urgent SOS panic triggered by student resident.'
        })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to dispatch SOS alert');
      }

      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sos-modal-backdrop" onClick={onClose}>
      <div className="sos-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="sos-modal-header">
          <div className="sos-header-badge">
            <span className="sos-pulse-ring"></span>
            <span>🚨 24x7 EMERGENCY HOSTEL RESCUE DISPATCH</span>
          </div>
          <button className="sos-close-btn" onClick={onClose} aria-label="Close">&times;</button>
        </div>

        <div className="sos-modal-body">
          {success ? (
            <div className="sos-success-state">
              <div className="sos-siren-animation">🚨</div>
              <h2 className="sos-success-title">SOS EMERGENCY ALARM DISPATCHED!</h2>
              <p className="sos-success-desc">
                High-priority siren alert broadcasted to <strong>Chief Warden, Hostel Superintendents &amp; Campus Security</strong>.
                Hostel staff has been routed to your room immediately.
              </p>

              <div className="sos-immediate-action-box">
                <h4>Stay Calm &bull; Help is on the way</h4>
                <p>If you or someone requires immediate ambulance/police escort, tap direct helpline below:</p>
                <div className="sos-call-buttons">
                  <a href="tel:108" className="btn-call-emergency btn-ambulance">
                    🚑 Call Ambulance 108
                  </a>
                  <a href="tel:07186295112" className="btn-call-emergency btn-hospital">
                    🏥 Sakoli Hospital: 07186-295112
                  </a>
                  <a href="tel:112" className="btn-call-emergency btn-police">
                    🚓 Call Police 112
                  </a>
                </div>
              </div>

              <button className="btn-sos-dismiss" onClick={onClose}>
                Return to Portal
              </button>
            </div>
          ) : (
            <>
              <div className="sos-intro-banner">
                <div className="sos-intro-icon">⚠️</div>
                <div>
                  <h3 className="sos-intro-title">Instant Emergency Alarm Trigger</h3>
                  <p className="sos-intro-sub">
                    Direct siren dispatch to Warden's phone, desk dashboard &amp; security gate. For medical distress, ragging, fire, or acute safety threats.
                  </p>
                </div>
              </div>

              {error && (
                <div className="sos-alert-error">
                  <span>⚠️</span> {error}
                </div>
              )}

              <form onSubmit={handleTriggerSos} className="sos-form">
                <label className="sos-form-label">Nature of Emergency (आणीबाणीचे स्वरूप) *</label>
                <div className="sos-type-grid">
                  <button
                    type="button"
                    className={`sos-type-chip ${alertType === 'MEDICAL_EMERGENCY' ? 'active' : ''}`}
                    onClick={() => setAlertType('MEDICAL_EMERGENCY')}
                  >
                    <span className="type-icon">🚑</span>
                    <span className="type-text">Medical Emergency</span>
                    <span className="type-sub">तीव्र आजारपण / अपघात</span>
                  </button>

                  <button
                    type="button"
                    className={`sos-type-chip ${alertType === 'RAGGING_HARASSMENT' ? 'active' : ''}`}
                    onClick={() => setAlertType('RAGGING_HARASSMENT')}
                  >
                    <span className="type-icon">🛡️</span>
                    <span className="type-text">Ragging / Harassment</span>
                    <span className="type-sub">रॅगिंग / गैरवर्तन छळ</span>
                  </button>

                  <button
                    type="button"
                    className={`sos-type-chip ${alertType === 'FIRE_HAZARD' ? 'active' : ''}`}
                    onClick={() => setAlertType('FIRE_HAZARD')}
                  >
                    <span className="type-icon">🔥</span>
                    <span className="type-text">Fire / Electrical Hazard</span>
                    <span className="type-sub">आग / शॉर्ट सर्किट धोका</span>
                  </button>

                  <button
                    type="button"
                    className={`sos-type-chip ${alertType === 'SECURITY_THREAT' ? 'active' : ''}`}
                    onClick={() => setAlertType('SECURITY_THREAT')}
                  >
                    <span className="type-icon">🚨</span>
                    <span className="type-text">Security Threat</span>
                    <span className="type-sub">अनाधिकृत व्यक्ती / धोका</span>
                  </button>
                </div>

                <div className="sos-form-group">
                  <label className="sos-form-label">Location / Condition Details (optional but recommended)</label>
                  <textarea
                    rows="2"
                    className="sos-textarea"
                    placeholder="e.g. Room 102 Sahyadri Boys Hostel - Student having acute chest pain/fainting..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    maxLength={1000}
                  ></textarea>
                </div>

                <div className="sos-resident-tag">
                  <span>Reporting as: <strong>{user?.fullName || 'Resident Student'}</strong></span>
                  <span>Hostel: <strong>Sahyadri / Kaveri Block</strong></span>
                </div>

                <div className="sos-actions">
                  <button
                    type="submit"
                    className="btn-trigger-panic"
                    disabled={loading}
                  >
                    {loading ? 'BROADCASTING ALARM...' : '🚨 TRIGGER IMMEDIATE SOS PANIC ALARM'}
                  </button>
                </div>
              </form>

              {/* Sakoli Emergency Directory */}
              <div className="sos-directory-section">
                <h4 className="directory-title">📞 Government Polytechnic Sakoli &bull; Emergency Direct Lines</h4>
                <div className="directory-grid">
                  {EMERGENCY_CONTACTS.map((c, i) => (
                    <div key={i} className="directory-item">
                      <span className="dir-icon">{c.icon}</span>
                      <div className="dir-info">
                        <span className="dir-name">{c.name}</span>
                        <span className="dir-role">{c.role}</span>
                      </div>
                      <a href={`tel:${c.phone}`} className="dir-call-btn">
                        📞 {c.phone}
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

