import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const ProtectedRoute = () => {
  const { currentUser, loading } = useAuth();
  
  // For testing purposes, bypass authentication check temporarily
  // This will allow you to access the dashboard without login
  if (process.env.NODE_ENV === 'development') {
    console.log('Development mode: Bypassing authentication check');
    return <Outlet />;
  }
  
  // If the authentication is still loading, show a loading spinner or message
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }
  
  // If user is not authenticated, redirect to login
  if (!currentUser) {
    return <Navigate to="/login" />;
  }
  
  // If authenticated, show the child routes
  return <Outlet />;
};

export default ProtectedRoute;