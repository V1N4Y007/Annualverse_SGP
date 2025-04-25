import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

function Header() {
  const { currentUser, userRole, logout } = useAuth();
  const [error, setError] = useState('');
  const navigate = useNavigate();
  
  async function handleLogout() {
    setError('');
    
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      setError('Failed to log out');
      console.error(error);
    }
  }

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
              <Link to="/" className="nav-link">Dashboard</Link>
            </li>
            <li className="nav-item">
              <Link to="/reports" className="nav-link">Reports</Link>
            </li>
            {(userRole === 'admin' || userRole === 'department_head') && (
              <li className="nav-item">
                <Link to="/reports/upload" className="nav-link">Upload Report</Link>
              </li>
            )}
          </ul>
          
          {currentUser && (
            <ul className="navbar-nav">
              <li className="nav-item dropdown">
                <a 
                  className="nav-link dropdown-toggle" 
                  href="#" 
                  id="navbarDropdown" 
                  role="button" 
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <i className="fas fa-user-circle me-1"></i>
                  {currentUser.displayName || currentUser.email}
                </a>
                <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="navbarDropdown">
                  <li>
                    <Link to="/profile" className="dropdown-item">My Profile</Link>
                  </li>
                  <li><hr className="dropdown-divider" /></li>
                  <li>
                    <button onClick={handleLogout} className="dropdown-item">Logout</button>
                  </li>
                </ul>
              </li>
            </ul>
          )}
        </div>
      </div>
      
      {error && <div className="alert alert-danger m-2">{error}</div>}
    </nav>
  );
}

export default Header;
