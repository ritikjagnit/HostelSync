import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import './PortalCommon.css';
import './AdminPortal.css';

export default function AdminPortal() {
  const { user, logout, authFetch } = useAuth();

  // Tab State: 'dashboard' | 'hostels' | 'rooms' | 'students'
  const [activeTab, setActiveTab] = useState('dashboard');

  // Data States
  const [dashboardStats, setDashboardStats] = useState(null);
  const [hostels, setHostels] = useState([]);
  const [selectedHostelId, setSelectedHostelId] = useState('');
  const [rooms, setRooms] = useState([]);
  const [students, setStudents] = useState([]);

  // UI Feedback States
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedbackError, setFeedbackError] = useState('');
  const [feedbackSuccess, setFeedbackSuccess] = useState('');

  // Student Filter & Search States
  const [studentSearch, setStudentSearch] = useState('');
  const [studentCourseFilter, setStudentCourseFilter] = useState('ALL');
  const [studentStatusFilter, setStudentStatusFilter] = useState('ALL');

  // Modals State
  const [hostelModalOpen, setHostelModalOpen] = useState(false);
  const [editingHostel, setEditingHostel] = useState(null); // null = create mode
  const [hostelFormData, setHostelFormData] = useState({
    name: '',
    hostelType: 'BOYS',
    address: '',
    active: true
  });

  const [roomModalOpen, setRoomModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null); // null = create mode
  const [roomFormData, setRoomFormData] = useState({
    roomNumber: '',
    floor: 1,
    capacity: 3
  });

  const [studentModalOpen, setStudentModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null); // null = create mode
  const [studentFormData, setStudentFormData] = useState({
    enrollmentNumber: '',
    fullName: '',
    email: '',
    course: 'Diploma in Computer Engineering',
    semester: 1,
    phone: '',
    password: '',
    active: true
  });

  const [studentDetailModalOpen, setStudentDetailModalOpen] = useState(false);
  const [selectedStudentDetail, setSelectedStudentDetail] = useState(null);
  const [loadingStudentDetail, setLoadingStudentDetail] = useState(false);

  // Load Dashboard & Hostels
  const loadDashboardData = useCallback(() => {
    let isMounted = true;
    authFetch('/api/admin/dashboard')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load dashboard metrics');
        return res.json();
      })
      .then((data) => {
        if (!isMounted) return;
        setDashboardStats(data);
        setHostels(data.hostels || []);
        if (data.hostels && data.hostels.length > 0 && !selectedHostelId) {
          setSelectedHostelId(String(data.hostels[0].id));
        }
      })
      .catch((err) => {
        if (isMounted) setFeedbackError(err.message || 'Error loading administrator dashboard');
      })
      .finally(() => {
        if (isMounted) setLoadingDashboard(false);
      });

    return () => {
      isMounted = false;
    };
  }, [authFetch, selectedHostelId]);

  useEffect(() => {
    const cleanup = loadDashboardData();
    return cleanup;
  }, [loadDashboardData]);

  // Load Rooms when selectedHostelId changes or tab is 'rooms'
  const loadRoomsForHostel = useCallback((hostelId) => {
    if (!hostelId) {
      return;
    }
    let isMounted = true;
    authFetch(`/api/admin/hostels/${hostelId}/rooms`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch rooms for this hostel');
        return res.json();
      })
      .then((data) => {
        if (isMounted) setRooms(data);
      })
      .catch((err) => {
        if (isMounted) setFeedbackError(err.message);
      })
      .finally(() => {
        if (isMounted) setLoadingRooms(false);
      });

    return () => {
      isMounted = false;
    };
  }, [authFetch]);

  useEffect(() => {
    if (selectedHostelId) {
      const cleanup = loadRoomsForHostel(selectedHostelId);
      return cleanup;
    }
  }, [selectedHostelId, loadRoomsForHostel]);

  // Load Students Directory
  const loadStudents = useCallback((query = '') => {
    let isMounted = true;
    const url = query && query.trim()
      ? `/api/admin/students?search=${encodeURIComponent(query.trim())}`
      : '/api/admin/students';

    authFetch(url)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load student directory');
        return res.json();
      })
      .then((data) => {
        if (isMounted) setStudents(data);
      })
      .catch((err) => {
        if (isMounted) setFeedbackError(err.message || 'Error loading students');
      })
      .finally(() => {
        if (isMounted) setLoadingStudents(false);
      });

    return () => {
      isMounted = false;
    };
  }, [authFetch]);

  useEffect(() => {
    const cleanup = loadStudents();
    return cleanup;
  }, [loadStudents]);

  const handleStudentSearchSubmit = (e) => {
    e.preventDefault();
    clearFeedback();
    setLoadingStudents(true);
    loadStudents(studentSearch);
  };

  const handleStudentSearchClear = () => {
    clearFeedback();
    setStudentSearch('');
    setLoadingStudents(true);
    loadStudents('');
  };

  // Open Create Student Modal
  const openCreateStudentModal = () => {
    clearFeedback();
    setEditingStudent(null);
    setStudentFormData({
      enrollmentNumber: '',
      fullName: '',
      email: '',
      course: 'Diploma in Computer Engineering',
      semester: 1,
      phone: '',
      password: '',
      active: true
    });
    setStudentModalOpen(true);
  };

  // Open Edit Student Modal
  const openEditStudentModal = (student) => {
    clearFeedback();
    setEditingStudent(student);
    setStudentFormData({
      enrollmentNumber: student.enrollmentNumber,
      fullName: student.fullName,
      email: student.email,
      course: student.course,
      semester: student.semester,
      phone: student.phone,
      password: '',
      active: student.active
    });
    setStudentModalOpen(true);
  };

  // View Student Full Details
  const handleViewStudentDetail = async (studentId) => {
    clearFeedback();
    setStudentDetailModalOpen(true);
    setLoadingStudentDetail(true);
    setSelectedStudentDetail(null);
    try {
      const res = await authFetch(`/api/admin/students/${studentId}`);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to fetch student details');
      }
      const data = await res.json();
      setSelectedStudentDetail(data);
    } catch (err) {
      setFeedbackError(err.message);
    } finally {
      setLoadingStudentDetail(false);
    }
  };

  // Submit Student Form (Create or Edit)
  const handleStudentFormSubmit = async (e) => {
    e.preventDefault();
    clearFeedback();

    if (!studentFormData.enrollmentNumber.trim()) {
      setFeedbackError('Enrollment number is required.');
      return;
    }
    if (!studentFormData.fullName.trim()) {
      setFeedbackError('Full name is required.');
      return;
    }
    if (!studentFormData.email.trim() || !studentFormData.email.includes('@')) {
      setFeedbackError('Valid institutional email address is required.');
      return;
    }
    if (!studentFormData.course.trim()) {
      setFeedbackError('Academic course is required.');
      return;
    }
    const sem = Number(studentFormData.semester);
    if (isNaN(sem) || sem < 1 || sem > 10) {
      setFeedbackError('Semester must be between 1 and 10.');
      return;
    }
    const phone = studentFormData.phone.trim();
    if (phone.length < 10 || phone.length > 20) {
      setFeedbackError('Contact phone number must be between 10 and 20 characters.');
      return;
    }
    if (!editingStudent && (!studentFormData.password || studentFormData.password.length < 6)) {
      setFeedbackError('Password must be at least 6 characters for new student account creation.');
      return;
    }

    setActionLoading(true);
    try {
      const url = editingStudent
        ? `/api/admin/students/${editingStudent.id}`
        : '/api/admin/students';
      const method = editingStudent ? 'PUT' : 'POST';

      const payload = editingStudent
        ? {
            enrollmentNumber: studentFormData.enrollmentNumber.trim(),
            fullName: studentFormData.fullName.trim(),
            course: studentFormData.course.trim(),
            semester: sem,
            phone: phone,
            email: studentFormData.email.trim(),
            active: studentFormData.active
          }
        : {
            enrollmentNumber: studentFormData.enrollmentNumber.trim(),
            fullName: studentFormData.fullName.trim(),
            email: studentFormData.email.trim(),
            course: studentFormData.course.trim(),
            semester: sem,
            phone: phone,
            password: studentFormData.password,
            active: studentFormData.active
          };

      const res = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Student operation failed');
      }

      setFeedbackSuccess(
        editingStudent
          ? `Student "${data.fullName}" (${data.enrollmentNumber}) updated successfully.`
          : `Student "${data.fullName}" (${data.enrollmentNumber}) enrolled successfully.`
      );
      setStudentModalOpen(false);
      loadStudents(studentSearch);
    } catch (err) {
      setFeedbackError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle Student Account Status
  const handleToggleStudentStatus = async (student) => {
    clearFeedback();
    const newStatus = !student.active;

    setActionLoading(true);
    try {
      const res = await authFetch(`/api/admin/students/${student.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: newStatus })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to update student status');
      }

      setFeedbackSuccess(
        `Student "${student.fullName}" account status marked as ${newStatus ? 'ACTIVE' : 'INACTIVE'}.`
      );
      loadStudents(studentSearch);
    } catch (err) {
      setFeedbackError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Safe Student Deletion
  const handleDeleteStudent = async (student) => {
    clearFeedback();
    const confirmed = window.confirm(
      `Are you sure you want to delete student "${student.fullName}" (${student.enrollmentNumber})?\n\nIf this student has historical room allocations, the database will safely prevent deletion to preserve institutional records.`
    );
    if (!confirmed) return;

    setActionLoading(true);
    try {
      const res = await authFetch(`/api/admin/students/${student.id}`, {
        method: 'DELETE'
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to delete student');
      }

      setFeedbackSuccess(data.message || 'Student deleted successfully.');
      loadStudents(studentSearch);
    } catch (err) {
      setFeedbackError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Clear Alerts
  const clearFeedback = () => {
    setFeedbackError('');
    setFeedbackSuccess('');
  };

  // Open Create Hostel Modal
  const openCreateHostelModal = () => {
    clearFeedback();
    setEditingHostel(null);
    setHostelFormData({
      name: '',
      hostelType: 'BOYS',
      address: '',
      active: true
    });
    setHostelModalOpen(true);
  };

  // Open Edit Hostel Modal
  const openEditHostelModal = (hostel) => {
    clearFeedback();
    setEditingHostel(hostel);
    setHostelFormData({
      name: hostel.name,
      hostelType: hostel.hostelType,
      address: hostel.address,
      active: hostel.active
    });
    setHostelModalOpen(true);
  };

  // Submit Hostel Form (Create or Edit)
  const handleHostelFormSubmit = async (e) => {
    e.preventDefault();
    clearFeedback();

    if (!hostelFormData.name.trim() || !hostelFormData.address.trim()) {
      setFeedbackError('Please provide both hostel name and address.');
      return;
    }

    setActionLoading(true);
    try {
      const url = editingHostel
        ? `/api/admin/hostels/${editingHostel.id}`
        : '/api/admin/hostels';
      const method = editingHostel ? 'PUT' : 'POST';

      const res = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(hostelFormData)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Operation failed');
      }

      setFeedbackSuccess(
        editingHostel
          ? `Hostel "${data.name}" updated successfully.`
          : `Hostel "${data.name}" created successfully.`
      );
      setHostelModalOpen(false);
      loadDashboardData();
    } catch (err) {
      setFeedbackError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle Hostel Status (Active / Inactive)
  const handleToggleHostelStatus = async (hostel) => {
    clearFeedback();
    const newStatus = !hostel.active;

    setActionLoading(true);
    try {
      const res = await authFetch(`/api/admin/hostels/${hostel.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: newStatus })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to update status');
      }

      setFeedbackSuccess(
        `Hostel "${hostel.name}" is now marked as ${newStatus ? 'ACTIVE' : 'INACTIVE'}.`
      );
      loadDashboardData();
    } catch (err) {
      setFeedbackError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Open Create Room Modal
  const openCreateRoomModal = () => {
    clearFeedback();
    if (!selectedHostelId) {
      setFeedbackError('Please select a hostel first before adding rooms.');
      return;
    }
    setEditingRoom(null);
    setRoomFormData({
      roomNumber: '',
      floor: 1,
      capacity: 3
    });
    setRoomModalOpen(true);
  };

  // Open Edit Room Modal
  const openEditRoomModal = (room) => {
    clearFeedback();
    setEditingRoom(room);
    setRoomFormData({
      roomNumber: room.roomNumber,
      floor: room.floor,
      capacity: room.capacity
    });
    setRoomModalOpen(true);
  };

  // Submit Room Form (Create or Edit)
  const handleRoomFormSubmit = async (e) => {
    e.preventDefault();
    clearFeedback();

    if (!roomFormData.roomNumber.trim()) {
      setFeedbackError('Room number is required.');
      return;
    }

    if (roomFormData.floor < 0) {
      setFeedbackError('Floor number cannot be negative.');
      return;
    }

    if (roomFormData.capacity < 1) {
      setFeedbackError('Room capacity must be at least 1.');
      return;
    }

    setActionLoading(true);
    try {
      const url = editingRoom
        ? `/api/admin/rooms/${editingRoom.id}`
        : `/api/admin/hostels/${selectedHostelId}/rooms`;
      const method = editingRoom ? 'PUT' : 'POST';

      const res = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomNumber: roomFormData.roomNumber.trim(),
          floor: Number(roomFormData.floor),
          capacity: Number(roomFormData.capacity)
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Room operation failed');
      }

      setFeedbackSuccess(
        editingRoom
          ? `Room "${data.roomNumber}" updated successfully.`
          : `Room "${data.roomNumber}" created successfully.`
      );
      setRoomModalOpen(false);
      loadRoomsForHostel(selectedHostelId);
      loadDashboardData();
    } catch (err) {
      setFeedbackError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Navigate directly to manage rooms for a specific hostel
  const handleViewRoomsForHostel = (hostelId) => {
    setSelectedHostelId(String(hostelId));
    setActiveTab('rooms');
  };

  const selectedHostelObj = hostels.find((h) => String(h.id) === String(selectedHostelId));

  return (
    <div className="portal-wrapper">
      <div className="container">
        {/* Header Section */}
        <div className="card portal-header-card">
          <div>
            <span className="badge badge-primary" style={{ marginBottom: '0.5rem' }}>
              Institutional Governance
            </span>
            <h1 className="portal-title">Administrator Portal</h1>
            <p className="portal-subtitle">
              Government Polytechnic Sakoli &bull; Principal & Rector Administration
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <span className="badge badge-primary" style={{ padding: '0.4rem 0.8rem' }}>
              {user?.fullName} ({user?.role})
            </span>
            <button id="btn-admin-logout" onClick={logout} className="btn btn-secondary btn-sm">
              Sign Out
            </button>
          </div>
        </div>

        {/* Global Alert Messages */}
        {feedbackError && (
          <div className="admin-alert admin-alert-error" role="alert">
            <span>&#9888; {feedbackError}</span>
            <button className="admin-alert-close" onClick={() => setFeedbackError('')} aria-label="Dismiss error">
              &times;
            </button>
          </div>
        )}

        {feedbackSuccess && (
          <div className="admin-alert admin-alert-success" role="alert">
            <span>&#10003; {feedbackSuccess}</span>
            <button className="admin-alert-close" onClick={() => setFeedbackSuccess('')} aria-label="Dismiss message">
              &times;
            </button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="admin-tabs" role="tablist">
          <button
            role="tab"
            aria-selected={activeTab === 'dashboard'}
            className={`admin-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => {
              clearFeedback();
              setActiveTab('dashboard');
            }}
          >
            &#128202; Executive Dashboard
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'hostels'}
            className={`admin-tab ${activeTab === 'hostels' ? 'active' : ''}`}
            onClick={() => {
              clearFeedback();
              setActiveTab('hostels');
            }}
          >
            &#127970; Hostels Directory <span className="tab-count">{hostels.length}</span>
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'rooms'}
            className={`admin-tab ${activeTab === 'rooms' ? 'active' : ''}`}
            onClick={() => {
              clearFeedback();
              setActiveTab('rooms');
            }}
          >
            &#128716; Room Inventory <span className="tab-count">{rooms.length}</span>
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'students'}
            className={`admin-tab ${activeTab === 'students' ? 'active' : ''}`}
            onClick={() => {
              clearFeedback();
              setActiveTab('students');
            }}
          >
            &#127891; Student Directory <span className="tab-count">{students.length}</span>
          </button>
        </div>

        {/* TAB 1: EXECUTIVE DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div>
            {loadingDashboard ? (
              <div style={{ textAlign: 'center', padding: '3rem' }}>
                <span className="spinner"></span>
                <p style={{ marginTop: '1rem', color: 'var(--slate-500)' }}>
                  Loading real-time hostel inventory metrics...
                </p>
              </div>
            ) : (
              <>
                {/* Real KPI Cards */}
                <div className="kpi-grid">
                  <div className="kpi-card kpi-blue">
                    <span className="kpi-label">Hostel Blocks</span>
                    <span className="kpi-value">{dashboardStats?.totalHostels ?? 0}</span>
                    <span className="kpi-subtext">
                      {dashboardStats?.activeHostels ?? 0} Active &bull; {(dashboardStats?.totalHostels ?? 0) - (dashboardStats?.activeHostels ?? 0)} Inactive
                    </span>
                  </div>

                  <div className="kpi-card kpi-purple">
                    <span className="kpi-label">Total Rooms</span>
                    <span className="kpi-value">{dashboardStats?.totalRooms ?? 0}</span>
                    <span className="kpi-subtext">Across all configured buildings</span>
                  </div>

                  <div className="kpi-card kpi-amber">
                    <span className="kpi-label">Total Bed Capacity</span>
                    <span className="kpi-value">{dashboardStats?.totalCapacity ?? 0}</span>
                    <span className="kpi-subtext">Designed student accommodation</span>
                  </div>

                  <div className="kpi-card">
                    <span className="kpi-label">Active Occupants</span>
                    <span className="kpi-value">{dashboardStats?.activeAllocations ?? 0}</span>
                    <span className="kpi-subtext">Current resident students</span>
                  </div>

                  <div className="kpi-card kpi-green">
                    <span className="kpi-label">Available Beds</span>
                    <span className="kpi-value">{dashboardStats?.availableBeds ?? 0}</span>
                    <span className="kpi-subtext">Ready for immediate allocation</span>
                  </div>
                </div>

                {/* Hostels Summary Table */}
                <div className="section-action-bar">
                  <h2 className="action-bar-title">Campus Hostels Overview</h2>
                  <button className="btn btn-primary btn-sm" onClick={openCreateHostelModal}>
                    + Add New Hostel
                  </button>
                </div>

                {hostels.length === 0 ? (
                  <div className="empty-state-card">
                    <div className="empty-state-icon">&#127970;</div>
                    <h3 className="empty-state-title">No Hostels Registered Yet</h3>
                    <p className="empty-state-text">
                      Start building the Government Polytechnic Sakoli campus database by creating the first hostel building.
                    </p>
                    <button className="btn btn-primary" onClick={openCreateHostelModal}>
                      Create First Hostel
                    </button>
                  </div>
                ) : (
                  <div className="admin-table-container">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Hostel Name</th>
                          <th>Type</th>
                          <th>Premises Address</th>
                          <th>Rooms</th>
                          <th>Capacity</th>
                          <th>Occupied</th>
                          <th>Available</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {hostels.map((hostel) => (
                          <tr key={hostel.id}>
                            <td style={{ fontWeight: 700, color: 'var(--primary-900)' }}>
                              {hostel.name}
                            </td>
                            <td>
                              <span className={`badge ${hostel.hostelType === 'BOYS' ? 'type-badge-boys' : 'type-badge-girls'}`}>
                                {hostel.hostelType}
                              </span>
                            </td>
                            <td>{hostel.address}</td>
                            <td>{hostel.totalRooms}</td>
                            <td>{hostel.totalCapacity}</td>
                            <td>{hostel.activeAllocations}</td>
                            <td style={{ fontWeight: 700, color: hostel.availableBeds > 0 ? 'var(--accent-green)' : 'var(--slate-400)' }}>
                              {hostel.availableBeds}
                            </td>
                            <td>
                              <span className={`badge ${hostel.active ? 'status-badge-active' : 'status-badge-inactive'}`}>
                                {hostel.active ? 'ACTIVE' : 'INACTIVE'}
                              </span>
                            </td>
                            <td>
                              <div className="table-btn-group">
                                <button
                                  className="btn btn-secondary btn-sm"
                                  onClick={() => handleViewRoomsForHostel(hostel.id)}
                                >
                                  Rooms
                                </button>
                                <button
                                  className="btn btn-secondary btn-sm"
                                  onClick={() => openEditHostelModal(hostel)}
                                >
                                  Edit
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* TAB 2: HOSTELS DIRECTORY & MANAGEMENT */}
        {activeTab === 'hostels' && (
          <div>
            <div className="section-action-bar">
              <div>
                <h2 className="action-bar-title">Hostel Buildings Directory</h2>
                <p style={{ fontSize: '0.875rem', color: 'var(--slate-500)' }}>
                  Configure blocks, types, addresses, and activation status
                </p>
              </div>
              <button className="btn btn-primary btn-sm" onClick={openCreateHostelModal}>
                + Add New Hostel
              </button>
            </div>

            {hostels.length === 0 ? (
              <div className="empty-state-card">
                <div className="empty-state-icon">&#127970;</div>
                <h3 className="empty-state-title">No Hostels Registered Yet</h3>
                <p className="empty-state-text">
                  There are no hostel records in the database. Click below to add a hostel building.
                </p>
                <button className="btn btn-primary" onClick={openCreateHostelModal}>
                  + Add Hostel
                </button>
              </div>
            ) : (
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Hostel Name</th>
                      <th>Type</th>
                      <th>Address</th>
                      <th>Rooms</th>
                      <th>Beds</th>
                      <th>Active Residents</th>
                      <th>Status</th>
                      <th>Management Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hostels.map((h) => (
                      <tr key={h.id}>
                        <td style={{ fontWeight: 700, color: 'var(--primary-900)' }}>{h.name}</td>
                        <td>
                          <span className={`badge ${h.hostelType === 'BOYS' ? 'type-badge-boys' : 'type-badge-girls'}`}>
                            {h.hostelType}
                          </span>
                        </td>
                        <td>{h.address}</td>
                        <td>{h.totalRooms}</td>
                        <td>{h.totalCapacity}</td>
                        <td>{h.activeAllocations}</td>
                        <td>
                          <span className={`badge ${h.active ? 'status-badge-active' : 'status-badge-inactive'}`}>
                            {h.active ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                        </td>
                        <td>
                          <div className="table-btn-group">
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => handleViewRoomsForHostel(h.id)}
                            >
                              Manage Rooms
                            </button>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => openEditHostelModal(h)}
                            >
                              Edit
                            </button>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => handleToggleHostelStatus(h)}
                              disabled={actionLoading}
                              title={h.active ? 'Deactivate this hostel' : 'Activate this hostel'}
                            >
                              {h.active ? 'Deactivate' : 'Activate'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: ROOM INVENTORY */}
        {activeTab === 'rooms' && (
          <div>
            <div className="section-action-bar">
              <div>
                <h2 className="action-bar-title">Room Inventory Management</h2>
                <p style={{ fontSize: '0.875rem', color: 'var(--slate-500)' }}>
                  Manage individual rooms, floor assignments, and bed capacities
                </p>
              </div>

              <div className="action-bar-actions">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <label htmlFor="hostel-selector" style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--slate-700)' }}>
                    Hostel:
                  </label>
                  <select
                    id="hostel-selector"
                    className="form-input"
                    style={{ width: 'auto', minWidth: '220px' }}
                    value={selectedHostelId}
                    onChange={(e) => setSelectedHostelId(e.target.value)}
                  >
                    {hostels.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name} ({h.hostelType})
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  className="btn btn-primary btn-sm"
                  onClick={openCreateRoomModal}
                  disabled={hostels.length === 0}
                >
                  + Add Room
                </button>
              </div>
            </div>

            {selectedHostelObj && (
              <div className="card" style={{ marginBottom: '1.5rem', borderLeft: '4px solid var(--primary-600)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.125rem', color: 'var(--primary-900)' }}>
                      {selectedHostelObj.name}
                    </h3>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--slate-500)' }}>
                      {selectedHostelObj.address} &bull; Type: <strong>{selectedHostelObj.hostelType}</strong>
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem' }}>
                    <div>Total Rooms: <strong>{rooms.length}</strong></div>
                    <div>Total Beds: <strong>{selectedHostelObj.totalCapacity}</strong></div>
                    <div>Available: <strong style={{ color: 'var(--accent-green)' }}>{selectedHostelObj.availableBeds}</strong></div>
                  </div>
                </div>
              </div>
            )}

            {loadingRooms ? (
              <div style={{ textAlign: 'center', padding: '3rem' }}>
                <span className="spinner"></span>
                <p style={{ marginTop: '1rem', color: 'var(--slate-500)' }}>Loading room inventory...</p>
              </div>
            ) : rooms.length === 0 ? (
              <div className="empty-state-card">
                <div className="empty-state-icon">&#128716;</div>
                <h3 className="empty-state-title">No Rooms Configured</h3>
                <p className="empty-state-text">
                  This hostel does not have any rooms added yet. Create the first room unit.
                </p>
                <button
                  className="btn btn-primary"
                  onClick={openCreateRoomModal}
                  disabled={!selectedHostelId}
                >
                  + Add First Room
                </button>
              </div>
            ) : (
              <div className="rooms-grid">
                {rooms.map((room) => {
                  const occupancyPercent = room.capacity > 0 ? (room.activeAllocations / room.capacity) * 100 : 0;
                  const isFull = room.availableBeds === 0;

                  return (
                    <div key={room.id} className="room-card">
                      <div className="room-card-header">
                        <div>
                          <div className="room-number-title">Room {room.roomNumber}</div>
                          <span className="room-floor-tag">Floor {room.floor}</span>
                        </div>
                        <span className={`badge ${isFull ? 'status-badge-inactive' : 'status-badge-active'}`}>
                          {isFull ? 'FULL' : `${room.availableBeds} VACANT`}
                        </span>
                      </div>

                      <div className="room-stats-list">
                        <div className="room-stat-row">
                          <span>Total Capacity:</span>
                          <span className="room-stat-val">{room.capacity} beds</span>
                        </div>
                        <div className="room-stat-row">
                          <span>Occupied Beds:</span>
                          <span className="room-stat-val">{room.activeAllocations}</span>
                        </div>
                        <div className="room-stat-row">
                          <span>Available Beds:</span>
                          <span className="room-stat-val">{room.availableBeds}</span>
                        </div>

                        <div className="occupancy-bar-container" title={`Occupancy: ${Math.round(occupancyPercent)}%`}>
                          <div
                            className={`occupancy-bar-fill ${isFull ? 'full' : ''}`}
                            style={{ width: `${Math.min(100, occupancyPercent)}%` }}
                          ></div>
                        </div>
                      </div>

                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ marginTop: 'auto' }}
                        onClick={() => openEditRoomModal(room)}
                      >
                        Edit Room
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: STUDENT DIRECTORY & ADMISSIONS */}
        {activeTab === 'students' && (
          <div>
            <div className="section-action-bar">
              <div>
                <h2 className="action-bar-title">Student Admissions & Directory</h2>
                <p style={{ fontSize: '0.875rem', color: 'var(--slate-500)' }}>
                  Institutional student directory, course enrollments, contact records, and room statuses
                </p>
              </div>
              <button className="btn btn-primary btn-sm" onClick={openCreateStudentModal}>
                + Enroll New Student
              </button>
            </div>

            {/* Search and Filters Bar */}
            <div className="search-filter-bar">
              <form onSubmit={handleStudentSearchSubmit} className="search-input-wrap" style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Search by student name or enrollment number..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                />
                <button type="submit" className="btn btn-primary btn-sm" disabled={loadingStudents}>
                  Search
                </button>
                {studentSearch && (
                  <button type="button" className="btn btn-secondary btn-sm" onClick={handleStudentSearchClear}>
                    Clear
                  </button>
                )}
              </form>

              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <select
                  className="filter-select"
                  value={studentCourseFilter}
                  onChange={(e) => setStudentCourseFilter(e.target.value)}
                  aria-label="Filter by course"
                >
                  <option value="ALL">All Academic Courses</option>
                  {Array.from(new Set(students.map((s) => s.course).filter(Boolean))).sort().map((course) => (
                    <option key={course} value={course}>
                      {course}
                    </option>
                  ))}
                </select>

                <select
                  className="filter-select"
                  value={studentStatusFilter}
                  onChange={(e) => setStudentStatusFilter(e.target.value)}
                  aria-label="Filter by status"
                >
                  <option value="ALL">All Account Statuses</option>
                  <option value="ACTIVE">Active Students</option>
                  <option value="INACTIVE">Inactive Students</option>
                </select>
              </div>
            </div>

            {loadingStudents ? (
              <div style={{ textAlign: 'center', padding: '3rem' }}>
                <span className="spinner"></span>
                <p style={{ marginTop: '1rem', color: 'var(--slate-500)' }}>Loading student directory...</p>
              </div>
            ) : students.length === 0 ? (
              <div className="empty-state-card">
                <div className="empty-state-icon">&#127891;</div>
                <h3 className="empty-state-title">No Students Registered Yet</h3>
                <p className="empty-state-text">
                  There are no student profiles in the database. Enroll the first student to begin managing admissions and hostel allocations.
                </p>
                <button className="btn btn-primary" onClick={openCreateStudentModal}>
                  + Enroll First Student
                </button>
              </div>
            ) : (() => {
              const filteredStudents = students.filter((s) => {
                if (studentCourseFilter !== 'ALL' && s.course !== studentCourseFilter) {
                  return false;
                }
                if (studentStatusFilter === 'ACTIVE' && !s.active) {
                  return false;
                }
                if (studentStatusFilter === 'INACTIVE' && s.active) {
                  return false;
                }
                return true;
              });

              if (filteredStudents.length === 0) {
                return (
                  <div className="empty-state-card">
                    <div className="empty-state-icon">&#128269;</div>
                    <h3 className="empty-state-title">No Matching Students Found</h3>
                    <p className="empty-state-text">
                      No student records matched your current search and filter criteria.
                    </p>
                    <button
                      className="btn btn-secondary"
                      onClick={() => {
                        setStudentSearch('');
                        setStudentCourseFilter('ALL');
                        setStudentStatusFilter('ALL');
                        loadStudents('');
                      }}
                    >
                      Reset Filters
                    </button>
                  </div>
                );
              }

              return (
                <div className="admin-table-container">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Enrollment No</th>
                        <th>Student Name</th>
                        <th>Course & Semester</th>
                        <th>Contact</th>
                        <th>Hostel Allocation</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.map((student) => (
                        <tr key={student.id}>
                          <td>
                            <span className="student-enrollment-badge">{student.enrollmentNumber}</span>
                          </td>
                          <td style={{ fontWeight: 700, color: 'var(--primary-900)' }}>
                            {student.fullName}
                          </td>
                          <td>
                            <div>{student.course}</div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>
                              Semester {student.semester}
                            </span>
                          </td>
                          <td>
                            <div style={{ fontSize: '0.8125rem' }}>{student.phone}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>{student.email}</div>
                          </td>
                          <td>
                            {student.currentAllocationId ? (
                              <span className="badge housing-badge-allocated" title={`Allocated in ${student.currentHostelName}`}>
                                &#127970; {student.currentHostelName} ({student.currentRoomNumber})
                              </span>
                            ) : (
                              <span className="badge housing-badge-none">
                                Awaiting Room
                              </span>
                            )}
                          </td>
                          <td>
                            <span className={`badge ${student.active ? 'status-badge-active' : 'status-badge-inactive'}`}>
                              {student.active ? 'ACTIVE' : 'INACTIVE'}
                            </span>
                          </td>
                          <td>
                            <div className="table-btn-group">
                              <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => handleViewStudentDetail(student.id)}
                              >
                                View
                              </button>
                              <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => openEditStudentModal(student)}
                              >
                                Edit
                              </button>
                              <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => handleToggleStudentStatus(student)}
                                disabled={actionLoading}
                                title={student.active ? 'Deactivate student account' : 'Activate student account'}
                              >
                                {student.active ? 'Deactivate' : 'Activate'}
                              </button>
                              <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => handleDeleteStudent(student)}
                                disabled={actionLoading}
                                title="Safely delete student if no allocation history"
                                style={{ color: 'var(--accent-red)' }}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })()}
          </div>
        )}

        {/* MODAL 1: CREATE / EDIT HOSTEL */}
        {hostelModalOpen && (
          <div className="modal-backdrop" role="dialog" aria-modal="true">
            <div className="modal-card">
              <div className="modal-header">
                <h3 className="modal-title">
                  {editingHostel ? 'Edit Hostel Building' : 'Add New Hostel Building'}
                </h3>
                <button
                  className="modal-close-btn"
                  onClick={() => setHostelModalOpen(false)}
                  disabled={actionLoading}
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleHostelFormSubmit}>
                <div className="modal-body">
                  <div className="form-group">
                    <label htmlFor="hostel-name-input" className="form-label">
                      Hostel Name *
                    </label>
                    <input
                      id="hostel-name-input"
                      type="text"
                      className="form-input"
                      placeholder="e.g. Sahyadri Boys Hostel"
                      value={hostelFormData.name}
                      onChange={(e) => setHostelFormData({ ...hostelFormData, name: e.target.value })}
                      required
                      disabled={actionLoading}
                      maxLength={100}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="hostel-type-input" className="form-label">
                      Hostel Type *
                    </label>
                    <select
                      id="hostel-type-input"
                      className="form-input"
                      value={hostelFormData.hostelType}
                      onChange={(e) => setHostelFormData({ ...hostelFormData, hostelType: e.target.value })}
                      disabled={actionLoading}
                    >
                      <option value="BOYS">BOYS Hostel</option>
                      <option value="GIRLS">GIRLS Hostel</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="hostel-address-input" className="form-label">
                      Premises Address / Location *
                    </label>
                    <input
                      id="hostel-address-input"
                      type="text"
                      className="form-input"
                      placeholder="e.g. Campus Block A, Government Polytechnic Sakoli"
                      value={hostelFormData.address}
                      onChange={(e) => setHostelFormData({ ...hostelFormData, address: e.target.value })}
                      required
                      disabled={actionLoading}
                      maxLength={255}
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <input
                      id="hostel-active-input"
                      type="checkbox"
                      checked={hostelFormData.active}
                      onChange={(e) => setHostelFormData({ ...hostelFormData, active: e.target.checked })}
                      disabled={actionLoading}
                      style={{ width: '16px', height: '16px' }}
                    />
                    <label htmlFor="hostel-active-input" style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--slate-700)' }}>
                      Active for Student Admissions & Allotment
                    </label>
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setHostelModalOpen(false)}
                    disabled={actionLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={actionLoading}
                  >
                    {actionLoading ? 'Saving...' : editingHostel ? 'Save Changes' : 'Create Hostel'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 2: CREATE / EDIT ROOM */}
        {roomModalOpen && (
          <div className="modal-backdrop" role="dialog" aria-modal="true">
            <div className="modal-card">
              <div className="modal-header">
                <h3 className="modal-title">
                  {editingRoom ? `Edit Room ${editingRoom.roomNumber}` : 'Add Room to Hostel'}
                </h3>
                <button
                  className="modal-close-btn"
                  onClick={() => setRoomModalOpen(false)}
                  disabled={actionLoading}
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleRoomFormSubmit}>
                <div className="modal-body">
                  <div className="form-group">
                    <label htmlFor="room-number-input" className="form-label">
                      Room Number / Label *
                    </label>
                    <input
                      id="room-number-input"
                      type="text"
                      className="form-input"
                      placeholder="e.g. 101, 102, A-201"
                      value={roomFormData.roomNumber}
                      onChange={(e) => setRoomFormData({ ...roomFormData, roomNumber: e.target.value })}
                      required
                      disabled={actionLoading}
                      maxLength={20}
                    />
                    <span style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>
                      Must be unique within the selected hostel.
                    </span>
                  </div>

                  <div className="form-group">
                    <label htmlFor="room-floor-input" className="form-label">
                      Floor Number *
                    </label>
                    <input
                      id="room-floor-input"
                      type="number"
                      min="0"
                      max="50"
                      className="form-input"
                      value={roomFormData.floor}
                      onChange={(e) => setRoomFormData({ ...roomFormData, floor: parseInt(e.target.value, 10) || 0 })}
                      required
                      disabled={actionLoading}
                    />
                    <span style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>
                      Enter 0 for Ground Floor, 1 for 1st Floor, etc.
                    </span>
                  </div>

                  <div className="form-group">
                    <label htmlFor="room-capacity-input" className="form-label">
                      Bed Capacity *
                    </label>
                    <input
                      id="room-capacity-input"
                      type="number"
                      min="1"
                      max="20"
                      className="form-input"
                      value={roomFormData.capacity}
                      onChange={(e) => setRoomFormData({ ...roomFormData, capacity: parseInt(e.target.value, 10) || 1 })}
                      required
                      disabled={actionLoading}
                    />
                    {editingRoom && editingRoom.activeAllocations > 0 && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--accent-gold)' }}>
                        Notice: Room currently has {editingRoom.activeAllocations} active allocation(s). Capacity cannot be less than this number.
                      </span>
                    )}
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setRoomModalOpen(false)}
                    disabled={actionLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={actionLoading}
                  >
                    {actionLoading ? 'Saving...' : editingRoom ? 'Update Room' : 'Add Room'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 3: STUDENT PROFILE DETAILS */}
        {studentDetailModalOpen && (
          <div className="modal-backdrop" role="dialog" aria-modal="true">
            <div className="modal-card" style={{ maxWidth: '640px' }}>
              <div className="modal-header">
                <div>
                  <h3 className="modal-title">Student Admission Profile</h3>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--slate-500)', margin: 0 }}>
                    Government Polytechnic Sakoli &bull; Institutional Academic Record
                  </p>
                </div>
                <button
                  className="modal-close-btn"
                  onClick={() => setStudentDetailModalOpen(false)}
                >
                  &times;
                </button>
              </div>

              <div className="modal-body">
                {loadingStudentDetail ? (
                  <div style={{ textAlign: 'center', padding: '2rem' }}>
                    <span className="spinner"></span>
                    <p style={{ marginTop: '0.75rem', color: 'var(--slate-500)' }}>
                      Loading verified admission details...
                    </p>
                  </div>
                ) : selectedStudentDetail ? (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem', borderBottom: '1px solid var(--slate-200)' }}>
                      <div>
                        <h4 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-900)', margin: 0 }}>
                          {selectedStudentDetail.fullName}
                        </h4>
                        <span className="student-enrollment-badge" style={{ marginTop: '0.25rem', display: 'inline-block' }}>
                          Enrollment: {selectedStudentDetail.enrollmentNumber}
                        </span>
                      </div>
                      <span className={`badge ${selectedStudentDetail.active ? 'status-badge-active' : 'status-badge-inactive'}`}>
                        {selectedStudentDetail.active ? 'ACTIVE ACCOUNT' : 'INACTIVE'}
                      </span>
                    </div>

                    <div className="detail-modal-grid">
                      <div className="detail-modal-item">
                        <span className="detail-item-label">Academic Program</span>
                        <span className="detail-item-value">{selectedStudentDetail.course}</span>
                      </div>

                      <div className="detail-modal-item">
                        <span className="detail-item-label">Current Semester</span>
                        <span className="detail-item-value">Semester {selectedStudentDetail.semester}</span>
                      </div>

                      <div className="detail-modal-item">
                        <span className="detail-item-label">Institutional Email</span>
                        <span className="detail-item-value">{selectedStudentDetail.email}</span>
                      </div>

                      <div className="detail-modal-item">
                        <span className="detail-item-label">Contact Phone</span>
                        <span className="detail-item-value">{selectedStudentDetail.phone}</span>
                      </div>

                      <div className="detail-modal-item">
                        <span className="detail-item-label">Linked User ID</span>
                        <span className="detail-item-value">User #{selectedStudentDetail.userId} ({selectedStudentDetail.userRole})</span>
                      </div>

                      <div className="detail-modal-item">
                        <span className="detail-item-label">Enrolled Date</span>
                        <span className="detail-item-value">
                          {selectedStudentDetail.createdAt ? new Date(selectedStudentDetail.createdAt).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                    </div>

                    <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--slate-50)', borderRadius: 'var(--radius-md)', border: '1px solid var(--slate-200)' }}>
                      <h5 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--slate-800)', marginBottom: '0.5rem' }}>
                        Hostel Accommodation Status
                      </h5>
                      {selectedStudentDetail.currentAllocationId ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.875rem' }}>
                          <div>Building: <strong>{selectedStudentDetail.currentHostelName}</strong></div>
                          <div>Room Number: <strong>{selectedStudentDetail.currentRoomNumber}</strong> (Floor {selectedStudentDetail.currentRoomFloor})</div>
                          <div>Allocated On: <strong>{selectedStudentDetail.allocationDate}</strong></div>
                          <div style={{ marginTop: '0.25rem' }}>
                            <span className="badge housing-badge-allocated">Active Campus Resident</span>
                          </div>
                        </div>
                      ) : (
                        <div style={{ fontSize: '0.875rem', color: 'var(--slate-600)' }}>
                          <p style={{ margin: 0 }}>This student is currently not allocated to any hostel room (Day Scholar / Awaiting Allotment).</p>
                        </div>
                      )}
                      <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--slate-500)', borderTop: '1px dashed var(--slate-300)', paddingTop: '0.5rem' }}>
                        Total Historical Allocations Recorded: <strong>{selectedStudentDetail.totalAllocationsCount}</strong>
                      </div>
                    </div>
                  </>
                ) : (
                  <p>No student details loaded.</p>
                )}
              </div>

              <div className="modal-footer">
                {selectedStudentDetail && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setStudentDetailModalOpen(false);
                      openEditStudentModal(selectedStudentDetail);
                    }}
                  >
                    Edit Student
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setStudentDetailModalOpen(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 4: CREATE / EDIT STUDENT */}
        {studentModalOpen && (
          <div className="modal-backdrop" role="dialog" aria-modal="true">
            <div className="modal-card" style={{ maxWidth: '600px' }}>
              <div className="modal-header">
                <h3 className="modal-title">
                  {editingStudent ? `Edit Student: ${editingStudent.fullName}` : 'Enroll New Student'}
                </h3>
                <button
                  className="modal-close-btn"
                  onClick={() => setStudentModalOpen(false)}
                  disabled={actionLoading}
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleStudentFormSubmit}>
                <div className="modal-body">
                  <div className="form-grid-2">
                    <div className="form-group">
                      <label htmlFor="student-enrollment-input" className="form-label">
                        Enrollment Number *
                      </label>
                      <input
                        id="student-enrollment-input"
                        type="text"
                        className="form-input"
                        placeholder="e.g. EN2024CS001"
                        value={studentFormData.enrollmentNumber}
                        onChange={(e) => setStudentFormData({ ...studentFormData, enrollmentNumber: e.target.value })}
                        required
                        disabled={actionLoading}
                        maxLength={30}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="student-name-input" className="form-label">
                        Full Name *
                      </label>
                      <input
                        id="student-name-input"
                        type="text"
                        className="form-input"
                        placeholder="e.g. Rahul Sharma"
                        value={studentFormData.fullName}
                        onChange={(e) => setStudentFormData({ ...studentFormData, fullName: e.target.value })}
                        required
                        disabled={actionLoading}
                        maxLength={100}
                      />
                    </div>
                  </div>

                  <div className="form-grid-2">
                    <div className="form-group">
                      <label htmlFor="student-email-input" className="form-label">
                        Institutional Email *
                      </label>
                      <input
                        id="student-email-input"
                        type="email"
                        className="form-input"
                        placeholder="e.g. rahul.sharma@gpsakoli.ac.in"
                        value={studentFormData.email}
                        onChange={(e) => setStudentFormData({ ...studentFormData, email: e.target.value })}
                        required
                        disabled={actionLoading}
                        maxLength={100}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="student-phone-input" className="form-label">
                        Contact Phone *
                      </label>
                      <input
                        id="student-phone-input"
                        type="tel"
                        className="form-input"
                        placeholder="e.g. 9876543210"
                        value={studentFormData.phone}
                        onChange={(e) => setStudentFormData({ ...studentFormData, phone: e.target.value })}
                        required
                        disabled={actionLoading}
                        minLength={10}
                        maxLength={20}
                      />
                    </div>
                  </div>

                  <div className="form-grid-2">
                    <div className="form-group">
                      <label htmlFor="student-course-input" className="form-label">
                        Academic Course *
                      </label>
                      <select
                        id="student-course-input"
                        className="form-input"
                        value={studentFormData.course}
                        onChange={(e) => setStudentFormData({ ...studentFormData, course: e.target.value })}
                        required
                        disabled={actionLoading}
                      >
                        <option value="Diploma in Computer Engineering">Diploma in Computer Engineering</option>
                        <option value="Diploma in Civil Engineering">Diploma in Civil Engineering</option>
                        <option value="Diploma in Mechanical Engineering">Diploma in Mechanical Engineering</option>
                        <option value="Diploma in Electrical Engineering">Diploma in Electrical Engineering</option>
                        <option value="Diploma in Electronics & Telecommunication">Diploma in Electronics & Telecommunication</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="student-semester-input" className="form-label">
                        Current Semester (1–10) *
                      </label>
                      <input
                        id="student-semester-input"
                        type="number"
                        min="1"
                        max="10"
                        className="form-input"
                        value={studentFormData.semester}
                        onChange={(e) => setStudentFormData({ ...studentFormData, semester: parseInt(e.target.value, 10) || 1 })}
                        required
                        disabled={actionLoading}
                      />
                    </div>
                  </div>

                  {!editingStudent && (
                    <div className="form-group">
                      <label htmlFor="student-password-input" className="form-label">
                        Portal Login Password *
                      </label>
                      <input
                        id="student-password-input"
                        type="password"
                        className="form-input"
                        placeholder="Minimum 6 characters"
                        value={studentFormData.password}
                        onChange={(e) => setStudentFormData({ ...studentFormData, password: e.target.value })}
                        required
                        minLength={6}
                        maxLength={50}
                        disabled={actionLoading}
                      />
                      <span style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>
                        Creates a linked User account with STUDENT role. Passwords are encrypted with BCrypt.
                      </span>
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <input
                      id="student-active-input"
                      type="checkbox"
                      checked={studentFormData.active}
                      onChange={(e) => setStudentFormData({ ...studentFormData, active: e.target.checked })}
                      disabled={actionLoading}
                      style={{ width: '16px', height: '16px' }}
                    />
                    <label htmlFor="student-active-input" style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--slate-700)' }}>
                      Active Student Account (eligible for hostel admissions and room allocation)
                    </label>
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setStudentModalOpen(false)}
                    disabled={actionLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={actionLoading}
                  >
                    {actionLoading ? 'Saving...' : editingStudent ? 'Save Changes' : 'Enroll Student'}
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
