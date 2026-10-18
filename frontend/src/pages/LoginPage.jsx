import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './LoginPage.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim() || !password) {
      setErrorMessage('Please enter both your institutional email and password.');
      return;
    }

    setLoading(true);
    try {
      const user = await login(email, password);

      // Determine redirect destination based on user's role or from state
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
      setErrorMessage(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-wrapper">
      <div className="login-card card">
        <div className="login-header">
          <div className="login-badge-wrap">
            <span className="badge badge-primary">Government Polytechnic Sakoli</span>
          </div>
          <h2 className="login-title">HostelSync Sign In</h2>
          <p className="login-subtitle">
            Enter your institutional credentials to access your designated portal
          </p>
        </div>

        {errorMessage && (
          <div className="login-error-alert" role="alert">
            <div className="error-icon">&#9888;</div>
            <div className="error-text">{errorMessage}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="login-email" className="form-label">
              Institutional Email
            </label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. user@gpsakoli.ac.in"
              className="form-input"
              autoComplete="email"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="login-password" className="form-label">
              Password
            </label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your account password"
              className="form-input"
              autoComplete="current-password"
              required
              disabled={loading}
            />
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
                <span>Authenticating...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        <div className="login-footer">
          <p className="login-hint">
            Account credentials are assigned by the hostel rector office. Contact hostel administration if you require access.
          </p>
          <div className="login-back-link">
            <Link to="/">&larr; Return to Welcome Portal</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
