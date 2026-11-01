import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import './NotificationCenter.css';

const CATEGORY_META = {
  GENERAL: { label: 'General Announcement', icon: '📢', color: '#2563eb', bg: '#eff6ff' },
  ACADEMIC: { label: 'Academic & Exam', icon: '🎓', color: '#7c3aed', bg: '#f5f3ff' },
  FEE_DEADLINE: { label: 'Fee Deadline', icon: '💰', color: '#b45309', bg: '#fef3c7' },
  MAINTENANCE: { label: 'Maintenance Work', icon: '🔧', color: '#0369a1', bg: '#e0f2fe' },
  DISCIPLINE: { label: 'Code of Conduct', icon: '⚖️', color: '#be123c', bg: '#ffe4e6' },
  EMERGENCY: { label: 'Emergency Alert', icon: '🚨', color: '#dc2626', bg: '#fee2e2' },
  HOLIDAY: { label: 'Holiday & Vacation', icon: '🏖️', color: '#059669', bg: '#ecfdf5' },
  MESS_SPECIAL: { label: 'Mess & Dining Notice', icon: '🍽️', color: '#ea580c', bg: '#ffedd5' }
};

export default function NotificationCenter({ role = 'STUDENT' }) {
  const { authFetch, user } = useAuth();

  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState('ALL'); // ALL, UNREAD, URGENT
  const [selectedNotice, setSelectedNotice] = useState(null);
  const [readIds, setReadIds] = useState(() => {
    try {
      const storageKey = `hostelsync_read_notices_${user?.username || user?.email || 'default'}`;
      const saved = localStorage.getItem(storageKey);
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Determine endpoint based on role
  const getEndpoint = useCallback(() => {
    const userRole = role?.toUpperCase();
    if (userRole === 'ADMIN') return '/api/admin/notices';
    if (userRole === 'WARDEN') return '/api/warden/notices';
    return '/api/student/notices';
  }, [role]);

  // Fetch notices
  const fetchNotices = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const res = await authFetch(getEndpoint());
      if (res.ok) {
        const data = await res.json();
        setNotices(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.warn('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [authFetch, getEndpoint, user]);

  // Initial fetch and auto-polling every 30s
  useEffect(() => {
    fetchNotices();
    const interval = setInterval(fetchNotices, 30000);
    return () => clearInterval(interval);
  }, [fetchNotices]);

  // Save read IDs to localStorage
  const saveReadIds = (newSet) => {
    setReadIds(newSet);
    try {
      const storageKey = `hostelsync_read_notices_${user?.username || user?.email || 'default'}`;
      localStorage.setItem(storageKey, JSON.stringify(Array.from(newSet)));
    } catch (e) {
      console.error('Failed to save read notices to localStorage', e);
    }
  };

  const markAsRead = (id) => {
    if (!readIds.has(id)) {
      const next = new Set(readIds);
      next.add(id);
      saveReadIds(next);
    }
  };

  const markAllAsRead = () => {
    const next = new Set(readIds);
    notices.forEach((n) => next.add(n.id));
    saveReadIds(next);
  };

  const handleOpenNotice = (notice) => {
    markAsRead(notice.id);
    setSelectedNotice(notice);
  };

  // Derived counts
  const unreadNotices = notices.filter((n) => !readIds.has(n.id));
  const unreadCount = unreadNotices.length;
  const urgentCount = notices.filter((n) => n.priority === 'URGENT' || n.priority === 'IMPORTANT').length;
  const hasUrgentUnread = unreadNotices.some((n) => n.priority === 'URGENT');

  // Filtered list
  const filteredNotices = notices.filter((n) => {
    if (filter === 'UNREAD') return !readIds.has(n.id);
    if (filter === 'URGENT') return n.priority === 'URGENT' || n.priority === 'IMPORTANT';
    return true;
  });

  // Helper for human-readable relative time
  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    } catch {
      return '';
    }
  };

  return (
    <div className="notification-center-root" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        className={`btn-notification-bell ${hasUrgentUnread ? 'pulse-urgent' : ''}`}
        onClick={() => setIsOpen((prev) => !prev)}
        title="Hostel Notifications & Official Circulars"
        aria-label="Notifications"
        aria-expanded={isOpen}
      >
        <svg
          className="bell-icon-svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>

        {unreadCount > 0 && (
          <span className="notification-badge" aria-label={`${unreadCount} unread notifications`}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="notification-dropdown-panel" role="region" aria-label="Notifications Panel">
          <div className="notif-header">
            <div className="notif-header-title">
              <span className="notif-title-text">Hostel Circulars</span>
              {unreadCount > 0 && (
                <span className="notif-unread-pill">{unreadCount} New</span>
              )}
            </div>
            <div className="notif-header-actions">
              {unreadCount > 0 && (
                <button
                  type="button"
                  className="btn-mark-all-read"
                  onClick={markAllAsRead}
                  title="Mark all notifications as read"
                >
                  ✓ Mark all read
                </button>
              )}
              <button
                type="button"
                className="btn-refresh-notif"
                onClick={fetchNotices}
                disabled={loading}
                title="Refresh notices"
              >
                🔄
              </button>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="notif-filter-tabs">
            <button
              type="button"
              className={`filter-chip ${filter === 'ALL' ? 'active' : ''}`}
              onClick={() => setFilter('ALL')}
            >
              All ({notices.length})
            </button>
            <button
              type="button"
              className={`filter-chip ${filter === 'UNREAD' ? 'active' : ''}`}
              onClick={() => setFilter('UNREAD')}
            >
              Unread ({unreadCount})
            </button>
            <button
              type="button"
              className={`filter-chip ${filter === 'URGENT' ? 'active' : ''}`}
              onClick={() => setFilter('URGENT')}
            >
              ⚠️ Urgent ({urgentCount})
            </button>
          </div>

          {/* Notification List */}
          <div className="notif-list-container">
            {loading && notices.length === 0 ? (
              <div className="notif-empty-state">
                <span className="notif-spinner"></span>
                <span>Checking for circulars...</span>
              </div>
            ) : filteredNotices.length === 0 ? (
              <div className="notif-empty-state">
                <span className="empty-icon">📭</span>
                <p className="empty-title">
                  {filter === 'UNREAD'
                    ? 'All caught up! No unread circulars.'
                    : filter === 'URGENT'
                    ? 'No urgent notices at this time.'
                    : 'No notices posted yet.'}
                </p>
                <p className="empty-sub">Official campus announcements and directives will appear here.</p>
              </div>
            ) : (
              filteredNotices.map((n) => {
                const isRead = readIds.has(n.id);
                const meta = CATEGORY_META[n.category] || CATEGORY_META.GENERAL;
                const isUrgent = n.priority === 'URGENT';
                const isImportant = n.priority === 'IMPORTANT';

                return (
                  <div
                    key={n.id}
                    className={`notif-item ${!isRead ? 'unread' : ''} ${isUrgent ? 'item-urgent' : ''}`}
                    onClick={() => handleOpenNotice(n)}
                  >
                    {!isRead && <span className="unread-dot" title="Unread circular"></span>}
                    <div className="notif-cat-avatar" style={{ backgroundColor: meta.bg, color: meta.color }}>
                      {meta.icon}
                    </div>

                    <div className="notif-item-body">
                      <div className="notif-item-top">
                        <span className="notif-cat-badge" style={{ color: meta.color, backgroundColor: meta.bg }}>
                          {meta.label}
                        </span>
                        {isUrgent && <span className="badge-priority-urgent">🚨 URGENT</span>}
                        {isImportant && !isUrgent && <span className="badge-priority-important">⚠️ IMPORTANT</span>}
                        {n.isPinned && <span className="pinned-pin" title="Pinned Announcement">📌</span>}
                        <span className="notif-time">{formatTimeAgo(n.createdAt)}</span>
                      </div>

                      <h4 className="notif-item-title">{n.title}</h4>
                      <p className="notif-item-snippet">{n.content}</p>

                      <div className="notif-item-footer">
                        <span className="notif-author">✍️ {n.postedByName || 'Hostel Admin'}</span>
                        <span className="notif-audience-pill">{n.hostelName || 'All Hostels'}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Notice Detail Modal */}
      {selectedNotice && (
        <div className="notif-modal-backdrop" onClick={() => setSelectedNotice(null)}>
          <div className="notif-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="notif-modal-header">
              <div className="notif-modal-tags">
                <span
                  className="modal-cat-pill"
                  style={{
                    backgroundColor: CATEGORY_META[selectedNotice.category]?.bg || '#eff6ff',
                    color: CATEGORY_META[selectedNotice.category]?.color || '#2563eb'
                  }}
                >
                  {CATEGORY_META[selectedNotice.category]?.icon || '📢'}{' '}
                  {CATEGORY_META[selectedNotice.category]?.label || selectedNotice.category}
                </span>

                {selectedNotice.priority === 'URGENT' && (
                  <span className="badge-priority-urgent">🚨 URGENT DIRECTIVE</span>
                )}
                {selectedNotice.priority === 'IMPORTANT' && (
                  <span className="badge-priority-important">⚠️ IMPORTANT NOTICE</span>
                )}
                {selectedNotice.isPinned && (
                  <span className="modal-pinned-badge">📌 PINNED ON NOTICE BOARD</span>
                )}
              </div>

              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setSelectedNotice(null)}
                aria-label="Close Notice"
              >
                &times;
              </button>
            </div>

            <div className="notif-modal-body">
              <div className="official-crest-strip">
                <span className="mini-emblem">🏛️</span>
                <span className="gov-inst-title">GOVERNMENT POLYTECHNIC SAKOLI &bull; HOSTEL ADMINISTRATION</span>
              </div>

              <h2 className="modal-notice-title">{selectedNotice.title}</h2>

              <div className="modal-notice-meta">
                <div className="meta-block">
                  <span className="meta-label">Issued By</span>
                  <span className="meta-val">{selectedNotice.postedByName || 'Chief Warden / Principal'}</span>
                </div>
                <div className="meta-block">
                  <span className="meta-label">Target Residents</span>
                  <span className="meta-val">{selectedNotice.hostelName || 'All Hostel Blocks (Boys & Girls)'}</span>
                </div>
                <div className="meta-block">
                  <span className="meta-label">Date Published</span>
                  <span className="meta-val">
                    {new Date(selectedNotice.createdAt).toLocaleString('en-IN', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>

              <div className="modal-notice-content">
                {selectedNotice.content.split('\n').map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>

              <div className="official-disclaimer-box">
                <span>📋</span>
                <p>
                  This circular constitutes an official hostel notice issued by the authority of Government Polytechnic Sakoli.
                  Residents are expected to comply with instructions by the specified dates.
                </p>
              </div>
            </div>

            <div className="notif-modal-footer">
              <button
                type="button"
                className="btn-print-notice"
                onClick={() => window.print()}
              >
                🖨️ Print Circular
              </button>
              <button
                type="button"
                className="btn-modal-close"
                onClick={() => setSelectedNotice(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

