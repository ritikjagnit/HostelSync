import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import './GrievanceMaintenanceManager.css';

const CATEGORIES = [
  { value: 'ALL', label: 'All Categories' },
  { value: 'ELECTRICAL', label: 'Electrical', icon: '⚡' },
  { value: 'PLUMBING', label: 'Plumbing', icon: '🚰' },
  { value: 'CARPENTRY', label: 'Carpentry', icon: '🪚' },
  { value: 'CLEANLINESS', label: 'Cleanliness', icon: '🧹' },
  { value: 'INTERNET_WIFI', label: 'Internet / Wi-Fi', icon: '📶' },
  { value: 'OTHER', label: 'Other', icon: '📌' }
];

const URGENCIES = [
  { value: 'ALL', label: 'All Urgencies' },
  { value: 'EMERGENCY', label: 'Emergency', badgeClass: 'urgency-emergency', icon: '🔥' },
  { value: 'HIGH', label: 'High', badgeClass: 'urgency-high', icon: '⚠️' },
  { value: 'MEDIUM', label: 'Medium', badgeClass: 'urgency-medium', icon: 'ℹ️' },
  { value: 'LOW', label: 'Low', badgeClass: 'urgency-low', icon: '🟢' }
];

const STATUSES = [
  { value: 'ALL', label: 'All Statuses' },
  { value: 'PENDING', label: 'Pending Review', badgeClass: 'status-pending', icon: '⏳' },
  { value: 'IN_PROGRESS', label: 'In Progress', badgeClass: 'status-inprogress', icon: '🔄' },
  { value: 'RESOLVED', label: 'Resolved', badgeClass: 'status-resolved', icon: '✅' },
  { value: 'REJECTED', label: 'Rejected', badgeClass: 'status-rejected', icon: '❌' }
];

export default function GrievanceMaintenanceManager({
  apiPrefix = '/api/warden/complaints',
  role = 'WARDEN',
  hostels = []
}) {
  const { authFetch } = useAuth();

  // Data states
  const [complaints, setComplaints] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0,
    rejected: 0
  });

  // Filter states
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [urgencyFilter, setUrgencyFilter] = useState('ALL');
  const [hostelFilter, setHostelFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // UI & Loading states
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState('');
  const [feedbackError, setFeedbackError] = useState('');

  // Status Update Modal State
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [targetStatus, setTargetStatus] = useState('IN_PROGRESS');
  const [resolutionNotes, setResolutionNotes] = useState('');

  // Load Complaints and Stats
  const loadData = useCallback(async () => {
    setLoading(true);
    setFeedbackError('');
    try {
      // Build query params
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (categoryFilter !== 'ALL') params.append('category', categoryFilter);
      if (urgencyFilter !== 'ALL') params.append('urgency', urgencyFilter);
      if (role === 'ADMIN' && hostelFilter !== 'ALL') params.append('hostelId', hostelFilter);

      const qs = params.toString() ? `?${params.toString()}` : '';

      // Stats query
      const statsParams = new URLSearchParams();
      if (role === 'ADMIN' && hostelFilter !== 'ALL') statsParams.append('hostelId', hostelFilter);
      const statsQs = statsParams.toString() ? `?${statsParams.toString()}` : '';

      const [resList, resStats] = await Promise.all([
        authFetch(`${apiPrefix}${qs}`),
        authFetch(`${apiPrefix}/stats${statsQs}`)
      ]);

      if (!resList.ok) throw new Error('Failed to load complaints records');
      const listData = await resList.json();
      setComplaints(listData);

      if (resStats.ok) {
        const statsData = await resStats.json();
        setStats(statsData);
      }
    } catch (err) {
      setFeedbackError(err.message || 'Unable to fetch maintenance tickets');
    } finally {
      setLoading(false);
    }
  }, [apiPrefix, authFetch, statusFilter, categoryFilter, urgencyFilter, hostelFilter, role]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Open Status Update Modal
  const openStatusModal = (complaint) => {
    setSelectedComplaint(complaint);
    setTargetStatus(complaint.status === 'PENDING' ? 'IN_PROGRESS' : complaint.status);
    setResolutionNotes(complaint.resolutionNotes || '');
    setFeedbackError('');
    setFeedbackSuccess('');
  };

  const closeStatusModal = () => {
    setSelectedComplaint(null);
    setResolutionNotes('');
  };

  // Submit Status Update
  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!selectedComplaint) return;

    if (['RESOLVED', 'REJECTED'].includes(targetStatus) && !resolutionNotes.trim()) {
      setFeedbackError(`Please provide resolution/action remarks when marking ticket as ${targetStatus}.`);
      return;
    }

    setActionLoading(true);
    setFeedbackError('');
    try {
      const res = await authFetch(`${apiPrefix}/${selectedComplaint.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: targetStatus,
          resolutionNotes: resolutionNotes.trim()
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to update ticket status');
      }

      const updated = await res.json();
      setFeedbackSuccess(`Ticket ${updated.ticketNumber} successfully updated to ${updated.status}.`);
      closeStatusModal();
      loadData();
    } catch (err) {
      setFeedbackError(err.message || 'An error occurred while updating status');
    } finally {
      setActionLoading(false);
    }
  };

  // Client-side text search filtering
  const filteredComplaints = complaints.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (c.ticketNumber && c.ticketNumber.toLowerCase().includes(q)) ||
      (c.title && c.title.toLowerCase().includes(q)) ||
      (c.description && c.description.toLowerCase().includes(q)) ||
      (c.studentName && c.studentName.toLowerCase().includes(q)) ||
      (c.roomNumber && c.roomNumber.toLowerCase().includes(q)) ||
      (c.hostelName && c.hostelName.toLowerCase().includes(q))
    );
  });

  const getCategoryMeta = (cat) => CATEGORIES.find((c) => c.value === cat) || { label: cat, icon: '📌' };
  const getUrgencyMeta = (urg) => URGENCIES.find((u) => u.value === urg) || { label: urg, badgeClass: 'urgency-low', icon: '🟢' };
  const getStatusMeta = (st) => STATUSES.find((s) => s.value === st) || { label: st, badgeClass: 'status-pending', icon: '⏳' };

  return (
    <div className="grievance-manager">
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

      {/* Overview Stat Cards */}
      <div className="grievance-stats-grid">
        <div className="grievance-stat-card stat-total" onClick={() => setStatusFilter('ALL')}>
          <div className="stat-card-top">
            <span className="stat-label">Total Tickets</span>
            <span className="stat-icon">📋</span>
          </div>
          <div className="stat-number">{stats.total}</div>
          <div className="stat-subtext">All time filed grievances</div>
        </div>

        <div className="grievance-stat-card stat-pending" onClick={() => setStatusFilter('PENDING')}>
          <div className="stat-card-top">
            <span className="stat-label">Pending Review</span>
            <span className="stat-icon">⏳</span>
          </div>
          <div className="stat-number">{stats.pending}</div>
          <div className="stat-subtext">Awaiting superintendent action</div>
        </div>

        <div className="grievance-stat-card stat-inprogress" onClick={() => setStatusFilter('IN_PROGRESS')}>
          <div className="stat-card-top">
            <span className="stat-label">In Progress</span>
            <span className="stat-icon">🔄</span>
          </div>
          <div className="stat-number">{stats.inProgress}</div>
          <div className="stat-subtext">Maintenance work assigned</div>
        </div>

        <div className="grievance-stat-card stat-resolved" onClick={() => setStatusFilter('RESOLVED')}>
          <div className="stat-card-top">
            <span className="stat-label">Resolved</span>
            <span className="stat-icon">✅</span>
          </div>
          <div className="stat-number">{stats.resolved}</div>
          <div className="stat-subtext">Successfully redressed</div>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="grievance-toolbar">
        <div className="toolbar-search">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search by ticket #, student, room, title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="grievance-input"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="search-clear-btn">&times;</button>
          )}
        </div>

        <div className="toolbar-filters">
          {role === 'ADMIN' && hostels.length > 0 && (
            <select
              value={hostelFilter}
              onChange={(e) => setHostelFilter(e.target.value)}
              className="grievance-select"
            >
              <option value="ALL">All Hostels ({hostels.length})</option>
              {hostels.map((h) => (
                <option key={h.id} value={h.id}>{h.name}</option>
              ))}
            </select>
          )}

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="grievance-select"
          >
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="grievance-select"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.icon ? `${c.icon} ` : ''}{c.label}</option>
            ))}
          </select>

          <select
            value={urgencyFilter}
            onChange={(e) => setUrgencyFilter(e.target.value)}
            className="grievance-select"
          >
            {URGENCIES.map((u) => (
              <option key={u.value} value={u.value}>{u.icon ? `${u.icon} ` : ''}{u.label}</option>
            ))}
          </select>

          <button onClick={loadData} className="btn btn-secondary btn-icon" title="Refresh Tickets">
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Tickets List / Table */}
      {loading ? (
        <div className="grievance-loading-state">
          <span className="spinner"></span>
          <p>Loading grievance and maintenance tickets...</p>
        </div>
      ) : filteredComplaints.length === 0 ? (
        <div className="grievance-empty-state">
          <div className="empty-icon">🎉</div>
          <h3>No Maintenance Tickets Found</h3>
          <p>
            {complaints.length === 0
              ? 'There are currently no reported complaints or maintenance issues in this section.'
              : 'No tickets matched the current filter criteria. Try adjusting the search or filters.'}
          </p>
        </div>
      ) : (
        <div className="grievance-table-wrapper">
          <table className="grievance-table">
            <thead>
              <tr>
                <th>Ticket &amp; Date</th>
                <th>Resident &amp; Room</th>
                <th>Category</th>
                <th>Urgency</th>
                <th>Issue Summary</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredComplaints.map((item) => {
                const catMeta = getCategoryMeta(item.category);
                const urgMeta = getUrgencyMeta(item.urgency);
                const stMeta = getStatusMeta(item.status);
                const createdDate = item.createdAt
                  ? new Date(item.createdAt).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    })
                  : '-';

                return (
                  <tr key={item.id} className={item.urgency === 'EMERGENCY' ? 'row-emergency' : ''}>
                    <td>
                      <div className="ticket-number-badge">{item.ticketNumber}</div>
                      <div className="ticket-date-muted">{createdDate}</div>
                    </td>
                    <td>
                      <div className="resident-name">{item.studentName || 'Resident Student'}</div>
                      <div className="resident-subtext">
                        Room {item.roomNumber || 'N/A'} &bull; {item.hostelName || 'Hostel'}
                      </div>
                      {item.studentPhone && (
                        <div className="resident-subtext" style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>
                          📞 {item.studentPhone}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className="category-pill">
                        <span>{catMeta.icon}</span> {catMeta.label}
                      </span>
                    </td>
                    <td>
                      <span className={`urgency-pill ${urgMeta.badgeClass}`}>
                        <span>{urgMeta.icon}</span> {urgMeta.label}
                      </span>
                    </td>
                    <td>
                      <div className="ticket-title-text">{item.title}</div>
                      <div className="ticket-desc-snippet" title={item.description}>
                        {item.description}
                      </div>
                      {item.resolutionNotes && (
                        <div className="ticket-resolution-snippet">
                          <strong>Resolution:</strong> {item.resolutionNotes}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className={`status-pill ${stMeta.badgeClass}`}>
                        <span>{stMeta.icon}</span> {stMeta.label}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => openStatusModal(item)}
                        className="btn btn-sm btn-primary action-btn"
                        id={`btn-manage-complaint-${item.id}`}
                      >
                        Action / Resolve
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal: Update Ticket Status & Resolution Remarks */}
      {selectedComplaint && (
        <div className="modal-overlay" onClick={closeStatusModal}>
          <div className="modal-content grievance-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span className="modal-badge">{selectedComplaint.ticketNumber}</span>
                <h3 className="modal-title">Redress Complaint / Maintenance Ticket</h3>
              </div>
              <button onClick={closeStatusModal} className="modal-close-btn">&times;</button>
            </div>

            <div className="grievance-modal-body">
              {/* Ticket Details Summary */}
              <div className="ticket-info-panel">
                <div className="ticket-info-row">
                  <span className="info-label">Resident:</span>
                  <span className="info-value">
                    <strong>{selectedComplaint.studentName}</strong> ({selectedComplaint.studentEmail})
                  </span>
                </div>
                <div className="ticket-info-row">
                  <span className="info-label">Location:</span>
                  <span className="info-value">
                    {selectedComplaint.hostelName} &bull; Room {selectedComplaint.roomNumber || 'Unassigned'}
                  </span>
                </div>
                <div className="ticket-info-row">
                  <span className="info-label">Category &amp; Urgency:</span>
                  <span className="info-value">
                    {getCategoryMeta(selectedComplaint.category).icon} {selectedComplaint.category} &bull;{' '}
                    <span className={`urgency-pill ${getUrgencyMeta(selectedComplaint.urgency).badgeClass}`}>
                      {selectedComplaint.urgency}
                    </span>
                  </span>
                </div>
                <div className="ticket-info-row">
                  <span className="info-label">Subject:</span>
                  <span className="info-value"><strong>{selectedComplaint.title}</strong></span>
                </div>
                <div className="ticket-info-desc">
                  <span className="info-label">Description:</span>
                  <p className="desc-text">{selectedComplaint.description}</p>
                </div>
              </div>

              {/* Status Update Form */}
              <form onSubmit={handleUpdateStatus} className="status-form">
                <div className="form-group">
                  <label className="form-label">Update Ticket Status *</label>
                  <select
                    value={targetStatus}
                    onChange={(e) => setTargetStatus(e.target.value)}
                    className="grievance-select full-width"
                    required
                  >
                    <option value="PENDING">⏳ PENDING (Awaiting Review)</option>
                    <option value="IN_PROGRESS">🔄 IN PROGRESS (Maintenance In Process)</option>
                    <option value="RESOLVED">✅ RESOLVED (Issue Fixed &amp; Verified)</option>
                    <option value="REJECTED">❌ REJECTED (Invalid / Out of Scope)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Resolution / Maintenance Notes {['RESOLVED', 'REJECTED'].includes(targetStatus) ? '*' : '(Optional)'}
                  </label>
                  <textarea
                    rows={4}
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    placeholder={
                      targetStatus === 'RESOLVED'
                        ? 'Describe how the issue was fixed (e.g. Electrician repaired wiring in room 101, tested and verified operational).'
                        : targetStatus === 'REJECTED'
                        ? 'Reason for rejecting ticket (e.g. Personal item not covered under hostel maintenance policy).'
                        : 'Add work notes, technician assigned, or spare parts ordered...'
                    }
                    className="grievance-textarea"
                    required={['RESOLVED', 'REJECTED'].includes(targetStatus)}
                  />
                  <span className="form-hint">
                    These remarks will be immediately visible to the resident student on their portal.
                  </span>
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    onClick={closeStatusModal}
                    className="btn btn-secondary"
                    disabled={actionLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={actionLoading}
                  >
                    {actionLoading ? 'Updating Status...' : 'Save & Update Ticket'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
