import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

function ProtectedRoute({ children, requiredRole }) {
  const { currentUser, userRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  // If a specific role is required for the route
  if (requiredRole && userRole !== requiredRole) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger" role="alert">
          You don't have permission to access this page.
        </div>
      </div>
    );
  }

  return children;
}

export default ProtectedRoute;
