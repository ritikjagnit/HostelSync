import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import './FeeManagerSection.css';

const FEE_TYPES = [
  { value: 'HOSTEL_RENT', label: 'Hostel Room Rent (वसतिगृह भाडे)' },
  { value: 'MESS_DEPOSIT', label: 'Mess Deposit & Advances (मेस अनामत)' },
  { value: 'CAUTION_MONEY', label: 'Caution Money / Security Deposit' },
  { value: 'MAINTENANCE_FEE', label: 'Annual Maintenance & Sanitation Fee' },
  { value: 'ELECTRICITY_WATER', label: 'Electricity & Water Charges' },
  { value: 'FINE_PENALTY', label: 'Disciplinary / Late Fine' }
];

const PAYMENT_MODES = [
  { value: 'UPI', label: 'UPI / QR Code (PhonePe, GPay, Paytm)' },
  { value: 'NET_BANKING', label: 'NEFT / RTGS / Net Banking' },
  { value: 'CASH', label: 'Cash at Hostel Office' },
  { value: 'CHALLAN', label: 'Bank Challan (SBI Sakoli Branch)' }
];

export default function FeeManagerSection({ role = 'STUDENT' }) {
  const { authFetch, user } = useAuth();

  const [feeRecords, setFeeRecords] = useState([]);
  const [noDuesData, setNoDuesData] = useState(null);
  const [stats, setStats] = useState({
    totalCollected: 0,
    totalPending: 0,
    totalOverdue: 0,
    paidRecordsCount: 0,
    pendingRecordsCount: 0
  });

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState('');
  const [feedbackError, setFeedbackError] = useState('');

  // Modals
  const [activeReceipt, setActiveReceipt] = useState(null);
  const [noDuesModalOpen, setNoDuesModalOpen] = useState(false);
  const [paymentModalRecord, setPaymentModalRecord] = useState(null);
  const [createFeeModalOpen, setCreateFeeModalOpen] = useState(false);

  // Admin Payment Form
  const [paymentForm, setPaymentForm] = useState({
    paidAmount: '',
    paymentMode: 'UPI',
    transactionRef: '',
    remarks: ''
  });

  // Admin Create Fee Form
  const [feeDemandForm, setFeeDemandForm] = useState({
    studentId: '',
    feeType: 'HOSTEL_RENT',
    amount: '',
    dueDate: '',
    remarks: ''
  });

  const isStaff = role === 'ADMIN';

  const loadData = useCallback(async () => {
    setLoading(true);
    setFeedbackError('');
    try {
      if (role === 'STUDENT') {
        const [feeRes, nocRes] = await Promise.all([
          authFetch('/api/student/fees/my'),
          authFetch('/api/student/fees/no-dues')
        ]);

        if (feeRes.ok) {
          const fees = await feeRes.json();
          setFeeRecords(fees);
        }
        if (nocRes.ok) {
          const noc = await nocRes.json();
          setNoDuesData(noc);
        }
      } else {
        // Admin
        const [feeRes, statsRes] = await Promise.all([
          authFetch('/api/admin/fees'),
          authFetch('/api/admin/fees/stats')
        ]);

        if (feeRes.ok) {
          const fees = await feeRes.json();
          setFeeRecords(fees);
        }
        if (statsRes.ok) {
          const st = await statsRes.json();
          setStats(st);
        }
      }
    } catch (err) {
      setFeedbackError(err.message || 'Error fetching fee records');
    } finally {
      setLoading(false);
    }
  }, [authFetch, role]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Open Record Payment Modal (Admin)
  const openPaymentModal = (record) => {
    setPaymentModalRecord(record);
    setPaymentForm({
      paidAmount: String(record.balance || record.amount),
      paymentMode: 'UPI',
      transactionRef: `TXN-${Date.now().toString().slice(-6)}`,
      remarks: 'Payment cleared by student'
    });
  };

  // Submit Payment (Admin)
  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!paymentForm.paidAmount || Number(paymentForm.paidAmount) <= 0) {
      setFeedbackError('Please enter a valid payment amount.');
      return;
    }

    setActionLoading(true);
    try {
      const res = await authFetch(`/api/admin/fees/${paymentModalRecord.id}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paidAmount: Number(paymentForm.paidAmount),
          paymentMode: paymentForm.paymentMode,
          transactionRef: paymentForm.transactionRef,
          remarks: paymentForm.remarks
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Payment recording failed');
      }

      setFeedbackSuccess(`Payment of ₹${paymentForm.paidAmount} recorded successfully! Receipt generated.`);
      setPaymentModalRecord(null);
      loadData();
    } catch (err) {
      setFeedbackError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Submit Create Fee Demand (Admin)
  const handleCreateFeeDemand = async (e) => {
    e.preventDefault();
    if (!feeDemandForm.studentId || !feeDemandForm.amount || !feeDemandForm.dueDate) {
      setFeedbackError('Student ID, Amount, and Due Date are required.');
      return;
    }

    setActionLoading(true);
    try {
      const res = await authFetch('/api/admin/fees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: Number(feeDemandForm.studentId),
          feeType: feeDemandForm.feeType,
          amount: Number(feeDemandForm.amount),
          dueDate: feeDemandForm.dueDate,
          remarks: feeDemandForm.remarks
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Fee demand creation failed');
      }

      setFeedbackSuccess('Fee demand invoice successfully issued to student!');
      setCreateFeeModalOpen(false);
      setFeeDemandForm({
        studentId: '',
        feeType: 'HOSTEL_RENT',
        amount: '',
        dueDate: '',
        remarks: ''
      });
      loadData();
    } catch (err) {
      setFeedbackError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Summary calculations for Student
  const totalBilled = feeRecords.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  const totalPaid = feeRecords.reduce((sum, r) => sum + (Number(r.paidAmount) || 0), 0);
  const balanceOutstanding = Math.max(0, totalBilled - totalPaid);

  return (
    <div className="fee-manager-container">
      {/* Header Banner */}
      <div className="fee-header-card">
        <div className="fee-header-left">
          <div className="fee-header-badge">
            <span className="live-bullet"></span>
            <span>TREASURY &amp; HOSTEL ACCOUNTS</span>
          </div>
          <h2 className="fee-header-title">Hostel Fee Management &amp; No-Dues Clearance</h2>
          <p className="fee-header-desc">
            Government Polytechnic Sakoli &bull; Official fee challan tracking, automated digital payment receipts, and semester No-Dues (NOC) clearance.
          </p>
        </div>

        <div className="fee-header-actions">
          {role === 'STUDENT' ? (
            <button
              className="btn-noc-action"
              onClick={() => {
                setFeedbackError('');
                setNoDuesModalOpen(true);
              }}
            >
              <span>📜</span> Official No-Dues (NOC)
            </button>
          ) : (
            <button
              className="btn-noc-action"
              onClick={() => {
                setFeedbackError('');
                setCreateFeeModalOpen(true);
              }}
            >
              <span>➕</span> Issue Fee Demand
            </button>
          )}
        </div>
      </div>

      {/* Notifications */}
      {feedbackSuccess && (
        <div className="fee-alert fee-alert-success">
          <span>✓</span>
          <span>{feedbackSuccess}</span>
          <button onClick={() => setFeedbackSuccess('')} className="alert-close">&times;</button>
        </div>
      )}
      {feedbackError && (
        <div className="fee-alert fee-alert-error">
          <span>⚠️</span>
          <span>{feedbackError}</span>
          <button onClick={() => setFeedbackError('')} className="alert-close">&times;</button>
        </div>
      )}

      {/* Financial Summary Cards */}
      {role === 'STUDENT' ? (
        <div className="fee-summary-grid">
          <div className="fee-summary-card">
            <span className="summary-label">Total Fee Invoiced</span>
            <div className="summary-amount">₹{totalBilled.toLocaleString('en-IN')}</div>
            <span className="summary-sub">Academic Session 2025-26</span>
          </div>

          <div className="fee-summary-card card-paid">
            <span className="summary-label">Total Amount Paid</span>
            <div className="summary-amount text-success">₹{totalPaid.toLocaleString('en-IN')}</div>
            <span className="summary-sub">Verified &amp; Deposited</span>
          </div>

          <div className={`fee-summary-card ${balanceOutstanding > 0 ? 'card-due' : 'card-clear'}`}>
            <span className="summary-label">Pending Dues Balance</span>
            <div className={`summary-amount ${balanceOutstanding > 0 ? 'text-danger' : 'text-success'}`}>
              ₹{balanceOutstanding.toLocaleString('en-IN')}
            </div>
            <span className="summary-sub">
              {balanceOutstanding === 0 ? '✅ 100% Cleared (Eligible for NOC)' : '⚠️ Dues must be cleared for clearance'}
            </span>
          </div>
        </div>
      ) : (
        <div className="fee-summary-grid">
          <div className="fee-summary-card card-paid">
            <span className="summary-label">Total Revenue Collected</span>
            <div className="summary-amount text-success">₹{(stats.totalCollected || 0).toLocaleString('en-IN')}</div>
            <span className="summary-sub">{stats.paidRecordsCount || 0} Invoices Cleared</span>
          </div>

          <div className="fee-summary-card card-due">
            <span className="summary-label">Outstanding Fees Pending</span>
            <div className="summary-amount text-warning">₹{(stats.totalPending || 0).toLocaleString('en-IN')}</div>
            <span className="summary-sub">{stats.pendingRecordsCount || 0} Pending Collections</span>
          </div>

          <div className="fee-summary-card">
            <span className="summary-label">Overdue Defaulters</span>
            <div className="summary-amount text-danger">₹{(stats.totalOverdue || 0).toLocaleString('en-IN')}</div>
            <span className="summary-sub">Immediate Follow-up Required</span>
          </div>
        </div>
      )}

      {/* Fee Invoices & Records Table */}
      <div className="fee-table-card">
        <div className="fee-table-header">
          <h3>📋 {role === 'STUDENT' ? 'My Fee Invoices & Payment History' : 'Hostel Fee Ledger & Collections'}</h3>
          <span className="records-count">{feeRecords.length} Records</span>
        </div>

        {loading ? (
          <div className="fee-loading">
            <div className="fee-spinner"></div>
            <p>Loading fee ledger and payment vouchers...</p>
          </div>
        ) : feeRecords.length === 0 ? (
          <div className="fee-empty">
            <p>No fee records found in this account.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="fee-table">
              <thead>
                <tr>
                  <th>Voucher / Invoice</th>
                  {role !== 'STUDENT' && <th>Resident</th>}
                  <th>Fee Type</th>
                  <th>Amount</th>
                  <th>Paid</th>
                  <th>Balance</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {feeRecords.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <span className="receipt-ref-code">{r.receiptNumber || `INV-#${r.id}`}</span>
                    </td>
                    {role !== 'STUDENT' && (
                      <td>
                        <strong>{r.studentName}</strong>
                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>{r.enrollmentNumber}</div>
                      </td>
                    )}
                    <td>
                      <span className="fee-type-tag">{r.feeType?.replace('_', ' ')}</span>
                    </td>
                    <td className="font-bold">₹{Number(r.amount).toLocaleString('en-IN')}</td>
                    <td className="text-success font-medium">₹{Number(r.paidAmount || 0).toLocaleString('en-IN')}</td>
                    <td className={r.balance > 0 ? 'text-danger font-bold' : 'text-muted'}>
                      ₹{Number(r.balance || 0).toLocaleString('en-IN')}
                    </td>
                    <td>{r.dueDate || 'N/A'}</td>
                    <td>
                      <span className={`status-pill pill-${r.status?.toLowerCase()}`}>
                        {r.status}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons-group">
                        {r.status === 'PAID' && (
                          <button
                            className="btn-table-action btn-receipt"
                            onClick={() => setActiveReceipt(r)}
                            title="View Printable Payment Receipt"
                          >
                            🧾 Receipt
                          </button>
                        )}
                        {role === 'ADMIN' && r.status !== 'PAID' && (
                          <button
                            className="btn-table-action btn-pay"
                            onClick={() => openPaymentModal(r)}
                            title="Record Payment for Student"
                          >
                            💳 Pay
                          </button>
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

      {/* PRINTABLE PAYMENT RECEIPT MODAL */}
      {activeReceipt && (
        <div className="fee-modal-overlay" onClick={() => setActiveReceipt(null)}>
          <div className="fee-modal-dialog receipt-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="printable-receipt" id="printable-fee-receipt">
              {/* Receipt Header */}
              <div className="receipt-header">
                <div className="receipt-college">GOVERNMENT POLYTECHNIC SAKOLI</div>
                <div className="receipt-sub">Bhandara Road, Sakoli, Dist. Bhandara - 441802 (M.S.)</div>
                <div className="receipt-hostel">OFFICE OF THE HOSTEL RECTOR &amp; TREASURER</div>
                <div className="receipt-title-badge">OFFICIAL FEE PAYMENT RECEIPT</div>
              </div>

              <div className="receipt-divider"></div>

              {/* Receipt Details Grid */}
              <div className="receipt-meta-grid">
                <div>
                  <span className="lbl">Receipt Number:</span>
                  <span className="val highlight">{activeReceipt.receiptNumber || `REC-2026-${activeReceipt.id}`}</span>
                </div>
                <div>
                  <span className="lbl">Payment Date:</span>
                  <span className="val">{activeReceipt.paidAt ? new Date(activeReceipt.paidAt).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN')}</span>
                </div>
                <div>
                  <span className="lbl">Student Name:</span>
                  <span className="val">{activeReceipt.studentName || user?.fullName}</span>
                </div>
                <div>
                  <span className="lbl">Enrollment No:</span>
                  <span className="val">{activeReceipt.enrollmentNumber || user?.enrollmentNumber || 'ENR-2026'}</span>
                </div>
                <div>
                  <span className="lbl">Fee Category:</span>
                  <span className="val">{activeReceipt.feeType?.replace('_', ' ')}</span>
                </div>
                <div>
                  <span className="lbl">Payment Mode:</span>
                  <span className="val">{activeReceipt.paymentMode || 'ONLINE_UPI'}</span>
                </div>
                <div>
                  <span className="lbl">Transaction Ref:</span>
                  <span className="val">{activeReceipt.transactionRef || 'GP-HOSTEL-DIRECT'}</span>
                </div>
                <div>
                  <span className="lbl">Payment Status:</span>
                  <span className="val text-success font-bold">CLEARED / PAID</span>
                </div>
              </div>

              {/* Fee Breakdown Table */}
              <table className="receipt-items-table">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th style={{ textAlign: 'right' }}>Amount Paid (INR)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{activeReceipt.feeType?.replace('_', ' ')} - Academic Session 2025-2026</td>
                    <td style={{ textAlign: 'right' }}>₹{Number(activeReceipt.paidAmount || activeReceipt.amount).toLocaleString('en-IN')}.00</td>
                  </tr>
                  <tr className="total-row">
                    <td><strong>TOTAL AMOUNT RECEIVED</strong></td>
                    <td style={{ textAlign: 'right' }}><strong>₹{Number(activeReceipt.paidAmount || activeReceipt.amount).toLocaleString('en-IN')}.00</strong></td>
                  </tr>
                </tbody>
              </table>

              {/* Stamp and Signature Area */}
              <div className="receipt-signatures">
                <div className="stamp-box">
                  <div className="stamp-circle">
                    <span>GP SAKOLI</span>
                    <span>HOSTEL</span>
                    <span>PAID</span>
                  </div>
                </div>

                <div className="signature-box">
                  <div className="sig-line"></div>
                  <span className="sig-title">Hostel Cashier / Warden</span>
                  <span className="sig-dept">Govt. Polytechnic Sakoli</span>
                </div>
              </div>

              <div className="receipt-footer-note">
                * This is a computer-generated institutional receipt verified by the Hostel Treasury System. No physical signature required.
              </div>
            </div>

            <div className="receipt-modal-actions no-print">
              <button className="btn-secondary" onClick={() => setActiveReceipt(null)}>
                Close
              </button>
              <button className="btn-print" onClick={() => window.print()}>
                🖨️ Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NO-DUES CERTIFICATE (NOC) MODAL */}
      {noDuesModalOpen && noDuesData && (
        <div className="fee-modal-overlay" onClick={() => setNoDuesModalOpen(false)}>
          <div className="fee-modal-dialog noc-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="printable-noc" id="printable-noc-slip">
              {/* College Header */}
              <div className="noc-header">
                <div className="gov-emblem">🏛️</div>
                <div className="noc-college">GOVERNMENT POLYTECHNIC SAKOLI</div>
                <div className="noc-sub">Affiliated to MSBTE Mumbai &bull; Approved by DTE Maharashtra</div>
                <div className="noc-title">HOSTEL NO-DUES CLEARANCE CERTIFICATE (NOC)</div>
                <div className="noc-ref">Certificate No: <strong>{noDuesData.certificateNumber || 'NOC-2026-PENDING'}</strong></div>
              </div>

              <div className="noc-body">
                {noDuesData.isEligibleForNoDues ? (
                  <>
                    <p className="noc-cert-text">
                      This is to certify that <strong>{noDuesData.studentName}</strong>, bearing Enrollment Number{' '}
                      <strong>{noDuesData.enrollmentNumber}</strong>, resident of{' '}
                      <strong>{noDuesData.hostelName || 'Sahyadri Boys Hostel'}</strong> (Room No.{' '}
                      <strong>{noDuesData.roomNumber || '104'}</strong>), has <strong>NO OUTSTANDING DUES</strong>{' '}
                      pertaining to hostel room rent, mess bills, electricity, water charges, or disciplinary penalties for the current academic session.
                    </p>

                    <p className="noc-cert-text">
                      All hostel property has been accounted for and returned in satisfactory condition. The student is officially cleared for semester exam admit card issuance / annual security refund / transfer.
                    </p>

                    <div className="noc-verification-block">
                      <div className="qr-box">
                        <div className="qr-placeholder">
                          <span>NOC-QR</span>
                        </div>
                      </div>
                      <div className="hash-details">
                        <div><strong>Clearance Date:</strong> {noDuesData.clearanceDate}</div>
                        <div><strong>Security Seal Hash:</strong> <span className="font-mono">{noDuesData.verificationHash || 'SHA-256-CLEAR-2026'}</span></div>
                        <div><strong>Verified By:</strong> Hostel Superintendent &amp; Chief Warden</div>
                      </div>
                    </div>

                    <div className="noc-signatures-row">
                      <div className="sig-item">
                        <div className="sig-line"></div>
                        <span>Hostel Mess In-charge</span>
                      </div>
                      <div className="sig-item">
                        <div className="sig-line"></div>
                        <span>Hostel Warden</span>
                      </div>
                      <div className="sig-item">
                        <div className="sig-line"></div>
                        <span>Principal / Rector</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="noc-not-cleared">
                    <div className="not-cleared-icon">⚠️</div>
                    <h3>No-Dues Clearance Pending</h3>
                    <p>
                      Student <strong>{noDuesData.studentName}</strong> has an outstanding dues balance of{' '}
                      <strong className="text-danger">₹{Number(noDuesData.totalDuesPending).toLocaleString('en-IN')}</strong>.
                    </p>
                    <p className="text-muted">
                      Please clear all pending hostel rent and mess fee invoices listed in the fee ledger above to generate your official signed No-Dues Certificate.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="noc-modal-actions no-print">
              <button className="btn-secondary" onClick={() => setNoDuesModalOpen(false)}>
                Close
              </button>
              {noDuesData.isEligibleForNoDues && (
                <button className="btn-print" onClick={() => window.print()}>
                  🖨️ Print No-Dues Certificate (NOC)
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* RECORD PAYMENT MODAL (Admin) */}
      {paymentModalRecord && (
        <div className="fee-modal-overlay" onClick={() => setPaymentModalRecord(null)}>
          <div className="fee-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">Record Fee Payment</h3>
                <p className="modal-sub">
                  For: <strong>{paymentModalRecord.studentName}</strong> ({paymentModalRecord.enrollmentNumber})
                </p>
              </div>
              <button className="modal-close" onClick={() => setPaymentModalRecord(null)}>&times;</button>
            </div>

            <form onSubmit={handleRecordPayment}>
              <div className="form-group">
                <label>Fee Category</label>
                <input type="text" value={paymentModalRecord.feeType} disabled />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Amount Due (INR)</label>
                  <input type="text" value={`₹${paymentModalRecord.balance || paymentModalRecord.amount}`} disabled />
                </div>

                <div className="form-group">
                  <label>Payment Amount Received (INR) *</label>
                  <input
                    type="number"
                    value={paymentForm.paidAmount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paidAmount: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Payment Mode *</label>
                  <select
                    value={paymentForm.paymentMode}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentMode: e.target.value })}
                  >
                    {PAYMENT_MODES.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Transaction / Challan Reference *</label>
                  <input
                    type="text"
                    value={paymentForm.transactionRef}
                    onChange={(e) => setPaymentForm({ ...paymentForm, transactionRef: e.target.value })}
                    placeholder="e.g. UPI Ref / Bank Challan No"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Remarks / Note</label>
                <input
                  type="text"
                  value={paymentForm.remarks}
                  onChange={(e) => setPaymentForm({ ...paymentForm, remarks: e.target.value })}
                  placeholder="e.g. Fees received and receipt generated"
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setPaymentModalRecord(null)}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-submit" disabled={actionLoading}>
                  {actionLoading ? 'Recording...' : '💳 Confirm & Issue Receipt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE FEE DEMAND MODAL (Admin) */}
      {createFeeModalOpen && (
        <div className="fee-modal-overlay" onClick={() => setCreateFeeModalOpen(false)}>
          <div className="fee-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">Issue New Fee Demand</h3>
                <p className="modal-sub">Generate room rent, mess deposit or maintenance charge invoice</p>
              </div>
              <button className="modal-close" onClick={() => setCreateFeeModalOpen(false)}>&times;</button>
            </div>

            <form onSubmit={handleCreateFeeDemand}>
              <div className="form-row">
                <div className="form-group">
                  <label>Student ID (Numeric) *</label>
                  <input
                    type="number"
                    placeholder="e.g. 1"
                    value={feeDemandForm.studentId}
                    onChange={(e) => setFeeDemandForm({ ...feeDemandForm, studentId: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Fee Category *</label>
                  <select
                    value={feeDemandForm.feeType}
                    onChange={(e) => setFeeDemandForm({ ...feeDemandForm, feeType: e.target.value })}
                  >
                    {FEE_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Amount (INR) *</label>
                  <input
                    type="number"
                    placeholder="e.g. 3500"
                    value={feeDemandForm.amount}
                    onChange={(e) => setFeeDemandForm({ ...feeDemandForm, amount: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Due Date *</label>
                  <input
                    type="date"
                    value={feeDemandForm.dueDate}
                    onChange={(e) => setFeeDemandForm({ ...feeDemandForm, dueDate: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Remarks / Terms</label>
                <input
                  type="text"
                  placeholder="e.g. Hostel Rent for Even Semester 2026"
                  value={feeDemandForm.remarks}
                  onChange={(e) => setFeeDemandForm({ ...feeDemandForm, remarks: e.target.value })}
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setCreateFeeModalOpen(false)}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-submit" disabled={actionLoading}>
                  {actionLoading ? 'Issuing...' : '📄 Generate Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
