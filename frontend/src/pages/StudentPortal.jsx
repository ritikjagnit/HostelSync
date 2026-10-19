import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import ImageWithFallback from '../components/ImageWithFallback';
import StudentComplaintSection from '../components/StudentComplaintSection';
import { MEDIA_REGISTRY, getHostelImage } from '../config/media';
import './PortalCommon.css';
import './StudentPortal.css';

function getCurrentYearMonth() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export default function StudentPortal() {
  const { user, logout, authFetch } = useAuth();

  // Tab State: 'overview' | 'my-room' | 'allocations' | 'profile' | 'attendance'
  const [activeTab, setActiveTab] = useState('overview');

  // Data States
  const [dashboardData, setDashboardData] = useState(null);
  const [allocations, setAllocations] = useState([]);
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [loadingAllocations, setLoadingAllocations] = useState(false);

  // Attendance States
  const [selectedMonth, setSelectedMonth] = useState(getCurrentYearMonth());
  const [attendanceSummary, setAttendanceSummary] = useState(null);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [loadingAttendanceSummary, setLoadingAttendanceSummary] = useState(false);
  const [loadingAttendanceHistory, setLoadingAttendanceHistory] = useState(false);
  const [historyFilterStatus, setHistoryFilterStatus] = useState('ALL');
  const [historyDateFrom, setHistoryDateFrom] = useState('');
  const [historyDateTo, setHistoryDateTo] = useState('');

  // Profile Edit Modal State
  const [editPhoneModalOpen, setEditPhoneModalOpen] = useState(false);
  const [phoneInput, setPhoneInput] = useState('');
  const [savingPhone, setSavingPhone] = useState(false);

  // Feedback States
  const [feedbackSuccess, setFeedbackSuccess] = useState('');
  const [feedbackError, setFeedbackError] = useState('');


  const clearFeedback = () => {
    setFeedbackSuccess('');
    setFeedbackError('');
  };

  // Load Dashboard Data
  const loadDashboard = useCallback(() => {
    let isMounted = true;
    authFetch('/api/student/dashboard')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load student dashboard');
        return res.json();
      })
      .then((data) => {
        if (!isMounted) return;
        setDashboardData(data);
        if (data.profile?.phone) {
          setPhoneInput(data.profile.phone);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setFeedbackError(err.message || 'Unable to fetch student profile data');
      })
      .finally(() => {
        if (isMounted) setLoadingDashboard(false);
      });

    return () => {
      isMounted = false;
    };
  }, [authFetch]);

  // Load Allocation History
  const loadAllocations = useCallback(() => {
    let isMounted = true;
    setLoadingAllocations(true);
    authFetch('/api/student/allocations')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load room allocation records');
        return res.json();
      })
      .then((data) => {
        if (!isMounted) return;
        setAllocations(data);
      })
      .catch((err) => {
        if (!isMounted) return;
        setFeedbackError(err.message || 'Unable to fetch room allocation history');
      })
      .finally(() => {
        if (isMounted) setLoadingAllocations(false);
      });

    return () => {
      isMounted = false;
    };
  }, [authFetch]);

  // Load Attendance Monthly Summary
  const loadAttendanceSummary = useCallback((month = selectedMonth) => {
    let isMounted = true;
    setLoadingAttendanceSummary(true);
    const query = month ? `?month=${month}` : '';
    authFetch(`/api/student/attendance/summary${query}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load attendance summary');
        return res.json();
      })
      .then((data) => {
        if (!isMounted) return;
        setAttendanceSummary(data);
      })
      .catch((err) => {
        if (!isMounted) return;
        setFeedbackError(err.message || 'Unable to fetch monthly attendance summary');
      })
      .finally(() => {
        if (isMounted) setLoadingAttendanceSummary(false);
      });

    return () => {
      isMounted = false;
    };
  }, [authFetch, selectedMonth]);

  // Load Personal Attendance History
  const loadAttendanceHistory = useCallback((from = historyDateFrom, to = historyDateTo, status = historyFilterStatus) => {
    let isMounted = true;
    setLoadingAttendanceHistory(true);
    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    if (status && status !== 'ALL') params.append('status', status);

    const queryStr = params.toString() ? `?${params.toString()}` : '';
    authFetch(`/api/student/attendance/history${queryStr}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load attendance history records');
        return res.json();
      })
      .then((data) => {
        if (!isMounted) return;
        setAttendanceHistory(data);
      })
      .catch((err) => {
        if (!isMounted) return;
        setFeedbackError(err.message || 'Unable to fetch attendance history');
      })
      .finally(() => {
        if (isMounted) setLoadingAttendanceHistory(false);
      });

    return () => {
      isMounted = false;
    };
  }, [authFetch, historyDateFrom, historyDateTo, historyFilterStatus]);

  // Initial Load
  useEffect(() => {
    const cleanupDashboard = loadDashboard();
    return cleanupDashboard;
  }, [loadDashboard]);

  // Tab Switch Handler
  const handleTabChange = (tab) => {
    clearFeedback();
    setActiveTab(tab);
    if (tab === 'allocations') {
      loadAllocations();
    } else if (tab === 'attendance') {
      loadAttendanceSummary(selectedMonth);
      loadAttendanceHistory(historyDateFrom, historyDateTo, historyFilterStatus);
    }
  };

  const handleAttendanceMonthChange = (newMonth) => {
    setSelectedMonth(newMonth);
    loadAttendanceSummary(newMonth);
  };

  const handleStudentHistorySearch = (e) => {
    if (e) e.preventDefault();
    clearFeedback();
    loadAttendanceHistory(historyDateFrom, historyDateTo, historyFilterStatus);
  };

  const handleStudentHistoryReset = () => {
    clearFeedback();
    setHistoryDateFrom('');
    setHistoryDateTo('');
    setHistoryFilterStatus('ALL');
    loadAttendanceHistory('', '', 'ALL');
  };


  // Open Edit Phone Modal
  const openEditPhoneModal = () => {
    clearFeedback();
    setPhoneInput(dashboardData?.profile?.phone || '');
    setEditPhoneModalOpen(true);
  };

  // Submit Phone Number Update
  const handlePhoneUpdateSubmit = async (e) => {
    e.preventDefault();
    clearFeedback();

    const trimmedPhone = phoneInput.trim();
    if (!trimmedPhone) {
      setFeedbackError('Phone number cannot be blank.');
      return;
    }
    const phoneRegex = /^[0-9+\-\s()]{7,20}$/;
    if (!phoneRegex.test(trimmedPhone)) {
      setFeedbackError('Please enter a valid phone number (between 7 and 20 digits/symbols).');
      return;
    }

    setSavingPhone(true);
    try {
      const res = await authFetch('/api/student/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: trimmedPhone })
      });

      const updatedProfile = await res.json();
      if (!res.ok) {
        throw new Error(updatedProfile.message || 'Failed to update phone number');
      }

      setFeedbackSuccess('Contact phone number updated successfully!');
      setDashboardData((prev) => (prev ? { ...prev, profile: updatedProfile } : prev));
      setEditPhoneModalOpen(false);
    } catch (err) {
      setFeedbackError(err.message);
    } finally {
      setSavingPhone(false);
    }
  };

  const profile = dashboardData?.profile;
  const currentRoom = dashboardData?.currentRoom;
  const roomAllocated = dashboardData?.roomAllocated;

  return (
    <div className="student-portal-wrapper">
      <div className="container">
        {/* Portal Header */}
        <div className="card student-header-card">
          <div>
            <div className="student-welcome-badge">
              <span className="badge badge-primary">Student Resident</span>
              <span className="badge badge-success">Active Account</span>
            </div>
            <h1 className="student-portal-title">
              {profile ? profile.fullName : user?.fullName || 'Student Resident'}
            </h1>
            <p className="student-portal-subtitle">
              Government Polytechnic Sakoli &bull; {profile ? `${profile.course} (Semester ${profile.semester})` : 'Diploma Engineering'}
              {profile?.enrollmentNumber ? ` &bull; Enrollment: ${profile.enrollmentNumber}` : ''}
            </p>
          </div>

          <div className="student-header-actions">
            <button
              id="btn-student-logout"
              onClick={logout}
              className="btn btn-secondary"
              title="Sign out of student account"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Global Feedback Notifications */}
        {feedbackSuccess && (
          <div className="student-alert-success" role="alert">
            <span>&#10003;</span>
            <div>{feedbackSuccess}</div>
          </div>
        )}
        {feedbackError && (
          <div className="student-alert-error" role="alert">
            <span>&#9888;</span>
            <div>{feedbackError}</div>
          </div>
        )}

        {/* Tab Navigation */}
        <nav className="student-tabs-nav" aria-label="Student Portal Navigation">
          <button
            id="tab-student-overview"
            className={`student-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => handleTabChange('overview')}
          >
            <span>&#128187;</span> Dashboard Overview
          </button>
          <button
            id="tab-student-room"
            className={`student-tab-btn ${activeTab === 'my-room' ? 'active' : ''}`}
            onClick={() => handleTabChange('my-room')}
          >
            <span>&#128716;</span> My Room
          </button>
          <button
            id="tab-student-history"
            className={`student-tab-btn ${activeTab === 'allocations' ? 'active' : ''}`}
            onClick={() => handleTabChange('allocations')}
          >
            <span>&#128220;</span> Allocation History
          </button>
          <button
            id="tab-student-attendance"
            className={`student-tab-btn ${activeTab === 'attendance' ? 'active' : ''}`}
            onClick={() => handleTabChange('attendance')}
          >
            <span>&#128197;</span> My Attendance
          </button>
          <button
            id="tab-student-complaints"
            className={`student-tab-btn ${activeTab === 'complaints' ? 'active' : ''}`}
            onClick={() => handleTabChange('complaints')}
          >
            <span>&#128295;</span> Maintenance &amp; Grievances
          </button>
          <button
            id="tab-student-profile"
            className={`student-tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => handleTabChange('profile')}
          >
            <span>&#128100;</span> My Profile
          </button>
        </nav>

        {/* ============================================================= */}
        {/* TAB 1: DASHBOARD OVERVIEW                                      */}
        {/* ============================================================= */}
        {activeTab === 'overview' && (
          <div>
            {loadingDashboard ? (
              <div style={{ textAlign: 'center', padding: '3rem 0' }}>
                <span className="spinner"></span>
                <p style={{ marginTop: '1rem', color: 'var(--slate-500)' }}>Loading resident dashboard...</p>
              </div>
            ) : (
              <>
                {/* 4 Stat Cards */}
                <div className="student-stats-grid">
                  {/* Housing Status */}
                  <div className="student-stat-card">
                    <div className="stat-card-header">
                      <span className="stat-card-title">Housing Status</span>
                      {roomAllocated ? (
                        <span className="status-badge-active">Allocated</span>
                      ) : (
                        <span className="status-badge-completed">Not Allocated</span>
                      )}
                    </div>
                    <div className="stat-card-value">
                      {roomAllocated ? `Room ${currentRoom?.roomNumber}` : 'Pending'}
                    </div>
                    <div className="stat-card-detail">
                      {roomAllocated
                        ? `${currentRoom?.hostelName} (Floor ${currentRoom?.floor})`
                        : 'No active bed allocation on file'}
                    </div>
                  </div>

                  {/* Academic Standing */}
                  <div className="student-stat-card">
                    <div className="stat-card-header">
                      <span className="stat-card-title">Academic Branch</span>
                      <span className="badge badge-primary">Semester {profile?.semester || '-'}</span>
                    </div>
                    <div className="stat-card-value" style={{ fontSize: '1.25rem' }}>
                      {profile?.course || 'Diploma Engineering'}
                    </div>
                    <div className="stat-card-detail">
                      Govt. Polytechnic Sakoli
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="student-stat-card">
                    <div className="stat-card-header">
                      <span className="stat-card-title">Registered Phone</span>
                      <button
                        onClick={openEditPhoneModal}
                        className="badge badge-primary"
                        style={{ border: 'none', cursor: 'pointer' }}
                        title="Edit phone number"
                      >
                        Edit
                      </button>
                    </div>
                    <div className="stat-card-value" style={{ fontSize: '1.35rem' }}>
                      {profile?.phone || 'Not Registered'}
                    </div>
                    <div className="stat-card-detail">
                      {profile?.email || user?.email}
                    </div>
                  </div>

                  {/* Allocation Count */}
                  <div className="student-stat-card">
                    <div className="stat-card-header">
                      <span className="stat-card-title">Residential Records</span>
                      <span className="badge badge-secondary">All Time</span>
                    </div>
                    <div className="stat-card-value">
                      {dashboardData?.totalAllocationsCount || 0}
                    </div>
                    <div className="stat-card-detail">
                      Total historical room allotments
                    </div>
                  </div>
                </div>

                {/* Current Room Quick Banner or Empty Banner */}
                {roomAllocated && currentRoom ? (
                  <div className="student-accommodation-banner">
                    <div className="accommodation-banner-media">
                      <ImageWithFallback
                        src={getHostelImage(currentRoom.hostelName, currentRoom.hostelType).src}
                        fallbackSrc={getHostelImage(currentRoom.hostelName, currentRoom.hostelType).fallbackSrc}
                        alt={`${currentRoom.hostelName} accommodation`}
                        className="accommodation-banner-img"
                      />
                      <div className="accommodation-banner-overlay"></div>
                      <span className="badge badge-success accommodation-banner-badge">
                        Active Residence
                      </span>
                    </div>
                    <div className="accommodation-banner-content">
                      <div className="accommodation-banner-header">
                        <div>
                          <span className="accommodation-hostel-tag">{currentRoom.hostelType} HOSTEL &bull; FLOOR {currentRoom.floor}</span>
                          <h2 className="accommodation-room-title">
                            Room {currentRoom.roomNumber} &bull; {currentRoom.hostelName}
                          </h2>
                          <p className="accommodation-address">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: '2px' }}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                            <span>{currentRoom.hostelAddress || 'Government Polytechnic Sakoli Campus'}</span>
                          </p>
                        </div>
                        <div className="accommodation-alloc-date">
                          <span className="alloc-label">Allocated On</span>
                          <span className="alloc-val">{currentRoom.allocationDate}</span>
                        </div>
                      </div>

                      <div className="accommodation-metrics-pills">
                        <div className="acc-pill">
                          <span className="acc-pill-lbl">Capacity</span>
                          <span className="acc-pill-val">{currentRoom.capacity} Beds</span>
                        </div>
                        <div className="acc-pill">
                          <span className="acc-pill-lbl">Occupants</span>
                          <span className="acc-pill-val">{currentRoom.currentOccupancy} Active</span>
                        </div>
                        <div className="acc-pill">
                          <span className="acc-pill-lbl">Vacant</span>
                          <span className="acc-pill-val" style={{ color: currentRoom.availableBeds > 0 ? 'var(--accent-emerald-600)' : 'inherit' }}>
                            {currentRoom.availableBeds} Beds
                          </span>
                        </div>
                      </div>

                      <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                          id="btn-goto-room"
                          onClick={() => handleTabChange('my-room')}
                          className="btn btn-primary btn-sm"
                        >
                          View Room Details &rarr;
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="empty-state-panel">
                    <div className="empty-state-icon">&#127968;</div>
                    <h2 className="empty-state-title">Room Not Allocated Yet</h2>
                    <p className="empty-state-desc">
                      You do not have an active hostel room allocation at this time. Room allotments are administered by the hostel office according to institutional guidelines and availability.
                    </p>
                    <button
                      onClick={() => handleTabChange('profile')}
                      className="btn btn-secondary"
                    >
                      Verify Contact Information
                    </button>
                  </div>
                )}

                {/* Guidelines & Institutional Notice */}
                <div className="guidelines-box">
                  <h3 className="guidelines-title">Institutional Resident Guidelines</h3>
                  <ul className="guidelines-list">
                    <li>Hostel curfew is strictly observed at 9:00 PM on all campus instructional days.</li>
                    <li>Ensure your registered contact phone number is always current for emergency notifications.</li>
                    <li>Room allocations and bed assignments are non-transferable and strictly managed by the administration.</li>
                    <li>For hostel room maintenance, please contact the Hostel Warden office during working hours.</li>
                  </ul>
                </div>
              </>
            )}
          </div>
        )}

        {/* ============================================================= */}
        {/* TAB 2: MY ROOM                                                */}
        {/* ============================================================= */}
        {activeTab === 'my-room' && (
          <div>
            {loadingDashboard ? (
              <div style={{ textAlign: 'center', padding: '3rem 0' }}>
                <span className="spinner"></span>
                <p style={{ marginTop: '1rem', color: 'var(--slate-500)' }}>Loading room assignment details...</p>
              </div>
            ) : roomAllocated && currentRoom ? (
              <div className="room-showcase-card">
                <div className="room-showcase-photo-banner">
                  <ImageWithFallback
                    src={MEDIA_REGISTRY.roomInterior.src}
                    fallbackSrc={MEDIA_REGISTRY.roomInterior.fallbackSrc}
                    alt={MEDIA_REGISTRY.roomInterior.alt}
                    className="room-showcase-bg-img"
                  />
                  <div className="room-showcase-photo-overlay"></div>
                  <div className="room-showcase-photo-content">
                    <div className="room-showcase-header-top">
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span className="badge badge-gold" style={{ background: 'rgba(255, 255, 255, 0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.4)' }}>
                          {currentRoom.hostelType} HOSTEL
                        </span>
                        <span className="status-badge-active">ACTIVE RESIDENCE</span>
                      </div>
                      <div className="room-allotted-since">
                        <span className="allotted-lbl">Allotted Since</span>
                        <span className="allotted-date">{currentRoom.allocationDate}</span>
                      </div>
                    </div>
                    <h2 className="room-hero-title">
                      Room {currentRoom.roomNumber} &bull; {currentRoom.hostelName}
                    </h2>
                    <p className="room-hero-subtitle">
                      Campus Address: {currentRoom.hostelAddress || 'Government Polytechnic Sakoli Campus'}
                    </p>
                  </div>
                </div>

                <div className="room-showcase-body">
                  <h3 style={{ fontSize: '1.125rem', color: 'var(--primary-900)', marginBottom: '1.25rem' }}>
                    Room Specifications & Live Bed Metrics
                  </h3>

                  <div className="room-metrics-row">
                    <div className="room-metric-box">
                      <div className="metric-label">Room Number</div>
                      <div className="metric-value">{currentRoom.roomNumber}</div>
                    </div>
                    <div className="room-metric-box">
                      <div className="metric-label">Floor Level</div>
                      <div className="metric-value">
                        {currentRoom.floor === 0 ? 'Ground' : `Floor ${currentRoom.floor}`}
                      </div>
                    </div>
                    <div className="room-metric-box">
                      <div className="metric-label">Total Bed Capacity</div>
                      <div className="metric-value">{currentRoom.capacity} Beds</div>
                    </div>
                    <div className="room-metric-box">
                      <div className="metric-label">Current Occupancy</div>
                      <div className="metric-value">{currentRoom.currentOccupancy} Active</div>
                    </div>
                    <div className="room-metric-box">
                      <div className="metric-label">Available Beds</div>
                      <div className="metric-value" style={{ color: currentRoom.availableBeds > 0 ? '#16a34a' : '#dc2626' }}>
                        {currentRoom.availableBeds} Vacant
                      </div>
                    </div>
                  </div>

                  <div className="guidelines-box" style={{ marginTop: '1rem' }}>
                    <h4 className="guidelines-title">Room Occupancy & Maintenance Policy</h4>
                    <p style={{ fontSize: '0.875rem', color: 'var(--slate-600)', margin: 0, lineHeight: '1.6' }}>
                      Bed allocations are registered to your verified institutional identity (Enrollment: {profile?.enrollmentNumber}). Vacating or re-allocating requires administrative completion and checkout by the Hostel Office.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="empty-state-panel">
                <div className="empty-state-icon">&#128716;</div>
                <h2 className="empty-state-title">No Active Room Allocation</h2>
                <p className="empty-state-desc">
                  You do not have an active hostel bed assignment. If you have submitted an application for hostel accommodation, please check with the hostel warden office for your allotment status.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ============================================================= */}
        {/* TAB 3: ALLOCATION HISTORY                                     */}
        {/* ============================================================= */}
        {activeTab === 'allocations' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', color: 'var(--primary-900)', margin: 0 }}>
                  Residential Allocation History
                </h2>
                <p style={{ fontSize: '0.875rem', color: 'var(--slate-500)', margin: '0.25rem 0 0' }}>
                  Complete historical record of all room allotments and checkout records
                </p>
              </div>
              <button
                onClick={loadAllocations}
                className="btn btn-secondary"
                disabled={loadingAllocations}
              >
                {loadingAllocations ? 'Refreshing...' : 'Refresh Records'}
              </button>
            </div>

            {loadingAllocations ? (
              <div style={{ textAlign: 'center', padding: '3rem 0' }}>
                <span className="spinner"></span>
                <p style={{ marginTop: '1rem', color: 'var(--slate-500)' }}>Loading historical records...</p>
              </div>
            ) : allocations.length === 0 ? (
              <div className="empty-state-panel">
                <div className="empty-state-icon">&#128220;</div>
                <h2 className="empty-state-title">No Allocation History Found</h2>
                <p className="empty-state-desc">
                  There are no past or active room allocations associated with your student account.
                </p>
              </div>
            ) : (
              <div className="student-data-table-wrap">
                <table className="student-data-table">
                  <thead>
                    <tr>
                      <th>Allocation ID</th>
                      <th>Hostel Building</th>
                      <th>Room & Floor</th>
                      <th>Allotted Date</th>
                      <th>Vacated Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allocations.map((alloc) => (
                      <tr key={alloc.id}>
                        <td>
                          <strong>#{alloc.id}</strong>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--slate-800)' }}>{alloc.hostelName}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>{alloc.hostelType} Hostel</div>
                        </td>
                        <td>
                          Room <strong>{alloc.roomNumber}</strong> (Floor {alloc.floor})
                        </td>
                        <td>{alloc.allocationDate}</td>
                        <td>
                          {alloc.vacatingDate ? (
                            alloc.vacatingDate
                          ) : alloc.status === 'ACTIVE' ? (
                            <span style={{ color: '#16a34a', fontWeight: 600 }}>Currently Occupying</span>
                          ) : (
                            'N/A'
                          )}
                        </td>
                        <td>
                          {alloc.status === 'ACTIVE' ? (
                            <span className="status-badge-active">ACTIVE</span>
                          ) : (
                            <span className="status-badge-completed">COMPLETED</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ============================================================= */}
        {/* TAB 4: MY PROFILE                                             */}
        {/* ============================================================= */}
        {activeTab === 'profile' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', color: 'var(--primary-900)', margin: 0 }}>
                  Verified Resident Profile
                </h2>
                <p style={{ fontSize: '0.875rem', color: 'var(--slate-500)', margin: '0.25rem 0 0' }}>
                  Academic records and editable personal contact information
                </p>
              </div>

              <button
                id="btn-edit-phone"
                onClick={openEditPhoneModal}
                className="btn btn-primary"
              >
                &#9998; Update Phone Number
              </button>
            </div>

            <div className="profile-card-grid">
              {/* Card 1: Academic & Registration Identity */}
              <div className="card">
                <h3 style={{ fontSize: '1.1rem', color: 'var(--primary-900)', marginBottom: '1rem' }}>
                  Institutional Academic Records
                </h3>

                <div className="portal-info-item">
                  <span className="info-label">Full Name:</span>
                  <span className="info-value">{profile?.fullName}</span>
                </div>

                <div className="portal-info-item">
                  <span className="info-label">Enrollment Number:</span>
                  <span className="info-value">
                    <span className="badge badge-primary">{profile?.enrollmentNumber}</span>
                  </span>
                </div>

                <div className="portal-info-item">
                  <span className="info-label">Engineering Course:</span>
                  <span className="info-value">{profile?.course}</span>
                </div>

                <div className="portal-info-item">
                  <span className="info-label">Current Semester:</span>
                  <span className="info-value">Semester {profile?.semester}</span>
                </div>

                <div className="portal-info-item">
                  <span className="info-label">Institution:</span>
                  <span className="info-value">Govt. Polytechnic Sakoli</span>
                </div>

                <div className="portal-info-item">
                  <span className="info-label">Admission Record Status:</span>
                  <span className="info-value">
                    <span className="badge badge-success">ACTIVE ENROLLMENT</span>
                  </span>
                </div>
              </div>

              {/* Card 2: Contact & Account Details */}
              <div className="card">
                <h3 style={{ fontSize: '1.1rem', color: 'var(--primary-900)', marginBottom: '1rem' }}>
                  Contact & Security Profile
                </h3>

                <div className="portal-info-item">
                  <span className="info-label">Institutional Email:</span>
                  <span className="info-value">{profile?.email || user?.email}</span>
                </div>

                <div className="portal-info-item">
                  <span className="info-label">Registered Phone:</span>
                  <span className="info-value" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <strong>{profile?.phone}</strong>
                    <button
                      onClick={openEditPhoneModal}
                      style={{ background: 'none', border: 'none', color: 'var(--primary-600)', cursor: 'pointer', fontSize: '0.8125rem', textDecoration: 'underline' }}
                    >
                      Change
                    </button>
                  </span>
                </div>

                <div className="portal-info-item">
                  <span className="info-label">Account Role:</span>
                  <span className="info-value">
                    <span className="badge badge-primary">{user?.role || 'STUDENT'}</span>
                  </span>
                </div>

                <div className="portal-info-item">
                  <span className="info-label">Student ID:</span>
                  <span className="info-value">#{profile?.id}</span>
                </div>

                <div className="portal-info-item">
                  <span className="info-label">Account Security:</span>
                  <span className="info-value">BCrypt Hashed (Protected)</span>
                </div>
              </div>
            </div>

            {/* Administrative Integrity Notice */}
            <div className="guidelines-box">
              <h4 className="guidelines-title">Administrative Record Integrity Policy</h4>
              <p style={{ fontSize: '0.875rem', color: 'var(--slate-600)', margin: 0, lineHeight: '1.6' }}>
                Academic records, including your Full Name, Enrollment Number, Course, and Semester, are managed directly by Government Polytechnic Sakoli. If any academic details require updates or corrections, please contact the Polytechnic Student Section with supporting documentation.
              </p>
            </div>
          </div>
        )}

        {/* ============================================================= */}
        {/* TAB 5: MY ATTENDANCE                                           */}
        {/* ============================================================= */}
        {activeTab === 'attendance' && (
          <div>
            <div className="section-action-bar" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--primary-900)', margin: 0 }}>
                  Hostel Night Roll Call &amp; Attendance Records
                </h2>
                <p style={{ fontSize: '0.875rem', color: 'var(--slate-600)', margin: '0.25rem 0 0 0' }}>
                  Official attendance verified by duty wardens during nightly roll calls at Government Polytechnic Sakoli.
                </p>
              </div>

              {/* Month Selector */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <label htmlFor="student-month-select" style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--slate-700)' }}>
                  Month:
                </label>
                <input
                  id="student-month-select"
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => handleAttendanceMonthChange(e.target.value)}
                  style={{
                    padding: '0.45rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--slate-300)',
                    fontSize: '0.875rem',
                    color: 'var(--slate-800)',
                    background: 'white'
                  }}
                />
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    loadAttendanceSummary(selectedMonth);
                    loadAttendanceHistory(historyDateFrom, historyDateTo, historyFilterStatus);
                  }}
                  disabled={loadingAttendanceSummary || loadingAttendanceHistory}
                >
                  {loadingAttendanceSummary ? 'Refreshing...' : 'Refresh'}
                </button>
              </div>
            </div>

            {/* Attendance Percentage Calculation Notice */}
            <div className="attendance-calc-formula">
              <strong>Institutional Attendance Calculation Policy:</strong>
              <div style={{ marginTop: '0.35rem' }}>
                Attendance Rate = <code>(Present Days ÷ Total Marked Days) × 100</code>.
                Sanctioned leaves (Authorized Passes) and unrecorded dates are not penalized in the percentage numerator. Maintaining an overall attendance rate of <strong>75% or above</strong> is mandatory for continued hostel residency.
              </div>
            </div>

            {/* Monthly KPI Metrics */}
            {loadingAttendanceSummary ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <span className="spinner"></span>
                <p style={{ marginTop: '0.5rem', color: 'var(--slate-500)' }}>Calculating monthly attendance metrics...</p>
              </div>
            ) : attendanceSummary ? (
              <div className="student-attendance-kpis">
                <div className={`student-attendance-card ${attendanceSummary.attendancePercentage >= 75 ? 'card-green' : attendanceSummary.attendancePercentage >= 50 ? 'card-amber' : 'card-red'}`}>
                  <div className="stat-card-title">Monthly Attendance Rate</div>
                  <div className={`attendance-percentage-gauge ${attendanceSummary.attendancePercentage >= 75 ? 'good' : attendanceSummary.attendancePercentage >= 50 ? 'warning' : 'danger'}`}>
                    {attendanceSummary.attendancePercentage.toFixed(1)}%
                  </div>
                  <div className="stat-card-detail">
                    {attendanceSummary.attendancePercentage >= 75 ? 'Good Standing (>= 75%)' : 'Caution: Below 75% Requirement'}
                  </div>
                </div>

                <div className="student-attendance-card card-green">
                  <div className="stat-card-title">Present Days</div>
                  <div className="stat-card-value" style={{ color: '#16a34a' }}>
                    {attendanceSummary.presentDays}
                  </div>
                  <div className="stat-card-detail">Verified in hostel room</div>
                </div>

                <div className="student-attendance-card card-red">
                  <div className="stat-card-title">Absent Days</div>
                  <div className="stat-card-value" style={{ color: '#dc2626' }}>
                    {attendanceSummary.absentDays}
                  </div>
                  <div className="stat-card-detail">Unexcused night roll calls</div>
                </div>

                <div className="student-attendance-card card-amber">
                  <div className="stat-card-title">Authorized Leave</div>
                  <div className="stat-card-value" style={{ color: '#d97706' }}>
                    {attendanceSummary.onLeaveDays}
                  </div>
                  <div className="stat-card-detail">Sanctioned gate pass / medical</div>
                </div>

                <div className="student-attendance-card card-blue">
                  <div className="stat-card-title">Total Marked Days</div>
                  <div className="stat-card-value">
                    {attendanceSummary.totalMarkedDays}
                  </div>
                  <div className="stat-card-detail">Roll call sessions in {attendanceSummary.month}</div>
                </div>
              </div>
            ) : null}

            {/* Attendance History Section */}
            <div className="card" style={{ background: 'white', borderRadius: 'var(--radius-md)', padding: '1.5rem', border: '1px solid var(--slate-200)', boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--slate-100)', paddingBottom: '0.75rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--primary-900)', margin: 0 }}>
                    Personal Roll Call Log &amp; Verification History
                  </h3>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--slate-500)', margin: '0.25rem 0 0 0' }}>
                    Complete audit trail of dates, warden signatures, and status records.
                  </p>
                </div>
                <span className="badge badge-primary">{attendanceHistory.length} Days Recorded</span>
              </div>

              {/* Filter Controls */}
              <form onSubmit={handleStudentHistorySearch} className="student-filter-controls">
                <div style={{ flex: '1 1 140px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--slate-600)', display: 'block', marginBottom: '0.25rem' }}>
                    From Date:
                  </label>
                  <input
                    type="date"
                    className="form-input"
                    value={historyDateFrom}
                    onChange={(e) => setHistoryDateFrom(e.target.value)}
                    style={{ width: '100%', padding: '0.45rem 0.65rem', fontSize: '0.875rem' }}
                  />
                </div>

                <div style={{ flex: '1 1 140px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--slate-600)', display: 'block', marginBottom: '0.25rem' }}>
                    To Date:
                  </label>
                  <input
                    type="date"
                    className="form-input"
                    value={historyDateTo}
                    onChange={(e) => setHistoryDateTo(e.target.value)}
                    style={{ width: '100%', padding: '0.45rem 0.65rem', fontSize: '0.875rem' }}
                  />
                </div>

                <div style={{ flex: '1 1 140px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--slate-600)', display: 'block', marginBottom: '0.25rem' }}>
                    Status:
                  </label>
                  <select
                    className="form-input"
                    value={historyFilterStatus}
                    onChange={(e) => setHistoryFilterStatus(e.target.value)}
                    style={{ width: '100%', padding: '0.45rem 0.65rem', fontSize: '0.875rem' }}
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="PRESENT">Present</option>
                    <option value="ABSENT">Absent</option>
                    <option value="ON_LEAVE">On Leave</option>
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button type="submit" className="btn btn-primary btn-sm" disabled={loadingAttendanceHistory}>
                    {loadingAttendanceHistory ? 'Filtering...' : 'Filter'}
                  </button>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={handleStudentHistoryReset} disabled={loadingAttendanceHistory}>
                    Reset
                  </button>
                </div>
              </form>

              {loadingAttendanceHistory ? (
                <div style={{ textAlign: 'center', padding: '2.5rem' }}>
                  <span className="spinner"></span>
                  <p style={{ marginTop: '0.75rem', color: 'var(--slate-500)' }}>Loading roll call records...</p>
                </div>
              ) : attendanceHistory.length === 0 ? (
                <div className="empty-state-card" style={{ padding: '2rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>&#128197;</div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--slate-700)', margin: '0 0 0.5rem 0' }}>
                    No Attendance Records Found
                  </h4>
                  <p style={{ fontSize: '0.875rem', color: 'var(--slate-500)', margin: 0 }}>
                    No night roll calls have been marked for the selected date range.
                  </p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="allocations-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: 'var(--slate-50)', textAlign: 'left', borderBottom: '2px solid var(--slate-200)' }}>
                        <th style={{ padding: '0.75rem 1rem', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--slate-600)' }}>Date</th>
                        <th style={{ padding: '0.75rem 1rem', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--slate-600)' }}>Status</th>
                        <th style={{ padding: '0.75rem 1rem', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--slate-600)' }}>Hostel &amp; Room</th>
                        <th style={{ padding: '0.75rem 1rem', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--slate-600)' }}>Official Remarks</th>
                        <th style={{ padding: '0.75rem 1rem', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--slate-600)' }}>Verified By</th>
                        <th style={{ padding: '0.75rem 1rem', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--slate-600)' }}>Recorded At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendanceHistory.map((rec) => (
                        <tr key={rec.id} style={{ borderBottom: '1px solid var(--slate-100)' }}>
                          <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--primary-900)' }}>
                            {rec.attendanceDate}
                          </td>
                          <td style={{ padding: '0.85rem 1rem' }}>
                            <span className={`attendance-badge ${rec.status.toLowerCase()}`}>
                              {rec.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td style={{ padding: '0.85rem 1rem', fontSize: '0.875rem' }}>
                            <div>{rec.hostelName}</div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>Room {rec.roomNumber}</span>
                          </td>
                          <td style={{ padding: '0.85rem 1rem', fontSize: '0.875rem', color: 'var(--slate-700)' }}>
                            {rec.remarks ? rec.remarks : <span style={{ color: 'var(--slate-400)', fontStyle: 'italic' }}>—</span>}
                          </td>
                          <td style={{ padding: '0.85rem 1rem', fontSize: '0.875rem', color: 'var(--slate-700)' }}>
                            {rec.recordedByWardenName || `Warden #${rec.recordedByWardenId}`}
                          </td>
                          <td style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', color: 'var(--slate-500)' }}>
                            {rec.updatedAt ? new Date(rec.updatedAt).toLocaleString() : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================= */}
        {/* TAB 5: MAINTENANCE & GRIEVANCES (तक्रार निवारण)                  */}
        {/* ============================================================= */}
        {activeTab === 'complaints' && (
          <StudentComplaintSection
            currentRoomNumber={dashboardData?.currentAllocation?.room?.roomNumber || ''}
            hostelName={dashboardData?.currentAllocation?.room?.hostel?.name || ''}
          />
        )}

        {/* ============================================================= */}
        {/* MODAL: EDIT PHONE NUMBER                                      */}
        {/* ============================================================= */}

        {editPhoneModalOpen && (
          <div className="student-modal-backdrop" onClick={() => !savingPhone && setEditPhoneModalOpen(false)}>
            <div className="student-modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="student-modal-header">
                <h3 className="student-modal-title">Update Contact Phone</h3>
                <button
                  type="button"
                  className="btn-close-modal"
                  onClick={() => setEditPhoneModalOpen(false)}
                  disabled={savingPhone}
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handlePhoneUpdateSubmit}>
                <div style={{ marginBottom: '1.25rem' }}>
                  <label htmlFor="student-phone-input" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--slate-700)', marginBottom: '0.5rem' }}>
                    Mobile Phone Number <span style={{ color: 'red' }}>*</span>
                  </label>
                  <input
                    id="student-phone-input"
                    type="tel"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    placeholder="e.g. 9822110011"
                    maxLength={20}
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--slate-300)',
                      fontSize: '1rem',
                      color: 'var(--slate-800)'
                    }}
                  />
                  <small style={{ color: 'var(--slate-500)', fontSize: '0.8125rem', marginTop: '0.35rem', display: 'block' }}>
                    Used for critical institutional notifications and hostel emergency alerts.
                  </small>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setEditPhoneModalOpen(false)}
                    disabled={savingPhone}
                  >
                    Cancel
                  </button>
                  <button
                    id="btn-save-phone"
                    type="submit"
                    className="btn btn-primary"
                    disabled={savingPhone}
                  >
                    {savingPhone ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
