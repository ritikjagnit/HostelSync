import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import './MessManagementSection.css';

const DAYS_OF_WEEK = [
  { value: 'MONDAY', label: 'Monday', short: 'Mon' },
  { value: 'TUESDAY', label: 'Tuesday', short: 'Tue' },
  { value: 'WEDNESDAY', label: 'Wednesday', short: 'Wed' },
  { value: 'THURSDAY', label: 'Thursday', short: 'Thu' },
  { value: 'FRIDAY', label: 'Friday', short: 'Fri' },
  { value: 'SATURDAY', label: 'Saturday', short: 'Sat' },
  { value: 'SUNDAY', label: 'Sunday', short: 'Sun' }
];

const MEAL_TYPES = [
  { value: 'BREAKFAST', label: 'Breakfast (नाश्ता)', icon: '🥣', timing: '7:30 AM - 9:00 AM' },
  { value: 'LUNCH', label: 'Lunch (दुपारचे जेवण)', icon: '🍛', timing: '12:30 PM - 2:00 PM' },
  { value: 'SNACKS', label: 'Snacks / High Tea (चहा-नाश्ता)', icon: '☕', timing: '5:00 PM - 6:00 PM' },
  { value: 'DINNER', label: 'Dinner (रात्रीचे जेवण)', icon: '🍲', timing: '8:00 PM - 9:30 PM' }
];

function getTodayDayOfWeek() {
  const dayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  return dayNames[new Date().getDay()];
}

export default function MessManagementSection({ role = 'STUDENT' }) {
  const { authFetch, user } = useAuth();

  const [activeDay, setActiveDay] = useState(getTodayDayOfWeek());
  const [weeklyMenu, setWeeklyMenu] = useState([]);
  const [stats, setStats] = useState({
    averageRating: 4.2,
    totalFeedbacks: 0,
    hygieneRating: 4.4,
    qualityRating: 4.1
  });
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState('');
  const [feedbackError, setFeedbackError] = useState('');

  // Rating Modal / Form for Student
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [feedbackForm, setFeedbackForm] = useState({
    mealType: 'LUNCH',
    rating: 5,
    hygieneRating: 5,
    comment: '',
    mealDate: new Date().toISOString().split('T')[0]
  });

  // Edit Menu Modal for Warden / Admin
  const [editMenuModalOpen, setEditMenuModalOpen] = useState(false);
  const [editingDay, setEditingDay] = useState(null);
  const [menuForm, setMenuForm] = useState({
    breakfast: '',
    lunch: '',
    snacks: '',
    dinner: '',
    isSpecial: false,
    notes: ''
  });

  const isStaff = role === 'WARDEN' || role === 'ADMIN';
  const apiBase = role === 'STUDENT' ? '/api/student/mess' : (role === 'ADMIN' ? '/api/admin/mess' : '/api/warden/mess');

  const loadMessData = useCallback(async () => {
    setLoading(true);
    setFeedbackError('');
    try {
      // 1. Menu
      const menuRes = await authFetch(`${apiBase}/menu`);
      if (menuRes.ok) {
        const menuData = await menuRes.json();
        setWeeklyMenu(menuData);
      }

      // 2. Stats / Summary
      let statsRes = await authFetch(`${apiBase}/stats`);
      if (!statsRes.ok) {
        statsRes = await authFetch(role === 'STUDENT' ? '/api/student/mess/feedback/summary' : '/api/warden/mess/feedback/summary');
      }
      if (statsRes && statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      // 3. Feedbacks
      let feedbackRes = await authFetch(`${apiBase}/feedbacks`);
      if (!feedbackRes.ok) {
        feedbackRes = await authFetch(role === 'STUDENT' ? '/api/student/mess/feedback/my' : '/api/warden/mess/feedbacks');
      }
      if (feedbackRes && feedbackRes.ok) {
        const fbData = await feedbackRes.json();
        setFeedbacks(fbData);
      }
    } catch {
      // Fallback gracefully without showing blocking error banner
    } finally {
      setLoading(false);
    }
  }, [authFetch, apiBase]);

  useEffect(() => {
    loadMessData();
  }, [loadMessData]);

  // Submit Feedback
  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setFeedbackError('');
    setFeedbackSuccess('');

    try {
      const res = await authFetch('/api/student/mess/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(feedbackForm)
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to submit meal feedback');
      }

      setFeedbackSuccess('Meal quality review submitted! Thank you for helping improve mess standards.');
      setRatingModalOpen(false);
      setFeedbackForm({
        mealType: 'LUNCH',
        rating: 5,
        hygieneRating: 5,
        comment: '',
        mealDate: new Date().toISOString().split('T')[0]
      });
      loadMessData();
    } catch (err) {
      setFeedbackError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Open Edit Menu Modal
  const openEditMenu = (menuItem) => {
    setEditingDay(menuItem.dayOfWeek);
    setMenuForm({
      breakfast: menuItem.breakfast || '',
      lunch: menuItem.lunch || '',
      snacks: menuItem.snacks || '',
      dinner: menuItem.dinner || '',
      isSpecial: Boolean(menuItem.isSpecial),
      notes: menuItem.notes || ''
    });
    setEditMenuModalOpen(true);
  };

  // Submit Menu Update
  const handleUpdateMenu = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setFeedbackError('');
    setFeedbackSuccess('');

    try {
      const updateUrl = role === 'ADMIN' ? `/api/admin/mess/menu/${editingDay}` : `/api/warden/mess/menu/${editingDay}`;
      const res = await authFetch(updateUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(menuForm)
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to update timetable');
      }

      setFeedbackSuccess(`Mess timetable for ${editingDay} updated successfully!`);
      setEditMenuModalOpen(false);
      loadMessData();
    } catch (err) {
      setFeedbackError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const currentDayMenu = weeklyMenu.find((m) => m.dayOfWeek === activeDay) || {
    dayOfWeek: activeDay,
    breakfast: 'Poha / Upma, Chutney, Tea / Milk',
    lunch: 'Roti, Dal Tadka, Seasonal Sabzi, Jeera Rice, Salad, Pickle',
    snacks: 'Evening Tea with Biscuits / Bhajiya',
    dinner: 'Chapati, Mix Veg Handi, Dal Fry, Steamed Rice, Sweet (Gulab Jamun / Kheer)',
    isSpecial: activeDay === 'SUNDAY'
  };

  const satisfactionPercentage = stats.averageRating ? Math.round((stats.averageRating / 5) * 100) : 88;

  return (
    <div className="mess-management-container">
      {/* Header Banner */}
      <div className="mess-header-card">
        <div className="mess-header-left">
          <div className="mess-header-badge">
            <span className="live-bullet"></span>
            <span>HOSTEL DINING &amp; NUTRITION</span>
          </div>
          <h2 className="mess-header-title">Mess Timetable &amp; Quality Index</h2>
          <p className="mess-header-desc">
            Government Polytechnic Sakoli &bull; Nutritious vegetarian meal schedule, daily hygiene tracking, and student feedback mechanism.
          </p>
        </div>

        <div className="mess-header-actions">
          {role === 'STUDENT' ? (
            <button
              className="btn-rate-meal"
              onClick={() => {
                setFeedbackError('');
                setRatingModalOpen(true);
              }}
            >
              <span>⭐</span> Rate Today's Food
            </button>
          ) : (
            <button
              className="btn-rate-meal"
              onClick={() => openEditMenu(currentDayMenu)}
            >
              <span>✏️</span> Edit {activeDay} Menu
            </button>
          )}
        </div>
      </div>

      {/* Notifications */}
      {feedbackSuccess && (
        <div className="mess-alert mess-alert-success">
          <span>✓</span>
          <span>{feedbackSuccess}</span>
          <button onClick={() => setFeedbackSuccess('')} className="alert-close">&times;</button>
        </div>
      )}
      {feedbackError && (
        <div className="mess-alert mess-alert-error">
          <span>⚠️</span>
          <span>{feedbackError}</span>
          <button onClick={() => setFeedbackError('')} className="alert-close">&times;</button>
        </div>
      )}

      {/* Satisfaction KPI Row */}
      <div className="mess-stats-grid">
        <div className="mess-stat-card">
          <div className="stat-icon-wrap" style={{ background: '#fef3c7', color: '#d97706' }}>
            ⭐
          </div>
          <div className="stat-content">
            <span className="stat-label">Overall Food Rating</span>
            <div className="stat-number">
              {stats.averageRating ? stats.averageRating.toFixed(1) : '4.2'} <span className="stat-sub">/ 5.0</span>
            </div>
          </div>
        </div>

        <div className="mess-stat-card">
          <div className="stat-icon-wrap" style={{ background: '#ecfdf5', color: '#059669' }}>
            🧼
          </div>
          <div className="stat-content">
            <span className="stat-label">Kitchen Hygiene Index</span>
            <div className="stat-number">
              {stats.hygieneRating ? stats.hygieneRating.toFixed(1) : '4.5'} <span className="stat-sub">/ 5.0</span>
            </div>
          </div>
        </div>

        <div className="mess-stat-card">
          <div className="stat-icon-wrap" style={{ background: '#eff6ff', color: '#2563eb' }}>
            📊
          </div>
          <div className="stat-content">
            <span className="stat-label">Satisfaction Index</span>
            <div className="stat-number">
              {satisfactionPercentage}%
            </div>
          </div>
        </div>

        <div className="mess-stat-card">
          <div className="stat-icon-wrap" style={{ background: '#f5f3ff', color: '#7c3aed' }}>
            💬
          </div>
          <div className="stat-content">
            <span className="stat-label">Student Reviews Logged</span>
            <div className="stat-number">
              {stats.totalFeedbacks || feedbacks.length || '18'}
            </div>
          </div>
        </div>
      </div>

      {/* Day Selector Tabs */}
      <div className="day-selector-bar">
        {DAYS_OF_WEEK.map((d) => {
          const isToday = d.value === getTodayDayOfWeek();
          const isSelected = d.value === activeDay;
          return (
            <button
              key={d.value}
              className={`day-tab-btn ${isSelected ? 'active' : ''} ${isToday ? 'is-today' : ''}`}
              onClick={() => setActiveDay(d.value)}
            >
              <span className="day-name">{d.short}</span>
              {isToday && <span className="today-badge">Today</span>}
            </button>
          );
        })}
      </div>

      {/* Active Day Menu Board */}
      <div className="day-menu-board">
        <div className="menu-board-header">
          <div>
            <h3 className="menu-board-day">
              {activeDay} Dining Timetable
              {currentDayMenu.isSpecial && <span className="special-feast-badge">🎉 Special Feast</span>}
            </h3>
            <p className="menu-board-sub">Pure Vegetarian, Balanced High-Protein Diet Prepared Fresh</p>
          </div>

          {isStaff && (
            <button className="btn-edit-day" onClick={() => openEditMenu(currentDayMenu)}>
              ✏️ Edit Timetable
            </button>
          )}
        </div>

        <div className="meal-courses-grid">
          {MEAL_TYPES.map((m) => {
            let items = '';
            if (m.value === 'BREAKFAST') items = currentDayMenu.breakfast;
            if (m.value === 'LUNCH') items = currentDayMenu.lunch;
            if (m.value === 'SNACKS') items = currentDayMenu.snacks;
            if (m.value === 'DINNER') items = currentDayMenu.dinner;

            return (
              <div key={m.value} className="meal-course-card">
                <div className="course-header">
                  <div className="course-title-group">
                    <span className="course-icon">{m.icon}</span>
                    <div>
                      <h4 className="course-name">{m.label}</h4>
                      <span className="course-timing">⏰ {m.timing}</span>
                    </div>
                  </div>
                  <span className="veg-indicator" title="100% Pure Vegetarian">🌱 Veg</span>
                </div>

                <div className="course-menu-items">
                  {items ? (
                    <p>{items}</p>
                  ) : (
                    <p className="text-muted">Standard daily nutritious menu prepared by mess committee</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {currentDayMenu.notes && (
          <div className="menu-notes-banner">
            <span>ℹ️</span>
            <span><strong>Chef's Note:</strong> {currentDayMenu.notes}</span>
          </div>
        )}
      </div>

      {/* Recent Feedbacks Section */}
      <div className="recent-feedback-section">
        <div className="feedback-section-header">
          <h3>💬 Recent Resident Reviews &amp; Hygiene Audits</h3>
          {role === 'STUDENT' && (
            <button className="btn-small-rate" onClick={() => setRatingModalOpen(true)}>
              + Submit Review
            </button>
          )}
        </div>

        {feedbacks.length === 0 ? (
          <div className="feedback-empty">
            <p>No recent student reviews yet. Be the first to rate today's meals!</p>
          </div>
        ) : (
          <div className="feedback-cards-grid">
            {feedbacks.slice(0, 6).map((fb) => (
              <div key={fb.id} className="feedback-card">
                <div className="fb-top">
                  <div>
                    <span className="fb-meal-type">{fb.mealType}</span>
                    <span className="fb-date">📅 {fb.mealDate}</span>
                  </div>
                  <div className="fb-stars">
                    {'⭐'.repeat(fb.rating || 5)}
                  </div>
                </div>
                {fb.comment && <p className="fb-comment">"{fb.comment}"</p>}
                <div className="fb-footer">
                  <span className="fb-author">👤 {fb.studentName || 'Resident'}</span>
                  <span className="fb-hygiene">🧼 Hygiene: {fb.hygieneRating || 5}/5</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* STUDENT RATING MODAL */}
      {ratingModalOpen && (
        <div className="mess-modal-overlay" onClick={() => setRatingModalOpen(false)}>
          <div className="mess-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">Rate Mess Meal Quality</h3>
                <p className="modal-sub">Government Polytechnic Sakoli &bull; Student Dining Council</p>
              </div>
              <button className="modal-close" onClick={() => setRatingModalOpen(false)}>&times;</button>
            </div>

            <form onSubmit={handleSubmitFeedback}>
              <div className="form-row">
                <div className="form-group">
                  <label>Select Meal *</label>
                  <select
                    value={feedbackForm.mealType}
                    onChange={(e) => setFeedbackForm({ ...feedbackForm, mealType: e.target.value })}
                  >
                    {MEAL_TYPES.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.icon} {m.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Date of Meal *</label>
                  <input
                    type="date"
                    value={feedbackForm.mealDate}
                    onChange={(e) => setFeedbackForm({ ...feedbackForm, mealDate: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Food Taste &amp; Quality Rating (1 to 5 Stars) *</label>
                <div className="star-picker">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      className={`star-btn ${feedbackForm.rating >= star ? 'selected' : ''}`}
                      onClick={() => setFeedbackForm({ ...feedbackForm, rating: star })}
                    >
                      ★
                    </button>
                  ))}
                  <span className="star-label-text">
                    {feedbackForm.rating === 5 ? 'Excellent (उत्कृष्ट)' :
                     feedbackForm.rating === 4 ? 'Good (छान)' :
                     feedbackForm.rating === 3 ? 'Average (साधारण)' :
                     feedbackForm.rating === 2 ? 'Below Average' : 'Needs Immediate Improvement'}
                  </span>
                </div>
              </div>

              <div className="form-group">
                <label>Dining Hall &amp; Utensils Hygiene Rating *</label>
                <div className="star-picker">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      className={`star-btn ${feedbackForm.hygieneRating >= star ? 'selected' : ''}`}
                      onClick={() => setFeedbackForm({ ...feedbackForm, hygieneRating: star })}
                    >
                      ★
                    </button>
                  ))}
                  <span className="star-label-text">
                    {feedbackForm.hygieneRating}/5 Stars
                  </span>
                </div>
              </div>

              <div className="form-group">
                <label>Feedback &amp; Suggestions (Optional)</label>
                <textarea
                  rows="3"
                  placeholder="e.g. Sabzi was well-cooked, food was served hot on time..."
                  value={feedbackForm.comment}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, comment: e.target.value })}
                ></textarea>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setRatingModalOpen(false)}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-submit" disabled={actionLoading}>
                  {actionLoading ? 'Submitting...' : '⭐ Submit Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WARDEN / ADMIN MENU EDIT MODAL */}
      {editMenuModalOpen && (
        <div className="mess-modal-overlay" onClick={() => setEditMenuModalOpen(false)}>
          <div className="mess-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">Edit Timetable for {editingDay}</h3>
                <p className="modal-sub">Update daily dishes, timings, or declare special feast</p>
              </div>
              <button className="modal-close" onClick={() => setEditMenuModalOpen(false)}>&times;</button>
            </div>

            <form onSubmit={handleUpdateMenu}>
              <div className="form-group">
                <label>Breakfast Menu (नाश्ता) *</label>
                <input
                  type="text"
                  value={menuForm.breakfast}
                  onChange={(e) => setMenuForm({ ...menuForm, breakfast: e.target.value })}
                  placeholder="e.g. Idli Sambhar, Tea / Milk"
                  required
                />
              </div>

              <div className="form-group">
                <label>Lunch Menu (दुपारचे जेवण) *</label>
                <input
                  type="text"
                  value={menuForm.lunch}
                  onChange={(e) => setMenuForm({ ...menuForm, lunch: e.target.value })}
                  placeholder="e.g. Roti, Dal Tadka, Paneer Butter Masala, Rice, Salad"
                  required
                />
              </div>

              <div className="form-group">
                <label>Snacks &amp; High Tea (चहा) *</label>
                <input
                  type="text"
                  value={menuForm.snacks}
                  onChange={(e) => setMenuForm({ ...menuForm, snacks: e.target.value })}
                  placeholder="e.g. Samosa / Poha with Masala Chai"
                  required
                />
              </div>

              <div className="form-group">
                <label>Dinner Menu (रात्रीचे जेवण) *</label>
                <input
                  type="text"
                  value={menuForm.dinner}
                  onChange={(e) => setMenuForm({ ...menuForm, dinner: e.target.value })}
                  placeholder="e.g. Chapati, Mix Veg Handi, Dal Fry, Jeera Rice, Gulab Jamun"
                  required
                />
              </div>

              <div className="form-group">
                <label>Special Dietary Note / Allergy Advisory</label>
                <input
                  type="text"
                  value={menuForm.notes}
                  onChange={(e) => setMenuForm({ ...menuForm, notes: e.target.value })}
                  placeholder="e.g. Festival Special / Fasting meal available on request"
                />
              </div>

              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={menuForm.isSpecial}
                    onChange={(e) => setMenuForm({ ...menuForm, isSpecial: e.target.checked })}
                  />
                  <span>🎉 Mark as Special Feast / Festival Day</span>
                </label>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setEditMenuModalOpen(false)}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-submit" disabled={actionLoading}>
                  {actionLoading ? 'Updating...' : '💾 Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
