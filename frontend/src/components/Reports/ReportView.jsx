import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, doc, getDoc, getStorage, ref, getDownloadURL } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from '../Layout/Sidebar';

function ReportView() {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [department, setDepartment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { currentUser, userRole } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const reportDoc = await getDoc(doc(db, 'reports', id));
        
        if (!reportDoc.exists()) {
          setError('Report not found');
          return;
        }
        
        const reportData = reportDoc.data();
        
        // Check if user has access to this report
        if (!reportData.isPublic && userRole === 'faculty') {
          setError('You do not have permission to view this report');
          return;
        }
        
        // Fetch department details
        const departmentDoc = await getDoc(doc(db, 'departments', reportData.departmentId));
        
        setReport({
          id: reportDoc.id,
          ...reportData,
          createdAt: reportData.createdAt?.toDate() || new Date()
        });
        
        if (departmentDoc.exists()) {
          setDepartment({
            id: departmentDoc.id,
            ...departmentDoc.data()
          });
        }
      } catch (error) {
        console.error("Error fetching report:", error);
        setError('Failed to load report details');
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [id, userRole]);

  const downloadPDF = async () => {
    try {
      // Request the PDF from the backend
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/reports/${id}/pdf`, {
        headers: {
          'Authorization': `Bearer ${await currentUser.getIdToken()}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to download PDF');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${report.title}-report.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading PDF:", error);
      setError('Failed to download PDF: ' + error.message);
    }
  };

  const downloadOriginalFile = async () => {
    try {
      window.open(report.fileUrl, '_blank');
    } catch (error) {
      console.error("Error downloading original file:", error);
      setError('Failed to download file: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
        <button 
          className="btn btn-primary" 
          onClick={() => navigate('/reports')}
        >
          Back to Reports
        </button>
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
            <h1 className="h2">{report.title}</h1>
            <div className="btn-toolbar mb-2 mb-md-0">
              <div className="btn-group me-2">
                <button 
                  type="button" 
                  className="btn btn-sm btn-outline-secondary"
                  onClick={downloadPDF}
                >
                  <i className="fas fa-file-pdf me-1"></i> Download as PDF
                </button>
                <button 
                  type="button" 
                  className="btn btn-sm btn-outline-primary"
                  onClick={downloadOriginalFile}
                >
                  <i className="fas fa-download me-1"></i> Download Original
                </button>
              </div>
              <button 
                type="button" 
                className="btn btn-sm btn-outline-secondary"
                onClick={() => navigate('/reports')}
              >
                <i className="fas fa-arrow-left me-1"></i> Back to Reports
              </button>
            </div>
          </div>

          <div className="card mb-4">
            <div className="card-header bg-light">
              <div className="row align-items-center">
                <div className="col">
                  <h5 className="mb-0">Report Details</h5>
                </div>
                <div className="col-auto">
                  <span className={`badge bg-${report.status === 'approved' ? 'success' : report.status === 'pending' ? 'warning' : 'danger'}`}>
                    {report.status}
                  </span>
                </div>
              </div>
            </div>
            <div className="card-body">
              <div className="row mb-3">
                <div className="col-md-3 fw-bold">Department:</div>
                <div className="col-md-9">{department?.name || 'Unknown'}</div>
              </div>
              <div className="row mb-3">
                <div className="col-md-3 fw-bold">Academic Year:</div>
                <div className="col-md-9">{report.year}</div>
              </div>
              <div className="row mb-3">
                <div className="col-md-3 fw-bold">Uploaded By:</div>
                <div className="col-md-9">{report.uploaderName}</div>
              </div>
              <div className="row mb-3">
                <div className="col-md-3 fw-bold">Uploaded On:</div>
                <div className="col-md-9">{new Date(report.createdAt).toLocaleString()}</div>
              </div>
              <div className="row mb-3">
                <div className="col-md-3 fw-bold">Access Level:</div>
                <div className="col-md-9">
                  {report.isPublic ? (
                    <span className="badge bg-success">Public</span>
                  ) : (
                    <span className="badge bg-warning">Restricted</span>
                  )}
                </div>
              </div>
              <div className="row mb-3">
                <div className="col-md-3 fw-bold">File:</div>
                <div className="col-md-9">
                  <i className={`fas ${report.fileType.includes('pdf') ? 'fa-file-pdf' : 'fa-file-word'} me-2`}></i>
                  {report.fileName} ({(report.fileSize / 1024 / 1024).toFixed(2)} MB)
                </div>
              </div>
            </div>
          </div>

          <div className="card mb-4">
            <div className="card-header bg-light">
              <h5 className="mb-0">Description</h5>
            </div>
            <div className="card-body">
              <p className="card-text">{report.description}</p>
            </div>
          </div>

          <div className="card">
            <div className="card-header bg-light">
              <h5 className="mb-0">Preview</h5>
            </div>
            <div className="card-body">
              {report.fileType.includes('pdf') ? (
                <div className="embed-responsive">
                  <iframe 
                    className="embed-responsive-item" 
                    src={`${report.fileUrl}#view=FitH`} 
                    title="PDF Preview"
                    style={{ width: '100%', height: '500px' }}
                  ></iframe>
                </div>
              ) : (
                <div className="text-center p-5 bg-light">
                  <i className="fas fa-file-word fa-4x mb-3 text-primary"></i>
                  <h5>Word Document Preview Not Available</h5>
                  <p>Please download the document to view its contents.</p>
                  <button 
                    className="btn btn-primary mt-2"
                    onClick={downloadOriginalFile}
                  >
                    <i className="fas fa-download me-2"></i> Download Document
                  </button>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default ReportView;
