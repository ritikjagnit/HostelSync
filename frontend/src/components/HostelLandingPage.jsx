import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import ImageWithFallback from './ImageWithFallback';
import { MEDIA_REGISTRY } from '../config/media';
import HealthChecker from './HealthChecker';
import ArchitectureCard from './ArchitectureCard';
import HostelRegistrationModal from './HostelRegistrationModal';
import AdmissionStatusModal from './AdmissionStatusModal';
import './HostelLandingPage.css';

export default function HostelLandingPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [isRegModalOpen, setIsRegModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [trackQuery, setTrackQuery] = useState('');

  const facilities = [
    {
      id: 'boys-hostel',
      category: 'hostels',
      title: 'Sahyadri Boys Hostel',
      badge: 'Boys Residence • 160 Capacity',
      image: MEDIA_REGISTRY.boysHostel,
      specs: ['160 Sanctioned Bed Capacity', 'Solar Water Heating (6 AM - 10 PM)', '24x7 CCTV & Security Guard', 'Cooperative Student Mess Facility'],
      desc: 'Spacious multi-story residential facility situated on the main campus with lush green surroundings, dedicated dining hall, and indoor recreation provisions.'
    },
    {
      id: 'girls-hostel',
      category: 'hostels',
      title: 'Jijau Girls Hostel',
      badge: 'Girls Residence • Secure Campus',
      image: MEDIA_REGISTRY.girlsHostel,
      specs: ['Gated & CCTV-Guarded Boundary', 'Strict 6:30 PM Gate Timings', 'Dedicated Resident Lady Warden', 'Hygienic Dining & Solar Geysers'],
      desc: 'Secure and peaceful residential complex designed exclusively for female diploma engineering students with biometric entry, evening roll call, and 24x7 security surveillance.'
    },
    {
      id: 'room-units',
      category: 'rooms',
      title: 'Student Residential Rooms',
      badge: 'Standard Accommodation Unit',
      image: MEDIA_REGISTRY.roomInterior,
      specs: ['Triple & Twin Sharing Layouts', 'Individual Wooden Study Desks', 'Personal Storage Cupboards', 'Well-Ventilated & Natural Light'],
      desc: 'Ergonomically designed student living spaces equipped with individual study desks, secure cupboards, ceiling fans, and high-efficiency lighting for academic focus.'
    },
    {
      id: 'study-hall',
      category: 'amenities',
      title: 'Common Study & Reading Room',
      badge: 'Academic Amenity',
      image: MEDIA_REGISTRY.commonArea,
      specs: ['Quiet Study Desks & Tables', 'High-Speed Wi-Fi Internet', 'Technical Library Reference Shelf', 'Open 6:00 AM - 10:30 PM'],
      desc: 'Dedicated academic study space enabling collaborative learning, semester exam preparation, and digital resource access in a peaceful atmosphere.'
    }
  ];

  const notices = [
    {
      date: '19 OCT 2026',
      tag: 'Admissions',
      title: 'Hostel Room Allotment List for AY 2026-27 Announced',
      desc: 'Room allotments for first-year and direct second-year diploma students have been finalized strictly based on DTE Maharashtra merit ranks and reservation guidelines.'
    },
    {
      date: '18 OCT 2026',
      tag: 'Mandatory',
      title: 'Daily Night Roll Call Compliance Notice',
      desc: 'All residents of Sahyadri and Jijau Hostels must be present in their respective rooms during the evening roll call between 7:00 PM and 8:30 PM.'
    },
    {
      date: '15 OCT 2026',
      tag: 'Gate Pass',
      title: 'Digital Out-Pass Workflow Implementation',
      desc: 'Students leaving campus for weekend or holiday travel must submit a digital out-pass through HostelSync at least 24 hours prior to travel for Warden verification.'
    }
  ];

  const rules = [
    {
      title: '1. Curfew & Gate Timings',
      badge: 'Strict Policy',
      content: 'Girls Hostel gates are strictly locked from 6:30 PM to 7:00 AM. Unsanctioned late arrival attracts a disciplinary cash fine of ₹100. Boys Hostel curfew is strictly enforced at 9:00 PM.'
    },
    {
      title: '2. Mandatory Evening Attendance',
      badge: 'Roll Call',
      content: 'Every resident student must mark their attendance during the duty Warden’s evening roll call. Minimum 75% residency compliance is mandatory for semester hostel continuation.'
    },
    {
      title: '3. Digital Out-Pass & Leave Permits',
      badge: 'Safety First',
      content: 'Students leaving town must submit destination details, parent consent, and expected return time via HostelSync. Leaving without an authorized digital gate pass is prohibited.'
    },
    {
      title: '4. Anti-Ragging & Campus Discipline',
      badge: 'Zero Tolerance',
      content: 'Ragging in any form is strictly banned under the Maharashtra Prohibition of Ragging Act. Heavy penalties including immediate expulsion and police FIR are legally mandated.'
    },
    {
      title: '5. Electrical Appliances & Safety',
      badge: 'Hostel Safety',
      content: 'Use of high-power personal appliances (immersion heaters, electric irons, room coolers) is strictly prohibited. Solar geysers are operational between 6:00 AM to 10:00 PM.'
    },
    {
      title: '6. Mess Hygiene & Code of Conduct',
      badge: 'Dining Rules',
      content: 'Mess charges must be settled by the 10th of every month. Food waste disposal in washroom sinks is strictly prohibited. Maintain absolute peace during exam periods.'
    }
  ];

  const filteredFacilities = activeTab === 'all'
    ? facilities
    : facilities.filter(f => f.category === activeTab);

  return (
    <div className="gov-landing-page" id="hostel-landing">
      {/* 1. OFFICIAL GOVT HERO SECTION */}
      <section className="gov-hero-section">
        <div className="container gov-hero-container">
          <div className="gov-hero-text-col">
            <div className="gov-emblem-badge">
              <span className="gov-flag-dot saffron"></span>
              <span className="gov-flag-dot white"></span>
              <span className="gov-flag-dot green"></span>
              <span>DTE Code: <strong>04008</strong> &bull; Govt. of Maharashtra</span>
            </div>

            <h1 className="gov-hero-title">
              Government Polytechnic Sakoli
              <span className="gov-hero-title-sub">Smart Digital Hostel Management System</span>
            </h1>

            <p className="gov-hero-description">
              Welcome to <strong>HostelSync</strong>, the official digital residential platform for Government Polytechnic Sakoli (Dist. Bhandara). Providing secure, disciplined, and comfortable accommodation for 160+ diploma engineering students across Sahyadri Boys Hostel and Jijau Girls Hostel.
            </p>

            <div className="gov-hero-cta-group">
              <button
                type="button"
                id="hero-btn-apply"
                className="btn btn-primary gov-btn-cta gov-btn-apply-hero"
                onClick={() => setIsRegModalOpen(true)}
              >
                &#128221; Online Hostel Admission (2026-27) &rarr;
              </button>
              <button
                type="button"
                id="hero-btn-track"
                className="btn btn-secondary gov-btn-sec"
                onClick={() => {
                  setTrackQuery('');
                  setIsStatusModalOpen(true);
                }}
              >
                &#128269; Track Status
              </button>
              <Link to="/login" id="hero-btn-login" className="btn btn-secondary gov-btn-sec">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
                Sign In
              </Link>
            </div>

            <div className="gov-key-highlights">
              <div className="highlight-pill">
                <span className="highlight-icon">&#10003;</span>
                <span>Merit-Based Allotment</span>
              </div>
              <div className="highlight-pill">
                <span className="highlight-icon">&#10003;</span>
                <span>Digital Gate Pass</span>
              </div>
              <div className="highlight-pill">
                <span className="highlight-icon">&#10003;</span>
                <span>Evening Roll Call</span>
              </div>
              <div className="highlight-pill">
                <span className="highlight-icon">&#10003;</span>
                <span>Zero-Tolerance Anti-Ragging</span>
              </div>
            </div>
          </div>

          <div className="gov-hero-visual-col">
            <div className="gov-photo-card-showcase">
              <ImageWithFallback
                src={MEDIA_REGISTRY.campusHero}
                alt={MEDIA_REGISTRY.campusHero.alt}
                className="gov-hero-main-img"
                aspectRatio="16/10"
              />
              <div className="gov-hero-img-overlay"></div>
              <div className="gov-hero-floating-tag">
                <div className="tag-symbol">&#127963;</div>
                <div>
                  <div className="tag-headline">Sendurwafa Campus Residential Complex</div>
                  <div className="tag-subline">Sakoli, Bhandara District, Maharashtra &bull; Pin: 441802</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. LIVE ANNOUNCEMENTS / NOTICE TICKER */}
      <section className="gov-ticker-section">
        <div className="container gov-ticker-container">
          <div className="gov-ticker-label">
            <span className="ticker-live-dot"></span>
            <span>NOTICES &amp; ALERTS</span>
          </div>
          <div className="gov-ticker-content">
            <div className="ticker-item">
              <span className="badge badge-primary">ADMISSIONS</span>
              <span>Hostel room allotment for 2026-27 published as per DTE merit ranking and reservation quota.</span>
            </div>
            <div className="ticker-item">
              <span className="badge badge-success">TIMINGS</span>
              <span>Girls Hostel gate strictly closes at 6:30 PM. Mandatory evening roll-call is held between 7:00 PM – 8:30 PM.</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. RESIDENTIAL STATS STRIP */}
      <section className="gov-stats-strip">
        <div className="container">
          <div className="gov-stats-grid">
            <div className="gov-stat-box">
              <div className="gov-stat-val">160+</div>
              <div className="gov-stat-label">Sanctioned Bed Capacity</div>
              <div className="gov-stat-sub">Across Boys &amp; Girls Hostels</div>
            </div>
            <div className="gov-stat-box">
              <div className="gov-stat-val">2</div>
              <div className="gov-stat-label">Residential Hostels</div>
              <div className="gov-stat-sub">Sahyadri &amp; Jijau Blocks</div>
            </div>
            <div className="gov-stat-box">
              <div className="gov-stat-val">24x7</div>
              <div className="gov-stat-label">CCTV &amp; Guard Security</div>
              <div className="gov-stat-sub">Monitored Institutional Gates</div>
            </div>
            <div className="gov-stat-box">
              <div className="gov-stat-val">100%</div>
              <div className="gov-stat-label">Ragging-Free Guarantee</div>
              <div className="gov-stat-sub">Statutory Compliance</div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. ONLINE HOSTEL ADMISSIONS & MERIT SELECTION WORKFLOW */}
      <section className="gov-section gov-admission-section" id="hostel-admissions">
        <div className="container">
          <div className="gov-section-header">
            <span className="gov-section-tag">Academic Session 2026-2027</span>
            <h2 className="gov-section-title">Hostel Admission &amp; Selection Procedure</h2>
            <p className="gov-section-subtitle">
              Complete digital workflow: Students submit online applications, Hostel In-Charge verifies merit and eligibility, and allocates vacant rooms in Sahyadri Boys or Jijau Girls Hostel.
            </p>
          </div>

          <div className="gov-admission-workflow-grid">
            <div className="gov-step-card">
              <div className="gov-step-num">01</div>
              <div className="gov-step-icon">&#128221;</div>
              <h3 className="gov-step-title">Online Registration</h3>
              <p className="gov-step-desc">
                Prospective student submits personal details, diploma course, semester, SSC / Diploma merit percentage, and permanent home address with distance from Sakoli.
              </p>
            </div>

            <div className="gov-step-card">
              <div className="gov-step-num">02</div>
              <div className="gov-step-icon">&#128269;</div>
              <h3 className="gov-step-title">In-Charge Scrutiny</h3>
              <p className="gov-step-desc">
                Hostel In-Charge (Rector Dr. K. N. Potode &amp; Wardens) review applications against DTE Maharashtra merit norms, reservation quota, and travel distance criteria.
              </p>
            </div>

            <div className="gov-step-card">
              <div className="gov-step-num">03</div>
              <div className="gov-step-icon">&#9989;</div>
              <h3 className="gov-step-title">Shortlisting &amp; Selection</h3>
              <p className="gov-step-desc">
                Hostel In-Charge selects eligible candidates to the official Shortlist (Status: SELECTED). Applicants can track their live status using their application reference.
              </p>
            </div>

            <div className="gov-step-card">
              <div className="gov-step-num">04</div>
              <div className="gov-step-icon">&#128716;</div>
              <h3 className="gov-step-title">Room Allotment &amp; Key Handover</h3>
              <p className="gov-step-desc">
                Warden assigns the resident to a vacant room bed in Sahyadri Boys Hostel or Jijau Girls Hostel. Student login portal is automatically activated upon admission!
              </p>
            </div>
          </div>

          <div className="gov-admission-cta-card">
            <div className="gov-admission-cta-info">
              <h3>Ready to Join Government Polytechnic Sakoli Hostel?</h3>
              <p>Applications are actively reviewed on rolling merit lists. Register your details or track existing application status online.</p>
            </div>
            <div className="gov-admission-cta-btns">
              <button
                type="button"
                className="btn btn-primary gov-btn-cta"
                onClick={() => setIsRegModalOpen(true)}
              >
                &#128221; Apply for Hostel Admission
              </button>
              <button
                type="button"
                className="btn btn-secondary gov-btn-sec"
                onClick={() => {
                  setTrackQuery('');
                  setIsStatusModalOpen(true);
                }}
              >
                &#128269; Track Application Status
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 5. HOSTEL FACILITIES & INFRASTRUCTURE */}
      <section className="gov-section" id="hostel-facilities">
        <div className="container">
          <div className="gov-section-header">
            <span className="gov-section-tag">Residential Infrastructure</span>
            <h2 className="gov-section-title">Hostel Facilities &amp; Campus Living</h2>
            <p className="gov-section-subtitle">
              Government Polytechnic Sakoli provides modern, hygienic, and disciplined student accommodation fostering academic excellence and personal growth.
            </p>

            <div className="gov-filter-buttons">
              <button
                className={`gov-filter-btn ${activeTab === 'all' ? 'active' : ''}`}
                onClick={() => setActiveTab('all')}
              >
                All Facilities
              </button>
              <button
                className={`gov-filter-btn ${activeTab === 'hostels' ? 'active' : ''}`}
                onClick={() => setActiveTab('hostels')}
              >
                Hostel Buildings
              </button>
              <button
                className={`gov-filter-btn ${activeTab === 'rooms' ? 'active' : ''}`}
                onClick={() => setActiveTab('rooms')}
              >
                Room Units
              </button>
              <button
                className={`gov-filter-btn ${activeTab === 'amenities' ? 'active' : ''}`}
                onClick={() => setActiveTab('amenities')}
              >
                Study &amp; Amenities
              </button>
            </div>
          </div>

          <div className="gov-facilities-grid">
            {filteredFacilities.map((facility) => (
              <div key={facility.id} className="gov-facility-card">
                <div className="gov-facility-media">
                  <ImageWithFallback
                    src={facility.image}
                    alt={facility.title}
                    className="gov-facility-img"
                    aspectRatio="16/10"
                  />
                  <div className="gov-facility-overlay"></div>
                  <span className="gov-facility-badge">{facility.badge}</span>
                </div>
                <div className="gov-facility-body">
                  <h3 className="gov-facility-title">{facility.title}</h3>
                  <p className="gov-facility-desc">{facility.desc}</p>

                  <div className="gov-facility-specs">
                    {facility.specs.map((spec, i) => (
                      <div key={i} className="spec-item">
                        <span className="spec-bullet">&bull;</span>
                        <span>{spec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. HOSTEL RULES & TIMINGS */}
      <section className="gov-section gov-section-alt" id="hostel-rules">
        <div className="container">
          <div className="gov-section-header">
            <span className="gov-section-tag">Discipline &amp; Safety</span>
            <h2 className="gov-section-title">Hostel Rules &amp; Regulations</h2>
            <p className="gov-section-subtitle">
              Official institutional code of conduct established by Government Polytechnic Sakoli to maintain a secure, scholarly, and orderly residential environment.
            </p>
          </div>

          <div className="gov-rules-grid">
            {rules.map((rule, idx) => (
              <div key={idx} className="gov-rule-card">
                <div className="gov-rule-header">
                  <h3 className="gov-rule-title">{rule.title}</h3>
                  <span className="badge badge-primary">{rule.badge}</span>
                </div>
                <p className="gov-rule-content">{rule.content}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. HOSTEL ADMINISTRATION & RECTORY CONTACT */}
      <section className="gov-section" id="hostel-administration">
        <div className="container">
          <div className="gov-section-header">
            <span className="gov-section-tag">Administrative Purview</span>
            <h2 className="gov-section-title">Hostel Rectory &amp; Contact Desk</h2>
            <p className="gov-section-subtitle">
              For hostel admissions, allotment grievances, or emergency assistance, reach out to the designated institutional authorities during office hours.
            </p>
          </div>

          <div className="gov-admin-contact-grid">
            <div className="gov-contact-card">
              <div className="contact-role-badge">Institutional Leadership</div>
              <h3 className="contact-name">Principal &amp; Chief Warden</h3>
              <p className="contact-designation">Government Polytechnic Sakoli</p>
              <div className="contact-details">
                <div className="contact-row">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  <span>Sendurwafa, Sakoli, Dist. Bhandara, Maharashtra - 441802</span>
                </div>
                <div className="contact-row">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  <span>office.gpsakoli@dtemaharashtra.gov.in</span>
                </div>
                <div className="contact-row">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                  <span>Office Helpline: 07186-295112</span>
                </div>
              </div>
            </div>

            <div className="gov-contact-card highlighted">
              <div className="contact-role-badge">Hostel Rector Desk</div>
              <h3 className="contact-name">Dr. K. N. Potode</h3>
              <p className="contact-designation">Rector / Sr. Lecturer in Electrical Engineering</p>
              <div className="contact-details">
                <div className="contact-row">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                  <span>Direct Contact: <strong>9890381189</strong></span>
                </div>
                <div className="contact-row">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  <span>Visiting Hours: 10:30 AM to 5:00 PM (Working Days)</span>
                </div>
                <div className="contact-row">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  <span>Supervises Sahyadri Boys Hostel &amp; Student Welfare</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. RECENT NOTICES & CIRCULARS */}
      <section className="gov-section gov-section-alt" id="hostel-notices">
        <div className="container">
          <div className="gov-section-header">
            <span className="gov-section-tag">Official Circulars</span>
            <h2 className="gov-section-title">Institutional Notifications &amp; Schedules</h2>
            <p className="gov-section-subtitle">
              Stay updated with authentic announcements, room allocation timelines, and curfew updates.
            </p>
          </div>

          <div className="gov-notices-list">
            {notices.map((notice, i) => (
              <div key={i} className="gov-notice-item">
                <div className="notice-date-box">
                  <span className="notice-day">{notice.date.split(' ')[0]}</span>
                  <span className="notice-month">{notice.date.split(' ')[1]} {notice.date.split(' ')[2]}</span>
                </div>
                <div className="notice-content">
                  <div className="notice-meta">
                    <span className="badge badge-primary">{notice.tag}</span>
                  </div>
                  <h3 className="notice-title">{notice.title}</h3>
                  <p className="notice-desc">{notice.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. SYSTEM ARCHITECTURE & INTEGRITY (DEVELOPER/AUDIT TIER) */}
      <section className="gov-section" id="system-architecture">
        <div className="container">
          <div className="gov-section-header">
            <span className="gov-section-tag">System Governance</span>
            <h2 className="gov-section-title">Technical Architecture &amp; Service Health</h2>
            <p className="gov-section-subtitle">
              Enterprise-grade three-tier decoupled architecture ensuring institutional reliability, data integrity, and compliance.
            </p>
          </div>

          <HealthChecker />
          <ArchitectureCard />
        </div>
      </section>

      {/* MODALS */}
      <HostelRegistrationModal
        isOpen={isRegModalOpen}
        onClose={() => setIsRegModalOpen(false)}
        onTrackStatusClick={(appNum) => {
          setTrackQuery(appNum);
          setIsStatusModalOpen(true);
        }}
      />

      <AdmissionStatusModal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        initialQuery={trackQuery}
      />
    </div>
  );
}
