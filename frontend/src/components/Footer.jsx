import React from 'react';
import './Footer.css';

const CURRENT_YEAR = new Date().getFullYear();

export default function Footer() {
  return (
    <footer className="footer" id="main-footer">
      <div className="gov-footer-tricolor"></div>
      <div className="container footer-container">
        <div className="footer-top-grid">
          {/* Col 1: Institute Branding */}
          <div className="footer-col">
            <div className="footer-brand-title">HostelSync &bull; GP Sakoli</div>
            <p className="footer-lead">
              Smart Digital Residential System for Government Polytechnic Sakoli. Managing residential accommodation, automated bed inventory, night roll call, and student welfare under DTE Maharashtra.
            </p>
            <div className="footer-gov-seal">
              <span>Directorate of Technical Education (DTE)</span>
              <strong>Institute Code: 04008</strong>
            </div>
          </div>

          {/* Col 2: Institutional Contact */}
          <div className="footer-col">
            <h4 className="footer-col-heading">Campus Address &amp; Contact</h4>
            <div className="footer-address">
              <p>Government Polytechnic Sakoli</p>
              <p>Sendurwafa, Sakoli, District Bhandara</p>
              <p>Maharashtra, India &bull; PIN: 441802</p>
              <p style={{ marginTop: '0.5rem' }}>Telephone: <strong>07186-295112</strong></p>
              <p>Office: <a href="mailto:office.gpsakoli@dtemaharashtra.gov.in">office.gpsakoli@dtemaharashtra.gov.in</a></p>
            </div>
          </div>

          {/* Col 3: Hostels & Emergency Help */}
          <div className="footer-col">
            <h4 className="footer-col-heading">Hostel Helplines &amp; Emergency</h4>
            <div className="footer-helplines">
              <p>Hostel Rector (Dr. K. N. Potode): <strong>9890381189</strong></p>
              <p>Sahyadri Boys Hostel Desk: <strong>Sendurwafa Campus</strong></p>
              <p>Jijau Girls Hostel Desk: <strong>Campus Gated Enclosure</strong></p>
              <p style={{ marginTop: '0.5rem' }}>National Anti-Ragging Helpline: <strong>1800-180-5522</strong></p>
              <p>Emergency Services: Police <strong>112</strong> &bull; Ambulance <strong>108</strong></p>
            </div>
          </div>

          {/* Col 4: Important Links */}
          <div className="footer-col">
            <h4 className="footer-col-heading">Official Portals</h4>
            <ul className="footer-links-list">
              <li>
                <a href="https://www.gpsakoli.ac.in/" target="_blank" rel="noopener noreferrer">
                  GP Sakoli Official Website &rarr;
                </a>
              </li>
              <li>
                <a href="https://dtemaharashtra.gov.in" target="_blank" rel="noopener noreferrer">
                  DTE Maharashtra Portal &rarr;
                </a>
              </li>
              <li>
                <a href="https://msbte.org.in" target="_blank" rel="noopener noreferrer">
                  MSBTE Mumbai Portal &rarr;
                </a>
              </li>
              <li>
                <a href="https://www.antiragging.in" target="_blank" rel="noopener noreferrer">
                  National Anti-Ragging Portal &rarr;
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p className="copyright">
            &copy; {CURRENT_YEAR} Government Polytechnic Sakoli (DTE Code: 04008). All Rights Reserved.
          </p>
          <p className="build-stage">
            HostelSync Digital Campus Portal &bull; Enterprise Institutional Architecture
          </p>
        </div>
      </div>
    </footer>
  );
}
