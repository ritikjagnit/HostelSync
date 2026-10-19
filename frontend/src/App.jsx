import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import HostelLandingPage from './components/HostelLandingPage';
import Footer from './components/Footer';
import LoginPage from './pages/LoginPage';
import AdminPortal from './pages/AdminPortal';
import WardenPortal from './pages/WardenPortal';
import StudentPortal from './pages/StudentPortal';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  return (
    <div className="app-layout" id="hostelsync-app">
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<HostelLandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminPortal />
              </ProtectedRoute>
            }
          />
          <Route
            path="/warden"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'WARDEN']}>
                <WardenPortal />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <StudentPortal />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
