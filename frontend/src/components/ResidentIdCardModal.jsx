import React from 'react';
import './ResidentIdCardModal.css';

export default function ResidentIdCardModal({ student, onClose }) {
  if (!student) return null;

  const handlePrint = () => {
    window.print();
  };

  const enrollment = student.enrollmentNumber || 'ENR-2026-SAK';
  const qrString = `HOSTEL-RESIDENT:${enrollment}:${student.roomNumber || '104'}`;

  return (
    <div className="id-card-modal-overlay" onClick={onClose}>
      <div className="id-card-modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header no-print">
          <div>
            <h3 className="modal-title">Official Hostel Resident ID Card</h3>
            <p className="modal-sub">Government Polytechnic Sakoli &bull; Institutional Resident Pass</p>
          </div>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        {/* Printable Smart Card Graphic */}
        <div className="id-card-wrapper" id="printable-resident-id-card">
          <div className="id-card-badge">
            {/* Top Institutional Header */}
            <div className="id-header">
              <div className="id-gov-logo">🏛️</div>
              <div className="id-inst-text">
                <span className="inst-name">GOVT. POLYTECHNIC SAKOLI</span>
                <span className="inst-sub">HOSTEL RESIDENT IDENTITY CARD</span>
                <span className="inst-session">ACADEMIC SESSION: 2025 - 2026</span>
              </div>
            </div>

            {/* Middle Resident Profile */}
            <div className="id-body">
              <div className="id-photo-col">
                <div className="id-photo-frame">
                  {student.avatarUrl ? (
                    <img src={student.avatarUrl} alt={student.fullName} />
                  ) : (
                    <div className="id-photo-fallback">
                      👤
                    </div>
                  )}
                </div>
                <div className="id-role-tag">RESIDENT</div>
              </div>

              <div className="id-details-col">
                <h4 className="id-student-name">{student.fullName || 'Student Resident'}</h4>
                <div className="id-meta-row">
                  <span className="id-label">Enrollment:</span>
                  <span className="id-value font-mono">{enrollment}</span>
                </div>
                <div className="id-meta-row">
                  <span className="id-label">Hostel:</span>
                  <span className="id-value">{student.hostelName || 'Sahyadri Boys Hostel'}</span>
                </div>
                <div className="id-meta-row">
                  <span className="id-label">Room / Bed:</span>
                  <span className="id-value highlight-room">Room {student.roomNumber || '104'}</span>
                </div>
                <div className="id-meta-row">
                  <span className="id-label">Branch &amp; Sem:</span>
                  <span className="id-value">{student.course || 'Diploma Engg'} (Sem {student.semester || 'IV'})</span>
                </div>
                <div className="id-meta-row">
                  <span className="id-label">Emergency Phone:</span>
                  <span className="id-value font-mono">{student.phone || student.emergencyContact || '9876543210'}</span>
                </div>
              </div>
            </div>

            {/* Bottom Security Strip & Barcode */}
            <div className="id-footer">
              <div className="id-barcode-graphic">
                <div className="barcode-bars"></div>
                <span className="barcode-code">{enrollment}</span>
              </div>

              <div className="id-sign-graphic">
                <div className="sign-line"></div>
                <span className="sign-text">Hostel Warden</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Controls */}
        <div className="modal-actions no-print">
          <button className="btn-secondary" onClick={onClose}>
            Close
          </button>
          <button className="btn-print-id" onClick={handlePrint}>
            🖨️ Print ID Card
          </button>
        </div>
      </div>
    </div>
  );
}
