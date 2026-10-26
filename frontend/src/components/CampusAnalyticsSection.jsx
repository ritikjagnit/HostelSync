import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import './CampusAnalyticsSection.css';

export default function CampusAnalyticsSection() {
  const { authFetch } = useAuth();

  const [metrics, setMetrics] = useState({
    totalStudents: 0,
    totalRooms: 0,
    allocatedBeds: 0,
    vacantBeds: 0,
    occupancyRate: 0,
    activeGatePasses: 0,
    overdueGatePasses: 0,
    openComplaints: 0,
    resolvedComplaints: 0,
    totalFeeCollected: 0,
    totalFeePending: 0,
    attendanceRateToday: 0
  });

  const [loading, setLoading] = useState(true);
  const [downloadingExport, setDownloadingExport] = useState(null);
  const [feedbackSuccess, setFeedbackSuccess] = useState('');
  const [feedbackError, setFeedbackError] = useState('');

  const loadMetrics = useCallback(async () => {
    setLoading(true);
    setFeedbackError('');
    try {
      const res = await authFetch('/api/admin/analytics/overview');
      if (!res.ok) throw new Error('Failed to load campus analytics');
      const data = await res.json();
      setMetrics(data);
    } catch (err) {
      setFeedbackError(err.message || 'Error fetching analytics metrics');
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  // Export CSV Handler
  const handleExportCsv = async (exportType, label) => {
    setDownloadingExport(exportType);
    setFeedbackError('');
    setFeedbackSuccess('');

    try {
      const res = await authFetch(`/api/admin/analytics/export/${exportType}`);
      if (!res.ok) throw new Error(`Failed to generate ${label} export`);

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const today = new Date().toISOString().split('T')[0];
      a.download = `HostelSync_${label.replace(/\s+/g, '_')}_${today}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setFeedbackSuccess(`${label} CSV downloaded successfully!`);
    } catch (err) {
      setFeedbackError(err.message);
    } finally {
      setDownloadingExport(null);
    }
  };

  const totalComplaints = (metrics.openComplaints || 0) + (metrics.resolvedComplaints || 0);
  const resolutionRate = totalComplaints > 0 ? Math.round((metrics.resolvedComplaints / totalComplaints) * 100) : 100;

  const totalFeeDemanded = (metrics.totalFeeCollected || 0) + (metrics.totalFeePending || 0);
  const feeRecoveryRate = totalFeeDemanded > 0 ? Math.round((metrics.totalFeeCollected / totalFeeDemanded) * 100) : 0;

  return (
    <div className="campus-analytics-container">
      {/* Header Banner */}
      <div className="analytics-header-card">
        <div className="analytics-header-left">
          <div className="analytics-header-badge">
            <span className="live-bullet"></span>
            <span>EXECUTIVE AUDIT &amp; INTELLIGENCE</span>
          </div>
          <h2 className="analytics-header-title">Campus Analytics &amp; Official Audit Exports</h2>
          <p className="analytics-header-desc">
            Government Polytechnic Sakoli &bull; Comprehensive institutional KPIs, occupancy rates, roll call compliance, grievance SLAs, and one-click regulatory data exports.
          </p>
        </div>

        <button className="btn-refresh-analytics" onClick={loadMetrics} disabled={loading}>
          <span>🔄</span> {loading ? 'Refreshing...' : 'Refresh KPIs'}
        </button>
      </div>

      {/* Notifications */}
      {feedbackSuccess && (
        <div className="analytics-alert analytics-alert-success">
          <span>✓</span>
          <span>{feedbackSuccess}</span>
          <button onClick={() => setFeedbackSuccess('')} className="alert-close">&times;</button>
        </div>
      )}
      {feedbackError && (
        <div className="analytics-alert analytics-alert-error">
          <span>⚠️</span>
          <span>{feedbackError}</span>
          <button onClick={() => setFeedbackError('')} className="alert-close">&times;</button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-title">Hostel Occupancy Rate</span>
            <span className="kpi-icon">🏢</span>
          </div>
          <div className="kpi-value">{metrics.occupancyRate || 0}%</div>
          <div className="kpi-progress-bar">
            <div className="kpi-fill fill-blue" style={{ width: `${metrics.occupancyRate || 0}%` }}></div>
          </div>
          <div className="kpi-meta">
            <span>{metrics.allocatedBeds || 0} Beds Occupied</span>
            <span>{metrics.vacantBeds || 0} Vacant</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-title">Daily Roll Call Compliance</span>
            <span className="kpi-icon">📝</span>
          </div>
          <div className="kpi-value">{metrics.attendanceRateToday || 0}%</div>
          <div className="kpi-progress-bar">
            <div className="kpi-fill fill-emerald" style={{ width: `${metrics.attendanceRateToday || 0}%` }}></div>
          </div>
          <div className="kpi-meta">
            <span>Active Enrolled Residents: {metrics.totalStudents || 0}</span>
            <span>Today's Verified</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-title">Grievance SLA Resolution</span>
            <span className="kpi-icon">🛠️</span>
          </div>
          <div className="kpi-value">{resolutionRate}%</div>
          <div className="kpi-progress-bar">
            <div className="kpi-fill fill-purple" style={{ width: `${resolutionRate}%` }}></div>
          </div>
          <div className="kpi-meta">
            <span>{metrics.resolvedComplaints || 0} Resolved</span>
            <span className={metrics.openComplaints > 0 ? 'text-warning' : 'text-success'}>
              {metrics.openComplaints || 0} Open Tickets
            </span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-title">Fee Revenue Recovery</span>
            <span className="kpi-icon">💳</span>
          </div>
          <div className="kpi-value">{feeRecoveryRate}%</div>
          <div className="kpi-progress-bar">
            <div className="kpi-fill fill-indigo" style={{ width: `${feeRecoveryRate}%` }}></div>
          </div>
          <div className="kpi-meta">
            <span className="text-success">₹{(metrics.totalFeeCollected || 0).toLocaleString('en-IN')} Received</span>
            <span className="text-danger">₹{(metrics.totalFeePending || 0).toLocaleString('en-IN')} Pending</span>
          </div>
        </div>
      </div>

      {/* Safety & Gate Pass Operational Metrics */}
      <div className="ops-card">
        <h3 className="ops-title">🚨 Real-time Security &amp; Outing Status</h3>
        <div className="ops-grid">
          <div className="ops-item">
            <span className="ops-label">Students Currently Out of Campus</span>
            <div className="ops-number font-bold text-blue">{metrics.activeGatePasses || 0}</div>
            <span className="ops-sub">Valid active gate passes verified at security</span>
          </div>

          <div className={`ops-item ${metrics.overdueGatePasses > 0 ? 'item-alert' : ''}`}>
            <span className="ops-label">Overdue Return Alerts</span>
            <div className={`ops-number font-bold ${metrics.overdueGatePasses > 0 ? 'text-danger' : 'text-success'}`}>
              {metrics.overdueGatePasses || 0}
            </div>
            <span className="ops-sub">Students past expected in-time deadline</span>
          </div>

          <div className="ops-item">
            <span className="ops-label">Total Room Inventory</span>
            <div className="ops-number font-bold">{metrics.totalRooms || 0} Rooms</div>
            <span className="ops-sub">Across Boys &amp; Girls Hostels</span>
          </div>
        </div>
      </div>

      {/* Official Data Export Center */}
      <div className="export-center-card">
        <div className="export-header">
          <div>
            <h3 className="export-title">📥 Institutional Data Export &amp; Regulatory Audit</h3>
            <p className="export-sub">
              Download complete institutional registers in formatted CSV for MSBTE audits, DTE inspection, and accounting records.
            </p>
          </div>
        </div>

        <div className="export-grid">
          <div className="export-tile">
            <div className="tile-icon-wrap" style={{ background: '#eff6ff', color: '#1d4ed8' }}>
              👥
            </div>
            <div className="tile-content">
              <h4 className="tile-title">Residents &amp; Student Registry</h4>
              <p className="tile-desc">
                Full student directory with enrollment, assigned room, branch, year, mobile, and emergency guardian contacts.
              </p>
              <button
                className="btn-download-csv"
                onClick={() => handleExportCsv('residents', 'Residents Register')}
                disabled={downloadingExport === 'residents'}
              >
                {downloadingExport === 'residents' ? 'Generating...' : '📥 Export Residents CSV'}
              </button>
            </div>
          </div>

          <div className="export-tile">
            <div className="tile-icon-wrap" style={{ background: '#ecfdf5', color: '#047857' }}>
              💰
            </div>
            <div className="tile-content">
              <h4 className="tile-title">Fee Ledger &amp; Payment Vouchers</h4>
              <p className="tile-desc">
                Complete financial transaction log: fee demands, paid receipts, payment modes, transaction hashes, and dues.
              </p>
              <button
                className="btn-download-csv"
                onClick={() => handleExportCsv('fees', 'Fee Ledger')}
                disabled={downloadingExport === 'fees'}
              >
                {downloadingExport === 'fees' ? 'Generating...' : '📥 Export Fee Ledger CSV'}
              </button>
            </div>
          </div>

          <div className="export-tile">
            <div className="tile-icon-wrap" style={{ background: '#f5f3ff', color: '#6d28d9' }}>
              🔧
            </div>
            <div className="tile-content">
              <h4 className="tile-title">Maintenance &amp; Grievance Log</h4>
              <p className="tile-desc">
                Full register of student maintenance tickets: category (electrical, plumbing), room, urgency, resolution time, and remarks.
              </p>
              <button
                className="btn-download-csv"
                onClick={() => handleExportCsv('complaints', 'Complaints Log')}
                disabled={downloadingExport === 'complaints'}
              >
                {downloadingExport === 'complaints' ? 'Generating...' : '📥 Export Grievances CSV'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
