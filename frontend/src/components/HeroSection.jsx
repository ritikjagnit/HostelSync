import React from 'react';
import { Link } from 'react-router-dom';
import ImageWithFallback from './ImageWithFallback';
import { MEDIA_REGISTRY } from '../config/media';
import './HeroSection.css';

export default function HeroSection() {
  const heroImage = MEDIA_REGISTRY.campusHero;

  return (
    <section className="hero-section" id="welcome-hero">
      <div className="container hero-container">
        <div className="hero-content-col">
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
            A modern, unified institutional platform designed to streamline hostel infrastructure governance, residential student admissions, real-time bed allocations, and daily night roll-call oversight for Government Polytechnic Sakoli.
          </p>

          <div className="hero-actions-row">
            <Link to="/login" className="btn btn-primary">
              Sign In to Portal &rarr;
            </Link>
            <a href="#system-health" className="btn btn-secondary">
              System Architecture & Health
            </a>
          </div>

          <div className="hero-specs-row">
            <div className="spec-badge">
              <span className="spec-label">Frontend</span>
              <span className="spec-value">React 19 + Vite</span>
            </div>
            <div className="spec-badge">
              <span className="spec-label">Backend</span>
              <span className="spec-value">Spring Boot 3.4.3</span>
            </div>
            <div className="spec-badge">
              <span className="spec-label">Security</span>
              <span className="spec-value">Spring Security + JWT</span>
            </div>
          </div>
        </div>

        <div className="hero-visual-col">
          <div className="hero-photo-frame">
            <ImageWithFallback
              src={heroImage.src}
              fallbackSrc={heroImage.fallbackSrc}
              alt={heroImage.alt}
              className="hero-campus-photo"
            />
            <div className="hero-photo-gradient-overlay"></div>
            <div className="hero-photo-floating-card">
              <div className="floating-card-icon">&#127963;</div>
              <div>
                <div className="floating-card-title">Residential Campus Complex</div>
                <div className="floating-card-subtitle">Sakoli, Bhandara District, Maharashtra</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
