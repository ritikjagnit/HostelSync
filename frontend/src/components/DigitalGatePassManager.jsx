import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import './DigitalGatePassManager.css';

const PASS_TYPES = [
  { value: 'DAY_OUTING', label: 'Day Outing (लोकल मार्केट / काम)', icon: '🛍️' },
  { value: 'HOME_VISIT', label: 'Home Visit (घर प्रवास)', icon: '🏡' },
  { value: 'NIGHT_OUT', label: 'Night Out (रात्री बाहेर)', icon: '🌙' },
  { value: 'EMERGENCY', label: 'Emergency / Medical (वैद्यकीय / आणीबाणी)', icon: '🚨' },
  { value: 'COLLEGE_EVENT', label: 'College / Academic Event', icon: '🎓' }
];

const STATUS_FILTERS = [
  { value: 'ALL', label: 'All Passes' },
  { value: 'PENDING', label: 'Pending Approval', badge: 'status-pending', icon: '⏳' },
  { value: 'APPROVED', label: 'Approved', badge: 'status-approved', icon: '✅' },
  { value: 'OUT_OF_CAMPUS', label: 'Out of Campus', badge: 'status-out', icon: '🚶' },
  { value: 'RETURNED', label: 'Returned', badge: 'status-returned', icon: '🏠' },
  { value: 'OVERDUE', label: 'Overdue Return ⚠️', badge: 'status-overdue', icon: '🚨' },
  { value: 'REJECTED', label: 'Rejected', badge: 'status-rejected', icon: '❌' }
];

export default function DigitalGatePassManager({ role = 'STUDENT', hostelId = null }) {
  const { authFetch } = useAuth();

  const [passes, setPasses] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    outOfCampus: 0,
    returned: 0,
    overdue: 0
  });

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [feedbackSuccess, setFeedbackSuccess] = useState('');
  const [feedbackError, setFeedbackError] = useState('');

  // Modals
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [reviewModalPass, setReviewModalPass] = useState(null);
  const [actionRemarks, setActionRemarks] = useState('');
  const [targetStatus, setTargetStatus] = useState('APPROVED');
  const [printPass, setPrintPass] = useState(null);

  // Student apply form
  const [formData, setFormData] = useState({
    passType: 'DAY_OUTING',
    purpose: '',
    destination: '',
    outTime: '',
    expectedInTime: '',
    parentContact: ''
  });

  const apiBase = role === 'STUDENT' ? '/api/student/gatepass' : (role === 'ADMIN' ? '/api/admin/gatepass' : '/api/warden/gatepass');

  const loadData = useCallback(async () => {
    setLoading(true);
    setFeedbackError('');
    try {
      const qs = statusFilter !== 'ALL' ? `?status=${statusFilter}` : '';
      const [resList, resStats] = await Promise.all([
        authFetch(`${apiBase}${qs}`),
        role !== 'STUDENT' ? authFetch(`${apiBase}/stats`) : Promise.resolve(null)
      ]);

      if (!resList.ok) throw new Error('Failed to load gate passes');
      const list = await resList.json();
      setPasses(list);

      if (role === 'STUDENT') {
        setStats({
          total: list.length,
          pending: list.filter((p) => p.status === 'PENDING').length,
          approved: list.filter((p) => p.status === 'APPROVED').length,
          outOfCampus: list.filter((p) => p.status === 'OUT_OF_CAMPUS').length,
          returned: list.filter((p) => p.status === 'RETURNED').length,
          overdue: list.filter((p) => p.status === 'OVERDUE').length
        });
      } else if (resStats && resStats.ok) {
        const statsData = await resStats.json();
        setStats(statsData);
      }
    } catch (err) {
      setFeedbackError(err.message || 'Unable to fetch gate passes');
    } finally {
      setLoading(false);
    }
  }, [apiBase, authFetch, statusFilter, role]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleApplySubmit = async (e) => {
    e.preventDefault();
    if (!formData.purpose.trim() || !formData.destination.trim() || !formData.outTime || !formData.expectedInTime) {
      setFeedbackError('Please fill out all required fields.');
      return;
    }

    setActionLoading(true);
    setFeedbackError('');
    try {
      const res = await authFetch('/api/student/gatepass', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to submit gate pass application');
      }

      const created = await res.json();
      setFeedbackSuccess(`Gate pass ${created.passNumber} applied successfully! Waiting for warden review.`);
      setApplyModalOpen(false);
      setFormData({
        passType: 'DAY_OUTING',
        purpose: '',
        destination: '',
        outTime: '',
        expectedInTime: '',
        parentContact: ''
      });
      loadData();
    } catch (err) {
      setFeedbackError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReviewStatus = async (e) => {
    e.preventDefault();
    if (!reviewModalPass) return;

    setActionLoading(true);
    try {
      const res = await authFetch(`${apiBase}/${reviewModalPass.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: targetStatus,
          wardenRemarks: actionRemarks.trim()
        })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to update pass');
      }

      setFeedbackSuccess(`Pass ${reviewModalPass.passNumber} marked as ${targetStatus}.`);
      setReviewModalPass(null);
      setActionRemarks('');
      loadData();
    } catch (err) {
      setFeedbackError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleQuickAction = async (passId, endpoint, successMsg) => {
    setActionLoading(true);
    try {
      const res = await authFetch(`${apiBase}/${passId}/${endpoint}`, { method: 'PATCH' });
      if (!res.ok) throw new Error('Action failed');
      setFeedbackSuccess(successMsg);
      loadData();
    } catch (err) {
      setFeedbackError(err.message || 'Operation failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelPass = async (passId) => {
    if (!window.confirm('Cancel this pending gate pass request?')) return;
    try {
      const res = await authFetch(`/api/student/gatepass/${passId}/cancel`, { method: 'PATCH' });
      if (!res.ok) throw new Error('Cancellation failed');
      setFeedbackSuccess('Gate pass cancelled.');
      loadData();
    } catch (err) {
      setFeedbackError(err.message);
    }
  };

  const filteredPasses = passes.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (p.passNumber && p.passNumber.toLowerCase().includes(q)) ||
      (p.studentName && p.studentName.toLowerCase().includes(q)) ||
      (p.studentEnrollment && p.studentEnrollment.toLowerCase().includes(q)) ||
      (p.destination && p.destination.toLowerCase().includes(q)) ||
      (p.purpose && p.purpose.toLowerCase().includes(q))
    );
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING': return <span className="gate-badge badge-pending">⏳ Pending Review</span>;
      case 'APPROVED': return <span className="gate-badge badge-approved">✅ Approved</span>;
      case 'OUT_OF_CAMPUS': return <span className="gate-badge badge-out">🚶 Out of Campus</span>;
      case 'RETURNED': return <span className="gate-badge badge-returned">🏠 Returned</span>;
      case 'OVERDUE': return <span className="gate-badge badge-overdue">🚨 Overdue Return</span>;
      case 'REJECTED': return <span className="gate-badge badge-rejected">❌ Rejected</span>;
      case 'CANCELLED': return <span className="gate-badge badge-cancelled">🚫 Cancelled</span>;
      default: return <span className="gate-badge">{status}</span>;
    }
  };

  return (
    <div className="digital-gatepass-manager">
      {/* Feedback Alerts */}
      {feedbackSuccess && (
        <div className="alert alert-success" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <span>{feedbackSuccess}</span>
          <button onClick={() => setFeedbackSuccess('')} className="alert-close-btn">&times;</button>
        </div>
      )}
      {feedbackError && (
        <div className="alert alert-error" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <span>{feedbackError}</span>
          <button onClick={() => setFeedbackError('')} className="alert-close-btn">&times;</button>
        </div>
      )}

      {/* Header Banner */}
      <div className="gatepass-header-card">
        <div>
          <div className="gatepass-badge-row">
            <span className="badge badge-primary">Campus Resident Safety</span>
            <span className="badge badge-success">Automated Gate Register</span>
          </div>
          <h2 className="gatepass-title">Digital Gate Pass &amp; Outing System (गेट पास प्रणाली)</h2>
          <p className="gatepass-subtitle">
            {role === 'STUDENT'
              ? 'Apply for day outings, weekend home visits, or emergency leaves. Carry your digital pass with verification QR Code at the campus main security gate.'
              : 'Review resident leave applications, grant approvals, and record real-time security gate departures and returns.'}
          </p>
        </div>

        {role === 'STUDENT' && (
          <button
            onClick={() => setApplyModalOpen(true)}
            className="btn btn-primary btn-apply-gatepass"
            id="btn-apply-gatepass"
          >
            <span>➕</span> Apply Gate Pass (नवीन अर्ज)
          </button>
        )}
      </div>

      {/* Staff Stats Grid */}
      {role !== 'STUDENT' && (
        <div className="gatepass-stats-grid">
          <div className="gatepass-stat-card card-total" onClick={() => setStatusFilter('ALL')}>
            <span className="stat-label">Total Passes</span>
            <span className="stat-num">{stats.total}</span>
            <span className="stat-sub">All-time applications</span>
          </div>
          <div className="gatepass-stat-card card-pending" onClick={() => setStatusFilter('PENDING')}>
            <span className="stat-label">Pending Approval</span>
            <span className="stat-num">{stats.pending}</span>
            <span className="stat-sub">Needs superintendent review</span>
          </div>
          <div className="gatepass-stat-card card-out" onClick={() => setStatusFilter('OUT_OF_CAMPUS')}>
            <span className="stat-label">Out of Campus</span>
            <span className="stat-num">{stats.outOfCampus}</span>
            <span className="stat-sub">Currently outside hostel</span>
          </div>
          <div className="gatepass-stat-card card-overdue" onClick={() => setStatusFilter('OVERDUE')}>
            <span className="stat-label">Overdue Returns</span>
            <span className="stat-num">{stats.overdue}</span>
            <span className="stat-sub">Exceeded expected in-time</span>
          </div>
        </div>
      )}

      {/* Toolbar / Search / Filters */}
      <div className="gatepass-toolbar">
        <div className="toolbar-search">
          <span>🔍</span>
          <input
            type="text"
            placeholder="Search by pass #, student name, enrollment, destination..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="gatepass-search-input"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="btn-clear-search">&times;</button>
          )}
        </div>

        <div className="toolbar-actions">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="gatepass-select"
          >
            {STATUS_FILTERS.map((s) => (
              <option key={s.value} value={s.value}>{s.icon} {s.label}</option>
            ))}
          </select>
          <button onClick={loadData} className="btn btn-secondary">🔄 Refresh</button>
        </div>
      </div>

      {/* Passes List / Cards */}
      {loading ? (
        <div className="gatepass-loading">
          <span className="spinner"></span>
          <p>Loading digital gate pass register...</p>
        </div>
      ) : filteredPasses.length === 0 ? (
        <div className="gatepass-empty-state">
          <div className="empty-icon">🎫</div>
          <h3>No Gate Passes Found</h3>
          <p>
            {role === 'STUDENT'
              ? 'You do not have any active or past gate pass applications on file. Click "Apply Gate Pass" above whenever you need to leave the campus.'
              : 'No gate passes currently match the selected filter criteria.'}
          </p>
        </div>
      ) : (
        <div className="gatepass-cards-grid">
          {filteredPasses.map((p) => {
            const outDateStr = p.outTime ? new Date(p.outTime).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) : '-';
            const inDateStr = p.expectedInTime ? new Date(p.expectedInTime).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) : '-';
            const isOverdue = p.status === 'OVERDUE';

            return (
              <div key={p.id} className={`gatepass-card ${isOverdue ? 'card-border-overdue' : ''}`}>
                <div className="pass-card-header">
                  <span className="pass-number">{p.passNumber}</span>
                  {getStatusBadge(p.status)}
                </div>

                <div className="pass-meta-row">
                  <span className="pass-type-chip">
                    {p.passType === 'DAY_OUTING' && '🛍️ Day Outing'}
                    {p.passType === 'HOME_VISIT' && '🏡 Home Visit'}
                    {p.passType === 'NIGHT_OUT' && '🌙 Night Out'}
                    {p.passType === 'EMERGENCY' && '🚨 Emergency'}
                    {p.passType === 'COLLEGE_EVENT' && '🎓 Event'}
                  </span>
                  <span className="pass-room-chip">🚪 Room {p.roomNumber || 'Resident'}</span>
                </div>

                <div className="pass-student-info">
                  <div className="student-name">{p.studentName}</div>
                  <div className="student-sub">{p.studentEnrollment} &bull; {p.hostelName}</div>
                </div>

                <div className="pass-timing-box">
                  <div className="time-col">
                    <span className="time-label">Departure</span>
                    <span className="time-val">{outDateStr}</span>
                  </div>
                  <div className="time-arrow">&rarr;</div>
                  <div className="time-col">
                    <span className="time-label">Expected Return</span>
                    <span className="time-val">{inDateStr}</span>
                  </div>
                </div>

                <div className="pass-detail-row">
                  <span className="detail-key">Destination:</span>
                  <span className="detail-val">{p.destination}</span>
                </div>
                <div className="pass-detail-row">
                  <span className="detail-key">Purpose:</span>
                  <span className="detail-val">{p.purpose}</span>
                </div>
                {p.parentContact && (
                  <div className="pass-detail-row">
                    <span className="detail-key">Parent Contact:</span>
                    <span className="detail-val">📞 {p.parentContact}</span>
                  </div>
                )}
                {p.wardenRemarks && (
                  <div className="pass-remarks-snippet">
                    <strong>Warden Note:</strong> {p.wardenRemarks}
                  </div>
                )}

                {/* Actions Footer */}
                <div className="pass-card-actions">
                  {role === 'STUDENT' ? (
                    <>
                      {['APPROVED', 'OUT_OF_CAMPUS'].includes(p.status) && (
                        <button
                          onClick={() => setPrintPass(p)}
                          className="btn btn-sm btn-primary"
                        >
                          🪪 View Digital Gate Pass
                        </button>
                      )}
                      {p.status === 'PENDING' && (
                        <button
                          onClick={() => handleCancelPass(p.id)}
                          className="btn btn-sm btn-secondary"
                        >
                          Cancel Request
                        </button>
                      )}
                    </>
                  ) : (
                    <>
                      {p.status === 'PENDING' && (
                        <button
                          onClick={() => {
                            setReviewModalPass(p);
                            setTargetStatus('APPROVED');
                            setActionRemarks('');
                          }}
                          className="btn btn-sm btn-primary"
                        >
                          Approve / Reject
                        </button>
                      )}
                      {p.status === 'APPROVED' && (
                        <button
                          onClick={() => handleQuickAction(p.id, 'mark-exit', `Resident ${p.studentName} marked exited gate.`)}
                          className="btn btn-sm btn-secondary"
                          disabled={actionLoading}
                        >
                          🚶 Mark Exit Gate
                        </button>
                      )}
                      {['OUT_OF_CAMPUS', 'OVERDUE'].includes(p.status) && (
                        <button
                          onClick={() => handleQuickAction(p.id, 'mark-entry', `Resident ${p.studentName} marked returned safely.`)}
                          className="btn btn-sm btn-primary"
                          disabled={actionLoading}
                        >
                          🏠 Mark Returned
                        </button>
                      )}
                      <button
                        onClick={() => setPrintPass(p)}
                        className="btn btn-sm btn-secondary"
                        title="Print verification slip"
                      >
                        🖨️ Slip
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Student Apply Gate Pass */}
      {applyModalOpen && (
        <div className="modal-overlay" onClick={() => setApplyModalOpen(false)}>
          <div className="modal-content gatepass-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span className="modal-badge">Application Form</span>
                <h3 className="modal-title">Apply for Hostel Gate Pass</h3>
              </div>
              <button onClick={() => setApplyModalOpen(false)} className="modal-close-btn">&times;</button>
            </div>

            <form onSubmit={handleApplySubmit} className="gatepass-form">
              <div className="form-group">
                <label className="form-label">Type of Outing / Leave *</label>
                <select
                  value={formData.passType}
                  onChange={(e) => setFormData({ ...formData, passType: e.target.value })}
                  className="gatepass-input"
                  required
                >
                  {PASS_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.icon} {t.label}</option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group flex-1">
                  <label className="form-label">Out Time (निघण्याची वेळ) *</label>
                  <input
                    type="datetime-local"
                    value={formData.outTime}
                    onChange={(e) => setFormData({ ...formData, outTime: e.target.value })}
                    className="gatepass-input"
                    required
                  />
                </div>
                <div className="form-group flex-1">
                  <label className="form-label">Expected Return Time (परतण्याची वेळ) *</label>
                  <input
                    type="datetime-local"
                    value={formData.expectedInTime}
                    onChange={(e) => setFormData({ ...formData, expectedInTime: e.target.value })}
                    className="gatepass-input"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Destination Address / Place *</label>
                <input
                  type="text"
                  placeholder="e.g. Sakoli Main Market, Lakhani, Bhandara Home Address"
                  value={formData.destination}
                  onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                  className="gatepass-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Specific Purpose / Reason *</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Purchasing academic stationery, attending medical appointment, family wedding"
                  value={formData.purpose}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                  className="gatepass-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Parent / Guardian Contact Phone *</label>
                <input
                  type="tel"
                  placeholder="10-digit mobile number for emergency verification"
                  value={formData.parentContact}
                  onChange={(e) => setFormData({ ...formData, parentContact: e.target.value })}
                  className="gatepass-input"
                  required
                />
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setApplyModalOpen(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                  {actionLoading ? 'Submitting...' : 'Submit Gate Pass Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Warden Review Status */}
      {reviewModalPass && (
        <div className="modal-overlay" onClick={() => setReviewModalPass(null)}>
          <div className="modal-content gatepass-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span className="modal-badge">{reviewModalPass.passNumber}</span>
                <h3 className="modal-title">Review Gate Pass Request</h3>
              </div>
              <button onClick={() => setReviewModalPass(null)} className="modal-close-btn">&times;</button>
            </div>

            <form onSubmit={handleReviewStatus} className="gatepass-form">
              <div className="review-summary-box">
                <div><strong>Resident:</strong> {reviewModalPass.studentName} ({reviewModalPass.studentEnrollment})</div>
                <div><strong>Hostel &amp; Room:</strong> {reviewModalPass.hostelName} - Room {reviewModalPass.roomNumber}</div>
                <div><strong>Destination:</strong> {reviewModalPass.destination}</div>
                <div><strong>Purpose:</strong> {reviewModalPass.purpose}</div>
                <div><strong>Parent Contact:</strong> 📞 {reviewModalPass.parentContact}</div>
              </div>

              <div className="form-group">
                <label className="form-label">Approval Decision *</label>
                <select
                  value={targetStatus}
                  onChange={(e) => setTargetStatus(e.target.value)}
                  className="gatepass-input"
                  required
                >
                  <option value="APPROVED">✅ APPROVE GATE PASS</option>
                  <option value="REJECTED">❌ REJECT APPLICATION</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Warden Remarks / Instructions</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Approved. Must report to hostel before 8:00 PM roll call."
                  value={actionRemarks}
                  onChange={(e) => setActionRemarks(e.target.value)}
                  className="gatepass-input"
                />
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setReviewModalPass(null)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                  {actionLoading ? 'Saving...' : 'Confirm Decision'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Printable Digital Gate Pass Slip */}
      {printPass && (
        <div className="modal-overlay" onClick={() => setPrintPass(null)}>
          <div className="modal-content print-pass-modal" onClick={(e) => e.stopPropagation()}>
            <div className="printable-pass-container">
              <div className="pass-header">
                <div className="college-crest-mini">🏛️</div>
                <div className="college-heading">
                  <h3>GOVERNMENT POLYTECHNIC SAKOLI</h3>
                  <h4>OFFICIAL HOSTEL DIGITAL GATE PASS</h4>
                  <p>Dist. Bhandara, Maharashtra &bull; DTE Code: 4014</p>
                </div>
              </div>

              <div className="pass-qr-badge">
                <div className="qr-box">
                  {/* Visual SVG QR representation */}
                  <svg width="70" height="70" viewBox="0 0 100 100" fill="#0f172a">
                    <rect width="30" height="30" x="5" y="5" />
                    <rect width="18" height="18" x="11" y="11" fill="#fff" />
                    <rect width="10" height="10" x="15" y="15" fill="#0f172a" />
                    <rect width="30" height="30" x="65" y="5" />
                    <rect width="18" height="18" x="71" y="11" fill="#fff" />
                    <rect width="10" height="10" x="75" y="15" fill="#0f172a" />
                    <rect width="30" height="30" x="5" y="65" />
                    <rect width="18" height="18" x="11" y="71" fill="#fff" />
                    <rect width="10" height="10" x="15" y="75" fill="#0f172a" />
                    <rect width="10" height="10" x="45" y="15" />
                    <rect width="15" height="15" x="42" y="42" />
                    <rect width="10" height="20" x="70" y="65" />
                  </svg>
                </div>
                <div className="pass-serial">
                  <div className="serial-title">PASS NUMBER</div>
                  <div className="serial-val">{printPass.passNumber}</div>
                  <div className="pass-status-pill">{printPass.status}</div>
                </div>
              </div>

              <table className="pass-table">
                <tbody>
                  <tr>
                    <th>Resident Student</th>
                    <td><strong>{printPass.studentName}</strong></td>
                    <th>Enrollment No</th>
                    <td><code>{printPass.studentEnrollment}</code></td>
                  </tr>
                  <tr>
                    <th>Hostel &amp; Room</th>
                    <td>{printPass.hostelName} (Room {printPass.roomNumber || 'N/A'})</td>
                    <th>Contact Phone</th>
                    <td>{printPass.studentPhone || printPass.parentContact}</td>
                  </tr>
                  <tr>
                    <th>Departure (Out)</th>
                    <td><strong>{new Date(printPass.outTime).toLocaleString('en-IN')}</strong></td>
                    <th>Expected Return (In)</th>
                    <td><strong>{new Date(printPass.expectedInTime).toLocaleString('en-IN')}</strong></td>
                  </tr>
                  <tr>
                    <th>Destination</th>
                    <td colSpan="3">{printPass.destination}</td>
                  </tr>
                  <tr>
                    <th>Purpose of Leave</th>
                    <td colSpan="3">{printPass.purpose}</td>
                  </tr>
                  {printPass.wardenRemarks && (
                    <tr>
                      <th>Superintendent Remarks</th>
                      <td colSpan="3" style={{ color: '#0369a1' }}>{printPass.wardenRemarks}</td>
                    </tr>
                  )}
                </tbody>
              </table>

              <div className="pass-footer-signs">
                <div className="sign-box">
                  <div className="sign-line"></div>
                  <span>Student Resident Signature</span>
                </div>
                <div className="sign-box">
                  <div className="sign-stamp">VERIFIED &amp; APPROVED</div>
                  <div className="sign-line"></div>
                  <span>Hostel Superintendent / Warden</span>
                </div>
                <div className="sign-box">
                  <div className="sign-line"></div>
                  <span>Main Gate Security Sentry</span>
                </div>
              </div>
            </div>

            <div className="modal-actions" style={{ marginTop: '1rem', padding: '0 1.5rem 1.5rem' }}>
              <button onClick={() => window.print()} className="btn btn-primary">
                🖨️ Print Gate Pass Slip
              </button>
              <button onClick={() => setPrintPass(null)} className="btn btn-secondary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
