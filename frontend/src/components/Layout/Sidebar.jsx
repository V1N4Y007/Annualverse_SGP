import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { collection, getDocs, db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';

function Sidebar() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const location = useLocation();
  const { userRole } = useAuth();

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const departmentsSnapshot = await getDocs(collection(db, 'departments'));
        const departmentsList = departmentsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setDepartments(departmentsList);
      } catch (error) {
        console.error("Error fetching departments:", error);
        setError('Failed to load departments');
      } finally {
        setLoading(false);
      }
    };

    fetchDepartments();
  }, []);

  if (loading) {
    return (
      <div className="sidebar bg-light p-3 border-end" style={{ minHeight: 'calc(100vh - 56px)' }}>
        <h5 className="sidebar-heading d-flex justify-content-between align-items-center px-3 mt-4 mb-1 text-muted">
          <span>Departments</span>
        </h5>
        <div className="d-flex justify-content-center mt-4">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="sidebar bg-light p-3 border-end" style={{ minHeight: 'calc(100vh - 56px)' }}>
      <h5 className="sidebar-heading d-flex justify-content-between align-items-center px-3 mt-4 mb-1 text-muted">
        <span>Departments</span>
        {(userRole === 'admin') && (
          <Link to="/departments/manage" className="link-secondary">
            <i className="fas fa-cog"></i>
          </Link>
        )}
      </h5>

      {error && <div className="alert alert-danger">{error}</div>}

      <ul className="nav flex-column mb-2">
        {departments.map(department => (
          <li key={department.id} className="nav-item">
            <Link 
              to={`/departments/${department.id}`} 
              className={`nav-link ${location.pathname === `/departments/${department.id}` ? 'active' : ''}`}
            >
              <i className="fas fa-building me-2"></i>
              {department.name}
            </Link>
          </li>
        ))}
      </ul>

      <h5 className="sidebar-heading d-flex justify-content-between align-items-center px-3 mt-4 mb-1 text-muted">
        <span>Reports</span>
      </h5>

      <ul className="nav flex-column">
        <li className="nav-item">
          <Link 
            to="/reports" 
            className={`nav-link ${location.pathname === '/reports' ? 'active' : ''}`}
          >
            <i className="fas fa-file-alt me-2"></i>
            All Reports
          </Link>
        </li>
        {(userRole === 'admin' || userRole === 'department_head') && (
          <li className="nav-item">
            <Link 
              to="/reports/upload" 
              className={`nav-link ${location.pathname === '/reports/upload' ? 'active' : ''}`}
            >
              <i className="fas fa-upload me-2"></i>
              Upload Report
            </Link>
          </li>
        )}
      </ul>
    </div>
  );
}

export default Sidebar;
