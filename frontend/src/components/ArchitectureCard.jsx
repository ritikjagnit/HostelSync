import React from 'react';
import './ArchitectureCard.css';

export default function ArchitectureCard() {
  const tiers = [
    {
      id: 'tier-frontend',
      title: 'Frontend Tier',
      technology: 'React.js 19 + Vite',
      language: 'JavaScript (ES Modules)',
      features: [
        'Vite build tooling and HMR',
        'Vanilla CSS design system',
        'Decoupled REST API consumer',
        'Institutional blue & white theme'
      ],
      status: 'Initialized & Active'
    },
    {
      id: 'tier-backend',
      title: 'Backend Tier',
      technology: 'Spring Boot 3.4.3',
      language: 'Java 21 (LTS) & Maven',
      features: [
        'Layered architecture (controller, service, dto)',
        'REST health endpoint (/api/health)',
        'Jakarta validation & exception handling',
        'Cross-Origin Resource Sharing (CORS)'
      ],
      status: 'Configured & Ready'
    },
    {
      id: 'tier-database',
      title: 'Database Tier',
      technology: 'PostgreSQL 16',
      language: 'Relational SQL & JPA',
      features: [
        'Environment-driven datasource config',
        'Zero hardcoded passwords',
        'Relational schema design (hostels, beds, passes)',
        'Non-blocking health verification'
      ],
      status: 'Documented for Phase 2'
    }
  ];

  return (
    <section className="architecture-section" id="architecture-overview">
      <div className="section-header">
        <h2 className="section-title">System Architecture Overview</h2>
        <p className="section-subtitle">
          Established three-tier architecture for Government Polytechnic Sakoli HostelSync
        </p>
      </div>

      <div className="tiers-grid">
        {tiers.map((tier) => (
          <div key={tier.id} className="card tier-card" id={tier.id}>
            <div className="tier-header">
              <span className="tier-tag">{tier.title}</span>
              <span className="badge badge-neutral">{tier.status}</span>
            </div>

            <h3 className="tier-tech">{tier.technology}</h3>
            <p className="tier-lang">{tier.language}</p>

            <ul className="tier-features-list">
              {tier.features.map((feature, idx) => (
                <li key={idx} className="tier-feature-item">
                  <span className="check-bullet">&bull;</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
