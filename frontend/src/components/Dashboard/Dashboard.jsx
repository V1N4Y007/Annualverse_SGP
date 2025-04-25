import React, { useState, useEffect } from 'react';
import { collection, getDocs, db, query, where, orderBy } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from '../Layout/Sidebar';
import DataCharts from '../Visualization/DataCharts';

function Dashboard() {
  const [reports, setReports] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
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

        // Fetch reports
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
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser, userRole]);

  // Process data for charts
  const reportsByDepartment = departments.map(dept => {
    const deptReports = reports.filter(report => report.departmentId === dept.id);
    return {
      name: dept.name,
      count: deptReports.length
    };
  });

  const reportsByMonth = Array(12).fill(0).map((_, idx) => {
    const month = new Date(new Date().getFullYear(), idx).toLocaleDateString('en-US', { month: 'short' });
    const count = reports.filter(report => {
      const reportDate = new Date(report.createdAt);
      return reportDate.getMonth() === idx && reportDate.getFullYear() === new Date().getFullYear();
    }).length;
    
    return { name: month, count };
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
            <h1 className="h2">Dashboard</h1>
            <div className="btn-toolbar mb-2 mb-md-0">
              <div className="btn-group me-2">
                <button type="button" className="btn btn-sm btn-outline-secondary">
                  <i className="fas fa-share"></i> Share
                </button>
                <button type="button" className="btn btn-sm btn-outline-secondary">
                  <i className="fas fa-download"></i> Export
                </button>
              </div>
            </div>
          </div>

          {error && <div className="alert alert-danger">{error}</div>}

          <div className="row">
            <div className="col-xl-3 col-md-6 mb-4">
              <div className="card border-left-primary shadow h-100 py-2">
                <div className="card-body">
                  <div className="row no-gutters align-items-center">
                    <div className="col mr-2">
                      <div className="text-xs font-weight-bold text-primary text-uppercase mb-1">
                        Total Reports
                      </div>
                      <div className="h5 mb-0 font-weight-bold text-gray-800">{reports.length}</div>
                    </div>
                    <div className="col-auto">
                      <i className="fas fa-file-alt fa-2x text-gray-300"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-xl-3 col-md-6 mb-4">
              <div className="card border-left-success shadow h-100 py-2">
                <div className="card-body">
                  <div className="row no-gutters align-items-center">
                    <div className="col mr-2">
                      <div className="text-xs font-weight-bold text-success text-uppercase mb-1">
                        Departments
                      </div>
                      <div className="h5 mb-0 font-weight-bold text-gray-800">{departments.length}</div>
                    </div>
                    <div className="col-auto">
                      <i className="fas fa-building fa-2x text-gray-300"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="col-xl-3 col-md-6 mb-4">
              <div className="card border-left-info shadow h-100 py-2">
                <div className="card-body">
                  <div className="row no-gutters align-items-center">
                    <div className="col mr-2">
                      <div className="text-xs font-weight-bold text-info text-uppercase mb-1">
                        Recent Reports
                      </div>
                      <div className="h5 mb-0 font-weight-bold text-gray-800">
                        {reports.filter(r => {
                          const date = new Date(r.createdAt);
                          const oneMonthAgo = new Date();
                          oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
                          return date > oneMonthAgo;
                        }).length}
                      </div>
                    </div>
                    <div className="col-auto">
                      <i className="fas fa-calendar fa-2x text-gray-300"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="col-xl-3 col-md-6 mb-4">
              <div className="card border-left-warning shadow h-100 py-2">
                <div className="card-body">
                  <div className="row no-gutters align-items-center">
                    <div className="col mr-2">
                      <div className="text-xs font-weight-bold text-warning text-uppercase mb-1">
                        Your Role
                      </div>
                      <div className="h5 mb-0 font-weight-bold text-gray-800">
                        {userRole?.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                      </div>
                    </div>
                    <div className="col-auto">
                      <i className="fas fa-user-shield fa-2x text-gray-300"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DataCharts 
            reportsByDepartment={reportsByDepartment} 
            reportsByMonth={reportsByMonth}
          />

          <h2 className="mt-4">Recent Reports</h2>
          <div className="table-responsive">
            <table className="table table-striped table-sm">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Department</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.slice(0, 5).map(report => (
                  <tr key={report.id}>
                    <td>{report.title}</td>
                    <td>
                      {departments.find(d => d.id === report.departmentId)?.name || 'Unknown'}
                    </td>
                    <td>{new Date(report.createdAt).toLocaleDateString()}</td>
                    <td>
                      <span className={`badge bg-${report.status === 'approved' ? 'success' : report.status === 'pending' ? 'warning' : 'danger'}`}>
                        {report.status}
                      </span>
                    </td>
                    <td>
                      <a href={`/reports/${report.id}`} className="btn btn-sm btn-primary me-1">
                        <i className="fas fa-eye"></i>
                      </a>
                      {(userRole === 'admin' || (userRole === 'department_head' && report.departmentId === currentUser?.departmentId)) && (
                        <button className="btn btn-sm btn-danger">
                          <i className="fas fa-trash"></i>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                
                {reports.length === 0 && (
                  <tr>
                    <td colSpan="5" className="text-center">No reports available</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Dashboard;
