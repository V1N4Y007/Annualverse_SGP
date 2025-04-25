import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, db, query, where, orderBy, deleteDoc, doc } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from '../Layout/Sidebar';
import DepartmentSelector from '../Dashboard/DepartmentSelector';

function ReportList() {
  const [reports, setReports] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const { currentUser, userRole } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch departments
        const departmentsSnapshot = await getDocs(collection(db, 'departments'));
        const departmentsList = departmentsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setDepartments(departmentsList);

        // Fetch reports based on user role
        let reportsQuery;
        
        if (userRole === 'admin') {
          // Admin can see all reports
          reportsQuery = query(
            collection(db, 'reports'), 
            orderBy('createdAt', 'desc')
          );
        } else if (userRole === 'department_head') {
          // Department head can see reports from their department
          const userDoc = await getDocs(
            query(collection(db, 'users'), where('email', '==', currentUser.email))
          );
          
          if (!userDoc.empty) {
            const userData = userDoc.docs[0].data();
            if (userData.departmentId) {
              reportsQuery = query(
                collection(db, 'reports'),
                where('departmentId', '==', userData.departmentId),
                orderBy('createdAt', 'desc')
              );
            }
          }
        } else {
          // Faculty can see public reports
          reportsQuery = query(
            collection(db, 'reports'),
            where('isPublic', '==', true),
            orderBy('createdAt', 'desc')
          );
        }

        const reportsSnapshot = await getDocs(reportsQuery);
        const reportsList = reportsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date()
        }));
        
        setReports(reportsList);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError('Failed to load reports');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser, userRole]);

  const handleDeleteReport = async (reportId) => {
    if (window.confirm('Are you sure you want to delete this report? This action cannot be undone.')) {
      try {
        await deleteDoc(doc(db, 'reports', reportId));
        setReports(reports.filter(report => report.id !== reportId));
      } catch (error) {
        console.error("Error deleting report:", error);
        setError('Failed to delete report');
      }
    }
  };

  // Filter reports based on selected department and search term
  const filteredReports = reports.filter(report => {
    const matchesDepartment = !selectedDepartment || report.departmentId === selectedDepartment;
    const matchesSearch = !searchTerm || 
      report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesDepartment && matchesSearch;
  });

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
    <div className="container-fluid">
      <div className="row">
        <div className="col-md-3 col-lg-2 d-md-block">
          <Sidebar />
        </div>
        
        <main className="col-md-9 ms-sm-auto col-lg-10 px-md-4">
          <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
            <h1 className="h2">Reports</h1>
            {(userRole === 'admin' || userRole === 'department_head') && (
              <Link to="/reports/upload" className="btn btn-primary">
                <i className="fas fa-plus me-2"></i>Upload New Report
              </Link>
            )}
          </div>

          {error && <div className="alert alert-danger">{error}</div>}

          <div className="row mb-3">
            <div className="col-md-4">
              <div className="mb-3">
                <label htmlFor="searchInput" className="form-label">Search Reports</label>
                <div className="input-group">
                  <span className="input-group-text">
                    <i className="fas fa-search"></i>
                  </span>
                  <input
                    type="text"
                    id="searchInput"
                    className="form-control"
                    placeholder="Search by title or description"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>
            
            <div className="col-md-4">
              <DepartmentSelector 
                selectedDepartment={selectedDepartment} 
                setSelectedDepartment={setSelectedDepartment}
              />
            </div>
            
            <div className="col-md-4">
              <div className="mb-3">
                <label className="form-label">Total Reports</label>
                <h4>{filteredReports.length}</h4>
              </div>
            </div>
          </div>

          <div className="row">
            {filteredReports.length > 0 ? (
              filteredReports.map(report => (
                <div key={report.id} className="col-md-6 col-lg-4 mb-4">
                  <div className="card h-100 shadow-sm">
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <h5 className="card-title mb-0">{report.title}</h5>
                        <span className={`badge bg-${report.status === 'approved' ? 'success' : report.status === 'pending' ? 'warning' : 'danger'}`}>
                          {report.status}
                        </span>
                      </div>
                      
                      <h6 className="card-subtitle mb-2 text-muted">
                        {departments.find(d => d.id === report.departmentId)?.name || 'Unknown Department'}
                      </h6>
                      
                      <p className="card-text">
                        {report.description.length > 100 
                          ? `${report.description.substring(0, 100)}...` 
                          : report.description
                        }
                      </p>
                      
                      <div className="card-text small text-muted mb-2">
                        <i className="fas fa-calendar-alt me-1"></i> 
                        {new Date(report.createdAt).toLocaleDateString()}
                      </div>
                      
                      <div className="d-flex justify-content-between align-items-center">
                        <Link to={`/reports/${report.id}`} className="btn btn-sm btn-primary">
                          <i className="fas fa-eye me-1"></i> View Report
                        </Link>
                        
                        {(userRole === 'admin' || (userRole === 'department_head' && report.departmentId === currentUser?.departmentId)) && (
                          <button 
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDeleteReport(report.id)}
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-12">
                <div className="alert alert-info">
                  No reports found. {(userRole === 'admin' || userRole === 'department_head') && (
                    <>
                      <Link to="/reports/upload">Upload a new report</Link> to get started.
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default ReportList;
