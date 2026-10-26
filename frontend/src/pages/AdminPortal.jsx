import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import ImageWithFallback from '../components/ImageWithFallback';
import { getHostelImage } from '../config/media';
import AdminAdmissionsManager from '../components/AdminAdmissionsManager';
import GrievanceMaintenanceManager from '../components/GrievanceMaintenanceManager';
import DigitalGatePassManager from '../components/DigitalGatePassManager';
import NoticeBoardManager from '../components/NoticeBoardManager';
import MessManagementSection from '../components/MessManagementSection';
import FeeManagerSection from '../components/FeeManagerSection';
import CampusAnalyticsSection from '../components/CampusAnalyticsSection';
import RoomQrCodeModal from '../components/RoomQrCodeModal';
import ResidentIdCardModal from '../components/ResidentIdCardModal';
import './PortalCommon.css';
import './AdminPortal.css';

function getTodayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function AdminPortal() {
  const { user, logout, authFetch } = useAuth();

  // Tab State: 'dashboard' | 'hostels' | 'rooms' | 'students' | 'allocations'
  const [activeTab, setActiveTab] = useState('dashboard');
  const [hostelViewMode, setHostelViewMode] = useState('cards'); // 'cards' | 'table'

  // Data States
  const [dashboardStats, setDashboardStats] = useState(null);
  const [hostels, setHostels] = useState([]);
  const [selectedHostelId, setSelectedHostelId] = useState('');
  const [rooms, setRooms] = useState([]);
  const [students, setStudents] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [wardens, setWardens] = useState([]);

  // UI Feedback States
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [loadingAllocations, setLoadingAllocations] = useState(false);
  const [loadingWardens, setLoadingWardens] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedbackError, setFeedbackError] = useState('');
  const [feedbackSuccess, setFeedbackSuccess] = useState('');

  // Advanced Features Modals
  const [activeQrRoom, setActiveQrRoom] = useState(null);
  const [activeIdCardStudent, setActiveIdCardStudent] = useState(null);

  // Warden Assignment Modal State
  const [assignWardenModalOpen, setAssignWardenModalOpen] = useState(false);
  const [selectedWardenForAssign, setSelectedWardenForAssign] = useState(null);
  const [targetHostelIdForAssign, setTargetHostelIdForAssign] = useState('');

  // Student Filter & Search States
  const [studentSearch, setStudentSearch] = useState('');
  const [studentCourseFilter, setStudentCourseFilter] = useState('ALL');
  const [studentStatusFilter, setStudentStatusFilter] = useState('ALL');

  // Room Allocation Filter & Search States
  const [allocationSearch, setAllocationSearch] = useState('');
  const [allocationStatusFilter, setAllocationStatusFilter] = useState('ALL');
  const [allocationHostelFilter, setAllocationHostelFilter] = useState('ALL');

  // Attendance Oversight States
  const [adminAttendanceDate, setAdminAttendanceDate] = useState(getTodayDateString());
  const [adminAttendanceHostelId, setAdminAttendanceHostelId] = useState('');
  const [attendanceSummary, setAttendanceSummary] = useState(null);
  const [loadingAttendanceSummary, setLoadingAttendanceSummary] = useState(false);
  const [adminAttendanceHistory, setAdminAttendanceHistory] = useState([]);
  const [loadingAdminAttendanceHistory, setLoadingAdminAttendanceHistory] = useState(false);
  const [adminHistoryFrom, setAdminHistoryFrom] = useState('');
  const [adminHistoryTo, setAdminHistoryTo] = useState('');
  const [adminHistoryStatus, setAdminHistoryStatus] = useState('ALL');
  const [adminHistorySearch, setAdminHistorySearch] = useState('');

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

  // Allocation Modals State
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [availableStudents, setAvailableStudents] = useState([]);
  const [loadingAvailableStudents, setLoadingAvailableStudents] = useState(false);
  const [selectedHostelForAssign, setSelectedHostelForAssign] = useState('');
  const [roomsForAssign, setRoomsForAssign] = useState([]);
  const [loadingRoomsForAssign, setLoadingRoomsForAssign] = useState(false);
  const [assignFormData, setAssignFormData] = useState({
    studentId: '',
    roomId: '',
    allocationDate: getTodayDateString()
  });

  const [allocationDetailModalOpen, setAllocationDetailModalOpen] = useState(false);
  const [selectedAllocationDetail, setSelectedAllocationDetail] = useState(null);
  const [loadingAllocationDetail, setLoadingAllocationDetail] = useState(false);

  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [checkingOutAllocation, setCheckingOutAllocation] = useState(null);
  const [checkoutFormData, setCheckoutFormData] = useState({
    vacatingDate: getTodayDateString()
  });

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

  // Load Wardens List
  const loadWardens = useCallback(() => {
    let isMounted = true;
    authFetch('/api/admin/wardens')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load warden directory');
        return res.json();
      })
      .then((data) => {
        if (isMounted) setWardens(data);
      })
      .catch((err) => {
        if (isMounted) setFeedbackError(err.message || 'Error loading wardens');
      })
      .finally(() => {
        if (isMounted) setLoadingWardens(false);
      });

    return () => {
      isMounted = false;
    };
  }, [authFetch]);

  useEffect(() => {
    const cleanup = loadWardens();
    return cleanup;
  }, [loadWardens]);

  // Load Institutional Attendance Summary
  const loadAdminAttendanceSummary = useCallback((date = adminAttendanceDate, hostelId = adminAttendanceHostelId) => {
    let isMounted = true;
    Promise.resolve().then(() => {
      if (isMounted) setLoadingAttendanceSummary(true);
    });
    const params = new URLSearchParams();
    if (date) params.append('date', date);
    if (hostelId) params.append('hostelId', hostelId);

    const queryStr = params.toString() ? `?${params.toString()}` : '';
    authFetch(`/api/admin/attendance/summary${queryStr}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load institutional attendance summary');
        return res.json();
      })
      .then((data) => {
        if (isMounted) setAttendanceSummary(data);
      })
      .catch((err) => {
        if (isMounted) setFeedbackError(err.message || 'Error loading attendance summary');
      })
      .finally(() => {
        if (isMounted) setLoadingAttendanceSummary(false);
      });

    return () => {
      isMounted = false;
    };
  }, [authFetch, adminAttendanceDate, adminAttendanceHostelId]);

  // Load Institutional Attendance History
  const loadAdminAttendanceHistory = useCallback((from = adminHistoryFrom, to = adminHistoryTo, hostelId = adminAttendanceHostelId, status = adminHistoryStatus, search = adminHistorySearch) => {
    let isMounted = true;
    Promise.resolve().then(() => {
      if (isMounted) setLoadingAdminAttendanceHistory(true);
    });
    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    if (hostelId) params.append('hostelId', hostelId);
    if (status && status !== 'ALL') params.append('status', status);
    if (search && search.trim()) params.append('search', search.trim());

    const queryStr = params.toString() ? `?${params.toString()}` : '';
    authFetch(`/api/admin/attendance/history${queryStr}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load attendance history records');
        return res.json();
      })
      .then((data) => {
        if (isMounted) setAdminAttendanceHistory(data);
      })
      .catch((err) => {
        if (isMounted) setFeedbackError(err.message || 'Error loading attendance history');
      })
      .finally(() => {
        if (isMounted) setLoadingAdminAttendanceHistory(false);
      });

    return () => {
      isMounted = false;
    };
  }, [authFetch, adminHistoryFrom, adminHistoryTo, adminAttendanceHostelId, adminHistoryStatus, adminHistorySearch]);

  // Trigger loading when activeTab switches to 'attendance'
  useEffect(() => {
    if (activeTab === 'attendance') {
      const cleanupSummary = loadAdminAttendanceSummary();
      const cleanupHistory = loadAdminAttendanceHistory();
      return () => {
        if (cleanupSummary) cleanupSummary();
        if (cleanupHistory) cleanupHistory();
      };
    }
  }, [activeTab, loadAdminAttendanceSummary, loadAdminAttendanceHistory]);

  const handleAdminAttendanceSummaryRefresh = (e) => {
    if (e) e.preventDefault();
    clearFeedback();
    loadAdminAttendanceSummary(adminAttendanceDate, adminAttendanceHostelId);
  };

  const handleAdminAttendanceHistorySearch = (e) => {
    if (e) e.preventDefault();
    clearFeedback();
    loadAdminAttendanceHistory(adminHistoryFrom, adminHistoryTo, adminAttendanceHostelId, adminHistoryStatus, adminHistorySearch);
  };

  const handleAdminAttendanceHistoryClear = () => {
    clearFeedback();
    setAdminHistoryFrom('');
    setAdminHistoryTo('');
    setAdminHistoryStatus('ALL');
    setAdminHistorySearch('');
    loadAdminAttendanceHistory('', '', adminAttendanceHostelId, 'ALL', '');
  };


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

  // Load Room Allocations
  const loadAllocations = useCallback((search = '', status = '', hostelId = '') => {
    let isMounted = true;
    const params = new URLSearchParams();
    if (search && search.trim()) params.append('search', search.trim());
    if (status && status !== 'ALL') params.append('status', status);
    if (hostelId && hostelId !== 'ALL') params.append('hostelId', hostelId);

    const queryStr = params.toString() ? `?${params.toString()}` : '';
    authFetch(`/api/admin/allocations${queryStr}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load room allocations');
        return res.json();
      })
      .then((data) => {
        if (isMounted) setAllocations(data);
      })
      .catch((err) => {
        if (isMounted) setFeedbackError(err.message || 'Error loading allocations');
      })
      .finally(() => {
        if (isMounted) setLoadingAllocations(false);
      });

    return () => {
      isMounted = false;
    };
  }, [authFetch]);

  useEffect(() => {
    const cleanup = loadAllocations();
    return cleanup;
  }, [loadAllocations]);

  const handleAllocationSearchSubmit = (e) => {
    e.preventDefault();
    clearFeedback();
    setLoadingAllocations(true);
    loadAllocations(allocationSearch, allocationStatusFilter, allocationHostelFilter);
  };

  const handleAllocationSearchClear = () => {
    clearFeedback();
    setAllocationSearch('');
    setLoadingAllocations(true);
    loadAllocations('', allocationStatusFilter, allocationHostelFilter);
  };

  // Open Assign Room Modal
  const openAssignRoomModal = async () => {
    clearFeedback();
    const defaultHostelId = hostels.length > 0 ? String(hostels[0].id) : '';
    setSelectedHostelForAssign(defaultHostelId);
    setAssignFormData({
      studentId: '',
      roomId: '',
      allocationDate: getTodayDateString()
    });
    setAssignModalOpen(true);
    setLoadingAvailableStudents(true);
    setLoadingRoomsForAssign(true);

    try {
      const studentRes = await authFetch('/api/admin/allocations/available-students');
      if (studentRes.ok) {
        const studentData = await studentRes.json();
        setAvailableStudents(studentData);
      }
    } catch {
      // Ignored: feedback handled in modal
    } finally {
      setLoadingAvailableStudents(false);
    }

    if (defaultHostelId) {
      try {
        const roomRes = await authFetch(`/api/admin/allocations/available-rooms?hostelId=${defaultHostelId}&includeFull=true`);
        if (roomRes.ok) {
          const roomData = await roomRes.json();
          setRoomsForAssign(roomData);
        }
      } catch {
        // Ignored
      } finally {
        setLoadingRoomsForAssign(false);
      }
    } else {
      setLoadingRoomsForAssign(false);
    }
  };

  // When hostel selection changes in Assign modal
  const handleHostelChangeForAssign = async (hostelId) => {
    setSelectedHostelForAssign(hostelId);
    setAssignFormData((prev) => ({ ...prev, roomId: '' }));
    setLoadingRoomsForAssign(true);
    try {
      const res = await authFetch(`/api/admin/allocations/available-rooms?hostelId=${hostelId}&includeFull=true`);
      if (res.ok) {
        const data = await res.json();
        setRoomsForAssign(data);
      }
    } catch (err) {
      setFeedbackError(err.message);
    } finally {
      setLoadingRoomsForAssign(false);
    }
  };

  // Submit Room Assignment Form
  const handleAssignFormSubmit = async (e) => {
    e.preventDefault();
    clearFeedback();

    if (!assignFormData.studentId) {
      setFeedbackError('Please select a student to allocate.');
      return;
    }
    if (!assignFormData.roomId) {
      setFeedbackError('Please select a room with available bed capacity.');
      return;
    }

    setActionLoading(true);
    try {
      const res = await authFetch('/api/admin/allocations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: Number(assignFormData.studentId),
          roomId: Number(assignFormData.roomId),
          allocationDate: assignFormData.allocationDate || getTodayDateString()
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Room assignment failed');
      }

      setFeedbackSuccess(
        `Successfully allocated student "${data.studentName}" to Room ${data.roomNumber} (${data.hostelName}).`
      );
      setAssignModalOpen(false);

      // Refresh all dependent views
      loadAllocations(allocationSearch, allocationStatusFilter, allocationHostelFilter);
      loadDashboardData();
      if (selectedHostelId) loadRoomsForHostel(selectedHostelId);
      loadStudents(studentSearch);
    } catch (err) {
      setFeedbackError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Open Checkout Modal
  const openCheckoutModal = (allocation) => {
    clearFeedback();
    setCheckingOutAllocation(allocation);
    setCheckoutFormData({
      vacatingDate: getTodayDateString()
    });
    setCheckoutModalOpen(true);
  };

  // Confirm Checkout Submission
  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    clearFeedback();

    if (!checkingOutAllocation) return;

    setActionLoading(true);
    try {
      const res = await authFetch(`/api/admin/allocations/${checkingOutAllocation.id}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vacatingDate: checkoutFormData.vacatingDate || getTodayDateString()
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Checkout failed');
      }

      setFeedbackSuccess(
        `Resident "${data.studentName}" successfully checked out from Room ${data.roomNumber}. Bed capacity immediately restored.`
      );
      setCheckoutModalOpen(false);

      // Refresh all dependent views
      loadAllocations(allocationSearch, allocationStatusFilter, allocationHostelFilter);
      loadDashboardData();
      if (selectedHostelId) loadRoomsForHostel(selectedHostelId);
      loadStudents(studentSearch);
    } catch (err) {
      setFeedbackError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // View Allocation Details
  const handleViewAllocationDetail = async (allocId) => {
    clearFeedback();
    setAllocationDetailModalOpen(true);
    setLoadingAllocationDetail(true);
    setSelectedAllocationDetail(null);
    try {
      const res = await authFetch(`/api/admin/allocations/${allocId}`);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to fetch allocation details');
      }
      const data = await res.json();
      setSelectedAllocationDetail(data);
    } catch (err) {
      setFeedbackError(err.message);
    } finally {
      setLoadingAllocationDetail(false);
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

  // Open Assign Warden Modal
  const openAssignWardenModal = (warden) => {
    clearFeedback();
    setSelectedWardenForAssign(warden);
    setTargetHostelIdForAssign(hostels.length > 0 ? String(hostels[0].id) : '');
    setAssignWardenModalOpen(true);
  };

  // Submit Warden Assignment
  const handleAssignWardenSubmit = async (e) => {
    e.preventDefault();
    clearFeedback();

    if (!targetHostelIdForAssign) {
      setFeedbackError('Please select a hostel to assign to the warden.');
      return;
    }

    setActionLoading(true);
    try {
      const res = await authFetch('/api/admin/wardens/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wardenId: selectedWardenForAssign.id,
          hostelId: Number(targetHostelIdForAssign)
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Hostel assignment failed');
      }

      setFeedbackSuccess(
        `Successfully assigned "${data.hostelName}" to Warden ${data.wardenName}.`
      );
      setAssignWardenModalOpen(false);
      loadWardens();
    } catch (err) {
      setFeedbackError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Revoke Warden Assignment
  const handleRevokeWardenAssignment = async (wardenId, hostelId, hostelName, wardenName) => {
    if (!window.confirm(`Revoke oversight of "${hostelName}" from Warden "${wardenName}"?`)) {
      return;
    }

    clearFeedback();
    setActionLoading(true);
    try {
      const res = await authFetch(`/api/admin/wardens/${wardenId}/assignments/${hostelId}`, {
        method: 'DELETE'
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to revoke hostel assignment');
      }

      setFeedbackSuccess(`Revoked oversight of "${hostelName}" from Warden ${wardenName}.`);
      loadWardens();
    } catch (err) {
      setFeedbackError(err.message);
    } finally {
      setActionLoading(false);
    }
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
          <button
            role="tab"
            aria-selected={activeTab === 'allocations'}
            className={`admin-tab ${activeTab === 'allocations' ? 'active' : ''}`}
            onClick={() => {
              clearFeedback();
              setActiveTab('allocations');
            }}
          >
            &#128719; Room Allocations <span className="tab-count">{allocations.length}</span>
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'admissions'}
            className={`admin-tab ${activeTab === 'admissions' ? 'active' : ''}`}
            onClick={() => {
              clearFeedback();
              setActiveTab('admissions');
            }}
          >
            &#128221; Hostel Admissions
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'wardens'}
            className={`admin-tab ${activeTab === 'wardens' ? 'active' : ''}`}
            onClick={() => {
              clearFeedback();
              setActiveTab('wardens');
            }}
          >
            &#128110; Warden Oversight <span className="tab-count">{wardens.length}</span>
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'attendance'}
            className={`admin-tab ${activeTab === 'attendance' ? 'active' : ''}`}
            onClick={() => {
              clearFeedback();
              setActiveTab('attendance');
            }}
          >
            &#128197; Attendance Oversight
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'complaints'}
            className={`admin-tab ${activeTab === 'complaints' ? 'active' : ''}`}
            onClick={() => {
              clearFeedback();
              setActiveTab('complaints');
            }}
          >
            &#128295; Grievance Redressal
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'gatepass'}
            className={`admin-tab ${activeTab === 'gatepass' ? 'active' : ''}`}
            onClick={() => {
              clearFeedback();
              setActiveTab('gatepass');
            }}
          >
            🎫 Gate Pass Oversight
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'mess'}
            className={`admin-tab ${activeTab === 'mess' ? 'active' : ''}`}
            onClick={() => {
              clearFeedback();
              setActiveTab('mess');
            }}
          >
            🍽️ Mess &amp; Ratings
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'fees'}
            className={`admin-tab ${activeTab === 'fees' ? 'active' : ''}`}
            onClick={() => {
              clearFeedback();
              setActiveTab('fees');
            }}
          >
            💳 Fee Ledger &amp; Receipts
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'notices'}
            className={`admin-tab ${activeTab === 'notices' ? 'active' : ''}`}
            onClick={() => {
              clearFeedback();
              setActiveTab('notices');
            }}
          >
            📢 Notice Board
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'analytics'}
            className={`admin-tab ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => {
              clearFeedback();
              setActiveTab('analytics');
            }}
          >
            📊 Analytics &amp; CSV Export
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

                {/* Operational Quick Actions Bar */}
                <div className="admin-quick-actions-bar">
                  <span className="quick-actions-label">Quick Actions:</span>
                  <div className="quick-actions-pills">
                    <button
                      className="quick-action-pill"
                      onClick={() => {
                        setActiveTab('allocations');
                        openAssignRoomModal();
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
                      Assign Student Bed
                    </button>
                    <button
                      className="quick-action-pill"
                      onClick={() => {
                        setActiveTab('students');
                        openCreateStudentModal();
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/></svg>
                      Enroll Student
                    </button>
                    <button
                      className="quick-action-pill"
                      onClick={openCreateHostelModal}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                      Add Hostel Building
                    </button>
                    <button
                      className="quick-action-pill"
                      onClick={() => setActiveTab('attendance')}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                      Daily Attendance
                    </button>
                  </div>
                </div>

                {/* Hostels Summary Section */}
                <div className="section-action-bar">
                  <div>
                    <h2 className="action-bar-title">Campus Hostels Overview</h2>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--slate-500)', marginTop: '0.2rem' }}>
                      Real-time residential occupancy across Government Polytechnic Sakoli hostels
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
                      Start building the Government Polytechnic Sakoli campus database by creating the first hostel building.
                    </p>
                    <button className="btn btn-primary" onClick={openCreateHostelModal}>
                      Create First Hostel
                    </button>
                  </div>
                ) : (
                  <div className="hostels-photo-grid" style={{ marginBottom: '2rem' }}>
                    {hostels.map((hostel) => {
                      const media = getHostelImage(hostel.name, hostel.hostelType);
                      const occupancyPercent = hostel.totalCapacity > 0 ? Math.min(100, Math.round((hostel.activeAllocations / hostel.totalCapacity) * 100)) : 0;
                      return (
                        <div key={hostel.id} className="photo-card hostel-photo-card">
                          <div className="photo-card-media" style={{ height: '175px' }}>
                            <ImageWithFallback
                              src={media.src}
                              fallbackSrc={media.fallbackSrc}
                              alt={media.alt}
                              className="photo-card-img"
                            />
                            <div className="photo-card-overlay"></div>
                            <div className="photo-card-badge-top">
                              <span className={`badge ${hostel.hostelType === 'BOYS' ? 'type-badge-boys' : 'type-badge-girls'}`}>
                                {hostel.hostelType} HOSTEL
                              </span>
                              <span className={`badge ${hostel.active ? 'status-badge-active' : 'status-badge-inactive'}`}>
                                {hostel.active ? 'ACTIVE' : 'INACTIVE'}
                              </span>
                            </div>
                            <div className="photo-card-title-bottom">
                              <h3 className="photo-card-title">{hostel.name}</h3>
                            </div>
                          </div>
                          <div className="photo-card-content">
                            <p className="photo-card-address">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: '2px' }}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                              <span>{hostel.address || 'Government Polytechnic Sakoli Campus'}</span>
                            </p>

                            <div className="occupancy-section">
                              <div className="occupancy-header">
                                <span className="occupancy-title">Occupancy Rate</span>
                                <span className="occupancy-percent">{occupancyPercent}%</span>
                              </div>
                              <div className="occupancy-track" role="progressbar" aria-valuenow={occupancyPercent} aria-valuemin="0" aria-valuemax="100">
                                <div
                                  className={`occupancy-fill ${occupancyPercent >= 90 ? 'danger' : occupancyPercent >= 70 ? 'warning' : 'safe'}`}
                                  style={{ width: `${occupancyPercent}%` }}
                                ></div>
                              </div>
                              <div className="occupancy-stats-footer">
                                <span>{hostel.activeAllocations} resident students</span>
                                <span style={{ color: hostel.availableBeds > 0 ? 'var(--accent-emerald-600)' : 'var(--slate-500)', fontWeight: 600 }}>
                                  {hostel.availableBeds} beds vacant
                                </span>
                              </div>
                            </div>

                            <div className="photo-card-stats-grid">
                              <div className="photo-stat-box">
                                <span className="photo-stat-label">Rooms</span>
                                <span className="photo-stat-value">{hostel.totalRooms}</span>
                              </div>
                              <div className="photo-stat-box">
                                <span className="photo-stat-label">Total Beds</span>
                                <span className="photo-stat-value">{hostel.totalCapacity}</span>
                              </div>
                              <div className="photo-stat-box">
                                <span className="photo-stat-label">Occupied</span>
                                <span className="photo-stat-value">{hostel.activeAllocations}</span>
                              </div>
                              <div className="photo-stat-box">
                                <span className="photo-stat-label">Vacant</span>
                                <span className="photo-stat-value" style={{ color: hostel.availableBeds > 0 ? 'var(--accent-emerald-600)' : 'inherit' }}>{hostel.availableBeds}</span>
                              </div>
                            </div>

                            <div className="photo-card-actions">
                              <button
                                className="btn btn-primary btn-sm"
                                onClick={() => handleViewRoomsForHostel(hostel.id)}
                              >
                                View Rooms
                              </button>
                              <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => openEditHostelModal(hostel)}
                              >
                                Edit
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
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
                  Configure blocks, types, addresses, bed capacities, and operational status
                </p>
              </div>

              <div className="action-bar-actions" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <div className="view-mode-toggle">
                  <button
                    type="button"
                    className={`view-toggle-btn ${hostelViewMode === 'cards' ? 'active' : ''}`}
                    onClick={() => setHostelViewMode('cards')}
                    aria-label="View as photo cards"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                    Cards
                  </button>
                  <button
                    type="button"
                    className={`view-toggle-btn ${hostelViewMode === 'table' ? 'active' : ''}`}
                    onClick={() => setHostelViewMode('table')}
                    aria-label="View as table"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
                    Table
                  </button>
                </div>

                <button className="btn btn-primary btn-sm" onClick={openCreateHostelModal}>
                  + Add New Hostel
                </button>
              </div>
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
            ) : hostelViewMode === 'cards' ? (
              <div className="hostels-photo-grid">
                {hostels.map((h) => {
                  const media = getHostelImage(h.name, h.hostelType);
                  const occupancyPercent = h.totalCapacity > 0 ? Math.min(100, Math.round((h.activeAllocations / h.totalCapacity) * 100)) : 0;
                  return (
                    <div key={h.id} className="photo-card hostel-photo-card">
                      <div className="photo-card-media" style={{ height: '185px' }}>
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
                          <span className={`badge ${h.active ? 'status-badge-active' : 'status-badge-inactive'}`}>
                            {h.active ? 'ACTIVE' : 'INACTIVE'}
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
                            <span className="occupancy-title">Occupancy Rate</span>
                            <span className="occupancy-percent">{occupancyPercent}%</span>
                          </div>
                          <div className="occupancy-track" role="progressbar" aria-valuenow={occupancyPercent} aria-valuemin="0" aria-valuemax="100">
                            <div
                              className={`occupancy-fill ${occupancyPercent >= 90 ? 'danger' : occupancyPercent >= 70 ? 'warning' : 'safe'}`}
                              style={{ width: `${occupancyPercent}%` }}
                            ></div>
                          </div>
                          <div className="occupancy-stats-footer">
                            <span>{h.activeAllocations} resident students</span>
                            <span style={{ color: h.availableBeds > 0 ? 'var(--accent-emerald-600)' : 'var(--slate-500)', fontWeight: 600 }}>
                              {h.availableBeds} beds vacant
                            </span>
                          </div>
                        </div>

                        <div className="photo-card-stats-grid">
                          <div className="photo-stat-box">
                            <span className="photo-stat-label">Rooms</span>
                            <span className="photo-stat-value">{h.totalRooms}</span>
                          </div>
                          <div className="photo-stat-box">
                            <span className="photo-stat-label">Total Beds</span>
                            <span className="photo-stat-value">{h.totalCapacity}</span>
                          </div>
                          <div className="photo-stat-box">
                            <span className="photo-stat-label">Occupied</span>
                            <span className="photo-stat-value">{h.activeAllocations}</span>
                          </div>
                          <div className="photo-stat-box">
                            <span className="photo-stat-label">Vacant</span>
                            <span className="photo-stat-value" style={{ color: h.availableBeds > 0 ? 'var(--accent-emerald-600)' : 'inherit' }}>{h.availableBeds}</span>
                          </div>
                        </div>

                        <div className="photo-card-actions">
                          <button
                            className="btn btn-primary btn-sm"
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
                      </div>
                    </div>
                  );
                })}
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

                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ flex: 1 }}
                          onClick={() => openEditRoomModal(room)}
                        >
                          Edit Room
                        </button>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => setActiveQrRoom(room)}
                          title="Print Room QR Poster"
                        >
                          🚪 Poster
                        </button>
                      </div>
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
                                onClick={() => setActiveIdCardStudent({
                                  fullName: student.fullName,
                                  enrollmentNumber: student.enrollmentNumber,
                                  course: student.course,
                                  semester: student.semester,
                                  phone: student.phone,
                                  hostelName: student.currentAllocation?.room?.hostel?.name || 'Sahyadri Boys Hostel',
                                  roomNumber: student.currentAllocation?.room?.roomNumber || '104'
                                })}
                                title="View Printable Resident ID Card"
                              >
                                🪪 ID Card
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

        {/* TAB 5: ROOM ALLOCATIONS & BED ASSIGNMENTS */}
        {activeTab === 'allocations' && (
          <div>
            <div className="section-action-bar">
              <div>
                <h2 className="action-bar-title">Room Allocations & Bed Assignments</h2>
                <p style={{ fontSize: '0.875rem', color: 'var(--slate-500)' }}>
                  Assign resident students to rooms, monitor real bed occupancy, and manage vacating/checkout lifecycles
                </p>
              </div>
              <button className="btn btn-primary btn-sm" onClick={openAssignRoomModal}>
                + Assign Student to Room
              </button>
            </div>

            {/* Allocation Search and Filters Bar */}
            <div className="search-filter-bar">
              <form onSubmit={handleAllocationSearchSubmit} className="search-input-wrap" style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Search by student name or enrollment number..."
                  value={allocationSearch}
                  onChange={(e) => setAllocationSearch(e.target.value)}
                />
                <button type="submit" className="btn btn-primary btn-sm" disabled={loadingAllocations}>
                  Search
                </button>
                {allocationSearch && (
                  <button type="button" className="btn btn-secondary btn-sm" onClick={handleAllocationSearchClear}>
                    Clear
                  </button>
                )}
              </form>

              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <select
                  className="filter-select"
                  value={allocationStatusFilter}
                  onChange={(e) => {
                    const newStatus = e.target.value;
                    setAllocationStatusFilter(newStatus);
                    loadAllocations(allocationSearch, newStatus, allocationHostelFilter);
                  }}
                  aria-label="Filter by allocation status"
                >
                  <option value="ALL">All Allocation Statuses</option>
                  <option value="ACTIVE">Active Residents Only</option>
                  <option value="COMPLETED">Completed / Checked Out</option>
                </select>

                <select
                  className="filter-select"
                  value={allocationHostelFilter}
                  onChange={(e) => {
                    const newHostel = e.target.value;
                    setAllocationHostelFilter(newHostel);
                    loadAllocations(allocationSearch, allocationStatusFilter, newHostel);
                  }}
                  aria-label="Filter by hostel building"
                >
                  <option value="ALL">All Campus Hostels</option>
                  {hostels.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name} ({h.hostelType})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {loadingAllocations ? (
              <div style={{ textAlign: 'center', padding: '3rem' }}>
                <span className="spinner"></span>
                <p style={{ marginTop: '1rem', color: 'var(--slate-500)' }}>Loading room allocations...</p>
              </div>
            ) : allocations.length === 0 ? (
              <div className="empty-state-card">
                <div className="empty-state-icon">&#128719;</div>
                <h3 className="empty-state-title">No Room Allocations Recorded Yet</h3>
                <p className="empty-state-text">
                  There are currently no student room allocations matching your criteria. Allocate an active student to an available hostel bed.
                </p>
                <button className="btn btn-primary" onClick={openAssignRoomModal}>
                  + Assign First Student
                </button>
              </div>
            ) : (
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Allocation ID</th>
                      <th>Resident Student</th>
                      <th>Hostel & Room</th>
                      <th>Allocation Timeline</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allocations.map((alloc) => {
                      const isActive = alloc.status === 'ACTIVE';
                      return (
                        <tr key={alloc.id}>
                          <td>
                            <span className="allocation-id-badge">#{alloc.id}</span>
                          </td>
                          <td>
                            <div style={{ fontWeight: 700, color: 'var(--primary-900)' }}>
                              {alloc.studentName}
                            </div>
                            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', marginTop: '0.2rem' }}>
                              <span className="student-enrollment-badge">{alloc.enrollmentNumber}</span>
                              <span style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>
                                {alloc.studentCourse} &bull; Sem {alloc.studentSemester}
                              </span>
                            </div>
                          </td>
                          <td>
                            <div style={{ fontWeight: 600, color: 'var(--slate-800)' }}>
                              {alloc.hostelName}
                            </div>
                            <div style={{ fontSize: '0.8125rem', color: 'var(--slate-600)' }}>
                              Room <strong>{alloc.roomNumber}</strong> (Floor {alloc.floor})
                            </div>
                          </td>
                          <td>
                            <div style={{ fontSize: '0.8125rem' }}>
                              Allocated: <strong>{alloc.allocationDate}</strong>
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>
                              {alloc.vacatingDate ? `Vacated: ${alloc.vacatingDate}` : 'Currently Resident'}
                            </div>
                          </td>
                          <td>
                            <span className={`badge ${isActive ? 'status-badge-active' : 'status-badge-completed'}`}>
                              {isActive ? 'ACTIVE RESIDENT' : 'COMPLETED'}
                            </span>
                          </td>
                          <td>
                            <div className="table-btn-group">
                              <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => handleViewAllocationDetail(alloc.id)}
                              >
                                Details
                              </button>
                              {isActive && (
                                <button
                                  className="btn btn-secondary btn-sm"
                                  onClick={() => openCheckoutModal(alloc)}
                                  disabled={actionLoading}
                                  title="Check out student and free room capacity"
                                  style={{ color: 'var(--accent-gold)' }}
                                >
                                  Check Out
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB: HOSTEL ADMISSIONS & MERIT SELECTION */}
        {activeTab === 'admissions' && (
          <div className="admin-content-section" role="tabpanel">
            <AdminAdmissionsManager
              apiPrefix="/api/admin/admissions"
              role="ADMIN"
              hostels={hostels}
            />
          </div>
        )}

        {/* TAB 6: WARDEN OVERSIGHT & HOSTEL ASSIGNMENTS */}
        {activeTab === 'wardens' && (
          <div className="admin-content-section" role="tabpanel">
            <div className="section-header">
              <div>
                <h2 className="section-title">Warden Directory &amp; Hostel Assignments</h2>
                <p className="section-description">
                  Manage institutional wardens and assign specific hostel buildings to their administrative oversight.
                </p>
              </div>
            </div>

            {loadingWardens ? (
              <div style={{ textAlign: 'center', padding: '3rem' }}>
                <span className="spinner"></span>
                <p style={{ marginTop: '1rem', color: 'var(--slate-500)' }}>Loading wardens...</p>
              </div>
            ) : wardens.length === 0 ? (
              <div className="empty-state-card">
                <div className="empty-state-icon">&#128110;</div>
                <h3 className="empty-state-title">No Wardens Registered Yet</h3>
                <p className="empty-state-text">
                  There are currently no users with the WARDEN role in the system.
                </p>
              </div>
            ) : (
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Warden Name</th>
                      <th>Institutional Email</th>
                      <th>Account Status</th>
                      <th>Assigned Hostel Oversight</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {wardens.map((warden) => (
                      <tr key={warden.id}>
                        <td>
                          <div style={{ fontWeight: 700, color: 'var(--primary-900)' }}>
                            {warden.fullName}
                          </div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>
                            User ID #{warden.id}
                          </span>
                        </td>
                        <td>
                          <code>{warden.email}</code>
                        </td>
                        <td>
                          <span className={`badge ${warden.active ? 'status-badge-active' : 'status-badge-inactive'}`}>
                            {warden.active ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                        </td>
                        <td>
                          {warden.assignedHostels.length === 0 ? (
                            <span style={{ color: 'var(--slate-400)', fontStyle: 'italic', fontSize: '0.8125rem' }}>
                              No hostels assigned yet
                            </span>
                          ) : (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                              {warden.assignedHostels.map((h) => (
                                <span
                                  key={h.id}
                                  className="badge badge-primary"
                                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.35rem 0.6rem' }}
                                >
                                  {h.name}
                                  <button
                                    onClick={() => handleRevokeWardenAssignment(warden.id, h.id, h.name, warden.fullName)}
                                    title={`Revoke ${h.name}`}
                                    style={{
                                      background: 'none',
                                      border: 'none',
                                      color: '#ffffff',
                                      cursor: 'pointer',
                                      fontWeight: 'bold',
                                      marginLeft: '0.25rem',
                                      fontSize: '0.9rem'
                                    }}
                                  >
                                    &times;
                                  </button>
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td>
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => openAssignWardenModal(warden)}
                            disabled={!warden.active}
                          >
                            + Assign Hostel
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 7: INSTITUTIONAL ATTENDANCE OVERSIGHT */}
        {activeTab === 'attendance' && (
          <div className="admin-content-section" role="tabpanel">
            <div className="section-header">
              <div>
                <h2 className="section-title">Institutional Attendance Oversight</h2>
                <p className="section-description">
                  Real-time roll call audits, hostel occupancy verification, and comprehensive attendance history across all campus blocks.
                </p>
              </div>
            </div>

            {/* Filter & Controls Bar */}
            <div className="warden-filter-bar" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-end', background: '#ffffff', padding: '1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--slate-200)', marginBottom: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div className="warden-filter-group" style={{ minWidth: '180px', flex: 1 }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--slate-600)', textTransform: 'uppercase', marginBottom: '0.25rem', display: 'block' }}>
                  Roll Call Date:
                </label>
                <input
                  type="date"
                  className="form-input"
                  value={adminAttendanceDate}
                  onChange={(e) => setAdminAttendanceDate(e.target.value)}
                  max={getTodayDateString()}
                  style={{ width: '100%' }}
                />
              </div>

              <div className="warden-filter-group" style={{ minWidth: '220px', flex: 1 }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--slate-600)', textTransform: 'uppercase', marginBottom: '0.25rem', display: 'block' }}>
                  Filter by Hostel:
                </label>
                <select
                  className="form-input"
                  value={adminAttendanceHostelId}
                  onChange={(e) => setAdminAttendanceHostelId(e.target.value)}
                  style={{ width: '100%' }}
                >
                  <option value="">-- All Campus Hostels --</option>
                  {hostels.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name} ({h.hostelType})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleAdminAttendanceSummaryRefresh}
                  disabled={loadingAttendanceSummary}
                >
                  {loadingAttendanceSummary ? 'Refreshing...' : 'Update Summary'}
                </button>
              </div>
            </div>

            {/* KPI Cards */}
            {attendanceSummary && (
              <div className="kpi-grid" style={{ marginBottom: '2rem' }}>
                <div className="kpi-card kpi-blue">
                  <span className="kpi-label">Active Resident Strength</span>
                  <div className="kpi-value">{attendanceSummary.totalAllocatedStudents}</div>
                  <span className="kpi-subtext">Registered hostel residents</span>
                </div>

                <div className="kpi-card kpi-green">
                  <span className="kpi-label">Present Tonight</span>
                  <div className="kpi-value" style={{ color: '#16a34a' }}>{attendanceSummary.totalPresent}</div>
                  <span className="kpi-subtext">Physically verified in hostel</span>
                </div>

                <div className="kpi-card" style={{ borderTop: '4px solid #dc2626' }}>
                  <span className="kpi-label">Absent / Missing</span>
                  <div className="kpi-value" style={{ color: '#dc2626' }}>{attendanceSummary.totalAbsent}</div>
                  <span className="kpi-subtext">Unaccounted during roll call</span>
                </div>

                <div className="kpi-card kpi-amber">
                  <span className="kpi-label">Authorized Leave</span>
                  <div className="kpi-value" style={{ color: '#d97706' }}>{attendanceSummary.totalOnLeave}</div>
                  <span className="kpi-subtext">Sanctioned home / medical pass</span>
                </div>

                <div className="kpi-card kpi-purple">
                  <span className="kpi-label">Institution Attendance %</span>
                  <div className="kpi-value">{attendanceSummary.overallAttendancePercentage.toFixed(1)}%</div>
                  <span className="kpi-subtext">
                    {attendanceSummary.totalMarked} / {attendanceSummary.totalAllocatedStudents} residents marked ({attendanceSummary.totalUnmarked} pending)
                  </span>
                </div>
              </div>
            )}

            {/* Breakdown by Hostel Table */}
            <div className="card" style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--slate-100)', paddingBottom: '0.75rem' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--primary-900)', margin: 0 }}>
                  Hostel Building Roll Call Breakdown &bull; {adminAttendanceDate}
                </h3>
                <span className="badge badge-primary">
                  {attendanceSummary?.hostelSummaries?.length || 0} Hostels Audited
                </span>
              </div>

              {loadingAttendanceSummary ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <span className="spinner"></span>
                  <p style={{ marginTop: '0.5rem', color: 'var(--slate-500)' }}>Aggregating hostel attendance metrics...</p>
                </div>
              ) : !attendanceSummary?.hostelSummaries || attendanceSummary.hostelSummaries.length === 0 ? (
                <p style={{ color: 'var(--slate-500)', fontStyle: 'italic', padding: '1rem' }}>
                  No active hostels or allocation data available for this date.
                </p>
              ) : (
                <div className="admin-table-container">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Hostel Building</th>
                        <th>Type</th>
                        <th>Allocated Residents</th>
                        <th>Total Marked</th>
                        <th>Present</th>
                        <th>Absent</th>
                        <th>On Leave</th>
                        <th>Unmarked</th>
                        <th>Attendance Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendanceSummary.hostelSummaries.map((hs) => (
                        <tr key={hs.hostelId}>
                          <td style={{ fontWeight: 700, color: 'var(--primary-900)' }}>{hs.hostelName}</td>
                          <td>
                            <span className={`badge ${hs.hostelType === 'BOYS' ? 'type-badge-boys' : 'type-badge-girls'}`}>
                              {hs.hostelType}
                            </span>
                          </td>
                          <td><strong>{hs.totalAllocatedStudents}</strong></td>
                          <td>{hs.totalMarked}</td>
                          <td><strong style={{ color: '#16a34a' }}>{hs.presentCount}</strong></td>
                          <td><strong style={{ color: '#dc2626' }}>{hs.absentCount}</strong></td>
                          <td><strong style={{ color: '#d97706' }}>{hs.onLeaveCount}</strong></td>
                          <td>
                            {hs.unmarkedCount > 0 ? (
                              <span style={{ color: '#e11d48', fontWeight: 600 }}>{hs.unmarkedCount} pending</span>
                            ) : (
                              <span style={{ color: '#16a34a', fontSize: '0.8125rem' }}>&#10003; 100% Roll Call</span>
                            )}
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <div style={{ width: '80px', height: '8px', background: 'var(--slate-200)', borderRadius: '4px', overflow: 'hidden' }}>
                                <div
                                  style={{
                                    width: `${Math.min(100, hs.attendancePercentage)}%`,
                                    height: '100%',
                                    background: hs.attendancePercentage >= 75 ? '#16a34a' : hs.attendancePercentage >= 50 ? '#d97706' : '#dc2626'
                                  }}
                                />
                              </div>
                              <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>
                                {hs.attendancePercentage.toFixed(1)}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Attendance History & Audit Log */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--slate-100)', paddingBottom: '0.75rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--primary-900)', margin: 0 }}>
                    Detailed Attendance Audit Log &amp; Historical Search
                  </h3>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--slate-500)', margin: '0.25rem 0 0 0' }}>
                    Inspect individual attendance markings, recording wardens, and official remarks across all dates.
                  </p>
                </div>
                <span className="badge badge-primary">{adminAttendanceHistory.length} Records Found</span>
              </div>

              {/* History Search / Filter Controls */}
              <form onSubmit={handleAdminAttendanceHistorySearch} style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'flex-end', marginBottom: '1.5rem', background: 'var(--slate-50)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--slate-200)' }}>
                <div style={{ flex: '1 1 140px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--slate-600)', display: 'block', marginBottom: '0.25rem' }}>From Date:</label>
                  <input
                    type="date"
                    className="form-input"
                    value={adminHistoryFrom}
                    onChange={(e) => setAdminHistoryFrom(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>

                <div style={{ flex: '1 1 140px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--slate-600)', display: 'block', marginBottom: '0.25rem' }}>To Date:</label>
                  <input
                    type="date"
                    className="form-input"
                    value={adminHistoryTo}
                    onChange={(e) => setAdminHistoryTo(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>

                <div style={{ flex: '1 1 140px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--slate-600)', display: 'block', marginBottom: '0.25rem' }}>Status:</label>
                  <select
                    className="form-input"
                    value={adminHistoryStatus}
                    onChange={(e) => setAdminHistoryStatus(e.target.value)}
                    style={{ width: '100%' }}
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="PRESENT">Present</option>
                    <option value="ABSENT">Absent</option>
                    <option value="ON_LEAVE">On Leave</option>
                  </select>
                </div>

                <div style={{ flex: '2 1 200px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--slate-600)', display: 'block', marginBottom: '0.25rem' }}>Search Student / Roll:</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Search name or enrollment..."
                    value={adminHistorySearch}
                    onChange={(e) => setAdminHistorySearch(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button type="submit" className="btn btn-primary btn-sm" disabled={loadingAdminAttendanceHistory}>
                    {loadingAdminAttendanceHistory ? 'Searching...' : 'Search'}
                  </button>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={handleAdminAttendanceHistoryClear} disabled={loadingAdminAttendanceHistory}>
                    Clear
                  </button>
                </div>
              </form>

              {loadingAdminAttendanceHistory ? (
                <div style={{ textAlign: 'center', padding: '2.5rem' }}>
                  <span className="spinner"></span>
                  <p style={{ marginTop: '0.75rem', color: 'var(--slate-500)' }}>Loading audit history records...</p>
                </div>
              ) : adminAttendanceHistory.length === 0 ? (
                <div className="empty-state-card" style={{ padding: '2rem' }}>
                  <div className="empty-state-icon">&#128197;</div>
                  <h3 className="empty-state-title">No Attendance Records Found</h3>
                  <p className="empty-state-text">
                    No attendance records match the selected date range and filter criteria.
                  </p>
                </div>
              ) : (
                <div className="admin-table-container">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Student Name &amp; Enrollment</th>
                        <th>Hostel &amp; Room</th>
                        <th>Status</th>
                        <th>Remarks</th>
                        <th>Recorded By</th>
                        <th>Timestamp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adminAttendanceHistory.map((rec) => (
                        <tr key={rec.id}>
                          <td><strong>{rec.attendanceDate}</strong></td>
                          <td>
                            <div style={{ fontWeight: 600, color: 'var(--primary-900)' }}>{rec.studentName}</div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>{rec.enrollmentNumber}</span>
                          </td>
                          <td>
                            <div>{rec.hostelName}</div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>Room {rec.roomNumber}</span>
                          </td>
                          <td>
                            <span className={`attendance-badge ${rec.status.toLowerCase()}`}>
                              {rec.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td>
                            {rec.remarks ? (
                              <span style={{ fontSize: '0.8125rem', color: 'var(--slate-700)' }}>{rec.remarks}</span>
                            ) : (
                              <span style={{ color: 'var(--slate-400)', fontStyle: 'italic', fontSize: '0.75rem' }}>—</span>
                            )}
                          </td>
                          <td>
                            <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--slate-700)' }}>
                              {rec.recordedByWardenName || `Warden #${rec.recordedByWardenId}`}
                            </div>
                          </td>
                          <td>
                            <span style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>
                              {rec.updatedAt ? new Date(rec.updatedAt).toLocaleString() : '—'}
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

        {/* TAB 9: INSTITUTIONAL GRIEVANCE REDRESSAL & MAINTENANCE */}
        {activeTab === 'complaints' && (
          <GrievanceMaintenanceManager
            apiPrefix="/api/admin/complaints"
            role="ADMIN"
            hostels={hostels}
          />
        )}

        {/* TAB 10: GATE PASS OVERSIGHT */}
        {activeTab === 'gatepass' && (
          <DigitalGatePassManager role="ADMIN" />
        )}

        {/* TAB 11: MESS TIMETABLE & QUALITY INDEX */}
        {activeTab === 'mess' && (
          <MessManagementSection role="ADMIN" />
        )}

        {/* TAB 12: FEE LEDGER, RECEIPTS & NO-DUES */}
        {activeTab === 'fees' && (
          <FeeManagerSection role="ADMIN" />
        )}

        {/* TAB 13: DIGITAL NOTICE BOARD */}
        {activeTab === 'notices' && (
          <NoticeBoardManager role="ADMIN" />
        )}

        {/* TAB 14: CAMPUS ANALYTICS & CSV EXPORT */}
        {activeTab === 'analytics' && (
          <CampusAnalyticsSection />
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

        {/* MODAL 5: ASSIGN STUDENT TO ROOM */}
        {assignModalOpen && (
          <div className="modal-backdrop" role="dialog" aria-modal="true">
            <div className="modal-card" style={{ maxWidth: '640px' }}>
              <div className="modal-header">
                <div>
                  <h3 className="modal-title">Assign Student to Room</h3>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--slate-500)', margin: 0 }}>
                    Select an eligible polytechnic student and an available room with remaining bed capacity
                  </p>
                </div>
                <button
                  className="modal-close-btn"
                  onClick={() => setAssignModalOpen(false)}
                  disabled={actionLoading}
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleAssignFormSubmit}>
                <div className="modal-body">
                  {/* Step 1: Select Student */}
                  <div className="form-group">
                    <label htmlFor="assign-student-select" className="form-label">
                      1. Select Eligible Student *
                    </label>
                    {loadingAvailableStudents ? (
                      <p style={{ fontSize: '0.875rem', color: 'var(--slate-500)' }}>
                        <span className="spinner"></span> Loading available students...
                      </p>
                    ) : availableStudents.length === 0 ? (
                      <div className="checkout-confirm-card">
                        <span>&#9888; No eligible students without active room allocations currently exist.</span>
                        <span style={{ fontSize: '0.75rem' }}>
                          Enroll a new student in the <strong>Student Directory</strong> or check out an active resident first.
                        </span>
                      </div>
                    ) : (
                      <>
                        <select
                          id="assign-student-select"
                          className="form-input"
                          value={assignFormData.studentId}
                          onChange={(e) => setAssignFormData({ ...assignFormData, studentId: e.target.value })}
                          required
                          disabled={actionLoading}
                        >
                          <option value="">-- Choose an eligible active student ({availableStudents.length} available) --</option>
                          {availableStudents.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.fullName} ({s.enrollmentNumber}) &bull; {s.course} (Sem {s.semester})
                            </option>
                          ))}
                        </select>
                        <span style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>
                          Only active students who currently have no active room allocations are eligible.
                        </span>
                      </>
                    )}
                  </div>

                  {/* Step 2: Select Hostel Building */}
                  <div className="form-group">
                    <label htmlFor="assign-hostel-select" className="form-label">
                      2. Select Campus Hostel Building *
                    </label>
                    <select
                      id="assign-hostel-select"
                      className="form-input"
                      value={selectedHostelForAssign}
                      onChange={(e) => handleHostelChangeForAssign(e.target.value)}
                      required
                      disabled={actionLoading || hostels.filter((h) => h.active).length === 0}
                    >
                      {hostels.filter((h) => h.active).map((h) => (
                        <option key={h.id} value={h.id}>
                          {h.name} ({h.hostelType} Hostel &bull; {h.availableBeds} beds available)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Step 3: Select Room with capacity awareness */}
                  <div className="form-group">
                    <label htmlFor="assign-room-select" className="form-label">
                      3. Select Room Unit *
                    </label>
                    {loadingRoomsForAssign ? (
                      <p style={{ fontSize: '0.875rem', color: 'var(--slate-500)' }}>
                        <span className="spinner"></span> Loading rooms for this hostel building...
                      </p>
                    ) : roomsForAssign.length === 0 ? (
                      <p style={{ fontSize: '0.875rem', color: 'var(--accent-red)' }}>
                        No rooms configured in this hostel building yet. Please add rooms in Room Inventory.
                      </p>
                    ) : (
                      <>
                        <select
                          id="assign-room-select"
                          className="form-input"
                          value={assignFormData.roomId}
                          onChange={(e) => setAssignFormData({ ...assignFormData, roomId: e.target.value })}
                          required
                          disabled={actionLoading}
                        >
                          <option value="">-- Select an accommodation room unit --</option>
                          {roomsForAssign.map((r) => {
                            const isFull = r.availableBeds === 0;
                            return (
                              <option key={r.id} value={r.id} disabled={isFull}>
                                Room {r.roomNumber} (Floor {r.floor}) &bull; {r.activeAllocations}/{r.capacity} beds occupied {isFull ? '— [FULL]' : `— [${r.availableBeds} Vacant]`}
                              </option>
                            );
                          })}
                        </select>

                        {/* Room list visual preview */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.5rem', marginTop: '0.75rem', maxHeight: '180px', overflowY: 'auto' }}>
                          {roomsForAssign.map((r) => {
                            const isSelected = String(assignFormData.roomId) === String(r.id);
                            const isFull = r.availableBeds === 0;
                            return (
                              <div
                                key={r.id}
                                className={`room-select-card ${isSelected ? 'selected' : ''} ${isFull ? 'disabled' : ''}`}
                                onClick={() => {
                                  if (!isFull && !actionLoading) {
                                    setAssignFormData({ ...assignFormData, roomId: String(r.id) });
                                  }
                                }}
                              >
                                <div>
                                  <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--primary-900)' }}>
                                    Room {r.roomNumber}
                                  </div>
                                  <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>Floor {r.floor}</div>
                                </div>
                                <span className={`room-occupancy-pill ${isFull ? 'full' : 'available'}`}>
                                  {isFull ? 'FULL' : `${r.availableBeds} Vacant`}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Step 4: Allocation Date */}
                  <div className="form-group">
                    <label htmlFor="assign-date-input" className="form-label">
                      4. Allocation Effective Date *
                    </label>
                    <input
                      id="assign-date-input"
                      type="date"
                      className="form-input"
                      value={assignFormData.allocationDate}
                      onChange={(e) => setAssignFormData({ ...assignFormData, allocationDate: e.target.value })}
                      required
                      disabled={actionLoading}
                    />
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setAssignModalOpen(false)}
                    disabled={actionLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={actionLoading || availableStudents.length === 0 || !assignFormData.roomId}
                  >
                    {actionLoading ? 'Assigning...' : 'Confirm Room Assignment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 6: CHECKOUT CONFIRMATION */}
        {checkoutModalOpen && checkingOutAllocation && (
          <div className="modal-backdrop" role="dialog" aria-modal="true">
            <div className="modal-card" style={{ maxWidth: '520px' }}>
              <div className="modal-header">
                <div>
                  <h3 className="modal-title">Resident Room Checkout</h3>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--slate-500)', margin: 0 }}>
                    Vacate resident and restore available room bed capacity
                  </p>
                </div>
                <button
                  className="modal-close-btn"
                  onClick={() => setCheckoutModalOpen(false)}
                  disabled={actionLoading}
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleCheckoutSubmit}>
                <div className="modal-body">
                  <div className="checkout-confirm-card">
                    <div style={{ fontWeight: 700, fontSize: '0.9375rem' }}>
                      &#9888; Confirm Student Checkout
                    </div>
                    <div>
                      Student: <strong>{checkingOutAllocation.studentName}</strong> ({checkingOutAllocation.enrollmentNumber})
                    </div>
                    <div>
                      Accommodated: <strong>{checkingOutAllocation.hostelName}</strong> &bull; Room <strong>{checkingOutAllocation.roomNumber}</strong>
                    </div>
                    <div style={{ fontSize: '0.8125rem', marginTop: '0.25rem', color: '#b45309' }}>
                      Allocated Date: {checkingOutAllocation.allocationDate}
                    </div>
                    <div style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
                      Completing this checkout will mark the allocation as <strong>COMPLETED</strong> and immediately restore 1 bed to Room {checkingOutAllocation.roomNumber}&apos;s capacity.
                    </div>
                  </div>

                  <div className="form-group" style={{ marginTop: '0.5rem' }}>
                    <label htmlFor="checkout-date-input" className="form-label">
                      Vacating Date *
                    </label>
                    <input
                      id="checkout-date-input"
                      type="date"
                      className="form-input"
                      min={checkingOutAllocation.allocationDate}
                      value={checkoutFormData.vacatingDate}
                      onChange={(e) => setCheckoutFormData({ ...checkoutFormData, vacatingDate: e.target.value })}
                      required
                      disabled={actionLoading}
                    />
                    <span style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>
                      Cannot be earlier than allocation date ({checkingOutAllocation.allocationDate}).
                    </span>
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setCheckoutModalOpen(false)}
                    disabled={actionLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ backgroundColor: 'var(--accent-gold)', borderColor: 'var(--accent-gold)' }}
                    disabled={actionLoading}
                  >
                    {actionLoading ? 'Processing Checkout...' : 'Confirm Checkout & Free Bed'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 7: ALLOCATION RECORD DETAILS */}
        {allocationDetailModalOpen && (
          <div className="modal-backdrop" role="dialog" aria-modal="true">
            <div className="modal-card" style={{ maxWidth: '640px' }}>
              <div className="modal-header">
                <div>
                  <h3 className="modal-title">Allocation Record #{selectedAllocationDetail?.id}</h3>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--slate-500)', margin: 0 }}>
                    Government Polytechnic Sakoli &bull; Official Room Assignment Record
                  </p>
                </div>
                <button
                  className="modal-close-btn"
                  onClick={() => setAllocationDetailModalOpen(false)}
                >
                  &times;
                </button>
              </div>

              <div className="modal-body">
                {loadingAllocationDetail ? (
                  <div style={{ textAlign: 'center', padding: '2rem' }}>
                    <span className="spinner"></span>
                    <p style={{ marginTop: '0.75rem', color: 'var(--slate-500)' }}>Loading allocation record...</p>
                  </div>
                ) : selectedAllocationDetail ? (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem', borderBottom: '1px solid var(--slate-200)' }}>
                      <div>
                        <h4 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-900)', margin: 0 }}>
                          {selectedAllocationDetail.studentName}
                        </h4>
                        <span className="student-enrollment-badge" style={{ marginTop: '0.25rem', display: 'inline-block' }}>
                          Enrollment: {selectedAllocationDetail.enrollmentNumber}
                        </span>
                      </div>
                      <span className={`badge ${selectedAllocationDetail.status === 'ACTIVE' ? 'status-badge-active' : 'status-badge-completed'}`}>
                        {selectedAllocationDetail.status === 'ACTIVE' ? 'ACTIVE RESIDENT' : 'COMPLETED CHECKOUT'}
                      </span>
                    </div>

                    <div className="detail-modal-grid">
                      <div className="detail-modal-item">
                        <span className="detail-item-label">Hostel Building</span>
                        <span className="detail-item-value">{selectedAllocationDetail.hostelName}</span>
                      </div>

                      <div className="detail-modal-item">
                        <span className="detail-item-label">Hostel Type</span>
                        <span className="detail-item-value">{selectedAllocationDetail.hostelType} Hostel</span>
                      </div>

                      <div className="detail-modal-item">
                        <span className="detail-item-label">Room Number</span>
                        <span className="detail-item-value">Room {selectedAllocationDetail.roomNumber} (Floor {selectedAllocationDetail.floor})</span>
                      </div>

                      <div className="detail-modal-item">
                        <span className="detail-item-label">Room Capacity</span>
                        <span className="detail-item-value">{selectedAllocationDetail.roomCapacity} Total Beds</span>
                      </div>

                      <div className="detail-modal-item">
                        <span className="detail-item-label">Academic Program</span>
                        <span className="detail-item-value">{selectedAllocationDetail.studentCourse} (Sem {selectedAllocationDetail.studentSemester})</span>
                      </div>

                      <div className="detail-modal-item">
                        <span className="detail-item-label">Student Contact</span>
                        <span className="detail-item-value">{selectedAllocationDetail.studentPhone || selectedAllocationDetail.studentEmail}</span>
                      </div>

                      <div className="detail-modal-item">
                        <span className="detail-item-label">Allocation Effective Date</span>
                        <span className="detail-item-value">{selectedAllocationDetail.allocationDate}</span>
                      </div>

                      <div className="detail-modal-item">
                        <span className="detail-item-label">Vacating / Checkout Date</span>
                        <span className="detail-item-value">
                          {selectedAllocationDetail.vacatingDate || 'Currently Resident'}
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <p>No allocation details loaded.</p>
                )}
              </div>

              <div className="modal-footer">
                {selectedAllocationDetail?.status === 'ACTIVE' && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setAllocationDetailModalOpen(false);
                      openCheckoutModal(selectedAllocationDetail);
                    }}
                    style={{ color: 'var(--accent-gold)' }}
                  >
                    Check Out Resident
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setAllocationDetailModalOpen(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 8: ASSIGN HOSTEL TO WARDEN */}
        {assignWardenModalOpen && selectedWardenForAssign && (
          <div className="modal-backdrop" role="dialog" aria-modal="true">
            <div className="modal-card" style={{ maxWidth: '480px' }}>
              <div className="modal-header">
                <h3 className="modal-title">
                  Assign Hostel Oversight to {selectedWardenForAssign.fullName}
                </h3>
                <button
                  className="modal-close-btn"
                  onClick={() => setAssignWardenModalOpen(false)}
                  disabled={actionLoading}
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleAssignWardenSubmit}>
                <div className="modal-body">
                  <p style={{ fontSize: '0.875rem', color: 'var(--slate-600)', marginBottom: '1rem' }}>
                    Select the hostel building that Warden <strong>{selectedWardenForAssign.fullName}</strong> ({selectedWardenForAssign.email}) will have operational jurisdiction over.
                  </p>

                  <div className="form-group">
                    <label htmlFor="assign-hostel-select" className="form-label">
                      Select Hostel Building *
                    </label>
                    <select
                      id="assign-hostel-select"
                      className="form-input"
                      value={targetHostelIdForAssign}
                      onChange={(e) => setTargetHostelIdForAssign(e.target.value)}
                      required
                      disabled={actionLoading}
                    >
                      {hostels.map((h) => (
                        <option key={h.id} value={h.id}>
                          {h.name} ({h.hostelType} &bull; {h.active ? 'Active' : 'Inactive'})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setAssignWardenModalOpen(false)}
                    disabled={actionLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={actionLoading}
                  >
                    {actionLoading ? 'Assigning...' : 'Confirm Hostel Assignment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Room QR Poster */}
        {activeQrRoom && (
          <RoomQrCodeModal
            room={activeQrRoom}
            hostelName={hostels.find((h) => String(h.id) === selectedHostelId)?.name || 'Sahyadri Boys Hostel'}
            onClose={() => setActiveQrRoom(null)}
          />
        )}

        {/* Modal: Resident ID Card */}
        {activeIdCardStudent && (
          <ResidentIdCardModal
            student={activeIdCardStudent}
            onClose={() => setActiveIdCardStudent(null)}
          />
        )}
      </div>
    </div>
  );
}
