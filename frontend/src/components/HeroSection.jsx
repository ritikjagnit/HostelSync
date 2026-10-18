import React from 'react';
import './HeroSection.css';

export default function HeroSection() {
  return (
    <section className="hero-section" id="welcome-hero">
      <div className="container hero-container">
        <div className="hero-badge-wrap">
          <span className="badge badge-primary">
            Government Polytechnic Sakoli &bull; Directorate of Technical Education, Maharashtra
          </span>
        </div>

        <h1 className="hero-title" id="page-main-heading">
          HostelSync
        </h1>

        <p className="hero-subtitle">
          Smart Digital Hostel Management System
        </p>

        <p className="hero-description">
          A modern, unified digital platform designed to streamline hostel administration, student room allocations, verified gate pass workflows, and grievance management for Government Polytechnic Sakoli.
        </p>

        <div className="hero-specs-row">
          <div className="spec-badge">
            <span className="spec-label">Architecture</span>
            <span className="spec-value">React 19 + Spring Boot 3.4 REST</span>
          </div>
          <div className="spec-badge">
            <span className="spec-label">Persistence</span>
            <span className="spec-value">PostgreSQL 16 Relational</span>
          </div>
          <div className="spec-badge">
            <span className="spec-label">Environment</span>
            <span className="spec-value">Decoupled Full-Stack Architecture</span>
          </div>
        </div>
      </div>
    </section>
  );
}
