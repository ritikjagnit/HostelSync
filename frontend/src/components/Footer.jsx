import React from 'react';
import './Footer.css';

const CURRENT_YEAR = new Date().getFullYear();

export default function Footer() {
  return (
    <footer className="footer" id="main-footer">
      <div className="container footer-container">
        <div className="footer-top">
          <div className="footer-brand">
            <h4 className="footer-title">HostelSync</h4>
            <p className="footer-tagline">Smart Digital Hostel Management System</p>
            <p className="footer-inst">
              Government Polytechnic Sakoli &bull; Dist. Bhandara, Maharashtra, India
            </p>
          </div>

          <div className="footer-meta">
            <div className="footer-stack">
              <span className="stack-badge">React 19</span>
              <span className="stack-badge">Vite</span>
              <span className="stack-badge">Java 21</span>
              <span className="stack-badge">Spring Boot 3.4</span>
              <span className="stack-badge">PostgreSQL</span>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p className="copyright">
            &copy; {CURRENT_YEAR} Government Polytechnic Sakoli. All rights reserved.
          </p>
          <p className="build-stage">
            Phase 1 Foundation Setup &bull; Production Architecture Ready
          </p>
        </div>
      </div>
    </footer>
  );
}
