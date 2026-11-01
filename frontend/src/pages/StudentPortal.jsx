import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import ImageWithFallback from '../components/ImageWithFallback';
import StudentComplaintSection from '../components/StudentComplaintSection';
import DigitalGatePassManager from '../components/DigitalGatePassManager';
import NoticeBoardManager from '../components/NoticeBoardManager';
import MessManagementSection from '../components/MessManagementSection';
import FeeManagerSection from '../components/FeeManagerSection';
import ResidentIdCardModal from '../components/ResidentIdCardModal';
import RoomQrCodeModal from '../components/RoomQrCodeModal';
import EmergencySosModal from '../components/EmergencySosModal';
import {
  IconOverview,
  IconRoom,
  IconGatePass,
  IconMess,
  IconFees,
  IconNotice,
  IconGrievance,
  IconAttendance,
  IconHistory,
  IconProfile,
  IconSos,
  IconIdCard,
  IconQrCode,
  IconLogout,
  IconBuilding,
  IconGraduationCap,
  IconPhone,
  IconUsers,
  IconChevronRight,
  IconArrowRight,
  IconCheck,
  IconAlertTriangle,
  IconShield,
  IconSparkles
} from '../components/icons/PortalIcons';
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

  // Tab State: 'overview' | 'my-room' | 'gatepass' | 'mess' | 'fees' | 'notices' | 'complaints' | 'attendance' | 'allocations' | 'profile'
  const [activeTab, setActiveTab] = useState('overview');

  // Data States
  const [dashboardData, setDashboardData] = useState(null);
  const [allocations, setAllocations] = useState([]);
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [loadingAllocations, setLoadingAllocations] = useState(false);
  const [sosModalOpen, setSosModalOpen] = useState(false);

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

  // Advanced Features Modals
  const [idCardModalOpen, setIdCardModalOpen] = useState(false);
  const [roomQrModalOpen, setRoomQrModalOpen] = useState(false);

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
    <div className="student-portal-wrapper mesh-ambient-bg">
      <div className="container">
        {/* ============================================================= */}
        {/* 1. EXECUTIVE GLASSMORPHIC INSTITUTIONAL COMMAND BAR            */}
        {/* ============================================================= */}
        <header className="student-header-card">
          <div className="student-header-left">
            <div className="student-welcome-badge">
              <span className="live-pulse-dot"></span>
              <span className="inst-badge-text">GOVERNMENT POLYTECHNIC SAKOLI &bull; DTE CODE: 4172</span>
            </div>
            <h1 className="student-portal-title">
              {profile ? profile.fullName : user?.fullName || 'Student Resident'}
            </h1>
            <div className="student-header-meta">
              <span className="meta-pill">
                <IconGraduationCap size={15} />
                <span>{profile ? `${profile.course} (Sem ${profile.semester})` : 'Diploma Engineering'}</span>
              </span>
              <span className="meta-pill font-mono">
                <IconShield size={14} />
                <span>{profile?.enrollmentNumber || user?.enrollmentNumber || 'EN2026CS001'}</span>
              </span>
              {roomAllocated && currentRoom && (
                <span className="meta-pill room-pill">
                  <IconRoom size={15} />
                  <span>Room {currentRoom.roomNumber} &bull; {currentRoom.hostelName}</span>
                </span>
              )}
            </div>
          </div>

          <div className="student-header-actions">
            <button
              onClick={() => setSosModalOpen(true)}
              className="btn btn-student-sos"
              title="Trigger 24x7 Emergency SOS Panic Alarm"
            >
              <IconSos size={18} className="sos-pulse-icon" />
              <span>Emergency SOS</span>
            </button>
            <button
              onClick={() => setIdCardModalOpen(true)}
              className="btn btn-id-card"
              title="View & Print Official Hostel ID Card"
            >
              <IconIdCard size={18} />
              <span>Resident ID</span>
            </button>
            <button
              id="btn-student-logout"
              onClick={logout}
              className="btn btn-logout"
              title="Sign out of student account"
            >
              <IconLogout size={16} />
              <span>Sign Out</span>
            </button>
          </div>
        </header>

        {/* Global Feedback Notifications */}
        {feedbackSuccess && (
          <div className="student-alert-success" role="alert">
            <IconCheck size={20} />
            <div>{feedbackSuccess}</div>
          </div>
        )}
        {feedbackError && (
          <div className="student-alert-error" role="alert">
            <IconAlertTriangle size={20} />
            <div>{feedbackError}</div>
          </div>
        )}

        {/* ============================================================= */}
        {/* 2. DUAL-MODE SAAS APP SHELL (NAV RAIL ON DESKTOP, TABS ON MOBILE) */}
        {/* ============================================================= */}
        <div className="student-portal-shell">
          {/* Left Navigation Rail (Desktop) */}
          <aside className="portal-nav-rail" aria-label="Portal Navigation Rail">
            <div className="nav-group">
              <span className="nav-group-label">OVERVIEW &amp; LIVING</span>
              <button
                id="tab-student-overview"
                className={`nav-item-btn ${activeTab === 'overview' ? 'active' : ''}`}
                onClick={() => handleTabChange('overview')}
              >
                <div className="nav-item-icon-box">
                  <IconOverview size={18} />
                </div>
                <span className="nav-item-title">Overview</span>
                <span className="nav-item-badge">Hub</span>
              </button>

              <button
                id="tab-student-room"
                className={`nav-item-btn ${activeTab === 'my-room' ? 'active' : ''}`}
                onClick={() => handleTabChange('my-room')}
              >
                <div className="nav-item-icon-box">
                  <IconRoom size={18} />
                </div>
                <span className="nav-item-title">My Room</span>
                {roomAllocated && currentRoom && (
                  <span className="nav-item-badge active-room-badge">
                    {currentRoom.roomNumber}
                  </span>
                )}
              </button>
            </div>

            <div className="nav-group">
              <span className="nav-group-label">DAILY RESIDENT SERVICES</span>
              <button
                id="tab-student-gatepass"
                className={`nav-item-btn ${activeTab === 'gatepass' ? 'active' : ''}`}
                onClick={() => handleTabChange('gatepass')}
              >
                <div className="nav-item-icon-box">
                  <IconGatePass size={18} />
                </div>
                <span className="nav-item-title">Gate Pass</span>
                <span className="nav-item-badge">Digital QR</span>
              </button>

              <button
                id="tab-student-mess"
                className={`nav-item-btn ${activeTab === 'mess' ? 'active' : ''}`}
                onClick={() => handleTabChange('mess')}
              >
                <div className="nav-item-icon-box">
                  <IconMess size={18} />
                </div>
                <span className="nav-item-title">Mess Menu</span>
                <span className="nav-item-badge">Timetable</span>
              </button>

              <button
                id="tab-student-attendance"
                className={`nav-item-btn ${activeTab === 'attendance' ? 'active' : ''}`}
                onClick={() => handleTabChange('attendance')}
              >
                <div className="nav-item-icon-box">
                  <IconAttendance size={18} />
                </div>
                <span className="nav-item-title">Attendance</span>
                <span className="nav-item-badge">Roll Call</span>
              </button>
            </div>

            <div className="nav-group">
              <span className="nav-group-label">ACADEMIC &amp; FEES</span>
              <button
                id="tab-student-fees"
                className={`nav-item-btn ${activeTab === 'fees' ? 'active' : ''}`}
                onClick={() => handleTabChange('fees')}
              >
                <div className="nav-item-icon-box">
                  <IconFees size={18} />
                </div>
                <span className="nav-item-title">Fees &amp; NOC</span>
                <span className="nav-item-badge">Clearance</span>
              </button>

              <button
                id="tab-student-notices"
                className={`nav-item-btn ${activeTab === 'notices' ? 'active' : ''}`}
                onClick={() => handleTabChange('notices')}
              >
                <div className="nav-item-icon-box">
                  <IconNotice size={18} />
                </div>
                <span className="nav-item-title">Notices</span>
                <span className="nav-item-badge">Circulars</span>
              </button>

              <button
                id="tab-student-complaints"
                className={`nav-item-btn ${activeTab === 'complaints' ? 'active' : ''}`}
                onClick={() => handleTabChange('complaints')}
              >
                <div className="nav-item-icon-box">
                  <IconGrievance size={18} />
                </div>
                <span className="nav-item-title">Grievances</span>
                <span className="nav-item-badge">24x7</span>
              </button>
            </div>

            <div className="nav-group">
              <span className="nav-group-label">RECORDS &amp; IDENTITY</span>
              <button
                id="tab-student-history"
                className={`nav-item-btn ${activeTab === 'allocations' ? 'active' : ''}`}
                onClick={() => handleTabChange('allocations')}
              >
                <div className="nav-item-icon-box">
                  <IconHistory size={18} />
                </div>
                <span className="nav-item-title">History</span>
                <span className="nav-item-badge">Logs</span>
              </button>

              <button
                id="tab-student-profile"
                className={`nav-item-btn ${activeTab === 'profile' ? 'active' : ''}`}
                onClick={() => handleTabChange('profile')}
              >
                <div className="nav-item-icon-box">
                  <IconProfile size={18} />
                </div>
                <span className="nav-item-title">My Profile</span>
                <span className="nav-item-badge">Verified</span>
              </button>
            </div>

            {/* Sidebar Bottom Resident Mini Card */}
            <div className="nav-resident-card">
              <div className="resident-mini-avatar">
                <span>{(profile?.fullName || user?.fullName || 'S').split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}</span>
              </div>
              <div className="resident-mini-info">
                <span className="mini-name">{profile?.fullName || user?.fullName || 'Resident Scholar'}</span>
                <span className="mini-branch">{profile?.course || 'Diploma Engineering'}</span>
              </div>
            </div>
          </aside>

          {/* Mobile Sliding Frosted-Glass Tabs (Small Screens) */}
          <nav className="portal-tabs-mobile" aria-label="Mobile Navigation">
            <button className={`mobile-tab-btn ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => handleTabChange('overview')}>
              <IconOverview size={16} /> Overview
            </button>
            <button className={`mobile-tab-btn ${activeTab === 'my-room' ? 'active' : ''}`} onClick={() => handleTabChange('my-room')}>
              <IconRoom size={16} /> Room
            </button>
            <button className={`mobile-tab-btn ${activeTab === 'gatepass' ? 'active' : ''}`} onClick={() => handleTabChange('gatepass')}>
              <IconGatePass size={16} /> Gate Pass
            </button>
            <button className={`mobile-tab-btn ${activeTab === 'mess' ? 'active' : ''}`} onClick={() => handleTabChange('mess')}>
              <IconMess size={16} /> Mess
            </button>
            <button className={`mobile-tab-btn ${activeTab === 'fees' ? 'active' : ''}`} onClick={() => handleTabChange('fees')}>
              <IconFees size={16} /> Fees
            </button>
            <button className={`mobile-tab-btn ${activeTab === 'notices' ? 'active' : ''}`} onClick={() => handleTabChange('notices')}>
              <IconNotice size={16} /> Notices
            </button>
            <button className={`mobile-tab-btn ${activeTab === 'complaints' ? 'active' : ''}`} onClick={() => handleTabChange('complaints')}>
              <IconGrievance size={16} /> Grievances
            </button>
            <button className={`mobile-tab-btn ${activeTab === 'attendance' ? 'active' : ''}`} onClick={() => handleTabChange('attendance')}>
              <IconAttendance size={16} /> Attendance
            </button>
            <button className={`mobile-tab-btn ${activeTab === 'allocations' ? 'active' : ''}`} onClick={() => handleTabChange('allocations')}>
              <IconHistory size={16} /> History
            </button>
            <button className={`mobile-tab-btn ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => handleTabChange('profile')}>
              <IconProfile size={16} /> Profile
            </button>
          </nav>

          {/* Main Content Workspace */}
          <main className="portal-main-workspace">
            {/* ============================================================= */}
            {/* TAB 1: DASHBOARD OVERVIEW                                      */}
            {/* ============================================================= */}
            {activeTab === 'overview' && (
              <div className="overview-tab-content">
                {loadingDashboard ? (
                  <div className="portal-loading-card">
                    <span className="spinner"></span>
                    <p>Loading resident dashboard &amp; room parameters...</p>
                  </div>
                ) : (
                  <>
                    {/* 4 Senior SaaS KPI Cards */}
                    <div className="student-stats-grid">
                      {/* Housing Status */}
                      <div className="student-stat-card card-accent-emerald">
                        <div className="stat-card-header">
                          <span className="stat-card-title">Housing Status</span>
                          <div className="stat-icon-wrapper icon-emerald">
                            <IconRoom size={20} />
                          </div>
                        </div>
                        <div className="stat-card-value">
                          {roomAllocated ? `Room ${currentRoom?.roomNumber}` : 'Pending'}
                        </div>
                        <div className="stat-card-footer">
                          {roomAllocated ? (
                            <span className="pulse-badge green">
                              <span className="dot"></span>
                              <span>{currentRoom?.hostelName} (Floor {currentRoom?.floor})</span>
                            </span>
                          ) : (
                            <span className="pulse-badge amber">
                              <span className="dot"></span>
                              <span>No active bed allotment</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Academic Branch */}
                      <div className="student-stat-card card-accent-indigo">
                        <div className="stat-card-header">
                          <span className="stat-card-title">Academic Branch</span>
                          <div className="stat-icon-wrapper icon-indigo">
                            <IconGraduationCap size={20} />
                          </div>
                        </div>
                        <div className="stat-card-value font-compact">
                          {profile?.course || 'Diploma Engineering'}
                        </div>
                        <div className="stat-card-footer">
                          <span className="pulse-badge blue">
                            <span className="dot"></span>
                            <span>Semester {profile?.semester || '-'} &bull; Govt. Poly. Sakoli</span>
                          </span>
                        </div>
                      </div>

                      {/* Contact Info */}
                      <div className="student-stat-card card-accent-cyan">
                        <div className="stat-card-header">
                          <span className="stat-card-title">Registered Phone</span>
                          <div className="stat-icon-wrapper icon-cyan">
                            <IconPhone size={20} />
                          </div>
                        </div>
                        <div className="stat-card-value font-mono">
                          {profile?.phone || 'Not Registered'}
                        </div>
                        <div className="stat-card-footer">
                          <button
                            onClick={openEditPhoneModal}
                            className="btn-link-action"
                            title="Edit registered phone number"
                          >
                            <span>Update Number &rarr;</span>
                          </button>
                        </div>
                      </div>

                      {/* Historical Allocations */}
                      <div className="student-stat-card card-accent-violet">
                        <div className="stat-card-header">
                          <span className="stat-card-title">Residential Records</span>
                          <div className="stat-icon-wrapper icon-violet">
                            <IconBuilding size={20} />
                          </div>
                        </div>
                        <div className="stat-card-value">
                          {dashboardData?.totalAllocationsCount || 0}
                        </div>
                        <div className="stat-card-footer">
                          <span className="pulse-badge blue">
                            <span className="dot"></span>
                            <span>All-time institutional allotments</span>
                          </span>
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
                          <span className="accommodation-banner-badge">
                            Active Residence
                          </span>
                        </div>
                        <div className="accommodation-banner-content">
                          <div className="accommodation-banner-header">
                            <div>
                              <span className="accommodation-hostel-tag">
                                {currentRoom.hostelType} HOSTEL &bull; FLOOR {currentRoom.floor}
                              </span>
                              <h2 className="accommodation-room-title">
                                Room {currentRoom.roomNumber} &bull; {currentRoom.hostelName}
                              </h2>
                              <p className="accommodation-address">
                                <IconBuilding size={15} />
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
                              <span className="acc-pill-val" style={{ color: currentRoom.availableBeds > 0 ? '#10b981' : '#64748b' }}>
                                {currentRoom.availableBeds} Beds
                              </span>
                            </div>
                          </div>

                          <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                            <button
                              onClick={() => setRoomQrModalOpen(true)}
                              className="btn btn-secondary btn-sm"
                            >
                              <IconQrCode size={16} />
                              <span>Door QR Poster</span>
                            </button>
                            <button
                              id="btn-goto-room"
                              onClick={() => handleTabChange('my-room')}
                              className="btn btn-primary btn-sm"
                            >
                              <span>Inspect Room Details &rarr;</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="empty-state-panel">
                        <div className="empty-icon-circle">
                          <IconRoom size={32} />
                        </div>
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

                    {/* Quick Services Hub */}
                    <div className="quick-services-section">
                      <div className="section-header-row">
                        <div>
                          <div className="section-kicker">RESIDENT HUB</div>
                          <h3 className="section-heading-title">Daily Student Living &amp; Campus Services</h3>
                          <p className="section-heading-sub">Instant access to digital gate passes, mess reviews, fee ledger, and circulars</p>
                        </div>
                      </div>

                      <div className="quick-services-grid">
                        <div className="service-hub-card" onClick={() => handleTabChange('gatepass')}>
                          <div className="service-icon-box box-amber">
                            <IconGatePass size={22} />
                          </div>
                          <div className="service-content">
                            <h4>Digital Gate Pass</h4>
                            <p>Apply for day outing, home visit, or view approved pass slip with QR.</p>
                          </div>
                          <span className="service-arrow"><IconArrowRight size={16} /></span>
                        </div>

                        <div className="service-hub-card" onClick={() => handleTabChange('mess')}>
                          <div className="service-icon-box box-emerald">
                            <IconMess size={22} />
                          </div>
                          <div className="service-content">
                            <h4>Mess &amp; Dining</h4>
                            <p>Weekly vegetarian timetable, chef's special, and daily quality ratings.</p>
                          </div>
                          <span className="service-arrow"><IconArrowRight size={16} /></span>
                        </div>

                        <div className="service-hub-card" onClick={() => handleTabChange('fees')}>
                          <div className="service-icon-box box-indigo">
                            <IconFees size={22} />
                          </div>
                          <div className="service-content">
                            <h4>Fees &amp; No-Dues (NOC)</h4>
                            <p>View rent invoices, printable payment receipts, and clearance certificate.</p>
                          </div>
                          <span className="service-arrow"><IconArrowRight size={16} /></span>
                        </div>

                        <div className="service-hub-card" onClick={() => handleTabChange('notices')}>
                          <div className="service-icon-box box-blue">
                            <IconNotice size={22} />
                          </div>
                          <div className="service-content">
                            <h4>Notice Board</h4>
                            <p>Official announcements, exam quiet hours, and campus circulars.</p>
                          </div>
                          <span className="service-arrow"><IconArrowRight size={16} /></span>
                        </div>

                        <div className="service-hub-card" onClick={() => handleTabChange('complaints')}>
                          <div className="service-icon-box box-purple">
                            <IconGrievance size={22} />
                          </div>
                          <div className="service-content">
                            <h4>Grievance Tickets</h4>
                            <p>Report electrical, plumbing, carpentry or Wi-Fi maintenance issues.</p>
                          </div>
                          <span className="service-arrow"><IconArrowRight size={16} /></span>
                        </div>

                        <div className="service-hub-card" onClick={() => setIdCardModalOpen(true)}>
                          <div className="service-icon-box box-sky">
                            <IconIdCard size={22} />
                          </div>
                          <div className="service-content">
                            <h4>Smart Resident ID</h4>
                            <p>View and print your official college hostel smart card badge.</p>
                          </div>
                          <span className="service-arrow"><IconArrowRight size={16} /></span>
                        </div>
                      </div>
                    </div>

                    {/* Guidelines & Institutional Notice */}
                    <div className="guidelines-box">
                      <div className="guidelines-header-bar">
                        <IconShield size={20} />
                        <h3 className="guidelines-title">Institutional Resident Guidelines</h3>
                      </div>
                      <ul className="guidelines-list">
                        <li>Hostel curfew is strictly observed at 9:00 PM on all campus instructional days.</li>
                        <li>Ensure your registered contact phone number is always current for emergency notifications.</li>
                        <li>Room allocations and bed assignments are non-transferable and strictly managed by the administration.</li>
                        <li>For hostel room maintenance, please lodge tickets through the 24x7 Grievance section.</li>
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
              <div className="my-room-tab-content">
                {loadingDashboard ? (
                  <div className="portal-loading-card">
                    <span className="spinner"></span>
                    <p>Loading room assignment details...</p>
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
                      <h3 style={{ fontSize: '1.15rem', color: '#0f172a', fontWeight: 800, marginBottom: '1.25rem' }}>
                        Room Specifications &amp; Live Bed Metrics
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
                          <div className="metric-value" style={{ color: currentRoom.availableBeds > 0 ? '#10b981' : '#ef4444' }}>
                            {currentRoom.availableBeds} Vacant
                          </div>
                        </div>
                      </div>

                      <div className="guidelines-box" style={{ marginTop: '1.25rem' }}>
                        <h4 className="guidelines-title">Room Occupancy &amp; Maintenance Policy</h4>
                        <p style={{ fontSize: '0.875rem', color: '#475569', margin: 0, lineHeight: '1.6' }}>
                          Bed allocations are registered to your verified institutional identity (Enrollment: {profile?.enrollmentNumber}). Vacating or re-allocating requires administrative completion and checkout by the Hostel Office.
                        </p>
                      </div>

                      <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <button
                          className="btn btn-secondary"
                          onClick={() => setRoomQrModalOpen(true)}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}
                        >
                          <IconQrCode size={18} />
                          <span>Print Room QR Door Poster</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="empty-state-panel">
                    <div className="empty-icon-circle">
                      <IconRoom size={32} />
                    </div>
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
                    <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                      Residential Allocation History
                    </h2>
                    <p style={{ fontSize: '0.875rem', color: '#64748b', margin: '0.25rem 0 0' }}>
                      Complete historical audit log of all room allotments and checkout records
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
                  <div className="portal-loading-card">
                    <span className="spinner"></span>
                    <p>Loading historical records...</p>
                  </div>
                ) : allocations.length === 0 ? (
                  <div className="empty-state-panel">
                    <div className="empty-icon-circle">
                      <IconHistory size={32} />
                    </div>
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
                          <th>Hostel &amp; Wing</th>
                          <th>Room Number</th>
                          <th>Floor</th>
                          <th>Allotted On</th>
                          <th>Checkout Date</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allocations.map((a) => (
                          <tr key={a.id}>
                            <td className="font-mono font-bold">#ALC-{a.id}</td>
                            <td>{a.room?.hostel?.name || 'Sahyadri Boys Hostel'}</td>
                            <td className="font-bold">Room {a.room?.roomNumber}</td>
                            <td>Floor {a.room?.floor}</td>
                            <td>{a.allocationDate}</td>
                            <td>{a.checkoutDate || <span style={{ color: '#94a3b8' }}>Active Allotment</span>}</td>
                            <td>
                              {a.active ? (
                                <span className="pulse-badge green"><span className="dot"></span>ACTIVE</span>
                              ) : (
                                <span className="pulse-badge blue"><span className="dot"></span>COMPLETED</span>
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
              <div className="profile-section-container">
                {/* Executive Profile Hero Banner */}
                <div className="profile-hero-card">
                  <div className="profile-hero-left">
                    <div className="profile-avatar-large">
                      <span>{(profile?.fullName || user?.fullName || 'Student').split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}</span>
                    </div>
                    <div className="profile-hero-info">
                      <div className="profile-badge-row">
                        <span className="profile-verified-badge">
                          <IconShield size={14} />
                          <span>Verified MSBTE Resident</span>
                        </span>
                        <span className="profile-quota-tag">Govt. Polytechnic Sakoli</span>
                      </div>
                      <h2 className="profile-name-title">{profile?.fullName || user?.fullName}</h2>
                      <div className="profile-meta-pills">
                        <span className="meta-chip font-mono">
                          <IconShield size={13} />
                          <span>{profile?.enrollmentNumber || user?.enrollmentNumber || 'EN2026CS001'}</span>
                        </span>
                        <span className="meta-chip">
                          <IconGraduationCap size={14} />
                          <span>{profile?.course || 'Computer Engineering'}</span>
                        </span>
                        <span className="meta-chip">
                          <span>Semester {profile?.semester || '4'}</span>
                        </span>
                        <span className="meta-chip room-chip">
                          <IconRoom size={14} />
                          <span>Room {dashboardData?.currentAllocation?.room?.roomNumber || '101'}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="profile-hero-actions">
                    <button
                      onClick={() => setIdCardModalOpen(true)}
                      className="btn btn-id-card"
                      id="btn-profile-view-id"
                    >
                      <IconIdCard size={18} />
                      <span>Smart Resident ID</span>
                    </button>
                    <button
                      id="btn-edit-phone"
                      onClick={openEditPhoneModal}
                      className="btn btn-edit-contact"
                    >
                      <IconPhone size={16} />
                      <span>Edit Phone</span>
                    </button>
                  </div>
                </div>

                {/* Profile Information Dual Cards */}
                <div className="profile-card-grid">
                  {/* Card 1: Academic & Institutional Identity */}
                  <div className="profile-data-card">
                    <div className="card-heading-bar">
                      <div className="card-icon-tag icon-blue">
                        <IconGraduationCap size={22} />
                      </div>
                      <div>
                        <h3 className="card-main-title">Institutional Academic Records</h3>
                        <p className="card-sub-title">Official MSBTE enrolment and polytechnic registration</p>
                      </div>
                    </div>

                    <div className="profile-field-list">
                      <div className="profile-field-row">
                        <span className="field-label">Student Full Name</span>
                        <span className="field-value strong">{profile?.fullName}</span>
                      </div>
                      <div className="profile-field-row">
                        <span className="field-label">MSBTE Enrollment Number</span>
                        <span className="field-value badge-val">
                          <span className="enrollment-badge">{profile?.enrollmentNumber}</span>
                        </span>
                      </div>
                      <div className="profile-field-row">
                        <span className="field-label">Engineering Discipline</span>
                        <span className="field-value">{profile?.course}</span>
                      </div>
                      <div className="profile-field-row">
                        <span className="field-label">Current Academic Semester</span>
                        <span className="field-value">Semester {profile?.semester} (Active)</span>
                      </div>
                      <div className="profile-field-row">
                        <span className="field-label">Campus Institute</span>
                        <span className="field-value">Government Polytechnic Sakoli</span>
                      </div>
                      <div className="profile-field-row">
                        <span className="field-label">Admission Standing</span>
                        <span className="field-value">
                          <span className="pulse-badge green"><span className="dot"></span>ACTIVE ENROLLMENT</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Contact & Security Credentials */}
                  <div className="profile-data-card">
                    <div className="card-heading-bar">
                      <div className="card-icon-tag icon-emerald">
                        <IconShield size={22} />
                      </div>
                      <div>
                        <h3 className="card-main-title">Contact &amp; Account Credentials</h3>
                        <p className="card-sub-title">Portal security, contact phone and residential assignment</p>
                      </div>
                    </div>

                    <div className="profile-field-list">
                      <div className="profile-field-row">
                        <span className="field-label">Institutional Email</span>
                        <span className="field-value">{profile?.email || user?.email}</span>
                      </div>
                      <div className="profile-field-row">
                        <span className="field-label">Registered Contact Phone</span>
                        <span className="field-value phone-val">
                          <strong>{profile?.phone || 'Not Registered'}</strong>
                          <button
                            onClick={openEditPhoneModal}
                            className="btn-link-edit"
                            title="Update contact phone"
                          >
                            Change
                          </button>
                        </span>
                      </div>
                      <div className="profile-field-row">
                        <span className="field-label">Residential Hostel</span>
                        <span className="field-value">{dashboardData?.currentAllocation?.room?.hostel?.name || 'Sahyadri Boys Hostel'}</span>
                      </div>
                      <div className="profile-field-row">
                        <span className="field-label">Allotted Bed &amp; Room</span>
                        <span className="field-value">Room {dashboardData?.currentAllocation?.room?.roomNumber || '101'} (Floor {dashboardData?.currentAllocation?.room?.floor || '1'})</span>
                      </div>
                      <div className="profile-field-row">
                        <span className="field-label">System Account Role</span>
                        <span className="field-value">
                          <span className="role-chip">{user?.role || 'STUDENT'}</span>
                        </span>
                      </div>
                      <div className="profile-field-row">
                        <span className="field-label">Data Privacy &amp; Security</span>
                        <span className="field-value text-muted">BCrypt 256-bit Protected</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Administrative Integrity Notice */}
                <div className="guidelines-box profile-notice-box">
                  <h4 className="guidelines-title">Institutional Record Integrity &amp; Identity Policy</h4>
                  <p style={{ fontSize: '0.875rem', color: '#475569', margin: 0, lineHeight: '1.6' }}>
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
                    <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                      Hostel Night Roll Call &amp; Attendance Records
                    </h2>
                    <p style={{ fontSize: '0.875rem', color: '#64748b', margin: '0.25rem 0 0 0' }}>
                      Official attendance verified by duty wardens during nightly roll calls at Government Polytechnic Sakoli.
                    </p>
                  </div>

                  {/* Month Selector */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <label htmlFor="student-month-select" style={{ fontSize: '0.875rem', fontWeight: 600, color: '#334155' }}>
                      Month:
                    </label>
                    <input
                      id="student-month-select"
                      type="month"
                      value={selectedMonth}
                      onChange={(e) => handleAttendanceMonthChange(e.target.value)}
                      style={{
                        padding: '0.45rem 0.75rem',
                        borderRadius: '0.5rem',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.875rem',
                        color: '#0f172a',
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
                  <div className="portal-loading-card">
                    <span className="spinner"></span>
                    <p>Calculating monthly attendance metrics...</p>
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
                      <div className="stat-card-value" style={{ color: '#10b981' }}>
                        {attendanceSummary.presentDays}
                      </div>
                      <div className="stat-card-detail">Verified in hostel room</div>
                    </div>

                    <div className="student-attendance-card card-red">
                      <div className="stat-card-title">Absent Days</div>
                      <div className="stat-card-value" style={{ color: '#ef4444' }}>
                        {attendanceSummary.absentDays}
                      </div>
                      <div className="stat-card-detail">Unexcused night roll calls</div>
                    </div>

                    <div className="student-attendance-card card-amber">
                      <div className="stat-card-title">Authorized Leave</div>
                      <div className="stat-card-value" style={{ color: '#f59e0b' }}>
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
                <div className="saas-card" style={{ padding: '1.75rem', marginTop: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
                    <div>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                        Personal Roll Call Log &amp; Verification History
                      </h3>
                      <p style={{ fontSize: '0.8125rem', color: '#64748b', margin: '0.25rem 0 0 0' }}>
                        Complete audit trail of dates, warden signatures, and status records.
                      </p>
                    </div>
                    <span className="pulse-badge blue">{attendanceHistory.length} Days Recorded</span>
                  </div>

                  {/* Filter Controls */}
                  <form onSubmit={handleStudentHistorySearch} className="student-filter-controls">
                    <div style={{ flex: '1 1 140px' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>
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
                      <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>
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
                      <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>
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
                    <div className="portal-loading-card">
                      <span className="spinner"></span>
                      <p>Loading roll call records...</p>
                    </div>
                  ) : attendanceHistory.length === 0 ? (
                    <div className="empty-state-panel" style={{ padding: '2rem 1rem' }}>
                      <div className="empty-icon-circle">
                        <IconAttendance size={28} />
                      </div>
                      <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.5rem 0' }}>
                        No Attendance Records Found
                      </h4>
                      <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0 }}>
                        No night roll calls have been marked for the selected date range.
                      </p>
                    </div>
                  ) : (
                    <div className="student-data-table-wrap">
                      <table className="student-data-table">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Status</th>
                            <th>Hostel &amp; Room</th>
                            <th>Official Remarks</th>
                            <th>Verified By</th>
                            <th>Recorded At</th>
                          </tr>
                        </thead>
                        <tbody>
                          {attendanceHistory.map((rec) => (
                            <tr key={rec.id}>
                              <td className="font-bold">{rec.attendanceDate}</td>
                              <td>
                                {rec.status === 'PRESENT' ? (
                                  <span className="pulse-badge green"><span className="dot"></span>PRESENT</span>
                                ) : rec.status === 'ABSENT' ? (
                                  <span className="pulse-badge red"><span className="dot"></span>ABSENT</span>
                                ) : (
                                  <span className="pulse-badge amber"><span className="dot"></span>ON LEAVE</span>
                                )}
                              </td>
                              <td>
                                <div>{rec.hostelName}</div>
                                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Room {rec.roomNumber}</span>
                              </td>
                              <td>
                                {rec.remarks ? rec.remarks : <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>—</span>}
                              </td>
                              <td>
                                {rec.recordedByWardenName || `Warden #${rec.recordedByWardenId}`}
                              </td>
                              <td style={{ fontSize: '0.75rem', color: '#64748b' }}>
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
            {/* TAB 6: MAINTENANCE & GRIEVANCES                                */}
            {/* ============================================================= */}
            {activeTab === 'complaints' && (
              <StudentComplaintSection
                currentRoomNumber={dashboardData?.currentAllocation?.room?.roomNumber || ''}
                hostelName={dashboardData?.currentAllocation?.room?.hostel?.name || ''}
              />
            )}

            {/* ============================================================= */}
            {/* TAB 7: DIGITAL GATE PASS & OUTING                             */}
            {/* ============================================================= */}
            {activeTab === 'gatepass' && (
              <DigitalGatePassManager role="STUDENT" />
            )}

            {/* ============================================================= */}
            {/* TAB 8: MESS TIMETABLE & QUALITY INDEX                         */}
            {/* ============================================================= */}
            {activeTab === 'mess' && (
              <MessManagementSection role="STUDENT" />
            )}

            {/* ============================================================= */}
            {/* TAB 9: FEES, RECEIPTS & NO-DUES CLEARANCE (NOC)               */}
            {/* ============================================================= */}
            {activeTab === 'fees' && (
              <FeeManagerSection role="STUDENT" />
            )}

            {/* ============================================================= */}
            {/* TAB 10: DIGITAL NOTICE BOARD & CIRCULARS                      */}
            {/* ============================================================= */}
            {activeTab === 'notices' && (
              <NoticeBoardManager role="STUDENT" />
            )}
          </main>
        </div>

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
                  <label htmlFor="student-phone-input" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, color: '#334155', marginBottom: '0.5rem' }}>
                    Mobile Phone Number <span style={{ color: '#ef4444' }}>*</span>
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
                      borderRadius: '0.5rem',
                      border: '1px solid #cbd5e1',
                      fontSize: '1rem',
                      color: '#0f172a'
                    }}
                  />
                  <small style={{ color: '#64748b', fontSize: '0.8125rem', marginTop: '0.35rem', display: 'block' }}>
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

        {/* MODAL: RESIDENT ID CARD */}
        {idCardModalOpen && (
          <ResidentIdCardModal
            student={{
              fullName: profile?.fullName || user?.fullName,
              enrollmentNumber: profile?.enrollmentNumber || user?.enrollmentNumber,
              course: profile?.course,
              semester: profile?.semester,
              phone: profile?.phone,
              hostelName: dashboardData?.currentAllocation?.room?.hostel?.name || 'Sahyadri Boys Hostel',
              roomNumber: dashboardData?.currentAllocation?.room?.roomNumber || '104'
            }}
            onClose={() => setIdCardModalOpen(false)}
          />
        )}

        {/* MODAL: EMERGENCY SOS PANIC */}
        <EmergencySosModal isOpen={sosModalOpen} onClose={() => setSosModalOpen(false)} />

        {/* MODAL: ROOM QR CODE POSTER */}
        {roomQrModalOpen && (
          <RoomQrCodeModal
            room={dashboardData?.currentAllocation?.room || { roomNumber: '104', capacity: 3, floor: 'Floor 1' }}
            hostelName={dashboardData?.currentAllocation?.room?.hostel?.name || 'Sahyadri Boys Hostel'}
            onClose={() => setRoomQrModalOpen(false)}
          />
        )}
      </div>
    </div>
  );
}
