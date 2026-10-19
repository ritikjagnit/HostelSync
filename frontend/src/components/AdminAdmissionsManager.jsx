import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import './AdminAdmissionsManager.css';

const COURSES = [
  'Diploma in Computer Engineering',
  'Diploma in Electrical Engineering',
  'Diploma in Mechanical Engineering',
  'Diploma in Civil Engineering',
  'Diploma in Electronics & Telecommunication'
];

export default function AdminAdmissionsManager({
  apiPrefix = '/api/admin/admissions',
  _role = 'ADMIN',
  hostels = []
}) {
  const { authFetch } = useAuth();

  // Data states
  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState({
    totalApplications: 0,
    pendingCount: 0,
    selectedCount: 0,
    admittedCount: 0,
    rejectedCount: 0
  });

  // Filter states
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterGender, setFilterGender] = useState('ALL');
  const [filterCourse, setFilterCourse] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // UI & Loading states
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState('');
  const [feedbackError, setFeedbackError] = useState('');

  // Modals state
  const [reviewApp, setReviewApp] = useState(null);
  const [statusModalApp, setStatusModalApp] = useState(null);
  const [statusAction, setStatusAction] = useState('SELECTED'); // 'SELECTED' | 'REJECTED'
  const [statusRemarks, setStatusRemarks] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  // Admission & Room Allocation Modal state
  const [admitApp, setAdmitApp] = useState(null);
  const [targetHostelId, setTargetHostelId] = useState('');
  const [targetRoomId, setTargetRoomId] = useState('');
  const [availableRooms, setAvailableRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [defaultPassword, setDefaultPassword] = useState('StudentPass123!');

  // Clear feedback after delay
  const clearFeedback = () => {
    setFeedbackSuccess('');
    setFeedbackError('');
  };

  // Load Statistics
  const loadStats = useCallback(() => {
    authFetch(`${apiPrefix}/stats`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load admission stats');
        return res.json();
      })
      .then((data) => setStats(data))
      .catch((err) => console.warn('Could not load admission stats:', err.message));
  }, [authFetch, apiPrefix]);

  // Load Applications
  const loadApplications = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterStatus && filterStatus !== 'ALL') params.append('status', filterStatus);
    if (filterGender && filterGender !== 'ALL') params.append('gender', filterGender);
    if (filterCourse && filterCourse !== 'ALL') params.append('course', filterCourse);
    if (searchQuery && searchQuery.trim()) params.append('search', searchQuery.trim());

    authFetch(`${apiPrefix}?${params.toString()}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load hostel applications');
        return res.json();
      })
      .then((data) => {
        setApplications(data);
      })
      .catch((err) => {
        setFeedbackError(err.message || 'Error fetching applications');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [authFetch, apiPrefix, filterStatus, filterGender, filterCourse, searchQuery]);

  // Synchronize on mount and filter changes
  useEffect(() => {
    let isMounted = true;
    loadStats();

    const params = new URLSearchParams();
    if (filterStatus && filterStatus !== 'ALL') params.append('status', filterStatus);
    if (filterGender && filterGender !== 'ALL') params.append('gender', filterGender);
    if (filterCourse && filterCourse !== 'ALL') params.append('course', filterCourse);
    if (searchQuery && searchQuery.trim()) params.append('search', searchQuery.trim());

    authFetch(`${apiPrefix}?${params.toString()}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load hostel applications');
        return res.json();
      })
      .then((data) => {
        if (isMounted) setApplications(data);
      })
      .catch((err) => {
        if (isMounted) setFeedbackError(err.message || 'Error fetching applications');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [authFetch, apiPrefix, filterStatus, filterGender, filterCourse, searchQuery, loadStats]);

  // Fetch Available Rooms for Admission Modal
  const loadAvailableRooms = useCallback((hostelId) => {
    if (!hostelId) {
      setAvailableRooms([]);
      return;
    }
    setLoadingRooms(true);
    authFetch(`/api/admin/allocations/available-rooms?hostelId=${hostelId}&includeFull=false`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load vacant rooms');
        return res.json();
      })
      .then((rooms) => {
        setAvailableRooms(rooms);
        if (rooms.length > 0) {
          setTargetRoomId(String(rooms[0].id));
        } else {
          setTargetRoomId('');
        }
      })
      .catch((err) => {
        setAvailableRooms([]);
        setTargetRoomId('');
        console.warn('Error loading available rooms:', err.message);
      })
      .finally(() => {
        setLoadingRooms(false);
      });
  }, [authFetch]);

  // Open Admit Modal
  const handleOpenAdmitModal = (app) => {
    clearFeedback();
    setAdmitApp(app);

    // Auto-select hostel based on student gender
    const expectedType = app.gender === 'MALE' ? 'BOYS' : 'GIRLS';
    const matchingHostel = hostels.find((h) => h.hostelType === expectedType && h.active) || hostels[0];

    const hId = matchingHostel ? String(matchingHostel.id) : '';
    setTargetHostelId(hId);
    setDefaultPassword('StudentPass123!');

    if (hId) {
      loadAvailableRooms(hId);
    }
  };

  // Submit Admission (Allocate Room)
  const handleSubmitAdmission = async (e) => {
    e.preventDefault();
    if (!admitApp || !targetRoomId) {
      setFeedbackError('Please select a valid vacant room to finalize hostel admission.');
      return;
    }

    setActionLoading(true);
    clearFeedback();

    try {
      const res = await authFetch(`${apiPrefix}/${admitApp.id}/admit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: parseInt(targetRoomId, 10),
          defaultPassword: defaultPassword.trim() || 'StudentPass123!'
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to complete admission.');
      }

      setFeedbackSuccess(
        `Success! Student ${data.fullName} (${data.enrollmentNumber}) has been officially ADMITTED to ${data.allocatedHostelName}, Room ${data.allocatedRoomNumber}. Student portal account is active!`
      );
      setAdmitApp(null);
      loadStats();
      loadApplications();
    } catch (err) {
      setFeedbackError(err.message || 'Error admitting student.');
    } finally {
      setActionLoading(false);
    }
  };

  // Submit Status Change (Select / Reject)
  const handleSubmitStatus = async (e) => {
    e.preventDefault();
    if (!statusModalApp) return;

    setActionLoading(true);
    clearFeedback();

    try {
      const res = await authFetch(`${apiPrefix}/${statusModalApp.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: statusAction,
          rejectionReason: statusAction === 'REJECTED' ? rejectionReason.trim() : null,
          remarks: statusRemarks.trim() || undefined
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to update review status.');
      }

      const actionText = statusAction === 'SELECTED' ? 'SHORTLISTED / SELECTED' : 'REJECTED';
      setFeedbackSuccess(`Application ${data.applicationNumber} (${data.fullName}) updated to ${actionText}.`);
      setStatusModalApp(null);
      loadStats();
      loadApplications();
    } catch (err) {
      setFeedbackError(err.message || 'Error updating status.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="adm-manager-root">
      {/* Feedback Alerts */}
      {feedbackSuccess && (
        <div className="adm-mgr-alert success" role="alert">
          <span className="adm-mgr-icon">&#10003;</span>
          <div>{feedbackSuccess}</div>
          <button className="adm-mgr-close" onClick={() => setFeedbackSuccess('')}>&times;</button>
        </div>
      )}

      {feedbackError && (
        <div className="adm-mgr-alert error" role="alert">
          <span className="adm-mgr-icon">&#9888;</span>
          <div>{feedbackError}</div>
          <button className="adm-mgr-close" onClick={() => setFeedbackError('')}>&times;</button>
        </div>
      )}

      {/* Header Banner */}
      <div className="adm-mgr-header">
        <div>
          <div className="adm-mgr-badge">
            <span className="adm-mgr-flag"></span>
            <span>HOSTEL ADMISSION &amp; SCRUTINY DESK</span>
          </div>
          <h2 className="adm-mgr-title">Student Hostel Registrations &amp; Merit Selection</h2>
          <p className="adm-mgr-subtitle">
            Review incoming student registration applications, evaluate merit and district distance, select shortlisted candidates, and admit them to vacant hostel rooms.
          </p>
        </div>
        <button
          type="button"
          className="adm-btn adm-btn-secondary"
          onClick={() => {
            loadStats();
            loadApplications();
          }}
          disabled={loading}
        >
          &#8635; Refresh Records
        </button>
      </div>

      {/* Stat Cards Strip */}
      <div className="adm-mgr-stats-grid">
        <div className="adm-mgr-stat-card total" onClick={() => setFilterStatus('ALL')}>
          <div className="adm-mgr-stat-val">{stats.totalApplications}</div>
          <div className="adm-mgr-stat-lbl">Total Registrations</div>
          <div className="adm-mgr-stat-sub">Across all courses</div>
        </div>

        <div className="adm-mgr-stat-card pending" onClick={() => setFilterStatus('PENDING')}>
          <div className="adm-mgr-stat-val">{stats.pendingCount}</div>
          <div className="adm-mgr-stat-lbl">Pending Scrutiny</div>
          <div className="adm-mgr-stat-sub">Awaiting In-Charge Review</div>
        </div>

        <div className="adm-mgr-stat-card selected" onClick={() => setFilterStatus('SELECTED')}>
          <div className="adm-mgr-stat-val">{stats.selectedCount}</div>
          <div className="adm-mgr-stat-lbl">Shortlisted / Selected</div>
          <div className="adm-mgr-stat-sub">Ready for Room Allotment</div>
        </div>

        <div className="adm-mgr-stat-card admitted" onClick={() => setFilterStatus('ADMITTED')}>
          <div className="adm-mgr-stat-val">{stats.admittedCount}</div>
          <div className="adm-mgr-stat-lbl">Final Admitted</div>
          <div className="adm-mgr-stat-sub">Rooms &amp; Logins Activated</div>
        </div>

        <div className="adm-mgr-stat-card rejected" onClick={() => setFilterStatus('REJECTED')}>
          <div className="adm-mgr-stat-val">{stats.rejectedCount}</div>
          <div className="adm-mgr-stat-lbl">Not Selected</div>
          <div className="adm-mgr-stat-sub">Criteria / Distance</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="adm-mgr-filters-card">
        <div className="adm-mgr-filter-group">
          <label htmlFor="filter-search">Search Applicant</label>
          <input
            type="text"
            id="filter-search"
            placeholder="Name, App No, Enrollment..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="adm-mgr-filter-group">
          <label htmlFor="filter-status">Review Status</label>
          <select
            id="filter-status"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending Scrutiny</option>
            <option value="SELECTED">Shortlisted / Selected</option>
            <option value="ADMITTED">Officially Admitted</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>

        <div className="adm-mgr-filter-group">
          <label htmlFor="filter-gender">Gender &amp; Block</label>
          <select
            id="filter-gender"
            value={filterGender}
            onChange={(e) => setFilterGender(e.target.value)}
          >
            <option value="ALL">All Blocks</option>
            <option value="MALE">Boys Hostel (Sahyadri)</option>
            <option value="FEMALE">Girls Hostel (Jijau)</option>
          </select>
        </div>

        <div className="adm-mgr-filter-group">
          <label htmlFor="filter-course">Course / Department</label>
          <select
            id="filter-course"
            value={filterCourse}
            onChange={(e) => setFilterCourse(e.target.value)}
          >
            <option value="ALL">All Departments</option>
            {COURSES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="adm-mgr-filter-actions">
          <button
            type="button"
            className="adm-btn adm-btn-secondary"
            onClick={() => {
              setSearchQuery('');
              setFilterStatus('ALL');
              setFilterGender('ALL');
              setFilterCourse('ALL');
            }}
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Applications Data Table */}
      <div className="adm-mgr-table-card">
        <div className="adm-mgr-table-header">
          <h3>Registered Candidates ({applications.length})</h3>
          <span className="adm-mgr-sort-hint">Sorted by Merit Rank &amp; Distance</span>
        </div>

        {loading ? (
          <div className="adm-mgr-loading">
            <span className="adm-spinner" style={{ width: 28, height: 28, borderColor: '#cbd5e1', borderTopColor: '#0a2540' }}></span>
            <p>Loading hostel registration pool...</p>
          </div>
        ) : applications.length === 0 ? (
          <div className="adm-mgr-empty">
            <div className="adm-empty-icon">&#128221;</div>
            <h4>No registration records found</h4>
            <p>No student applications match the selected status or search criteria.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="adm-mgr-table">
              <thead>
                <tr>
                  <th>App # &amp; Date</th>
                  <th>Student Details</th>
                  <th>Course &amp; Sem</th>
                  <th>Block</th>
                  <th>Merit %</th>
                  <th>Home &amp; Distance</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => (
                  <tr key={app.id} className={`adm-row-${app.status.toLowerCase()}`}>
                    <td>
                      <strong className="adm-app-code">{app.applicationNumber}</strong>
                      <div className="adm-date-sub">
                        {app.appliedAt ? new Date(app.appliedAt).toLocaleDateString('en-IN') : 'N/A'}
                      </div>
                    </td>
                    <td>
                      <div className="adm-student-name">{app.fullName}</div>
                      <div className="adm-student-sub">
                        <span>{app.enrollmentNumber}</span> &bull; <span>{app.phone}</span>
                      </div>
                    </td>
                    <td>
                      <div className="adm-course-name">{app.course}</div>
                      <span className="badge badge-secondary">Sem {app.semester}</span>
                    </td>
                    <td>
                      <span className={`adm-block-pill ${app.gender === 'MALE' ? 'boys' : 'girls'}`}>
                        {app.gender === 'MALE' ? '👨 Sahyadri (Boys)' : '👩 Jijau (Girls)'}
                      </span>
                    </td>
                    <td>
                      <div className="adm-merit-val">{app.meritPercentage}%</div>
                      <span className="adm-cat-tag">{app.category}</span>
                    </td>
                    <td>
                      <div className="adm-dist-val">{app.distanceFromCollege} km</div>
                      <div className="adm-home-sub" title={app.homeAddress}>{app.homeAddress}</div>
                    </td>
                    <td>
                      <span className={`adm-status-badge ${app.status.toLowerCase()}`}>
                        {app.status === 'SELECTED' && '✓ SHORTLISTED'}
                        {app.status === 'ADMITTED' && '★ ADMITTED'}
                        {app.status === 'PENDING' && '⏳ PENDING'}
                        {app.status === 'REJECTED' && '✕ REJECTED'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="adm-action-btn-group">
                        {/* View Details */}
                        <button
                          type="button"
                          className="adm-action-btn view"
                          title="View Application Details"
                          onClick={() => setReviewApp(app)}
                        >
                          Review
                        </button>

                        {/* If PENDING: Select or Reject */}
                        {app.status === 'PENDING' && (
                          <>
                            <button
                              type="button"
                              className="adm-action-btn select"
                              title="Shortlist for Admission"
                              onClick={() => {
                                setStatusModalApp(app);
                                setStatusAction('SELECTED');
                                setStatusRemarks('Selected on merit criteria');
                                setRejectionReason('');
                              }}
                            >
                              Select
                            </button>
                            <button
                              type="button"
                              className="adm-action-btn reject"
                              title="Reject Application"
                              onClick={() => {
                                setStatusModalApp(app);
                                setStatusAction('REJECTED');
                                setRejectionReason('Does not meet merit/distance criteria');
                                setStatusRemarks('');
                              }}
                            >
                              Reject
                            </button>
                          </>
                        )}

                        {/* If SELECTED or PENDING: Admit to Room */}
                        {(app.status === 'SELECTED' || app.status === 'PENDING') && (
                          <button
                            type="button"
                            className="adm-action-btn admit"
                            title="Admit Student & Allocate Room"
                            onClick={() => handleOpenAdmitModal(app)}
                          >
                            &#128716; Admit
                          </button>
                        )}

                        {/* If ADMITTED: Room Badge */}
                        {app.status === 'ADMITTED' && (
                          <span className="adm-admitted-label" title={`Room ${app.allocatedRoomNumber}`}>
                            Room {app.allocatedRoomNumber}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: VIEW FULL DETAILS */}
      {reviewApp && (
        <div className="adm-modal-backdrop" onClick={() => setReviewApp(null)}>
          <div className="adm-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="adm-modal-header">
              <div className="adm-header-badge">
                <span className="adm-flag-strip"></span>
                <span>CANDIDATE ADMISSION PROFILE &bull; {reviewApp.applicationNumber}</span>
              </div>
              <button className="adm-close-btn" onClick={() => setReviewApp(null)}>&times;</button>
              <h2 className="adm-title">{reviewApp.fullName}</h2>
              <p className="adm-subtitle">{reviewApp.course} &bull; Semester {reviewApp.semester}</p>
            </div>
            <div className="adm-modal-body">
              <div className="adm-receipt-grid">
                <div className="adm-receipt-item">
                  <span className="adm-label">Enrollment Number:</span>
                  <span className="adm-val">{reviewApp.enrollmentNumber}</span>
                </div>
                <div className="adm-receipt-item">
                  <span className="adm-label">Contact Email:</span>
                  <span className="adm-val">{reviewApp.email}</span>
                </div>
                <div className="adm-receipt-item">
                  <span className="adm-label">Student Phone:</span>
                  <span className="adm-val">{reviewApp.phone}</span>
                </div>
                <div className="adm-receipt-item">
                  <span className="adm-label">Gender &amp; Block:</span>
                  <span className="adm-val">
                    {reviewApp.gender === 'MALE' ? 'Male (Sahyadri Boys Hostel)' : 'Female (Jijau Girls Hostel)'}
                  </span>
                </div>
                <div className="adm-receipt-item">
                  <span className="adm-label">Merit Marks (%):</span>
                  <span className="adm-val">{reviewApp.meritPercentage}%</span>
                </div>
                <div className="adm-receipt-item">
                  <span className="adm-label">Category:</span>
                  <span className="adm-val">{reviewApp.category}</span>
                </div>
                <div className="adm-receipt-item">
                  <span className="adm-label">Parent / Guardian:</span>
                  <span className="adm-val">{reviewApp.parentName}</span>
                </div>
                <div className="adm-receipt-item">
                  <span className="adm-label">Parent Phone:</span>
                  <span className="adm-val">{reviewApp.parentPhone}</span>
                </div>
                <div className="adm-receipt-item full-width">
                  <span className="adm-label">Permanent Address:</span>
                  <span className="adm-val">{reviewApp.homeAddress}</span>
                </div>
                <div className="adm-receipt-item">
                  <span className="adm-label">Distance from Sakoli:</span>
                  <span className="adm-val">{reviewApp.distanceFromCollege} km</span>
                </div>
                <div className="adm-receipt-item">
                  <span className="adm-label">Application Status:</span>
                  <span className="adm-val"><strong>{reviewApp.status}</strong></span>
                </div>
              </div>

              {reviewApp.remarks && (
                <div className="adm-receipt-instructions" style={{ marginTop: '1rem' }}>
                  <h4>Applicant Remarks:</h4>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#475569' }}>{reviewApp.remarks}</p>
                </div>
              )}

              {reviewApp.status === 'ADMITTED' && (
                <div className="adm-admitted-box">
                  <h4>Official Admission Record</h4>
                  <p><strong>Hostel:</strong> {reviewApp.allocatedHostelName}</p>
                  <p><strong>Allocated Room:</strong> Room {reviewApp.allocatedRoomNumber}</p>
                  <p><strong>Admitted By:</strong> {reviewApp.reviewedBy}</p>
                </div>
              )}

              <div className="adm-form-footer">
                <button type="button" className="adm-btn adm-btn-secondary" onClick={() => setReviewApp(null)}>
                  Close
                </button>
                {reviewApp.status !== 'ADMITTED' && (
                  <button
                    type="button"
                    className="adm-btn adm-btn-primary"
                    onClick={() => {
                      const appToAdmit = reviewApp;
                      setReviewApp(null);
                      handleOpenAdmitModal(appToAdmit);
                    }}
                  >
                    &#128716; Proceed to Room Admission
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: STATUS UPDATE (SELECT / REJECT) */}
      {statusModalApp && (
        <div className="adm-modal-backdrop" onClick={() => setStatusModalApp(null)}>
          <div className="adm-modal-card" style={{ maxWidth: 560 }} onClick={(e) => e.stopPropagation()}>
            <div className="adm-modal-header">
              <button className="adm-close-btn" onClick={() => setStatusModalApp(null)}>&times;</button>
              <h2 className="adm-title">
                {statusAction === 'SELECTED' ? '✓ Shortlist Candidate for Admission' : '✕ Reject Application'}
              </h2>
              <p className="adm-subtitle">
                {statusModalApp.fullName} &bull; {statusModalApp.applicationNumber}
              </p>
            </div>
            <form onSubmit={handleSubmitStatus} className="adm-modal-body">
              <div className="adm-receipt-grid" style={{ marginBottom: '1rem' }}>
                <div className="adm-receipt-item">
                  <span className="adm-label">Qualifying Merit:</span>
                  <span className="adm-val">{statusModalApp.meritPercentage}%</span>
                </div>
                <div className="adm-receipt-item">
                  <span className="adm-label">Distance:</span>
                  <span className="adm-val">{statusModalApp.distanceFromCollege} km</span>
                </div>
              </div>

              {statusAction === 'REJECTED' && (
                <div className="adm-form-group" style={{ marginBottom: '1rem' }}>
                  <label htmlFor="modal-rejection">Rejection Reason *</label>
                  <input
                    type="text"
                    id="modal-rejection"
                    required
                    placeholder="e.g. Merit below cutoff, Local resident < 10km"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                  />
                </div>
              )}

              <div className="adm-form-group">
                <label htmlFor="modal-remarks">Hostel In-Charge Remarks (Optional)</label>
                <input
                  type="text"
                  id="modal-remarks"
                  placeholder="e.g. Merit verified with DTE marksheet"
                  value={statusRemarks}
                  onChange={(e) => setStatusRemarks(e.target.value)}
                />
              </div>

              <div className="adm-form-footer">
                <button
                  type="button"
                  className="adm-btn adm-btn-secondary"
                  onClick={() => setStatusModalApp(null)}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`adm-btn ${statusAction === 'SELECTED' ? 'adm-btn-primary' : 'adm-btn-outline'}`}
                  disabled={actionLoading}
                >
                  {actionLoading ? <span className="adm-spinner"></span> : `Confirm ${statusAction}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: FINAL ADMIT TO ROOM */}
      {admitApp && (
        <div className="adm-modal-backdrop" onClick={() => setAdmitApp(null)}>
          <div className="adm-modal-card" style={{ maxWidth: 640 }} onClick={(e) => e.stopPropagation()}>
            <div className="adm-modal-header">
              <div className="adm-header-badge">
                <span className="adm-flag-strip"></span>
                <span>OFFICIAL ROOM ALLOCATION &amp; ADMISSION</span>
              </div>
              <button className="adm-close-btn" onClick={() => setAdmitApp(null)}>&times;</button>
              <h2 className="adm-title">&#128716; Admit Student to Hostel</h2>
              <p className="adm-subtitle">
                {admitApp.fullName} ({admitApp.enrollmentNumber}) &bull; {admitApp.gender === 'MALE' ? 'Male (Boys Hostel)' : 'Female (Girls Hostel)'}
              </p>
            </div>

            <form onSubmit={handleSubmitAdmission} className="adm-modal-body">
              <div className="adm-form-row">
                <div className="adm-form-group">
                  <label htmlFor="admit-hostel">Select Hostel Block *</label>
                  <select
                    id="admit-hostel"
                    value={targetHostelId}
                    onChange={(e) => {
                      const hId = e.target.value;
                      setTargetHostelId(hId);
                      loadAvailableRooms(hId);
                    }}
                    required
                  >
                    {hostels
                      .filter((h) => h.active)
                      .map((h) => (
                        <option key={h.id} value={h.id}>
                          {h.name} ({h.hostelType === 'BOYS' ? 'Boys' : 'Girls'})
                        </option>
                      ))}
                  </select>
                </div>

                <div className="adm-form-group">
                  <label htmlFor="admit-room">Assign Vacant Room *</label>
                  {loadingRooms ? (
                    <div style={{ padding: '0.6rem', color: '#64748b', fontSize: '0.85rem' }}>
                      <span className="adm-spinner" style={{ width: 14, height: 14, borderColor: '#94a3b8', borderTopColor: '#0a2540' }}></span> Loading rooms...
                    </div>
                  ) : availableRooms.length === 0 ? (
                    <div style={{ padding: '0.6rem', color: '#ef4444', fontSize: '0.85rem', fontWeight: 600 }}>
                      No vacant rooms available in this block!
                    </div>
                  ) : (
                    <select
                      id="admit-room"
                      value={targetRoomId}
                      onChange={(e) => setTargetRoomId(e.target.value)}
                      required
                    >
                      {availableRooms.map((r) => (
                        <option key={r.id} value={r.id}>
                          Room {r.roomNumber} (Floor {r.floor} • Capacity: {r.currentOccupancy || 0}/{r.capacity} beds)
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <div className="adm-form-group">
                <label htmlFor="admit-password">Student Portal Login Default Password</label>
                <input
                  type="text"
                  id="admit-password"
                  value={defaultPassword}
                  onChange={(e) => setDefaultPassword(e.target.value)}
                  placeholder="StudentPass123!"
                />
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  Student can sign in to the Student Portal with email <strong>{admitApp.email}</strong> using this password.
                </span>
              </div>

              <div className="adm-receipt-instructions" style={{ marginTop: '1.25rem' }}>
                <h4>Admission Actions Automated by HostelSync:</h4>
                <ol>
                  <li>Creates or links the official <strong>Student &amp; User Account</strong> with <code>ROLE_STUDENT</code>.</li>
                  <li>Allocates a bed in the selected room with status <code>ACTIVE</code>.</li>
                  <li>Marks the application status as <strong>ADMITTED</strong>.</li>
                </ol>
              </div>

              <div className="adm-form-footer">
                <button
                  type="button"
                  className="adm-btn adm-btn-secondary"
                  onClick={() => setAdmitApp(null)}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="adm-btn adm-btn-primary"
                  disabled={actionLoading || availableRooms.length === 0}
                >
                  {actionLoading ? (
                    <>
                      <span className="adm-spinner"></span>
                      Admitting Student...
                    </>
                  ) : (
                    '&#10003; Confirm Admission & Allot Room'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
