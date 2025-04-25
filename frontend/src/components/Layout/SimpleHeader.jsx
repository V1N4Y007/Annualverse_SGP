import React from 'react';
import { Link } from 'react-router-dom';

const SimpleHeader = ({ user, login, logout }) => {
  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
      <div className="container-fluid">
        <Link to="/" className="navbar-brand">Annual Report Portal</Link>
        
        <button 
          className="navbar-toggler" 
          type="button" 
          data-bs-toggle="collapse" 
          data-bs-target="#navbarNav"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <Link to="/" className="nav-link">Generate Annual Report</Link>
            </li>
          </ul>
          
          <div className="navbar-nav">
            {user ? (
              <div className="d-flex align-items-center">
                <span className="text-light me-3">
                  Welcome, {user.displayName || user.email}
                </span>
                <button onClick={logout} className="btn btn-outline-light btn-sm">
                  Logout
                </button>
              </div>
            ) : (
              <button onClick={login} className="btn btn-outline-light btn-sm">
                Login as Demo User
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default SimpleHeader;