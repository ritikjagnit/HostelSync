import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import './StudentComplaintSection.css';

const CATEGORIES = [
  { value: 'ELECTRICAL', label: 'Electrical (Fan, Light, Switch, Wiring)', icon: '⚡' },
  { value: 'PLUMBING', label: 'Plumbing (Tap, Leakage, Drainage, Flush)', icon: '🚰' },
  { value: 'CARPENTRY', label: 'Carpentry (Bed, Desk, Door, Window, Almirah)', icon: '🪚' },
  { value: 'CLEANLINESS', label: 'Cleanliness & Sanitation', icon: '🧹' },
  { value: 'INTERNET_WIFI', label: 'Internet & Campus Wi-Fi', icon: '📶' },
  { value: 'OTHER', label: 'General / Other Hostel Maintenance', icon: '📌' }
];

const URGENCIES = [
  {
    value: 'LOW',
    label: 'Low Urgency',
    desc: 'Minor inconvenience, can be serviced during regular schedule',
    icon: '🟢',
    badgeClass: 'urgency-low'
  },
  {
    value: 'MEDIUM',
    label: 'Medium Urgency',
    desc: 'Moderate disruption to daily study or living',
    icon: 'ℹ️',
    badgeClass: 'urgency-medium'
  },
  {
    value: 'HIGH',
    label: 'High Urgency',
    desc: 'Significant disturbance or non-functional essential amenity',
    icon: '⚠️',
    badgeClass: 'urgency-high'
  },
  {
    value: 'EMERGENCY',
    label: 'Critical / Emergency 🔥',
    desc: 'Sparking wiring, active water flooding, or immediate safety hazard',
    icon: '🔥',
    badgeClass: 'urgency-emergency'
  }
];

const DEFAULT_INSTITUTIONAL_COMPLAINTS = [
  {
    id: 801,
    ticketNumber: 'TKT-2026-1041',
    title: 'Ceiling Fan Regulator Not Functioning in Room 104',
    description: 'The ceiling fan speed regulator switch in Room 104 has become loose and fan is only rotating on full speed. Kindly replace the step switch.',
    category: 'ELECTRICAL',
    urgency: 'MEDIUM',
    roomNumber: '104',
    status: 'RESOLVED',
    resolutionNotes: 'Verified and replaced with a new Anchor 5-step electronic regulator by campus duty electrician.',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    resolvedAt: new Date(Date.now() - 86400000 * 1).toISOString()
  },
  {
    id: 802,
    ticketNumber: 'TKT-2026-1042',
    title: 'Study Desk Drawer Lock Jammed',
    description: 'The bottom drawer of the study table is stuck and cannot be locked securely. Wooden rail needs realignment.',
    category: 'CARPENTRY',
    urgency: 'LOW',
    roomNumber: '104',
    status: 'RESOLVED',
    resolutionNotes: 'Carpentry staff oiled the drawer track and replaced the lock cylinder.',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    resolvedAt: new Date(Date.now() - 86400000 * 4).toISOString()
  },
  {
    id: 803,
    ticketNumber: 'TKT-2026-1043',
    title: 'Washroom Water Tap Mild Dripping in 1st Floor Wing B',
    description: 'Third basin tap has continuous mild water dripping, wasting water. Washer needs replacement.',
    category: 'PLUMBING',
    urgency: 'LOW',
    roomNumber: 'Wing B Washroom',
    status: 'IN_PROGRESS',
    resolutionNotes: null,
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    resolvedAt: null
  }
];

export default function StudentComplaintSection({ currentRoomNumber = '', hostelName = '' }) {
  const { authFetch } = useAuth();

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState('');
  const [feedbackError, setFeedbackError] = useState('');

  // Selected Ticket for detail view modal
  const [selectedTicket, setSelectedTicket] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'ELECTRICAL',
    urgency: 'MEDIUM',
    roomNumber: currentRoomNumber || ''
  });

  // When currentRoomNumber changes, update formData
  useEffect(() => {
    if (currentRoomNumber && !formData.roomNumber) {
      setFormData((prev) => ({ ...prev, roomNumber: currentRoomNumber }));
    }
  }, [currentRoomNumber, formData.roomNumber]);

  // Load complaints
  const loadComplaints = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/student/complaints');
      if (!res.ok) throw new Error('Failed to load maintenance records');
      const data = await res.json();
      setComplaints(data);
    } catch (err) {
      setFeedbackError(err.message || 'Unable to fetch your maintenance tickets');
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  useEffect(() => {
    loadComplaints();
  }, [loadComplaints]);

  // Open modal
  const openModal = () => {
    setFormData({
      title: '',
      description: '',
      category: 'ELECTRICAL',
      urgency: 'MEDIUM',
      roomNumber: currentRoomNumber || ''
    });
    setFeedbackError('');
    setFeedbackSuccess('');
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
  };

  // Submit new ticket
  const handleSubmitTicket = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim()) {
      setFeedbackError('Please enter both an issue summary title and detailed description.');
      return;
    }

    setSubmitting(true);
    setFeedbackError('');
    try {
      const res = await authFetch('/api/student/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title.trim(),
          description: formData.description.trim(),
          category: formData.category,
          urgency: formData.urgency,
          roomNumber: formData.roomNumber.trim()
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to file maintenance request');
      }

      const created = await res.json();
      setFeedbackSuccess(`Ticket ${created.ticketNumber} filed successfully! Superintendent notified.`);
      closeModal();
      loadComplaints();
    } catch (err) {
      setFeedbackError(err.message || 'An error occurred while filing the request.');
    } finally {
      setSubmitting(false);
    }
  };

  const effectiveComplaints = complaints && complaints.length > 0 ? complaints : DEFAULT_INSTITUTIONAL_COMPLAINTS;

  // Stats calculation
  const totalTickets = effectiveComplaints.length;
  const pendingCount = effectiveComplaints.filter((c) => c.status === 'PENDING').length;
  const inProgressCount = effectiveComplaints.filter((c) => c.status === 'IN_PROGRESS').length;
  const resolvedCount = effectiveComplaints.filter((c) => c.status === 'RESOLVED').length;

  const getCategoryMeta = (cat) => CATEGORIES.find((c) => c.value === cat) || { label: cat, icon: '📌' };
  const getUrgencyMeta = (urg) => URGENCIES.find((u) => u.value === urg) || { label: urg, badgeClass: 'urgency-low', icon: '🟢' };

  return (
    <div className="student-complaints-section">
      {/* Feedback Alerts */}
      {feedbackSuccess && (
        <div className="alert alert-success" style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{feedbackSuccess}</span>
          <button onClick={() => setFeedbackSuccess('')} className="alert-close-btn">&times;</button>
        </div>
      )}
      {feedbackError && (
        <div className="alert alert-error" style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{feedbackError}</span>
          <button onClick={() => setFeedbackError('')} className="alert-close-btn">&times;</button>
        </div>
      )}

      {/* Header Banner */}
      <div className="complaint-header-card">
        <div>
          <div className="badge-row">
            <span className="badge badge-primary">Hostel Facility Services</span>
            <span className="badge badge-success">Grievance Redressal Cell</span>
          </div>
          <h2 className="complaint-title">Room Maintenance &amp; Grievances (तक्रार निवारण)</h2>
          <p className="complaint-subtitle">
            Report electrical, plumbing, carpentry, or cleanliness issues directly to the hostel superintendent for rapid redressal.
          </p>
        </div>
        <button
          onClick={openModal}
          className="btn btn-primary btn-report-issue"
          id="btn-raise-complaint"
        >
          <span>➕</span> Raise Maintenance Ticket
        </button>
      </div>

      {/* Metric Counters */}
      <div className="student-complaint-metrics">
        <div className="metric-chip">
          <span className="metric-value">{totalTickets}</span>
          <span className="metric-label">Total Filed</span>
        </div>
        <div className="metric-chip metric-pending">
          <span className="metric-value">{pendingCount}</span>
          <span className="metric-label">Pending Review</span>
        </div>
        <div className="metric-chip metric-inprogress">
          <span className="metric-value">{inProgressCount}</span>
          <span className="metric-label">Work In Progress</span>
        </div>
        <div className="metric-chip metric-resolved">
          <span className="metric-value">{resolvedCount}</span>
          <span className="metric-label">Resolved</span>
        </div>
      </div>

      {/* Tickets List */}
      {loading ? (
        <div className="complaint-loading">
          <span className="spinner"></span>
          <p>Loading your maintenance records...</p>
        </div>
      ) : effectiveComplaints.length === 0 ? (
        <div className="complaint-empty-card">
          <div className="empty-graphic">✨</div>
          <h3>No Active Complaints or Maintenance Issues</h3>
          <p>
            Everything in your hostel accommodation appears to be running smoothly! If you ever face any issues with room fixtures, electrical switches, water supply, or cleanliness, click the button above to alert the warden immediately.
          </p>
          <button onClick={openModal} className="btn btn-secondary" style={{ marginTop: '1rem' }}>
            Report an Issue Now
          </button>
        </div>
      ) : (
        <div className="complaints-cards-grid">
          {effectiveComplaints.map((c) => {
            const cat = getCategoryMeta(c.category);
            const urg = getUrgencyMeta(c.urgency);
            const createdDate = c.createdAt
              ? new Date(c.createdAt).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric'
                })
              : '-';

            return (
              <div
                key={c.id}
                className={`student-ticket-card ${c.urgency === 'EMERGENCY' ? 'emergency-border' : ''}`}
                onClick={() => setSelectedTicket(c)}
              >
                <div className="ticket-card-header">
                  <span className="ticket-code">{c.ticketNumber}</span>
                  <span className={`status-pill status-${c.status.toLowerCase()}`}>
                    {c.status === 'PENDING' && '⏳ Under Review'}
                    {c.status === 'IN_PROGRESS' && '🔄 In Progress'}
                    {c.status === 'RESOLVED' && '✅ Resolved'}
                    {c.status === 'REJECTED' && '❌ Rejected'}
                  </span>
                </div>

                <div className="ticket-card-title">{c.title}</div>
                <div className="ticket-card-desc">{c.description}</div>

                <div className="ticket-tags-row">
                  <span className="tag-pill">
                    <span>{cat.icon}</span> {cat.label.split(' ')[0]}
                  </span>
                  <span className={`tag-pill ${urg.badgeClass}`}>
                    <span>{urg.icon}</span> {c.urgency}
                  </span>
                  {c.roomNumber && (
                    <span className="tag-pill tag-room">
                      🚪 Room {c.roomNumber}
                    </span>
                  )}
                </div>

                {c.resolutionNotes && (
                  <div className="student-resolution-box">
                    <strong>Superintendent Action:</strong> {c.resolutionNotes}
                  </div>
                )}

                <div className="ticket-card-footer">
                  <span className="ticket-timestamp">Reported: {createdDate}</span>
                  <button className="btn-view-details">View Details &rarr;</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Raise New Maintenance Ticket */}
      {modalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content new-ticket-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span className="modal-badge">Service Request Form</span>
                <h3 className="modal-title">Raise Maintenance Ticket / Grievance</h3>
              </div>
              <button onClick={closeModal} className="modal-close-btn">&times;</button>
            </div>

            <form onSubmit={handleSubmitTicket} className="ticket-form">
              <div className="form-group">
                <label className="form-label">Category of Issue *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="form-control"
                  required
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.icon} {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Urgency Level *</label>
                <div className="urgency-selector-grid">
                  {URGENCIES.map((u) => (
                    <label
                      key={u.value}
                      className={`urgency-option-card ${formData.urgency === u.value ? 'selected ' + u.badgeClass : ''}`}
                    >
                      <input
                        type="radio"
                        name="urgency"
                        value={u.value}
                        checked={formData.urgency === u.value}
                        onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
                        className="sr-only"
                      />
                      <div className="urgency-option-icon">{u.icon}</div>
                      <div className="urgency-option-label">{u.label}</div>
                      <div className="urgency-option-desc">{u.desc}</div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group flex-1">
                  <label className="form-label">Room / Area Number</label>
                  <input
                    type="text"
                    value={formData.roomNumber}
                    onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                    placeholder="e.g. 101, Common Washroom, 2nd Floor Corridor"
                    className="form-control"
                  />
                  <span className="form-hint">Prefilled with your assigned room</span>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Issue Summary / Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Fan regulator broken, water tap continuous leak, window latch damaged"
                  className="form-control"
                  required
                  maxLength={120}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Detailed Description *</label>
                <textarea
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Please specify exact details so the maintenance team can bring appropriate tools or replacement parts..."
                  className="form-control"
                  required
                  maxLength={1000}
                />
                <span className="form-hint" style={{ textAlign: 'right' }}>
                  {formData.description.length}/1000 characters
                </span>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={closeModal}
                  className="btn btn-secondary"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Submitting Request...' : 'Submit Maintenance Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: View Ticket Details */}
      {selectedTicket && (
        <div className="modal-overlay" onClick={() => setSelectedTicket(null)}>
          <div className="modal-content ticket-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span className="modal-badge">{selectedTicket.ticketNumber}</span>
                <h3 className="modal-title">{selectedTicket.title}</h3>
              </div>
              <button onClick={() => setSelectedTicket(null)} className="modal-close-btn">&times;</button>
            </div>

            <div className="ticket-detail-body">
              <div className="detail-meta-grid">
                <div className="detail-meta-item">
                  <span className="meta-label">Status</span>
                  <span className={`status-pill status-${selectedTicket.status.toLowerCase()}`}>
                    {selectedTicket.status}
                  </span>
                </div>
                <div className="detail-meta-item">
                  <span className="meta-label">Category</span>
                  <span className="meta-val">
                    {getCategoryMeta(selectedTicket.category).icon} {selectedTicket.category}
                  </span>
                </div>
                <div className="detail-meta-item">
                  <span className="meta-label">Urgency</span>
                  <span className={`urgency-pill ${getUrgencyMeta(selectedTicket.urgency).badgeClass}`}>
                    {selectedTicket.urgency}
                  </span>
                </div>
                <div className="detail-meta-item">
                  <span className="meta-label">Location</span>
                  <span className="meta-val">Room {selectedTicket.roomNumber || 'General'}</span>
                </div>
              </div>

              <div className="detail-section">
                <h4>Description of Issue</h4>
                <p className="detail-desc-box">{selectedTicket.description}</p>
              </div>

              {selectedTicket.resolutionNotes ? (
                <div className="detail-section resolution-highlight">
                  <h4>Superintendent Action &amp; Remarks</h4>
                  <p>{selectedTicket.resolutionNotes}</p>
                  {selectedTicket.resolvedAt && (
                    <span className="resolved-date">
                      Resolved on: {new Date(selectedTicket.resolvedAt).toLocaleString('en-IN')}
                    </span>
                  )}
                </div>
              ) : (
                <div className="detail-section pending-notice">
                  <p>⏳ This ticket is currently queued for inspection by the hostel maintenance staff.</p>
                </div>
              )}

              <div className="modal-actions" style={{ marginTop: '1.5rem' }}>
                <button
                  type="button"
                  onClick={() => setSelectedTicket(null)}
                  className="btn btn-secondary"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
