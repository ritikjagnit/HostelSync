import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import './NoticeBoardManager.css';

const CATEGORIES = [
  { value: 'ALL', label: 'All Notices', icon: '📋' },
  { value: 'GENERAL', label: 'General Announcement', icon: '📢' },
  { value: 'DISCIPLINE', label: 'Discipline & Rules', icon: '⚖️' },
  { value: 'MAINTENANCE', label: 'Campus Maintenance', icon: '🛠️' },
  { value: 'MESS', label: 'Mess & Food', icon: '🍲' },
  { value: 'EVENT', label: 'Hostel / College Event', icon: '🎉' },
  { value: 'EMERGENCY', label: 'Emergency Alert', icon: '🚨' }
];

const PRIORITIES = [
  { value: 'LOW', label: 'Low', badge: 'priority-low' },
  { value: 'NORMAL', label: 'Normal', badge: 'priority-normal' },
  { value: 'IMPORTANT', label: 'Important (महत्त्वाचे)', badge: 'priority-high' },
  { value: 'URGENT', label: 'Urgent / Alert 🔥', badge: 'priority-urgent' }
];

const TARGETS = [
  { value: 'ALL', label: 'All Residents (सर्व विद्यार्थी)' },
  { value: 'BOYS_HOSTEL', label: 'Boys Hostel Only (मुले वसतिगृह)' },
  { value: 'GIRLS_HOSTEL', label: 'Girls Hostel Only (मुली वसतिगृह)' }
];

export default function NoticeBoardManager({ role = 'STUDENT' }) {
  const { authFetch, user } = useAuth();

  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState('');
  const [feedbackError, setFeedbackError] = useState('');

  // Post / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeNoticeDetail, setActiveNoticeDetail] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    category: 'GENERAL',
    priority: 'NORMAL',
    target: 'ALL',
    content: '',
    pinned: false,
    expiresAt: ''
  });

  const isStaff = role === 'WARDEN' || role === 'ADMIN';
  const apiBase = role === 'STUDENT' ? '/api/student/notices' : (role === 'ADMIN' ? '/api/admin/notices' : '/api/warden/notices');

  const loadNotices = useCallback(async () => {
    setLoading(true);
    setFeedbackError('');
    try {
      const res = await authFetch(apiBase);
      if (!res.ok) {
        throw new Error('Unable to load official notices');
      }
      const data = await res.json();
      setNotices(data);
    } catch (err) {
      setFeedbackError(err.message || 'Error fetching notices');
    } finally {
      setLoading(false);
    }
  }, [authFetch, apiBase]);

  useEffect(() => {
    loadNotices();
  }, [loadNotices]);

  const handleCreateNotice = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      setFeedbackError('Notice Title and Body Content are required.');
      return;
    }

    setActionLoading(true);
    setFeedbackError('');
    setFeedbackSuccess('');

    try {
      const payload = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        category: formData.category,
        priority: formData.priority,
        targetAudience: formData.target || 'ALL',
        isPinned: Boolean(formData.pinned),
        hostelId: null
      };

      const res = await authFetch(apiBase, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to post circular');
      }

      setFeedbackSuccess('Circular notice published successfully to digital board!');
      setIsModalOpen(false);
      setFormData({
        title: '',
        category: 'GENERAL',
        priority: 'NORMAL',
        target: 'ALL',
        content: '',
        pinned: false,
        expiresAt: ''
      });
      loadNotices();
    } catch (err) {
      setFeedbackError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleTogglePin = async (noticeId) => {
    try {
      const res = await authFetch(`${apiBase}/${noticeId}/pin`, {
        method: 'PUT'
      });
      if (!res.ok) throw new Error('Failed to toggle pin state');
      loadNotices();
    } catch (err) {
      setFeedbackError(err.message);
    }
  };

  const handleDeleteNotice = async (noticeId) => {
    if (!window.confirm('Are you sure you want to delete this notice circular?')) return;
    try {
      const res = await authFetch(`${apiBase}/${noticeId}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete circular');
      setFeedbackSuccess('Notice removed from board.');
      loadNotices();
    } catch (err) {
      setFeedbackError(err.message);
    }
  };

  // Filter notices
  const filteredNotices = notices.filter((n) => {
    if (selectedCategory !== 'ALL' && n.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = n.title?.toLowerCase().includes(q);
      const matchContent = n.content?.toLowerCase().includes(q);
      const matchAuthor = n.postedByName?.toLowerCase().includes(q);
      if (!matchTitle && !matchContent && !matchAuthor) return false;
    }
    return true;
  });

  const pinnedNotices = filteredNotices.filter((n) => n.isPinned || n.pinned);
  const regularNotices = filteredNotices.filter((n) => !n.isPinned && !n.pinned);

  return (
    <div className="notice-board-container">
      {/* Header Banner */}
      <div className="notice-header-card">
        <div className="notice-header-content">
          <div className="notice-header-badge">
            <span className="live-bullet"></span>
            <span>OFFICIAL CIRCULARS &amp; BULLETINS</span>
          </div>
          <h2 className="notice-header-title">Digital Notice Board</h2>
          <p className="notice-header-desc">
            Government Polytechnic Sakoli &bull; Real-time administrative circulars, guidelines, timetable changes and hostel advisories.
          </p>
        </div>

        {isStaff && (
          <button
            className="btn-create-notice"
            onClick={() => {
              setFeedbackError('');
              setIsModalOpen(true);
            }}
          >
            <span>✍️</span> Publish New Notice
          </button>
        )}
      </div>

      {/* Notifications */}
      {feedbackSuccess && (
        <div className="notice-alert notice-alert-success">
          <span>✓</span>
          <span>{feedbackSuccess}</span>
          <button onClick={() => setFeedbackSuccess('')} className="alert-close">&times;</button>
        </div>
      )}
      {feedbackError && (
        <div className="notice-alert notice-alert-error">
          <span>⚠️</span>
          <span>{feedbackError}</span>
          <button onClick={() => setFeedbackError('')} className="alert-close">&times;</button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="notice-toolbar">
        <div className="notice-search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search notices, guidelines, keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="clear-search" onClick={() => setSearchQuery('')}>&times;</button>
          )}
        </div>

        <div className="notice-category-tabs">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              className={`cat-tab-btn ${selectedCategory === cat.value ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat.value)}
            >
              <span>{cat.icon}</span> {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="notice-loading">
          <div className="notice-spinner"></div>
          <p>Fetching notices and circulars from institutional registry...</p>
        </div>
      ) : filteredNotices.length === 0 ? (
        <div className="notice-empty">
          <div className="empty-icon">📭</div>
          <h3>No notices found</h3>
          <p>There are no circulars matching your active category or search query.</p>
        </div>
      ) : (
        <div className="notices-display">
          {/* PINNED SECTION */}
          {pinnedNotices.length > 0 && (
            <div className="pinned-section">
              <div className="section-label">
                <span>📌</span> PINNED ANNOUNCEMENTS &amp; URGENT NOTICES ({pinnedNotices.length})
              </div>
              <div className="notices-grid">
                {pinnedNotices.map((notice) => (
                  <NoticeCard
                    key={notice.id}
                    notice={notice}
                    isStaff={isStaff}
                    onTogglePin={handleTogglePin}
                    onDelete={handleDeleteNotice}
                    onReadMore={() => setActiveNoticeDetail(notice)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* REGULAR NOTICES */}
          {regularNotices.length > 0 && (
            <div className="regular-section">
              {pinnedNotices.length > 0 && (
                <div className="section-label regular-label">
                  <span>📰</span> ALL CIRCULARS ({regularNotices.length})
                </div>
              )}
              <div className="notices-grid">
                {regularNotices.map((notice) => (
                  <NoticeCard
                    key={notice.id}
                    notice={notice}
                    isStaff={isStaff}
                    onTogglePin={handleTogglePin}
                    onDelete={handleDeleteNotice}
                    onReadMore={() => setActiveNoticeDetail(notice)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* DETAIL MODAL */}
      {activeNoticeDetail && (
        <div className="notice-modal-overlay" onClick={() => setActiveNoticeDetail(null)}>
          <div className="notice-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-header-tags">
                <span className={`priority-pill ${activeNoticeDetail.priority?.toLowerCase()}`}>
                  {activeNoticeDetail.priority}
                </span>
                <span className="category-pill">{activeNoticeDetail.category}</span>
                {activeNoticeDetail.pinned && <span className="pinned-pill">📌 Pinned</span>}
              </div>
              <button className="modal-close" onClick={() => setActiveNoticeDetail(null)}>&times;</button>
            </div>

            <h2 className="modal-notice-title">{activeNoticeDetail.title}</h2>

            <div className="modal-meta-bar">
              <div>
                <strong>Issued By:</strong> {activeNoticeDetail.postedByName || 'Hostel Administration'} ({activeNoticeDetail.postedByRole})
              </div>
              <div>
                <strong>Target:</strong> {activeNoticeDetail.target?.replace('_', ' ')}
              </div>
              <div>
                <strong>Date:</strong> {new Date(activeNoticeDetail.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>

            <div className="modal-notice-content">
              {activeNoticeDetail.content.split('\n').map((paragraph, idx) => (
                <p key={idx}>{paragraph}</p>
              ))}
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setActiveNoticeDetail(null)}>
                Close Notice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE NOTICE MODAL (Staff only) */}
      {isModalOpen && (
        <div className="notice-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="notice-modal-dialog create-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">Publish Circular Announcement</h3>
                <p className="modal-sub">Broadcast instructions or advisories to hostel residents</p>
              </div>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>

            <form onSubmit={handleCreateNotice}>
              <div className="form-group">
                <label>Circular Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Mandatory Hostel Cleanliness Drive / Mess Timetable Change"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="form-row-3">
                <div className="form-group">
                  <label>Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    {CATEGORIES.filter((c) => c.value !== 'ALL').map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.icon} {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Priority Level *</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Target Audience *</label>
                  <select
                    value={formData.target}
                    onChange={(e) => setFormData({ ...formData, target: e.target.value })}
                  >
                    {TARGETS.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Notice Content &amp; Details *</label>
                <textarea
                  rows="6"
                  placeholder="Draft the circular message, instructions, deadlines, or relevant rules clearly..."
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  required
                ></textarea>
              </div>

              <div className="form-row">
                <div className="form-group checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.pinned}
                      onChange={(e) => setFormData({ ...formData, pinned: e.target.checked })}
                    />
                    <span>📌 Pin to top of Notice Board (High Visibility)</span>
                  </label>
                </div>

                <div className="form-group">
                  <label>Expiry Date (Optional)</label>
                  <input
                    type="date"
                    value={formData.expiresAt}
                    onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setIsModalOpen(false)}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-submit" disabled={actionLoading}>
                  {actionLoading ? 'Publishing...' : '📢 Broadcast Notice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function NoticeCard({ notice, isStaff, onTogglePin, onDelete, onReadMore }) {
  const isPinned = Boolean(notice.isPinned || notice.pinned);
  const isUrgent = notice.priority === 'URGENT' || notice.priority === 'IMPORTANT' || notice.priority === 'HIGH';
  const target = notice.targetAudience || notice.target || 'ALL';

  return (
    <div className={`notice-card ${isPinned ? 'card-pinned' : ''} ${isUrgent ? 'card-urgent' : ''}`}>
      <div className="card-top-row">
        <div className="badge-cluster">
          <span className={`priority-badge priority-${notice.priority?.toLowerCase()}`}>
            {notice.priority === 'URGENT' ? '🔥 URGENT' : notice.priority}
          </span>
          <span className="category-badge">{notice.category}</span>
          {target !== 'ALL' && (
            <span className="target-badge">
              {target === 'BOYS_HOSTEL' ? '🚹 Boys' : '🚺 Girls'}
            </span>
          )}
        </div>

        {isStaff && (
          <div className="staff-actions">
            <button
              className={`action-icon-btn ${isPinned ? 'pinned-active' : ''}`}
              title={isPinned ? 'Unpin Notice' : 'Pin Notice to Top'}
              onClick={() => onTogglePin(notice.id)}
            >
              📌
            </button>
            <button
              className="action-icon-btn delete-icon"
              title="Delete Notice"
              onClick={() => onDelete(notice.id)}
            >
              🗑️
            </button>
          </div>
        )}
      </div>

      <h3 className="card-title" onClick={onReadMore}>
        {notice.title}
      </h3>

      <p className="card-excerpt">
        {notice.content?.length > 180 ? `${notice.content.substring(0, 180)}...` : notice.content}
      </p>

      <div className="card-bottom">
        <div className="card-meta">
          <span className="meta-author">👤 {notice.postedByName || 'Admin'}</span>
          <span className="meta-date">
            📅 {new Date(notice.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        </div>

        <button className="read-more-link" onClick={onReadMore}>
          Read Full &rarr;
        </button>
      </div>
    </div>
  );
}
