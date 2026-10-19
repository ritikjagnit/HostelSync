import React, { useState } from 'react';
import { getApiUrl } from '../config/api';
import './HostelRegistrationModal.css';

const COURSES = [
  'Diploma in Computer Engineering',
  'Diploma in Electrical Engineering',
  'Diploma in Mechanical Engineering',
  'Diploma in Civil Engineering',
  'Diploma in Electronics & Telecommunication'
];

const CATEGORIES = ['OPEN', 'OBC', 'SC', 'ST', 'VJNT', 'NT-B', 'NT-C', 'NT-D', 'EWS', 'SBC'];

export default function HostelRegistrationModal({ isOpen, onClose, onTrackStatusClick }) {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    enrollmentNumber: '',
    course: 'Diploma in Computer Engineering',
    semester: 1,
    gender: 'MALE',
    category: 'OPEN',
    meritPercentage: '',
    parentName: '',
    parentPhone: '',
    homeAddress: '',
    distanceFromCollege: '',
    remarks: ''
  });

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [submittedData, setSubmittedData] = useState(null);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrorMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    // Client-side validations
    const merit = parseFloat(formData.meritPercentage);
    if (isNaN(merit) || merit < 35 || merit > 100) {
      setErrorMessage('Please enter a valid qualifying merit percentage between 35% and 100%.');
      return;
    }

    const dist = parseFloat(formData.distanceFromCollege);
    if (isNaN(dist) || dist < 0) {
      setErrorMessage('Please enter a valid permanent residence distance from Sakoli (km).');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        fullName: formData.fullName.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        enrollmentNumber: formData.enrollmentNumber.trim().toUpperCase(),
        course: formData.course,
        semester: parseInt(formData.semester, 10),
        gender: formData.gender,
        category: formData.category,
        meritPercentage: merit,
        parentName: formData.parentName.trim(),
        parentPhone: formData.parentPhone.trim(),
        homeAddress: formData.homeAddress.trim(),
        distanceFromCollege: dist,
        remarks: formData.remarks.trim() || undefined
      };

      const res = await fetch(getApiUrl('/api/admissions/apply'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to submit hostel admission registration.');
      }

      setSubmittedData(data);
    } catch (err) {
      setErrorMessage(err.message || 'Submission error. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSubmittedData(null);
    setErrorMessage('');
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      enrollmentNumber: '',
      course: 'Diploma in Computer Engineering',
      semester: 1,
      gender: 'MALE',
      category: 'OPEN',
      meritPercentage: '',
      parentName: '',
      parentPhone: '',
      homeAddress: '',
      distanceFromCollege: '',
      remarks: ''
    });
    onClose();
  };

  return (
    <div className="adm-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="adm-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header with Tricolor accent & Government Emblem */}
        <div className="adm-modal-header">
          <div className="adm-header-badge">
            <span className="adm-flag-strip"></span>
            <span className="adm-gov-label">GOVERNMENT OF MAHARASHTRA • DTE CODE: 04008</span>
          </div>
          <button className="adm-close-btn" onClick={onClose} aria-label="Close modal">
            &times;
          </button>
          <h2 className="adm-title">
            {submittedData ? 'Hostel Admission Acknowledgment' : 'Hostel Admission Registration Form'}
          </h2>
          <p className="adm-subtitle">
            Government Polytechnic Sakoli — Central Residential Admissions (2026-2027)
          </p>
        </div>

        {/* Content Body */}
        <div className="adm-modal-body">
          {submittedData ? (
            /* Official Receipt / Slip */
            <div className="adm-success-container">
              <div className="adm-success-seal">
                <div className="adm-seal-icon">&#10003;</div>
                <div className="adm-seal-text">APPLICATION REGISTERED SUCCESSFULLY</div>
              </div>

              <div className="adm-receipt-box">
                <div className="adm-receipt-header">
                  <div>
                    <span className="adm-receipt-sub">Application Reference Number</span>
                    <strong className="adm-app-number">{submittedData.applicationNumber}</strong>
                  </div>
                  <span className="adm-status-tag pending">STATUS: {submittedData.status}</span>
                </div>

                <div className="adm-receipt-grid">
                  <div className="adm-receipt-item">
                    <span className="adm-label">Student Name:</span>
                    <span className="adm-val">{submittedData.fullName}</span>
                  </div>
                  <div className="adm-receipt-item">
                    <span className="adm-label">Enrollment / ID:</span>
                    <span className="adm-val">{submittedData.enrollmentNumber}</span>
                  </div>
                  <div className="adm-receipt-item">
                    <span className="adm-label">Course:</span>
                    <span className="adm-val">{submittedData.course} (Sem {submittedData.semester})</span>
                  </div>
                  <div className="adm-receipt-item">
                    <span className="adm-label">Applied Hostel:</span>
                    <span className="adm-val">
                      {submittedData.gender === 'MALE' ? 'Sahyadri Boys Hostel' : 'Jijau Girls Hostel'}
                    </span>
                  </div>
                  <div className="adm-receipt-item">
                    <span className="adm-label">Merit Marks:</span>
                    <span className="adm-val">{submittedData.meritPercentage}% ({submittedData.category})</span>
                  </div>
                  <div className="adm-receipt-item">
                    <span className="adm-label">Distance from Sakoli:</span>
                    <span className="adm-val">{submittedData.distanceFromCollege} km</span>
                  </div>
                </div>

                <div className="adm-receipt-instructions">
                  <h4>Next Steps for Admission Selection:</h4>
                  <ol>
                    <li>Your application has been queued for verification by the <strong>Hostel In-Charge (Rector / Warden)</strong>.</li>
                    <li>Merit shortlisting and seat allotment is carried out as per DTE Maharashtra reservation and distance guidelines.</li>
                    <li>Keep your <strong>Application Number ({submittedData.applicationNumber})</strong> safe to track verification and room allotment status online.</li>
                  </ol>
                </div>
              </div>

              <div className="adm-success-actions">
                <button
                  type="button"
                  className="adm-btn adm-btn-primary"
                  onClick={() => {
                    handleReset();
                    if (onTrackStatusClick) onTrackStatusClick(submittedData.applicationNumber);
                  }}
                >
                  &#128269; Track Application Status Now
                </button>
                <button
                  type="button"
                  className="adm-btn adm-btn-secondary"
                  onClick={() => window.print()}
                >
                  &#128424; Print Acknowledgment Slip
                </button>
                <button
                  type="button"
                  className="adm-btn adm-btn-outline"
                  onClick={handleReset}
                >
                  Close Window
                </button>
              </div>
            </div>
          ) : (
            /* Registration Form */
            <form onSubmit={handleSubmit} className="adm-form">
              {errorMessage && (
                <div className="adm-alert-error" role="alert">
                  <strong>Registration Error:</strong> {errorMessage}
                </div>
              )}

              <div className="adm-form-section-title">
                <span className="adm-section-number">1</span> Personal & Academic Information
              </div>

              <div className="adm-form-row">
                <div className="adm-form-group">
                  <label htmlFor="reg-fullName">Candidate Full Name *</label>
                  <input
                    type="text"
                    id="reg-fullName"
                    name="fullName"
                    required
                    placeholder="e.g. Rahul Ramesh Meshram"
                    value={formData.fullName}
                    onChange={handleChange}
                  />
                </div>
                <div className="adm-form-group">
                  <label htmlFor="reg-email">Email Address *</label>
                  <input
                    type="email"
                    id="reg-email"
                    name="email"
                    required
                    placeholder="student@example.com"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="adm-form-row">
                <div className="adm-form-group">
                  <label htmlFor="reg-phone">Mobile / WhatsApp Number *</label>
                  <input
                    type="tel"
                    id="reg-phone"
                    name="phone"
                    required
                    placeholder="10-digit mobile number"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>
                <div className="adm-form-group">
                  <label htmlFor="reg-enrollment">Enrollment / DTE Candidate No. *</label>
                  <input
                    type="text"
                    id="reg-enrollment"
                    name="enrollmentNumber"
                    required
                    placeholder="e.g. EN24109821 or DTE24..."
                    value={formData.enrollmentNumber}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="adm-form-row">
                <div className="adm-form-group">
                  <label htmlFor="reg-course">Department / Course *</label>
                  <select
                    id="reg-course"
                    name="course"
                    value={formData.course}
                    onChange={handleChange}
                  >
                    {COURSES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="adm-form-group">
                  <label htmlFor="reg-semester">Semester / Year *</label>
                  <select
                    id="reg-semester"
                    name="semester"
                    value={formData.semester}
                    onChange={handleChange}
                  >
                    <option value={1}>Semester 1 (1st Year)</option>
                    <option value={2}>Semester 2 (1st Year)</option>
                    <option value={3}>Semester 3 (2nd Year)</option>
                    <option value={4}>Semester 4 (2nd Year)</option>
                    <option value={5}>Semester 5 (3rd Year)</option>
                    <option value={6}>Semester 6 (3rd Year)</option>
                  </select>
                </div>
              </div>

              <div className="adm-form-row">
                <div className="adm-form-group">
                  <label htmlFor="reg-gender">Gender & Hostel Assignment *</label>
                  <select
                    id="reg-gender"
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                  >
                    <option value="MALE">Male (Sahyadri Boys Hostel)</option>
                    <option value="FEMALE">Female (Jijau Girls Hostel)</option>
                  </select>
                </div>
                <div className="adm-form-group">
                  <label htmlFor="reg-category">Social Category *</label>
                  <select
                    id="reg-category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="adm-form-group">
                  <label htmlFor="reg-merit">Qualifying Merit Marks (%) *</label>
                  <input
                    type="number"
                    id="reg-merit"
                    name="meritPercentage"
                    step="0.01"
                    min="35"
                    max="100"
                    required
                    placeholder="e.g. 88.50"
                    value={formData.meritPercentage}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="adm-form-section-title">
                <span className="adm-section-number">2</span> Residence & Guardian Details
              </div>

              <div className="adm-form-row">
                <div className="adm-form-group">
                  <label htmlFor="reg-parentName">Parent / Guardian Full Name *</label>
                  <input
                    type="text"
                    id="reg-parentName"
                    name="parentName"
                    required
                    placeholder="Father / Mother / Guardian"
                    value={formData.parentName}
                    onChange={handleChange}
                  />
                </div>
                <div className="adm-form-group">
                  <label htmlFor="reg-parentPhone">Parent / Emergency Contact *</label>
                  <input
                    type="tel"
                    id="reg-parentPhone"
                    name="parentPhone"
                    required
                    placeholder="Parent mobile number"
                    value={formData.parentPhone}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="adm-form-row">
                <div className="adm-form-group full-width">
                  <label htmlFor="reg-homeAddress">Permanent Home Address (with Tehsil & District) *</label>
                  <input
                    type="text"
                    id="reg-homeAddress"
                    name="homeAddress"
                    required
                    placeholder="At Post / Village, Tehsil, Dist. Bhandara / Gondia / Nagpur / etc."
                    value={formData.homeAddress}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="adm-form-row">
                <div className="adm-form-group">
                  <label htmlFor="reg-distance">Distance from GP Sakoli Campus (km) *</label>
                  <input
                    type="number"
                    id="reg-distance"
                    name="distanceFromCollege"
                    min="0"
                    step="0.1"
                    required
                    placeholder="Approx distance in kilometers (e.g. 52)"
                    value={formData.distanceFromCollege}
                    onChange={handleChange}
                  />
                </div>
                <div className="adm-form-group">
                  <label htmlFor="reg-remarks">Special Notes / Medical / Preferences (Optional)</label>
                  <input
                    type="text"
                    id="reg-remarks"
                    name="remarks"
                    placeholder="e.g. Request ground floor room, sports quota, etc."
                    value={formData.remarks}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="adm-form-footer">
                <button
                  type="button"
                  className="adm-btn adm-btn-secondary"
                  onClick={onClose}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="adm-btn adm-btn-primary"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="adm-spinner"></span>
                      Submitting Application...
                    </>
                  ) : (
                    '&#128221; Submit Hostel Admission Application'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
