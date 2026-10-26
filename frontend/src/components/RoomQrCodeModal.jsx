import React from 'react';
import './RoomQrCodeModal.css';

export default function RoomQrCodeModal({ room, hostelName, onClose }) {
  if (!room) return null;

  const handlePrint = () => {
    window.print();
  };

  const roomNo = room.roomNumber || '104';
  const qrString = `HOSTEL-ROOM:${hostelName || 'Sahyadri'}:${roomNo}`;

  return (
    <div className="room-qr-modal-overlay" onClick={onClose}>
      <div className="room-qr-modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header no-print">
          <div>
            <h3 className="modal-title">Hostel Room QR Door Poster</h3>
            <p className="modal-sub">Printable door placard for student roll call and maintenance</p>
          </div>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        {/* Printable Room Placard */}
        <div className="door-poster-wrapper" id="printable-room-door-poster">
          <div className="door-poster-card">
            <div className="poster-header">
              <div className="inst-crest">🏛️</div>
              <div className="inst-titles">
                <span className="inst-main">GOVERNMENT POLYTECHNIC SAKOLI</span>
                <span className="inst-hostel">{hostelName || 'Sahyadri Boys Hostel'}</span>
              </div>
            </div>

            <div className="poster-divider"></div>

            <div className="poster-room-banner">
              <span className="room-tag">ROOM NUMBER</span>
              <h1 className="room-number-display">{roomNo}</h1>
              <span className="room-floor-tag">{room.floor || 'Floor 1'} &bull; Capacity: {room.capacity || 3} Beds</span>
            </div>

            {/* QR Code Graphic Box */}
            <div className="poster-qr-section">
              <div className="qr-border-box">
                <div className="qr-simulated">
                  <div className="qr-corner top-left"></div>
                  <div className="qr-corner top-right"></div>
                  <div className="qr-corner bottom-left"></div>
                  <div className="qr-center-text">
                    <span className="qr-room-code">ROOM {roomNo}</span>
                    <span className="qr-sub-code">SCAN ME</span>
                  </div>
                </div>
              </div>
              <p className="qr-instruction">
                📱 <strong>SCAN WITH HOSTELSYNC APP</strong>
                <br />
                Report Room Grievances / View Roll Call Status
              </p>
            </div>

            {/* Occupants list if available */}
            {room.occupants && room.occupants.length > 0 && (
              <div className="poster-occupants">
                <span className="occ-title">Registered Residents:</span>
                <div className="occ-list">
                  {room.occupants.map((occ, idx) => (
                    <span key={idx} className="occ-name">
                      Bed {idx + 1}: {occ.studentName || occ}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="poster-footer">
              <span>HOSTEL ADMINISTRATION &bull; RULES &amp; DISCIPLINE APPLY</span>
            </div>
          </div>
        </div>

        {/* Modal Controls */}
        <div className="modal-actions no-print">
          <button className="btn-secondary" onClick={onClose}>
            Close
          </button>
          <button className="btn-print-poster" onClick={handlePrint}>
            🖨️ Print Door Poster
          </button>
        </div>
      </div>
    </div>
  );
}
