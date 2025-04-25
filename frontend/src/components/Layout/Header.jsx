import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Header = () => {
  const { currentUser, signOut } = useAuth();
  const navigate = useNavigate();

  const handleHomeClick = () => {
    navigate('/');
  };

  const handleLoginClick = () => {
    navigate('/login');
  };

  const handleLogoutClick = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
      <div className="container">
        <Link className="navbar-brand" to="/">Annual Report Portal</Link>
        <button 
          className="navbar-toggler" 
          type="button" 
          data-bs-toggle="collapse" 
          data-bs-target="#navbarNav" 
          aria-controls="navbarNav" 
          aria-expanded="false" 
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <button 
                className="btn btn-primary nav-link" 
                onClick={handleHomeClick}
              >
                Home
              </button>
            </li>
          </ul>
          <div className="d-flex align-items-center">
            {currentUser && (
              <span className="text-white me-3">
                {currentUser.displayName || currentUser.email || 'User'}
              </span>
            )}
            <div>
              {currentUser ? (
                <button 
                  className="btn btn-outline-light" 
                  onClick={handleLogoutClick}
                >
                  Logout
                </button>
              ) : (
                <button 
                  className="btn btn-outline-light" 
                  onClick={handleLoginClick}
                >
                  Login
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Header;