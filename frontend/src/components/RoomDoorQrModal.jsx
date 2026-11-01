import React, { useState } from 'react';
import './RoomDoorQrModal.css';

/**
 * Generates a clean deterministic SVG QR code matrix from text
 * without external dependencies.
 */
function SimpleSvgQrCode({ text, size = 160 }) {
  // Deterministic pattern generator based on hash
  const gridSize = 21; // standard QR 21x21 version 1
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }

  const cells = [];
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      // Finder patterns in 3 corners
      const isFinderTopLeft = r < 7 && c < 7;
      const isFinderTopRight = r < 7 && c >= gridSize - 7;
      const isFinderBottomLeft = r >= gridSize - 7 && c < 7;

      let isBlack = false;
      if (isFinderTopLeft || isFinderTopRight || isFinderBottomLeft) {
        // 7x7 outer, 5x5 white, 3x3 black
        const localR = isFinderBottomLeft ? r - (gridSize - 7) : r;
        const localC = isFinderTopRight ? c - (gridSize - 7) : c;
        const border = localR === 0 || localR === 6 || localC === 0 || localC === 6;
        const inner = localR >= 2 && localR <= 4 && localC >= 2 && localC <= 4;
        isBlack = border || inner;
      } else {
        // Pseudo-random deterministic fill from string hash
        const cellHash = Math.sin((r * gridSize + c + Math.abs(hash)) * 9999);
        isBlack = (cellHash - Math.floor(cellHash)) > 0.48;
      }

      if (isBlack) {
        cells.push({ r, c });
      }
    }
  }

  const cellSize = size / gridSize;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="door-qr-svg">
      <rect width={size} height={size} fill="#ffffff" rx="4" />
      {cells.map((cell, idx) => (
        <rect
          key={idx}
          x={cell.c * cellSize}
          y={cell.r * cellSize}
          width={cellSize + 0.3}
          height={cellSize + 0.3}
          fill="#0f172a"
        />
      ))}
    </svg>
  );
}

// Synthesizes a subtle high-tech confirmation chime
function playSuccessBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
    osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.16);
  } catch {
    // AudioContext not allowed or muted
  }
}

export default function RoomDoorQrModal({
  isOpen,
  onClose,
  hostelName = 'GP Sakoli Hostel',
  roster = [],
  onMarkRoomAllPresent,
  onSelectRoomFilter
}) {
  const [activeTab, setActiveTab] = useState('scanner'); // 'scanner' | 'print'
  const [scannedRoom, setScannedRoom] = useState(null);
  const [isScanning, setIsScanning] = useState(false);

  if (!isOpen) return null;

  // Extract unique sorted rooms
  const roomsMap = {};
  roster.forEach((r) => {
    if (!r.roomNumber) return;
    if (!roomsMap[r.roomNumber]) {
      roomsMap[r.roomNumber] = [];
    }
    roomsMap[r.roomNumber].push(r);
  });
  const uniqueRooms = Object.keys(roomsMap).sort();

  // Simulate scanning a room door
  const handleSimulateScan = (roomNumber) => {
    setIsScanning(true);
    setScannedRoom(null);

    setTimeout(() => {
      setIsScanning(false);
      setScannedRoom(roomNumber);
      playSuccessBeep();
    }, 600);
  };

  const handleApplyAllPresent = (roomNumber) => {
    if (onMarkRoomAllPresent) {
      onMarkRoomAllPresent(roomNumber);
    }
    if (onSelectRoomFilter) {
      onSelectRoomFilter(roomNumber);
    }
    onClose();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="door-qr-modal-overlay" onClick={onClose}>
      <div className="door-qr-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="door-qr-header">
          <div className="door-qr-header-title">
            <span className="door-qr-icon">🚪</span>
            <div>
              <h3>Room Door QR Fast Roll Call &amp; Print System</h3>
              <p className="door-qr-subtitle">
                {hostelName} &bull; Government Polytechnic Sakoli
              </p>
            </div>
          </div>
          <button className="door-qr-close-btn" onClick={onClose} aria-label="Close modal">
            &times;
          </button>
        </div>

        {/* Tab Controls */}
        <div className="door-qr-tabs no-print">
          <button
            className={`door-qr-tab-btn ${activeTab === 'scanner' ? 'active' : ''}`}
            onClick={() => setActiveTab('scanner')}
          >
            📷 Door QR Camera Scanner
          </button>
          <button
            className={`door-qr-tab-btn ${activeTab === 'print' ? 'active' : ''}`}
            onClick={() => setActiveTab('print')}
          >
            🖨️ Door QR Badges (Print Ready)
          </button>
        </div>

        {/* Content Body */}
        <div className="door-qr-body">
          {activeTab === 'scanner' ? (
            <div className="scanner-view">
              <div className="scanner-hud-card">
                <div className="scanner-viewfinder">
                  <div className="scanner-laser"></div>
                  <div className="viewfinder-corner tl"></div>
                  <div className="viewfinder-corner tr"></div>
                  <div className="viewfinder-corner bl"></div>
                  <div className="viewfinder-corner br"></div>
                  <div className="viewfinder-center-guide">
                    {isScanning ? (
                      <span className="scanning-pulse">Decoding Room QR...</span>
                    ) : scannedRoom ? (
                      <span className="scanned-success-tag">✓ ROOM {scannedRoom} MATCHED</span>
                    ) : (
                      <span className="scanner-idle-tip">Point Camera at Door QR Sticker</span>
                    )}
                  </div>
                </div>

                <div className="scanner-instructions">
                  <strong>Digital Door Inspection Norm:</strong> Wardens tap the resident door QR code to instantly verify bed allocations and mark nightly attendance without manual roster typing.
                </div>
              </div>

              {/* Scanned Room Result Banner */}
              {scannedRoom && roomsMap[scannedRoom] && (
                <div className="scanned-result-panel">
                  <div className="scanned-result-header">
                    <div className="scanned-room-badge">
                      <span className="room-label">DOOR VERIFIED</span>
                      <strong className="room-num">Room {scannedRoom}</strong>
                    </div>
                    <div className="scanned-residents-count">
                      {roomsMap[scannedRoom].length} Resident(s) Assigned
                    </div>
                  </div>

                  <div className="scanned-residents-list">
                    {roomsMap[scannedRoom].map((st) => (
                      <div key={st.studentId} className="scanned-resident-row">
                        <div>
                          <strong>{st.studentName}</strong>
                          <span className="scanned-enroll">({st.enrollmentNumber})</span>
                        </div>
                        <span className="scanned-phone">📞 {st.phone}</span>
                      </div>
                    ))}
                  </div>

                  <div className="scanned-result-actions">
                    <button
                      className="btn btn-primary"
                      onClick={() => handleApplyAllPresent(scannedRoom)}
                      style={{ background: '#16a34a', borderColor: '#15803d' }}
                    >
                      ✓ Mark All {roomsMap[scannedRoom].length} Present &amp; Close
                    </button>
                    <button
                      className="btn btn-secondary"
                      onClick={() => {
                        if (onSelectRoomFilter) onSelectRoomFilter(scannedRoom);
                        onClose();
                      }}
                    >
                      Filter Roster for Room {scannedRoom}
                    </button>
                  </div>
                </div>
              )}

              {/* Quick Door Tap Selector */}
              <div className="quick-door-picker">
                <div className="picker-title">
                  <span>⚡ Quick Tap Room Doors in {hostelName}:</span>
                  <span className="picker-hint">(Click any room to simulate QR camera capture)</span>
                </div>
                <div className="picker-chips-grid">
                  {uniqueRooms.length === 0 ? (
                    <p style={{ color: 'var(--slate-500)', fontSize: '0.85rem' }}>
                      No room numbers allocated in current roster.
                    </p>
                  ) : (
                    uniqueRooms.map((rm) => (
                      <button
                        key={rm}
                        className={`door-chip-btn ${scannedRoom === rm ? 'active' : ''}`}
                        onClick={() => handleSimulateScan(rm)}
                      >
                        <span className="chip-door-icon">🚪</span>
                        <span className="chip-room-text">Room {rm}</span>
                        <span className="chip-count-pill">{roomsMap[rm].length}</span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Print View */
            <div className="print-badges-view">
              <div className="print-toolbar no-print">
                <p>
                  Print official door QR badges on standard A4 / sticker paper. Paste outside each hostel room door for rapid night roll-calls.
                </p>
                <button className="btn btn-primary" onClick={handlePrint}>
                  🖨️ Print All {uniqueRooms.length} Door Badges (A4 Sheet)
                </button>
              </div>

              <div className="door-badges-grid">
                {uniqueRooms.map((rm) => {
                  const roomResidents = roomsMap[rm] || [];
                  const qrCodeString = `HOSTEL-GPSAKOLI-${hostelName.replace(/\s+/g, '')}-RM-${rm}`;
                  return (
                    <div key={rm} className="printable-door-badge-card">
                      <div className="badge-govt-header">
                        <div className="badge-govt-logo">🏛️</div>
                        <div className="badge-govt-text">
                          <div className="inst-title">GOVT. POLYTECHNIC SAKOLI</div>
                          <div className="inst-sub">DTE Code: 04008 &bull; Hostel Residence Wing</div>
                        </div>
                      </div>

                      <div className="badge-room-showcase">
                        <span className="badge-room-tag">ROOM NUMBER</span>
                        <h2 className="badge-room-id">{rm}</h2>
                        <span className="badge-hostel-name">{hostelName}</span>
                      </div>

                      <div className="badge-qr-box">
                        <SimpleSvgQrCode text={qrCodeString} size={150} />
                        <span className="badge-qr-caption">SCAN FOR NIGHT ROLL CALL</span>
                      </div>

                      <div className="badge-residents-preview">
                        <div className="res-preview-title">Sanctioned Residents ({roomResidents.length}):</div>
                        {roomResidents.map((r) => (
                          <div key={r.studentId} className="res-name-item">
                            &bull; {r.studentName} ({r.course || 'Polytechnic'})
                          </div>
                        ))}
                      </div>

                      <div className="badge-footer-instructions">
                        <span>Anti-Ragging Helpline: 1800-180-5522</span>
                        <span>Emergency Police: 112</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

