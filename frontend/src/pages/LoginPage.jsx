import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMedia } from '../config/media';
import ImageWithFallback from '../components/ImageWithFallback';
import './LoginPage.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const heroMedia = getMedia('loginHero');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim() || !password) {
      setErrorMessage('Please enter both your institutional email and password.');
      return;
    }

    setLoading(true);
    try {
      const user = await login(email.trim(), password);

      const from = location.state?.from?.pathname;
      if (from && from !== '/login') {
        navigate(from, { replace: true });
      } else {
        switch (user.role) {
          case 'ADMIN':
            navigate('/admin', { replace: true });
            break;
          case 'WARDEN':
            navigate('/warden', { replace: true });
            break;
          case 'STUDENT':
          default:
            navigate('/student', { replace: true });
            break;
        }
      }
    } catch (err) {
      setErrorMessage(err.message || 'Authentication failed. Please check your institutional email and password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-split-page">
      <div className="login-split-container">
        {/* Visual Brand Side */}
        <div className="login-hero-panel">
          <div className="login-hero-image-wrap">
            <ImageWithFallback
              src={heroMedia.localSrc}
              fallbackSrc={heroMedia.remoteFallback}
              alt={heroMedia.alt}
              className="login-hero-image"
              aspectRatio="auto"
              loading="eager"
            />
            <div className="login-hero-overlay"></div>
          </div>

          <div className="login-hero-content">
            <div className="login-hero-badge">
              <span className="hero-pill">Government Polytechnic Sakoli</span>
            </div>

            <h1 className="login-hero-title">
              HostelSync
              <span className="login-hero-sub">Digital Hostel Management System</span>
            </h1>

            <p className="login-hero-desc">
              Integrated campus residence governance uniting administration, duty wardens, and polytechnic students in an institutional software ecosystem.
            </p>

            <div className="login-features-list">
              <div className="login-feature-item">
                <div className="feature-icon">&#10003;</div>
                <div>
                  <strong>Night Roll Call Oversight</strong>
                  <span>Verified hostel residency tracking &amp; attendance audits</span>
                </div>
              </div>
              <div className="login-feature-item">
                <div className="feature-icon">&#10003;</div>
                <div>
                  <strong>Controlled Room Inventory</strong>
                  <span>Capacity-aware bed allocation without over-allotment</span>
                </div>
              </div>
              <div className="login-feature-item">
                <div className="feature-icon">&#10003;</div>
                <div>
                  <strong>Student Self-Service</strong>
                  <span>Personal room occupancy metrics &amp; attendance records</span>
                </div>
              </div>
            </div>

            <div className="login-photo-attribution">
              <span>{heroMedia.credit} &bull; Demonstration Institutional Photography</span>
            </div>
          </div>
        </div>

        {/* Login Form Side */}
        <div className="login-form-panel">
          <div className="login-form-card">
            <div className="login-brand-header">
              <div className="login-emblem">
                <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" width="40" height="40">
                  <rect width="48" height="48" rx="10" fill="#0B192C"/>
                  <path d="M12 36V18L24 9L36 18V36H28V26H20V36H12Z" fill="#1E3E62"/>
                  <circle cx="24" cy="20" r="3" fill="#10B981"/>
                  <path d="M29 32C32 32 34 30 34 27" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <div>
                <span className="inst-label">Government Polytechnic Sakoli</span>
                <h2 className="login-heading">Sign In to HostelSync</h2>
              </div>
            </div>

            <p className="login-subtext">
              Enter your verified institutional credentials to access your designated administrative or resident portal.
            </p>

            {errorMessage && (
              <div className="login-error-alert" role="alert" aria-live="assertive">
                <span className="error-icon">&#9888;</span>
                <div className="error-content">
                  <strong>Authentication Failed</strong>
                  <p>{errorMessage}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="login-form" noValidate>
              <div className="form-group">
                <label htmlFor="login-email" className="form-label">
                  Institutional Email Address
                </label>
                <div className="input-with-icon">
                  <span className="input-icon" aria-hidden="true">&#9993;</span>
                  <input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. admin@gpsakoli.ac.in"
                    className="form-input with-left-icon"
                    autoComplete="email"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="form-group">
                <div className="label-row">
                  <label htmlFor="login-password" className="form-label">
                    Password
                  </label>
                </div>
                <div className="input-with-icon">
                  <span className="input-icon" aria-hidden="true">&#128274;</span>
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your account password"
                    className="form-input with-left-icon with-right-icon"
                    autoComplete="current-password"
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="btn-toggle-password"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    tabIndex={0}
                  >
                    {showPassword ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                id="btn-login-submit"
                className="btn btn-primary login-submit-btn"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    <span>Authenticating credentials...</span>
                  </>
                ) : (
                  <span>Sign In to Portal &rarr;</span>
                )}
              </button>
            </form>

            <div className="login-card-footer">
              <div className="credential-hint-box">
                <span className="hint-tag">Authorized Access Only</span>
                <p>
                  Institutional accounts are provisioned by the Principal and Hostel Rector Office. Use your assigned Government Polytechnic Sakoli email address.
                </p>
              </div>

              <div className="login-back-nav">
                <Link to="/" className="back-link">&larr; Return to Institutional Welcome</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
