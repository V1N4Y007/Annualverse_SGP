import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

// Components
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Dashboard from './components/Dashboard/Dashboard';
import ReportList from './components/Reports/ReportList';
import ReportUpload from './components/Reports/ReportUpload';
import ReportView from './components/Reports/ReportView';
import ReportGenerator from './components/Reports/ReportGenerator';
import UserProfile from './components/Profile/UserProfile';
import Header from './components/Layout/Header';
import ProtectedRoute from './components/Auth/ProtectedRoute';

function App() {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      {currentUser && <Header />}
      <div className="container-fluid">
        <Routes>
          <Route path="/login" element={!currentUser ? <Login /> : <Navigate to="/" />} />
          <Route path="/register" element={!currentUser ? <Register /> : <Navigate to="/" />} />
          
          <Route path="/" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/reports" element={
            <ProtectedRoute>
              <ReportList />
            </ProtectedRoute>
          } />
          
          <Route path="/reports/upload" element={
            <ProtectedRoute>
              <ReportUpload />
            </ProtectedRoute>
          } />
          
          <Route path="/reports/:id" element={
            <ProtectedRoute>
              <ReportView />
            </ProtectedRoute>
          } />
          
          <Route path="/profile" element={
            <ProtectedRoute>
              <UserProfile />
            </ProtectedRoute>
          } />
          
          <Route path="/reports/generate" element={
            <ProtectedRoute>
              <ReportGenerator />
            </ProtectedRoute>
          } />
        </Routes>
      </div>
    </div>
  );
}

export default App;
