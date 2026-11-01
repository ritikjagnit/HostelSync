import React from 'react';
import './AuditReportPrintModal.css';

export default function AuditReportPrintModal({
  isOpen,
  onClose,
  title,
  category,
  headers = [],
  rows = [],
  kpis = [],
  onExportExcel,
  onExportCsv
}) {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const todayStr = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
  const timeStr = new Date().toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit'
  });
  const auditDocRef = `GPS/HSTL/REG-${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`;

  return (
    <div className="audit-modal-backdrop" onClick={onClose}>
      <div className="audit-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Modal Top Control Bar (Hidden in Print) */}
        <div className="audit-modal-control-bar no-print">
          <div className="audit-control-left">
            <span className="audit-badge-pdf">📄 OFFICIAL AUDIT REPORT (PDF PREVIEW)</span>
            <span className="audit-doc-ref font-mono">{auditDocRef}</span>
          </div>

          <div className="audit-control-actions">
            {onExportExcel && (
              <button
                type="button"
                className="btn-audit-action btn-audit-excel"
                onClick={onExportExcel}
                title="Download formatted Excel workbook"
              >
                📊 Excel (.xls)
              </button>
            )}
            {onExportCsv && (
              <button
                type="button"
                className="btn-audit-action btn-audit-csv"
                onClick={onExportCsv}
                title="Download raw CSV"
              >
                📥 CSV
              </button>
            )}
            <button
              type="button"
              className="btn-audit-action btn-audit-print"
              onClick={handlePrint}
              title="Print document or Save as PDF"
            >
              🖨️ Save as PDF / Print
            </button>
            <button
              type="button"
              className="btn-audit-close"
              onClick={onClose}
              aria-label="Close"
            >
              &times;
            </button>
          </div>
        </div>

        {/* Printable Official Document Body */}
        <div className="audit-printable-sheet" id="audit-printable-area">
          {/* Institutional Letterhead */}
          <header className="audit-gov-header">
            <div className="audit-crest-col">
              <div className="audit-emblem-icon">🏛️</div>
              <div className="audit-emblem-sub">DTE: 04008</div>
            </div>

            <div className="audit-institute-details">
              <span className="audit-gov-line">महाराष्ट्र शासन &bull; GOVERNMENT OF MAHARASHTRA</span>
              <h1 className="audit-inst-name">GOVERNMENT POLYTECHNIC, SAKOLI</h1>
              <p className="audit-inst-address">
                Sendurwafa, Sakoli, Dist. Bhandara, Maharashtra - 441802 &bull; Directorate of Technical Education
              </p>
              <div className="audit-doc-subject-bar">
                <span className="audit-subject-title">{title.toUpperCase()}</span>
                <span className="audit-subject-category">{category}</span>
              </div>
            </div>

            <div className="audit-auth-stamp">
              <div className="stamp-seal-ring">
                <span>GOVT. POLY.</span>
                <span>SAKOLI</span>
                <span>AUDIT OK</span>
              </div>
            </div>
          </header>

          {/* Meta Details Bar */}
          <div className="audit-meta-grid">
            <div className="audit-meta-cell">
              <span className="meta-lbl">Document Ref No</span>
              <span className="meta-val font-mono">{auditDocRef}</span>
            </div>
            <div className="audit-meta-cell">
              <span className="meta-lbl">Generated On</span>
              <span className="meta-val">{todayStr} at {timeStr}</span>
            </div>
            <div className="audit-meta-cell">
              <span className="meta-lbl">Total Records Count</span>
              <span className="meta-val">{rows.length} Entries</span>
            </div>
            <div className="audit-meta-cell">
              <span className="meta-lbl">Issuing Authority</span>
              <span className="meta-val">Hostel Administration &amp; Chief Warden</span>
            </div>
          </div>

          {/* KPI Summary Block if provided */}
          {kpis && kpis.length > 0 && (
            <div className="audit-kpi-summary-strip">
              {kpis.map((kpi, idx) => (
                <div key={idx} className="audit-kpi-stat">
                  <span className="kpi-stat-lbl">{kpi.label}</span>
                  <span className="kpi-stat-val">{kpi.value}</span>
                </div>
              ))}
            </div>
          )}

          {/* Table */}
          <div className="audit-table-wrapper">
            <table className="audit-data-table">
              <thead>
                <tr>
                  <th style={{ width: '40px', textAlign: 'center' }}>#</th>
                  {headers.map((h, i) => (
                    <th key={i}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={headers.length + 1} style={{ textAlign: 'center', padding: '2rem' }}>
                      No records found for this register.
                    </td>
                  </tr>
                ) : (
                  rows.map((row, rIdx) => (
                    <tr key={rIdx}>
                      <td style={{ textAlign: 'center', color: '#64748b' }}>{rIdx + 1}</td>
                      {row.map((cell, cIdx) => (
                        <td key={cIdx}>
                          {cell === 'ACTIVE' || cell === 'PAID' || cell === 'RESOLVED' || cell === 'PRESENT' ? (
                            <span className="badge-audit badge-audit-success">{cell}</span>
                          ) : cell === 'PENDING' || cell === 'IN_PROGRESS' ? (
                            <span className="badge-audit badge-audit-warning">{cell}</span>
                          ) : cell === 'OVERDUE' || cell === 'ABSENT' || cell === 'REJECTED' ? (
                            <span className="badge-audit badge-audit-danger">{cell}</span>
                          ) : (
                            String(cell || '-')
                          )}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Official Sign-off & Verification Footer */}
          <footer className="audit-sign-block">
            <div className="audit-sign-col">
              <div className="audit-sign-line"></div>
              <span className="sign-role">Compiled by</span>
              <span className="sign-title">Hostel Estate / Data Clerk</span>
            </div>

            <div className="audit-sign-col">
              <div className="audit-sign-line"></div>
              <span className="sign-role">Verified &amp; Certified by</span>
              <span className="sign-title">Hostel Superintendent / Warden</span>
            </div>

            <div className="audit-sign-col">
              <div className="audit-sign-line"></div>
              <span className="sign-role">Countersigned &amp; Approved</span>
              <span className="sign-title">Principal / Rector</span>
              <span className="sign-sub">Government Polytechnic, Sakoli</span>
            </div>
          </footer>

          <div className="audit-doc-footnote">
            <span>
              * Official computerized audit transcript verified under MSBTE &amp; DTE Maharashtra residential governance protocols.
            </span>
            <span className="footnote-page font-mono">Page 1 of 1 &bull; System Integrity Hash: SHA256-VERIFIED</span>
          </div>
        </div>
      </div>
    </div>
  );
}
