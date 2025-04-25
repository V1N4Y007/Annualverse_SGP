import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, currentUser } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (currentUser) {
      navigate('/');
    }
  }, [currentUser, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    
    try {
      setError('');
      setLoading(true);
      
      await login(email, password);
      navigate('/');
    } catch (error) {
      console.error('Login error:', error);
      setError('Failed to log in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Demo login function - for easy testing
  const handleDemoLogin = () => {
    setEmail('demo@example.com');
    setPassword('password123');
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card">
            <div className="card-header bg-primary text-white">
              <h3 className="text-center mb-0">Login</h3>
            </div>
            <div className="card-body">
              {error && <div className="alert alert-danger">{error}</div>}
              
              <form onSubmit={handleLogin}>
                <div className="mb-3">
                  <label htmlFor="email" className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-control"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                
                <div className="mb-3">
                  <label htmlFor="password" className="form-label">Password</label>
                  <input
                    type="password"
                    className="form-control"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                
                <div className="d-grid gap-2">
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Signing in...
                      </>
                    ) : (
                      'Sign In'
                    )}
                  </button>
                  
                  <button 
                    type="button" 
                    className="btn btn-outline-secondary"
                    onClick={handleDemoLogin}
                  >
                    Use Demo Credentials
                  </button>
                </div>
              </form>
              
              <div className="text-center mt-4">
                <p>Annual Report Portal for Institute Departments</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;