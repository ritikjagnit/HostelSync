import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import ImageWithFallback from '../components/ImageWithFallback';
import { getHostelImage } from '../config/media';
import AdminAdmissionsManager from '../components/AdminAdmissionsManager';
import GrievanceMaintenanceManager from '../components/GrievanceMaintenanceManager';
import './PortalCommon.css';
import './WardenPortal.css';

function getTodayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function WardenPortal() {
  const { user, logout, authFetch } = useAuth();

  // Tab State: 'overview' | 'hostels' | 'rooms' | 'residents' | 'allocations'
  const [activeTab, setActiveTab] = useState('overview');

  // Data States
  const [dashboardData, setDashboardData] = useState(null);
  const [hostels, setHostels] = useState([]);
  const [selectedHostelId, setSelectedHostelId] = useState('');
  const [rooms, setRooms] = useState([]);
  const [residents, setResidents] = useState([]);
  const [allocations, setAllocations] = useState([]);

  // Filter States
  const [roomStatusFilter, setRoomStatusFilter] = useState('ALL'); // ALL | VACANT | PARTIAL | FULL
  const [roomSearch, setRoomSearch] = useState('');
  const [residentSearch, setResidentSearch] = useState('');
  const [allocationStatusFilter, setAllocationStatusFilter] = useState('ALL');
  const [allocationSearch, setAllocationSearch] = useState('');

  // Loading & Feedback States
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [loadingResidents, setLoadingResidents] = useState(false);
  const [loadingAllocations, setLoadingAllocations] = useState(false);
  const [feedbackError, setFeedbackError] = useState('');

  // Attendance States
  const [attendanceDate, setAttendanceDate] = useState(getTodayDateString);
  const [attendanceMode, setAttendanceMode] = useState('rollcall'); // 'rollcall' | 'history'
  const [rollCallRoster, setRollCallRoster] = useState([]);
  const [rollCallMarkings, setRollCallMarkings] = useState({}); // { [studentId]: { status, remarks } }
  const [attendanceSearch, setAttendanceSearch] = useState('');
  const [loadingRollCall, setLoadingRollCall] = useState(false);
  const [submittingAttendance, setSubmittingAttendance] = useState(false);
  const [attendanceSuccessMsg, setAttendanceSuccessMsg] = useState('');

  // Attendance History States

  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [loadingAttendanceHistory, setLoadingAttendanceHistory] = useState(false);
  const [historyFromDate, setHistoryFromDate] = useState('');
  const [historyToDate, setHistoryToDate] = useState('');
  const [historyStatusFilter, setHistoryStatusFilter] = useState('ALL');
  const [historySearch, setHistorySearch] = useState('');

  // Edit Attendance Modal State
  const [editAttendanceModalOpen, setEditAttendanceModalOpen] = useState(false);
  const [editingAttendanceRecord, setEditingAttendanceRecord] = useState(null);
  const [editStatus, setEditStatus] = useState('PRESENT');
  const [editRemarks, setEditRemarks] = useState('');
  const [savingEditAttendance, setSavingEditAttendance] = useState(false);

  // Load Dashboard Data
  const loadDashboard = useCallback(() => {
    authFetch('/api/warden/dashboard')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load warden dashboard metrics');
        return res.json();
      })
      .then((data) => {
        setDashboardData(data);
        if (data.hostels && data.hostels.length > 0) {
          setHostels(data.hostels);
          if (!selectedHostelId) {
            setSelectedHostelId(String(data.hostels[0].id));
          }
        }
      })
      .catch((err) => {
        setFeedbackError(err.message || 'Unable to connect to warden operations API');
      })
      .finally(() => {
        setLoadingDashboard(false);
      });
  }, [authFetch, selectedHostelId]);

  // Load Hostels List
  const loadHostels = useCallback(() => {
    authFetch('/api/warden/hostels')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load assigned hostels');
        return res.json();
      })
      .then((data) => {
        setHostels(data);
        if (data.length > 0 && !selectedHostelId) {
          setSelectedHostelId(String(data[0].id));
        }
      })
      .catch((err) => {
        setFeedbackError(err.message);
      });
  }, [authFetch, selectedHostelId]);

  // Load Rooms for Selected Hostel
  const loadRooms = useCallback((hostelId) => {
    if (!hostelId) return;
    authFetch(`/api/warden/hostels/${hostelId}/rooms`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load room inventory for hostel');
        return res.json();
      })
      .then((data) => {
        setRooms(data);
      })
      .catch((err) => {
        setFeedbackError(err.message);
      })
      .finally(() => {
        setLoadingRooms(false);
      });
  }, [authFetch]);

  // Load Residents
  const loadResidents = useCallback((hostelId = '', search = '') => {
    let url = '/api/warden/residents?';
    if (hostelId) url += `hostelId=${hostelId}&`;
    if (search.trim()) url += `search=${encodeURIComponent(search.trim())}&`;

    authFetch(url)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load resident directory');
        return res.json();
      })
      .then((data) => {
        setResidents(data);
      })
      .catch((err) => {
        setFeedbackError(err.message);
      })
      .finally(() => {
        setLoadingResidents(false);
      });
  }, [authFetch]);

  // Load Allocations
  const loadAllocations = useCallback((hostelId = '', status = 'ALL', search = '') => {
    let url = '/api/warden/allocations?';
    if (hostelId) url += `hostelId=${hostelId}&`;
    if (status && status !== 'ALL') url += `status=${status}&`;
    if (search.trim()) url += `search=${encodeURIComponent(search.trim())}&`;

    authFetch(url)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load allocation records');
        return res.json();
      })
      .then((data) => {
        setAllocations(data);
      })
      .catch((err) => {
        setFeedbackError(err.message);
      })
      .finally(() => {
        setLoadingAllocations(false);
      });
  }, [authFetch]);

  // Load Attendance Roll Call for Selected Hostel and Date
  const loadRollCall = useCallback((hostelId, date) => {
    if (!hostelId) return;
    const targetDate = date || getTodayDateString();
    Promise.resolve().then(() => setLoadingRollCall(true));
    authFetch(`/api/warden/attendance?hostelId=${hostelId}&date=${targetDate}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load roll-call roster for hostel');
        return res.json();
      })
      .then((data) => {
        setRollCallRoster(data);
        const marks = {};
        data.forEach((r) => {
          if (r.status) {
            marks[r.studentId] = {
              status: r.status,
              remarks: r.remarks || ''
            };
          }
        });
        setRollCallMarkings(marks);
      })
      .catch((err) => {
        setFeedbackError(err.message);
      })
      .finally(() => {
        setLoadingRollCall(false);
      });
  }, [authFetch]);

  // Load Attendance History with Filters
  const loadAttendanceHistory = useCallback((hostelId, from, to, status, search) => {
    Promise.resolve().then(() => setLoadingAttendanceHistory(true));
    let url = '/api/warden/attendance/history?';
    if (hostelId) url += `hostelId=${hostelId}&`;
    if (from) url += `from=${from}&`;
    if (to) url += `to=${to}&`;
    if (status && status !== 'ALL') url += `status=${status}&`;
    if (search && search.trim()) url += `search=${encodeURIComponent(search.trim())}&`;

    authFetch(url)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load attendance history');
        return res.json();
      })
      .then((data) => {
        setAttendanceHistory(data);
      })
      .catch((err) => {
        setFeedbackError(err.message);
      })
      .finally(() => {
        setLoadingAttendanceHistory(false);
      });
  }, [authFetch]);

  // Initial Data Load
  useEffect(() => {
    loadDashboard();
    loadHostels();
  }, [loadDashboard, loadHostels]);

  // Tab Navigation Side-Effects
  useEffect(() => {
    if (activeTab === 'rooms' && selectedHostelId) {
      loadRooms(selectedHostelId);
    } else if (activeTab === 'residents') {
      loadResidents(selectedHostelId, residentSearch);
    } else if (activeTab === 'allocations') {
      loadAllocations(selectedHostelId, allocationStatusFilter, allocationSearch);
    } else if (activeTab === 'attendance' && selectedHostelId) {
      if (attendanceMode === 'rollcall') {
        loadRollCall(selectedHostelId, attendanceDate);
      } else {
        loadAttendanceHistory(selectedHostelId, historyFromDate, historyToDate, historyStatusFilter, historySearch);
      }
    }
  }, [activeTab, selectedHostelId, loadRooms, loadResidents, loadAllocations, loadRollCall, loadAttendanceHistory, residentSearch, allocationStatusFilter, allocationSearch, attendanceMode, attendanceDate, historyFromDate, historyToDate, historyStatusFilter, historySearch]);

  // Handle Hostel Change
  const handleHostelChange = (e) => {
    const newId = e.target.value;
    setSelectedHostelId(newId);
    if (activeTab === 'rooms') {
      loadRooms(newId);
    } else if (activeTab === 'residents') {
      loadResidents(newId, residentSearch);
    } else if (activeTab === 'allocations') {
      loadAllocations(newId, allocationStatusFilter, allocationSearch);
    } else if (activeTab === 'attendance') {
      if (attendanceMode === 'rollcall') {
        loadRollCall(newId, attendanceDate);
      } else {
        loadAttendanceHistory(newId, historyFromDate, historyToDate, historyStatusFilter, historySearch);
      }
    }
  };

  // Roll Call Item Status Change
  const handleStatusChange = (studentId, status) => {
    setRollCallMarkings((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || {}),
        status
      }
    }));
  };

  // Roll Call Item Remarks Change
  const handleRemarksChange = (studentId, remarks) => {
    setRollCallMarkings((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || { status: 'PRESENT' }),
        remarks
      }
    }));
  };

  // Mark All Convenience
  const handleMarkAll = (status) => {
    const updated = { ...rollCallMarkings };
    rollCallRoster.forEach((r) => {
      updated[r.studentId] = {
        ...(updated[r.studentId] || {}),
        status
      };
    });
    setRollCallMarkings(updated);
  };

  // Clear All Marks
  const handleClearAllMarks = () => {
    setRollCallMarkings({});
  };

  // Submit Roll Call Batch
  const handleSubmitRollCall = async () => {
    setFeedbackError('');
    setAttendanceSuccessMsg('');

    const records = Object.entries(rollCallMarkings).map(([studentId, mark]) => ({
      studentId: Number(studentId),
      status: mark.status,
      remarks: mark.remarks || null
    }));

    if (records.length === 0) {
      setFeedbackError('Please mark attendance for at least one resident before saving.');
      return;
    }

    setSubmittingAttendance(true);
    try {
      const res = await authFetch('/api/warden/attendance/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hostelId: Number(selectedHostelId),
          date: attendanceDate,
          records
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to submit attendance roll call');
      }

      setAttendanceSuccessMsg(data.message || 'Roll call successfully recorded.');
      loadRollCall(selectedHostelId, attendanceDate);
    } catch (err) {
      setFeedbackError(err.message);
    } finally {
      setSubmittingAttendance(false);
    }
  };

  // Open Edit Attendance Record Modal
  const openEditAttendanceModal = (record) => {
    setEditingAttendanceRecord(record);
    setEditStatus(record.status);
    setEditRemarks(record.remarks || '');
    setEditAttendanceModalOpen(true);
  };

  // Save Edit Attendance
  const handleSaveEditAttendance = async (e) => {
    e.preventDefault();
    if (!editingAttendanceRecord) return;
    setSavingEditAttendance(true);
    setFeedbackError('');
    try {
      const res = await authFetch(`/api/warden/attendance/${editingAttendanceRecord.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: editStatus,
          remarks: editRemarks
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to update attendance record');
      }

      setAttendanceSuccessMsg(`Attendance record for ${data.studentName} updated successfully.`);
      setEditAttendanceModalOpen(false);
      loadAttendanceHistory(selectedHostelId, historyFromDate, historyToDate, historyStatusFilter, historySearch);
    } catch (err) {
      setFeedbackError(err.message);
    } finally {
      setSavingEditAttendance(false);
    }
  };

  // Filtered Rooms
  const filteredRooms = rooms.filter((r) => {
    const matchesSearch = !roomSearch.trim() || r.roomNumber.toLowerCase().includes(roomSearch.toLowerCase().trim());
    if (!matchesSearch) return false;

    if (roomStatusFilter === 'VACANT') return r.currentOccupancy === 0;
    if (roomStatusFilter === 'FULL') return r.availableBeds === 0;
    if (roomStatusFilter === 'PARTIAL') return r.currentOccupancy > 0 && r.availableBeds > 0;
    return true;
  });

  return (
    <div className="portal-wrapper">
      <div className="container">
        {/* Header Card */}
        <div className="card portal-header-card">
          <div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span className="badge badge-primary">Warden Operations</span>
              <span className="badge badge-success">Hostel Superintendent</span>
            </div>
            <h1 className="portal-title">Warden Operations Portal</h1>
            <p className="portal-subtitle">
              Government Polytechnic Sakoli &bull; Overseeing Assigned Hostels &amp; Resident Life
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ textAlign: 'right', display: 'none', md: 'block' }}>
              <div style={{ fontWeight: 600, color: 'var(--slate-900)' }}>{user?.fullName}</div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--slate-500)' }}>{user?.email}</div>
            </div>
            <button id="btn-warden-logout" onClick={logout} className="btn btn-secondary">
              Sign Out
            </button>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedbackError && (
          <div className="alert alert-error" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{feedbackError}</span>
            <button onClick={() => setFeedbackError('')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
              &times;
            </button>
          </div>
        )}

        {/* Success Alert */}
        {attendanceSuccessMsg && (
          <div className="alert alert-success" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{attendanceSuccessMsg}</span>
            <button onClick={() => setAttendanceSuccessMsg('')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
              &times;
            </button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="portal-tabs" style={{ marginBottom: '1.5rem' }}>
          <button
            className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
            id="tab-warden-overview"
          >
            Dashboard Overview
          </button>
          <button
            className={`tab-btn ${activeTab === 'attendance' ? 'active' : ''}`}
            onClick={() => setActiveTab('attendance')}
            id="tab-warden-attendance"
          >
            Night Roll Call
          </button>
          <button
            className={`tab-btn ${activeTab === 'complaints' ? 'active' : ''}`}
            onClick={() => setActiveTab('complaints')}
            id="tab-warden-complaints"
          >
            &#128295; Complaints &amp; Maintenance
          </button>
          <button
            className={`tab-btn ${activeTab === 'hostels' ? 'active' : ''}`}
            onClick={() => setActiveTab('hostels')}
            id="tab-warden-hostels"
          >
            Assigned Hostels ({hostels.length})
          </button>
          <button
            className={`tab-btn ${activeTab === 'rooms' ? 'active' : ''}`}
            onClick={() => setActiveTab('rooms')}
            id="tab-warden-rooms"
          >
            Room Inventory
          </button>
          <button
            className={`tab-btn ${activeTab === 'residents' ? 'active' : ''}`}
            onClick={() => setActiveTab('residents')}
            id="tab-warden-residents"
          >
            Resident Directory
          </button>
          <button
            className={`tab-btn ${activeTab === 'allocations' ? 'active' : ''}`}
            onClick={() => setActiveTab('allocations')}
            id="tab-warden-allocations"
          >
            Allocation History
          </button>
          <button
            className={`tab-btn ${activeTab === 'admissions' ? 'active' : ''}`}
            onClick={() => setActiveTab('admissions')}
            id="tab-warden-admissions"
          >
            &#128221; Admissions &amp; Selection
          </button>
        </div>

        {/* ---------------------------------------------------- */}
        {/* TAB 1: OVERVIEW DASHBOARD */}
        {/* ---------------------------------------------------- */}
        {activeTab === 'overview' && (
          <div>
            {loadingDashboard ? (
              <div style={{ textAlign: 'center', padding: '3rem' }}>
                <span className="spinner"></span>
                <p style={{ marginTop: '1rem', color: 'var(--slate-500)' }}>Loading operational statistics...</p>
              </div>
            ) : (
              <>
                {/* Stat Metric Cards */}
                <div className="warden-dashboard-stats">
                  <div className="warden-stat-card stat-hostels">
                    <div className="warden-stat-label">Assigned Hostels</div>
                    <div className="warden-stat-value">{dashboardData?.totalAssignedHostels ?? 0}</div>
                    <div className="warden-stat-subtext">Active oversight premises</div>
                  </div>

                  <div className="warden-stat-card stat-rooms">
                    <div className="warden-stat-label">Total Rooms</div>
                    <div className="warden-stat-value">{dashboardData?.totalRooms ?? 0}</div>
                    <div className="warden-stat-subtext">Across assigned blocks</div>
                  </div>

                  <div className="warden-stat-card stat-capacity">
                    <div className="warden-stat-label">Bed Capacity</div>
                    <div className="warden-stat-value">{dashboardData?.totalCapacity ?? 0}</div>
                    <div className="warden-stat-subtext">Sanctioned resident beds</div>
                  </div>

                  <div className="warden-stat-card stat-occupied">
                    <div className="warden-stat-label">Occupied Beds</div>
                    <div className="warden-stat-value">{dashboardData?.totalOccupiedBeds ?? 0}</div>
                    <div className="warden-stat-subtext">Active resident students</div>
                  </div>

                  <div className="warden-stat-card stat-available">
                    <div className="warden-stat-label">Available Beds</div>
                    <div className="warden-stat-value">{dashboardData?.totalAvailableBeds ?? 0}</div>
                    <div className="warden-stat-subtext">Ready for allocation</div>
                  </div>

                  <div className="warden-stat-card stat-rate">
                    <div className="warden-stat-label">Occupancy Rate</div>
                    <div className="warden-stat-value">{dashboardData?.occupancyRate ?? 0}%</div>
                    <div className="warden-stat-subtext">Current utilization</div>
                  </div>
                </div>

                {/* Assigned Hostels Summary Grid */}
                <div className="card" style={{ marginBottom: '2rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--slate-900)' }}>
                      Assigned Hostel Premises
                    </h2>
                    <button
                      className="btn btn-secondary"
                      style={{ fontSize: '0.8125rem' }}
                      onClick={() => setActiveTab('hostels')}
                    >
                      View All Hostels &rarr;
                    </button>
                  </div>

                  {dashboardData?.hostels?.length === 0 ? (
                    <div className="warden-empty-state">
                      <div className="warden-empty-title">No Hostels Assigned</div>
                      <div className="warden-empty-desc">
                        You are currently not assigned to oversee any hostel. Please contact the administrator (admin@gpsakoli.ac.in) for hostel assignment.
                      </div>
                    </div>
                  ) : (
                    <div className="warden-hostel-grid">
                      {dashboardData?.hostels?.map((h) => {
                        const media = getHostelImage(h.name, h.hostelType);
                        const pct = h.totalCapacity > 0 ? Math.round((h.occupiedBeds / h.totalCapacity) * 100) : 0;
                        return (
                          <div key={h.id} className="photo-card warden-hostel-photo-card">
                            <div className="photo-card-media" style={{ height: '170px' }}>
                              <ImageWithFallback
                                src={media.src}
                                fallbackSrc={media.fallbackSrc}
                                alt={media.alt}
                                className="photo-card-img"
                              />
                              <div className="photo-card-overlay"></div>
                              <div className="photo-card-badge-top">
                                <span className={`badge ${h.hostelType === 'BOYS' ? 'type-badge-boys' : 'type-badge-girls'}`}>
                                  {h.hostelType} HOSTEL
                                </span>
                              </div>
                              <div className="photo-card-title-bottom">
                                <h3 className="photo-card-title">{h.name}</h3>
                              </div>
                            </div>

                            <div className="photo-card-content">
                              <p className="photo-card-address">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: '2px' }}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                                <span>{h.address || 'Government Polytechnic Sakoli Campus'}</span>
                              </p>

                              <div className="occupancy-section">
                                <div className="occupancy-header">
                                  <span className="occupancy-title">Bed Utilization</span>
                                  <span className="occupancy-percent">{pct}%</span>
                                </div>
                                <div className="occupancy-track" role="progressbar" aria-valuenow={pct} aria-valuemin="0" aria-valuemax="100">
                                  <div
                                    className={`occupancy-fill ${pct >= 90 ? 'danger' : pct >= 70 ? 'warning' : 'safe'}`}
                                    style={{ width: `${pct}%` }}
                                  ></div>
                                </div>
                                <div className="occupancy-stats-footer">
                                  <span>{h.occupiedBeds} occupied / {h.totalCapacity} total</span>
                                  <span style={{ color: h.availableBeds > 0 ? 'var(--accent-emerald-600)' : 'var(--slate-500)', fontWeight: 600 }}>
                                    {h.availableBeds} vacant
                                  </span>
                                </div>
                              </div>

                              <div className="photo-card-stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                                <div className="photo-stat-box">
                                  <span className="photo-stat-label">Rooms</span>
                                  <span className="photo-stat-value">{h.totalRooms}</span>
                                </div>
                                <div className="photo-stat-box">
                                  <span className="photo-stat-label">Occupied</span>
                                  <span className="photo-stat-value">{h.occupiedBeds}</span>
                                </div>
                                <div className="photo-stat-box">
                                  <span className="photo-stat-label">Vacant</span>
                                  <span className="photo-stat-value" style={{ color: h.availableBeds > 0 ? 'var(--accent-emerald-600)' : 'inherit' }}>{h.availableBeds}</span>
                                </div>
                              </div>

                              <div className="photo-card-actions">
                                <button
                                  className="btn btn-secondary btn-sm"
                                  onClick={() => {
                                    setSelectedHostelId(String(h.id));
                                    setActiveTab('rooms');
                                  }}
                                >
                                  Explore Rooms
                                </button>
                                <button
                                  className="btn btn-primary btn-sm"
                                  onClick={() => {
                                    setSelectedHostelId(String(h.id));
                                    setActiveTab('attendance');
                                  }}
                                >
                                  Night Roll Call
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Recent Allocation Activity */}
                <div className="card">
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--slate-900)', marginBottom: '1rem' }}>
                    Recent Resident Allocations in Assigned Hostels
                  </h2>

                  {dashboardData?.recentAllocations?.length === 0 ? (
                    <p style={{ color: 'var(--slate-500)', fontStyle: 'italic' }}>
                      No recent room allocations recorded for your assigned premises.
                    </p>
                  ) : (
                    <div className="table-responsive">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Student Resident</th>
                            <th>Enrollment No</th>
                            <th>Hostel &amp; Room</th>
                            <th>Allocation Date</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dashboardData?.recentAllocations?.map((alloc) => (
                            <tr key={alloc.id}>
                              <td>
                                <div style={{ fontWeight: 600, color: 'var(--slate-900)' }}>{alloc.studentName}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>{alloc.course} &bull; Sem {alloc.semester}</div>
                              </td>
                              <td><code>{alloc.enrollmentNumber}</code></td>
                              <td>{alloc.hostelName} &bull; <strong>Room {alloc.roomNumber}</strong></td>
                              <td>{alloc.allocationDate}</td>
                              <td>
                                <span className={`badge ${alloc.status === 'ACTIVE' ? 'badge-success' : 'badge-secondary'}`}>
                                  {alloc.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* TAB 2: ASSIGNED HOSTELS */}
        {/* ---------------------------------------------------- */}
        {activeTab === 'hostels' && (
          <div>
            <div className="card" style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--slate-900)', marginBottom: '0.5rem' }}>
                Assigned Hostel Operations
              </h2>
              <p style={{ color: 'var(--slate-600)', fontSize: '0.875rem' }}>
                Your administrative purview covers the hostels below. All student records, room inspections, and occupancy tracking are strictly bounded to these premises.
              </p>
            </div>

            {hostels.length === 0 ? (
              <div className="warden-empty-state">
                <div className="warden-empty-title">No Hostels Assigned</div>
                <div className="warden-empty-desc">
                  You are not currently assigned to any hostel building. Only an administrator can assign hostels to warden accounts.
                </div>
              </div>
            ) : (
              <div className="warden-hostel-grid">
                {hostels.map((h) => {
                  const media = getHostelImage(h.name, h.hostelType);
                  const pct = h.totalCapacity > 0 ? Math.round((h.occupiedBeds / h.totalCapacity) * 100) : 0;
                  return (
                    <div key={h.id} className="photo-card warden-hostel-photo-card">
                      <div className="photo-card-media" style={{ height: '170px' }}>
                        <ImageWithFallback
                          src={media.src}
                          fallbackSrc={media.fallbackSrc}
                          alt={media.alt}
                          className="photo-card-img"
                        />
                        <div className="photo-card-overlay"></div>
                        <div className="photo-card-badge-top">
                          <span className={`badge ${h.hostelType === 'BOYS' ? 'type-badge-boys' : 'type-badge-girls'}`}>
                            {h.hostelType} HOSTEL
                          </span>
                        </div>
                        <div className="photo-card-title-bottom">
                          <h3 className="photo-card-title">{h.name}</h3>
                        </div>
                      </div>

                      <div className="photo-card-content">
                        <p className="photo-card-address">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: '2px' }}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                          <span>{h.address || 'Government Polytechnic Sakoli Campus'}</span>
                        </p>

                        <div className="occupancy-section">
                          <div className="occupancy-header">
                            <span className="occupancy-title">Bed Utilization</span>
                            <span className="occupancy-percent">{pct}%</span>
                          </div>
                          <div className="occupancy-track" role="progressbar" aria-valuenow={pct} aria-valuemin="0" aria-valuemax="100">
                            <div
                              className={`occupancy-fill ${pct >= 90 ? 'danger' : pct >= 70 ? 'warning' : 'safe'}`}
                              style={{ width: `${pct}%` }}
                            ></div>
                          </div>
                          <div className="occupancy-stats-footer">
                            <span>{h.occupiedBeds} occupied / {h.totalCapacity} beds</span>
                            <span style={{ color: h.availableBeds > 0 ? 'var(--accent-emerald-600)' : 'var(--slate-500)', fontWeight: 600 }}>
                              {h.availableBeds} vacant
                            </span>
                          </div>
                        </div>

                        <div className="photo-card-stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                          <div className="photo-stat-box">
                            <span className="photo-stat-label">Rooms</span>
                            <span className="photo-stat-value">{h.totalRooms}</span>
                          </div>
                          <div className="photo-stat-box">
                            <span className="photo-stat-label">Occupied</span>
                            <span className="photo-stat-value">{h.occupiedBeds}</span>
                          </div>
                          <div className="photo-stat-box">
                            <span className="photo-stat-label">Available</span>
                            <span className="photo-stat-value" style={{ color: h.availableBeds > 0 ? 'var(--accent-emerald-600)' : 'inherit' }}>{h.availableBeds}</span>
                          </div>
                        </div>

                        <div className="photo-card-actions">
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => {
                              setSelectedHostelId(String(h.id));
                              setActiveTab('rooms');
                            }}
                          >
                            View Rooms
                          </button>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => {
                              setSelectedHostelId(String(h.id));
                              setActiveTab('residents');
                            }}
                          >
                            Residents
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* TAB 3: ROOM INVENTORY */}
        {/* ---------------------------------------------------- */}
        {activeTab === 'rooms' && (
          <div>
            {/* Filter Bar */}
            <div className="warden-filter-bar">
              <div className="warden-filter-group">
                <label>Hostel Premises</label>
                <select
                  value={selectedHostelId}
                  onChange={handleHostelChange}
                  className="warden-filter-select"
                >
                  {hostels.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name} ({h.hostelType})
                    </option>
                  ))}
                </select>
              </div>

              <div className="warden-filter-group">
                <label>Occupancy Status</label>
                <select
                  value={roomStatusFilter}
                  onChange={(e) => setRoomStatusFilter(e.target.value)}
                  className="warden-filter-select"
                >
                  <option value="ALL">All Rooms</option>
                  <option value="VACANT">Completely Vacant</option>
                  <option value="PARTIAL">Partially Occupied</option>
                  <option value="FULL">Fully Occupied</option>
                </select>
              </div>

              <div className="warden-filter-group" style={{ minWidth: '220px' }}>
                <label>Search Room Number</label>
                <input
                  type="text"
                  placeholder="e.g. 101, 201..."
                  value={roomSearch}
                  onChange={(e) => setRoomSearch(e.target.value)}
                  className="warden-filter-input"
                />
              </div>
            </div>

            {loadingRooms ? (
              <div style={{ textAlign: 'center', padding: '3rem' }}>
                <span className="spinner"></span>
                <p style={{ marginTop: '1rem', color: 'var(--slate-500)' }}>Loading room inventory...</p>
              </div>
            ) : filteredRooms.length === 0 ? (
              <div className="warden-empty-state">
                <div className="warden-empty-title">No Rooms Found</div>
                <div className="warden-empty-desc">
                  No rooms match your filter criteria in the selected hostel.
                </div>
              </div>
            ) : (
              <div className="warden-room-grid">
                {filteredRooms.map((room) => (
                  <div key={room.id} className="warden-room-card">
                    <div className="warden-room-card-header">
                      <div>
                        <span className="warden-room-num">Room {room.roomNumber}</span>
                        <div className="warden-room-floor">Floor {room.floor} &bull; Capacity {room.capacity}</div>
                      </div>
                      <span className={`badge ${room.availableBeds === 0 ? 'badge-error' : room.currentOccupancy === 0 ? 'badge-success' : 'badge-gold'}`}>
                        {room.availableBeds === 0 ? 'FULL' : `${room.availableBeds} Bed${room.availableBeds > 1 ? 's' : ''} Left`}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.8125rem', color: 'var(--slate-600)', marginBottom: '0.5rem' }}>
                      Bed Slots:
                    </div>
                    <div className="warden-bed-indicators">
                      {Array.from({ length: room.capacity }).map((_, idx) => {
                        const isOccupied = idx < room.currentOccupancy;
                        return (
                          <div
                            key={idx}
                            className={`warden-bed-pill ${isOccupied ? 'occupied' : 'vacant'}`}
                            title={isOccupied ? `Bed ${idx + 1}: Occupied` : `Bed ${idx + 1}: Vacant`}
                          >
                            {idx + 1}
                          </div>
                        );
                      })}
                    </div>

                    <div style={{ marginTop: '0.75rem', borderTop: '1px solid var(--slate-100)', paddingTop: '0.75rem' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--slate-500)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                        Current Occupants ({room.occupants.length}):
                      </div>
                      {room.occupants.length === 0 ? (
                        <div style={{ fontSize: '0.8125rem', color: 'var(--slate-400)', fontStyle: 'italic' }}>
                          Room is currently vacant.
                        </div>
                      ) : (
                        <div className="warden-occupants-list">
                          {room.occupants.map((occ) => (
                            <div key={occ.allocationId} className="warden-occupant-badge">
                              <div>
                                <div className="name">{occ.studentName}</div>
                                <div className="roll">{occ.enrollmentNumber} &bull; {occ.phone}</div>
                              </div>
                              <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>ACTIVE</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* TAB 4: RESIDENT DIRECTORY */}
        {/* ---------------------------------------------------- */}
        {activeTab === 'residents' && (
          <div>
            <div className="warden-filter-bar">
              <div className="warden-filter-group">
                <label>Scope by Hostel</label>
                <select
                  value={selectedHostelId}
                  onChange={handleHostelChange}
                  className="warden-filter-select"
                >
                  <option value="">All Assigned Hostels</option>
                  {hostels.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="warden-filter-group" style={{ flex: 2, minWidth: '240px' }}>
                <label>Search Residents</label>
                <input
                  type="text"
                  placeholder="Search by student name, enrollment number, phone..."
                  value={residentSearch}
                  onChange={(e) => setResidentSearch(e.target.value)}
                  className="warden-filter-input"
                />
              </div>

              <div style={{ alignSelf: 'flex-end' }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => loadResidents(selectedHostelId, residentSearch)}
                >
                  Refresh
                </button>
              </div>
            </div>

            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--slate-900)' }}>
                  Active Hostel Residents ({residents.length})
                </h2>
                <span className="badge badge-primary">Current Active Allocations Only</span>
              </div>

              {loadingResidents ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                  <span className="spinner"></span>
                  <p style={{ marginTop: '1rem', color: 'var(--slate-500)' }}>Fetching resident records...</p>
                </div>
              ) : residents.length === 0 ? (
                <div className="warden-empty-state">
                  <div className="warden-empty-title">No Residents Found</div>
                  <div className="warden-empty-desc">
                    No active residents match your search criteria in the assigned hostel premises.
                  </div>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Resident Student</th>
                        <th>Enrollment No</th>
                        <th>Course &amp; Semester</th>
                        <th>Contact Phone</th>
                        <th>Hostel &amp; Room</th>
                        <th>Allocation Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {residents.map((res) => (
                        <tr key={res.allocationId}>
                          <td>
                            <div style={{ fontWeight: 600, color: 'var(--slate-900)' }}>{res.studentName}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>{res.email}</div>
                          </td>
                          <td><code>{res.enrollmentNumber}</code></td>
                          <td>{res.course} &bull; Sem {res.semester}</td>
                          <td><a href={`tel:${res.phone}`} style={{ color: 'var(--primary-600)', fontWeight: 500 }}>{res.phone}</a></td>
                          <td>
                            <strong>{res.hostelName}</strong>
                            <div style={{ fontSize: '0.8125rem', color: 'var(--slate-600)' }}>Room {res.roomNumber}</div>
                          </td>
                          <td>{res.allocationDate}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* TAB 5: ALLOCATION HISTORY */}
        {/* ---------------------------------------------------- */}
        {activeTab === 'allocations' && (
          <div>
            <div className="warden-filter-bar">
              <div className="warden-filter-group">
                <label>Filter by Hostel</label>
                <select
                  value={selectedHostelId}
                  onChange={handleHostelChange}
                  className="warden-filter-select"
                >
                  <option value="">All Assigned Hostels</option>
                  {hostels.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="warden-filter-group">
                <label>Allocation Status</label>
                <select
                  value={allocationStatusFilter}
                  onChange={(e) => setAllocationStatusFilter(e.target.value)}
                  className="warden-filter-select"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="ACTIVE">ACTIVE Only</option>
                  <option value="COMPLETED">COMPLETED (Vacated)</option>
                </select>
              </div>

              <div className="warden-filter-group" style={{ flex: 2, minWidth: '220px' }}>
                <label>Search Student / Enrollment</label>
                <input
                  type="text"
                  placeholder="Student name or enrollment..."
                  value={allocationSearch}
                  onChange={(e) => setAllocationSearch(e.target.value)}
                  className="warden-filter-input"
                />
              </div>

              <div style={{ alignSelf: 'flex-end' }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => loadAllocations(selectedHostelId, allocationStatusFilter, allocationSearch)}
                >
                  Search
                </button>
              </div>
            </div>

            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--slate-900)' }}>
                  Allocation Timeline &amp; History ({allocations.length})
                </h2>
              </div>

              {loadingAllocations ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                  <span className="spinner"></span>
                  <p style={{ marginTop: '1rem', color: 'var(--slate-500)' }}>Retrieving allocation logs...</p>
                </div>
              ) : allocations.length === 0 ? (
                <div className="warden-empty-state">
                  <div className="warden-empty-title">No Allocation Records Found</div>
                  <div className="warden-empty-desc">
                    No historical or active allocations match your search query.
                  </div>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Student Name</th>
                        <th>Enrollment No</th>
                        <th>Hostel &amp; Room</th>
                        <th>Allocation Date</th>
                        <th>Vacating Date</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allocations.map((alloc) => (
                        <tr key={alloc.id}>
                          <td>
                            <div style={{ fontWeight: 600, color: 'var(--slate-900)' }}>{alloc.studentName}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>{alloc.course} &bull; Sem {alloc.semester}</div>
                          </td>
                          <td><code>{alloc.enrollmentNumber}</code></td>
                          <td>{alloc.hostelName} &bull; <strong>Room {alloc.roomNumber}</strong></td>
                          <td>{alloc.allocationDate}</td>
                          <td>{alloc.vacatingDate || <span style={{ color: 'var(--slate-400)' }}>—</span>}</td>
                          <td>
                            <span className={`badge ${alloc.status === 'ACTIVE' ? 'badge-success' : 'badge-secondary'}`}>
                              {alloc.status}
                            </span>
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

        {/* ---------------------------------------------------- */}
        {/* TAB: HOSTEL ADMISSIONS & SELECTION */}
        {/* ---------------------------------------------------- */}
        {activeTab === 'admissions' && (
          <AdminAdmissionsManager
            apiPrefix="/api/warden/admissions"
            role="WARDEN"
            hostels={hostels}
          />
        )}

        {/* ---------------------------------------------------- */}
        {/* TAB: COMPLAINTS & GRIEVANCE REDRESSAL */}
        {/* ---------------------------------------------------- */}
        {activeTab === 'complaints' && (
          <GrievanceMaintenanceManager
            apiPrefix="/api/warden/complaints"
            role="WARDEN"
            hostels={hostels}
          />
        )}

        {/* ---------------------------------------------------- */}
        {/* TAB 6: NIGHT ROLL CALL & ATTENDANCE */}
        {/* ---------------------------------------------------- */}
        {activeTab === 'attendance' && (
          <div>
            {/* Control Bar: Mode Toggle, Hostel Selector, Date Picker */}
            <div className="attendance-header-bar">
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <div className="attendance-mode-tabs">
                  <button
                    className={`attendance-mode-btn ${attendanceMode === 'rollcall' ? 'active' : ''}`}
                    onClick={() => setAttendanceMode('rollcall')}
                    id="btn-mode-rollcall"
                  >
                    &#128221; Roll Call Roster
                  </button>
                  <button
                    className={`attendance-mode-btn ${attendanceMode === 'history' ? 'active' : ''}`}
                    onClick={() => {
                      setAttendanceMode('history');
                      loadAttendanceHistory(selectedHostelId, historyFromDate, historyToDate, historyStatusFilter, historySearch);
                    }}
                    id="btn-mode-history"
                  >
                    &#128197; Attendance History
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--slate-600)' }}>Hostel:</label>
                  <select
                    value={selectedHostelId}
                    onChange={handleHostelChange}
                    className="warden-filter-select"
                    style={{ minWidth: '180px' }}
                    id="select-attendance-hostel"
                  >
                    {hostels.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name}
                      </option>
                    ))}
                  </select>
                </div>

                {attendanceMode === 'rollcall' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--slate-600)' }}>Roll Call Date:</label>
                    <input
                      type="date"
                      value={attendanceDate}
                      max={todayDateStr}
                      onChange={(e) => {
                        const newDate = e.target.value;
                        setAttendanceDate(newDate);
                        if (selectedHostelId) {
                          loadRollCall(selectedHostelId, newDate);
                        }
                      }}
                      className="warden-filter-input"
                      style={{ padding: '0.35rem 0.5rem' }}
                      id="input-rollcall-date"
                    />
                  </div>
                )}
              </div>

              {attendanceMode === 'rollcall' && (
                <div className="attendance-quick-actions">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ fontSize: '0.8125rem', padding: '0.4rem 0.75rem' }}
                    onClick={() => handleMarkAll('PRESENT')}
                  >
                    All Present
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ fontSize: '0.8125rem', padding: '0.4rem 0.75rem' }}
                    onClick={() => handleMarkAll('ABSENT')}
                  >
                    All Absent
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ fontSize: '0.8125rem', padding: '0.4rem 0.75rem' }}
                    onClick={handleClearAllMarks}
                  >
                    Clear Marks
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ fontSize: '0.8125rem', padding: '0.4rem 1.25rem' }}
                    onClick={handleSubmitRollCall}
                    disabled={submittingAttendance || loadingRollCall}
                    id="btn-submit-rollcall"
                  >
                    {submittingAttendance ? (
                      <>
                        <span className="spinner" style={{ width: '14px', height: '14px', display: 'inline-block', marginRight: '6px' }}></span> Saving...
                      </>
                    ) : (
                      `Save Roll Call (${Object.keys(rollCallMarkings).length}/${rollCallRoster.length} Marked)`
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* SUB-VIEW 1: NIGHT ROLL CALL ROSTER */}
            {attendanceMode === 'rollcall' && (
              <div>
                {/* Summary metrics for current roll-call */}
                <div className="attendance-summary-banner">
                  <div className="attendance-summary-chip">
                    <div className="chip-label">Eligible Residents</div>
                    <div className="chip-val">{rollCallRoster.length}</div>
                  </div>
                  <div className="attendance-summary-chip">
                    <div className="chip-label">Marked Count</div>
                    <div className="chip-val" style={{ color: '#2563eb' }}>
                      {Object.keys(rollCallMarkings).length}
                    </div>
                  </div>
                  <div className="attendance-summary-chip">
                    <div className="chip-label">Present</div>
                    <div className="chip-val" style={{ color: '#16a34a' }}>
                      {Object.values(rollCallMarkings).filter((m) => m.status === 'PRESENT').length}
                    </div>
                  </div>
                  <div className="attendance-summary-chip">
                    <div className="chip-label">Absent</div>
                    <div className="chip-val" style={{ color: '#dc2626' }}>
                      {Object.values(rollCallMarkings).filter((m) => m.status === 'ABSENT').length}
                    </div>
                  </div>
                  <div className="attendance-summary-chip">
                    <div className="chip-label">On Leave</div>
                    <div className="chip-val" style={{ color: '#d97706' }}>
                      {Object.values(rollCallMarkings).filter((m) => m.status === 'ON_LEAVE').length}
                    </div>
                  </div>
                </div>

                {/* Filter and Search */}
                <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
                  <input
                    type="text"
                    placeholder="Search roster by student name, enrollment number, or room..."
                    value={attendanceSearch}
                    onChange={(e) => setAttendanceSearch(e.target.value)}
                    className="warden-filter-input"
                    style={{ width: '100%' }}
                  />
                </div>

                {/* Roll Call Table */}
                <div className="card">
                  {loadingRollCall ? (
                    <div style={{ textAlign: 'center', padding: '3rem' }}>
                      <span className="spinner"></span>
                      <p style={{ marginTop: '1rem', color: 'var(--slate-500)' }}>Loading roll-call roster...</p>
                    </div>
                  ) : rollCallRoster.length === 0 ? (
                    <div className="warden-empty-state">
                      <div className="warden-empty-title">No Active Residents Allocated</div>
                      <div className="warden-empty-desc">
                        There are currently no students with active room allocations in this hostel.
                      </div>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table">
                        <thead>
                          <tr>
                            <th style={{ width: '90px' }}>Room</th>
                            <th>Student Name</th>
                            <th>Enrollment</th>
                            <th>Contact Phone</th>
                            <th style={{ minWidth: '240px' }}>Roll Call Status</th>
                            <th style={{ minWidth: '200px' }}>Remarks</th>
                            <th>Previous Mark</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rollCallRoster
                            .filter((r) => {
                              if (!attendanceSearch.trim()) return true;
                              const q = attendanceSearch.toLowerCase().trim();
                              return (
                                r.studentName.toLowerCase().includes(q) ||
                                r.enrollmentNumber.toLowerCase().includes(q) ||
                                (r.roomNumber && r.roomNumber.toLowerCase().includes(q))
                              );
                            })
                            .map((resident) => {
                              const currentMark = rollCallMarkings[resident.studentId] || {};
                              const activeStatus = currentMark.status;
                              return (
                                <tr key={resident.studentId}>
                                  <td>
                                    <strong style={{ fontSize: '0.9375rem', color: 'var(--slate-900)' }}>
                                      {resident.roomNumber}
                                    </strong>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--slate-400)' }}>Floor {resident.floor}</div>
                                  </td>
                                  <td>
                                    <div style={{ fontWeight: 600, color: 'var(--slate-900)' }}>{resident.studentName}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>{resident.course} &bull; Sem {resident.semester}</div>
                                  </td>
                                  <td><code>{resident.enrollmentNumber}</code></td>
                                  <td>{resident.phone}</td>
                                  <td>
                                    <div className="attendance-toggle-group">
                                      <button
                                        type="button"
                                        className={`attendance-toggle-btn btn-present ${activeStatus === 'PRESENT' ? 'selected' : ''}`}
                                        onClick={() => handleStatusChange(resident.studentId, 'PRESENT')}
                                      >
                                        &#10003; Present
                                      </button>
                                      <button
                                        type="button"
                                        className={`attendance-toggle-btn btn-absent ${activeStatus === 'ABSENT' ? 'selected' : ''}`}
                                        onClick={() => handleStatusChange(resident.studentId, 'ABSENT')}
                                      >
                                        &#10007; Absent
                                      </button>
                                      <button
                                        type="button"
                                        className={`attendance-toggle-btn btn-leave ${activeStatus === 'ON_LEAVE' ? 'selected' : ''}`}
                                        onClick={() => handleStatusChange(resident.studentId, 'ON_LEAVE')}
                                      >
                                        &#9992; On Leave
                                      </button>
                                    </div>
                                  </td>
                                  <td>
                                    <input
                                      type="text"
                                      placeholder="Optional remarks..."
                                      value={currentMark.remarks || ''}
                                      onChange={(e) => handleRemarksChange(resident.studentId, e.target.value)}
                                      className="attendance-remarks-input"
                                    />
                                  </td>
                                  <td>
                                    {resident.status ? (
                                      <span className={`attendance-badge ${resident.status.toLowerCase()}`}>
                                        {resident.status}
                                      </span>
                                    ) : (
                                      <span style={{ fontSize: '0.75rem', color: 'var(--slate-400)' }}>Unmarked</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SUB-VIEW 2: ATTENDANCE HISTORY */}
            {attendanceMode === 'history' && (
              <div>
                <div className="warden-filter-bar" style={{ marginBottom: '1.5rem' }}>
                  <div className="warden-filter-group">
                    <label>From Date</label>
                    <input
                      type="date"
                      value={historyFromDate}
                      onChange={(e) => setHistoryFromDate(e.target.value)}
                      className="warden-filter-input"
                    />
                  </div>
                  <div className="warden-filter-group">
                    <label>To Date</label>
                    <input
                      type="date"
                      value={historyToDate}
                      onChange={(e) => setHistoryToDate(e.target.value)}
                      className="warden-filter-input"
                    />
                  </div>
                  <div className="warden-filter-group">
                    <label>Status Filter</label>
                    <select
                      value={historyStatusFilter}
                      onChange={(e) => setHistoryStatusFilter(e.target.value)}
                      className="warden-filter-select"
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="PRESENT">Present</option>
                      <option value="ABSENT">Absent</option>
                      <option value="ON_LEAVE">On Leave</option>
                    </select>
                  </div>
                  <div className="warden-filter-group" style={{ flex: 2 }}>
                    <label>Search Student</label>
                    <input
                      type="text"
                      placeholder="Search by student name or enrollment..."
                      value={historySearch}
                      onChange={(e) => setHistorySearch(e.target.value)}
                      className="warden-filter-input"
                    />
                  </div>
                  <div style={{ alignSelf: 'flex-end' }}>
                    <button
                      className="btn btn-secondary"
                      onClick={() => loadAttendanceHistory(selectedHostelId, historyFromDate, historyToDate, historyStatusFilter, historySearch)}
                    >
                      Filter Records
                    </button>
                  </div>
                </div>

                <div className="card">
                  {loadingAttendanceHistory ? (
                    <div style={{ textAlign: 'center', padding: '3rem' }}>
                      <span className="spinner"></span>
                      <p style={{ marginTop: '1rem', color: 'var(--slate-500)' }}>Loading historical records...</p>
                    </div>
                  ) : attendanceHistory.length === 0 ? (
                    <div className="warden-empty-state">
                      <div className="warden-empty-title">No Attendance Records Found</div>
                      <div className="warden-empty-desc">
                        No historical attendance marks found matching the selected filters.
                      </div>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Student</th>
                            <th>Enrollment</th>
                            <th>Hostel &amp; Room</th>
                            <th>Status</th>
                            <th>Remarks</th>
                            <th>Recorded By</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {attendanceHistory.map((rec) => (
                            <tr key={rec.id}>
                              <td><strong>{rec.attendanceDate}</strong></td>
                              <td>{rec.studentName}</td>
                              <td><code>{rec.enrollmentNumber}</code></td>
                              <td>{rec.hostelName} &bull; Room {rec.roomNumber}</td>
                              <td>
                                <span className={`attendance-badge ${rec.status.toLowerCase()}`}>
                                  {rec.status}
                                </span>
                              </td>
                              <td>{rec.remarks || <span style={{ color: 'var(--slate-400)' }}>—</span>}</td>
                              <td>
                                <div style={{ fontSize: '0.8125rem' }}>{rec.recordedByName}</div>
                              </td>
                              <td>
                                <button
                                  className="btn btn-secondary"
                                  style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                                  onClick={() => openEditAttendanceModal(rec)}
                                >
                                  Edit
                                </button>
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
          </div>
        )}

        {/* Modal: Edit Attendance Record */}
        {editAttendanceModalOpen && editingAttendanceRecord && (
          <div className="modal-backdrop">
            <div className="modal-content" style={{ maxWidth: '480px' }}>
              <div className="modal-header">
                <h2>Edit Attendance Record</h2>
                <button
                  className="modal-close"
                  onClick={() => setEditAttendanceModalOpen(false)}
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleSaveEditAttendance}>
                <div style={{ marginBottom: '1rem', background: 'var(--slate-50)', padding: '0.75rem 1rem', borderRadius: '8px' }}>
                  <div style={{ fontWeight: 600, color: 'var(--slate-900)' }}>
                    {editingAttendanceRecord.studentName}
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--slate-500)' }}>
                    Enrollment: <code>{editingAttendanceRecord.enrollmentNumber}</code> &bull; Room: {editingAttendanceRecord.roomNumber}
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--slate-500)', marginTop: '0.25rem' }}>
                    Date: <strong>{editingAttendanceRecord.attendanceDate}</strong>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Attendance Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="warden-filter-select"
                    style={{ width: '100%' }}
                  >
                    <option value="PRESENT">Present</option>
                    <option value="ABSENT">Absent</option>
                    <option value="ON_LEAVE">On Leave</option>
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Remarks</label>
                  <input
                    type="text"
                    value={editRemarks}
                    onChange={(e) => setEditRemarks(e.target.value)}
                    placeholder="Enter reason or note..."
                    className="warden-filter-input"
                    style={{ width: '100%' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setEditAttendanceModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={savingEditAttendance}
                  >
                    {savingEditAttendance ? 'Saving...' : 'Update Record'}
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
