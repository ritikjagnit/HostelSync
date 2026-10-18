import React from 'react';
import './RoleOverview.css';

export default function RoleOverview() {
  const roles = [
    {
      id: 'role-admin',
      title: 'Admin',
      badge: 'Institutional Governance',
      persona: 'Principal / Head of Institute / Hostel In-Charge',
      responsibilities: [
        'Global hostel and block configuration',
        'Warden appointment and assignment',
        'Fee structure definition and audit reviews',
        'Compliance, safety protocols, and institute reports'
      ]
    },
    {
      id: 'role-warden',
      title: 'Warden',
      badge: 'Hostel Operations',
      persona: 'Faculty Wardens & Hostel Superintendents',
      responsibilities: [
        'Bed allocation and room occupancy audits',
        'Digital gate pass and leave verification',
        'Grievance ticketing and maintenance supervision',
        'Daily student roll-call and emergency coordination'
      ]
    },
    {
      id: 'role-student',
      title: 'Student',
      badge: 'Resident Services',
      persona: 'Polytechnic Engineering Diploma Residents',
      responsibilities: [
        'Online hostel admission and room allotment',
        'Digital gate pass and leave submission',
        'Maintenance complaint filing and status tracking',
        'Digital fee receipt submission and mess notices'
      ]
    }
  ];

  return (
    <section className="roles-section" id="role-architecture">
      <div className="section-header">
        <h2 className="section-title">Planned Institutional Roles</h2>
        <p className="section-subtitle">
          Role-Based Access Control (RBAC) matrix planned for subsequent implementation phases
        </p>
      </div>

      <div className="roles-grid">
        {roles.map((role) => (
          <div key={role.id} className="card role-card" id={role.id}>
            <div className="role-header">
              <span className="badge badge-primary">{role.badge}</span>
              <h3 className="role-title">{role.title}</h3>
              <p className="role-persona">{role.persona}</p>
            </div>

            <div className="role-body">
              <span className="responsibilities-heading">Core Scope:</span>
              <ul className="role-list">
                {role.responsibilities.map((resp, idx) => (
                  <li key={idx} className="role-item">
                    <span className="bullet-dot">&#9679;</span>
                    <span>{resp}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
