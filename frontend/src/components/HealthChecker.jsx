import React, { useState, useEffect, useCallback } from 'react';
import { getApiUrl } from '../config/api';
import './HealthChecker.css';

export default function HealthChecker() {
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastChecked, setLastChecked] = useState(null);

  const checkHealth = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(getApiUrl('/api/health'));
      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      setHealthData(data);
    } catch (err) {
      setError(err.message || 'Unable to connect to Spring Boot backend');
      setHealthData(null);
    } finally {
      setLastChecked(new Date().toLocaleTimeString());
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    fetch(getApiUrl('/api/health'))
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP Error ${res.status}: ${res.statusText}`);
        }
        return res.json();
      })
      .then((data) => {
        if (active) {
          setHealthData(data);
          setError(null);
          setLastChecked(new Date().toLocaleTimeString());
          setLoading(false);
        }
      })
      .catch((err) => {
        if (active) {
          setHealthData(null);
          setError(err.message || 'Unable to connect to Spring Boot backend');
          setLastChecked(new Date().toLocaleTimeString());
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="health-section" id="backend-health-monitor">
      <div className="card health-card">
        <div className="health-card-header">
          <div className="health-title-group">
            <div className="indicator-wrap">
              <span className={`status-pill ${healthData ? 'online' : 'offline'}`}></span>
            </div>
            <div>
              <h2 className="health-heading">Backend REST API Health Check</h2>
              <p className="health-subheading">
                Live verification of Spring Boot endpoint: <code className="endpoint-code">GET /api/health</code>
              </p>
            </div>
          </div>

          <button
            id="btn-recheck-health"
            onClick={checkHealth}
            disabled={loading}
            className="btn btn-secondary health-btn"
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                <span>Connecting...</span>
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M23 4v6h-6"></path>
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                </svg>
                <span>Check Health</span>
              </>
            )}
          </button>
        </div>

        <div className="health-body">
          {healthData && (
            <div className="health-success-box">
              <div className="status-banner success">
                <div className="banner-icon">&#10003;</div>
                <div className="banner-content">
                  <strong>Backend Service Status: {healthData.status}</strong>
                  <span>Connected successfully to Spring Boot REST Service.</span>
                </div>
              </div>

              <div className="response-grid">
                <div className="response-item">
                  <span className="response-label">Application</span>
                  <span className="response-value">{healthData.application}</span>
                </div>
                <div className="response-item">
                  <span className="response-label">Institution</span>
                  <span className="response-value">{healthData.institution}</span>
                </div>
                <div className="response-item">
                  <span className="response-label">API Version</span>
                  <span className="response-value">{healthData.version}</span>
                </div>
                <div className="response-item">
                  <span className="response-label">Server Timestamp</span>
                  <span className="response-value mono">{healthData.timestamp}</span>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="health-error-box">
              <div className="status-banner warning">
                <div className="banner-icon">!</div>
                <div className="banner-content">
                  <strong>Backend Service Not Detected on Port 8080</strong>
                  <span>The frontend is running, but the Spring Boot backend is currently offline.</span>
                </div>
              </div>

              <div className="troubleshoot-guide">
                <p className="guide-title">How to start the Spring Boot backend:</p>
                <div className="code-block-cmd">
                  <code>cd backend</code>
                  <code>mvn spring-boot:run</code>
                </div>
                <p className="guide-note">
                  Once started, the backend will listen on <code>http://localhost:8080</code> and handle <code>/api/health</code> requests.
                </p>
              </div>
            </div>
          )}

          {lastChecked && (
            <div className="health-footer-info">
              <span>Last checked at: {lastChecked}</span>
              <span className="separator">&bull;</span>
              <span>Proxy target: <code>http://localhost:8080</code></span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
