import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  db, 
  collection, 
  addDoc, 
  storage, 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  serverTimestamp 
} from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from '../Layout/Sidebar';
import DepartmentSelector from '../Dashboard/DepartmentSelector';

function ReportUpload() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [file, setFile] = useState(null);
  const [year, setYear] = useState(new Date().getFullYear());
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);
  const { currentUser, userRole } = useAuth();
  const navigate = useNavigate();

  // Generate years for the dropdown (5 years back from current year)
  const years = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i);

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.size > 10 * 1024 * 1024) { // 10 MB limit
        setError('File size should be less than 10 MB');
        return;
      }
      
      // Accept only PDF and DOC/DOCX files
      const fileExt = selectedFile.name.split('.').pop().toLowerCase();
      if (!['pdf', 'doc', 'docx'].includes(fileExt)) {
        setError('Only PDF and DOC/DOCX files are allowed');
        return;
      }
      
      setFile(selectedFile);
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedDepartment) {
      return setError('Please select a department');
    }
    
    if (!file) {
      return setError('Please upload a report file');
    }
    
    try {
      setLoading(true);
      setError('');
      
      // Upload file to Firebase Storage
      const fileRef = ref(storage, `reports/${selectedDepartment}/${Date.now()}_${file.name}`);
      await uploadBytes(fileRef, file);
      const fileUrl = await getDownloadURL(fileRef);
      
      // Add report to Firestore
      const reportData = {
        title,
        description,
        departmentId: selectedDepartment,
        year: parseInt(year),
        fileUrl,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        isPublic,
        uploadedBy: currentUser.uid,
        uploaderName: currentUser.displayName || currentUser.email,
        status: userRole === 'admin' ? 'approved' : 'pending', // Auto-approve for admin
        createdAt: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, 'reports'), reportData);
      
      // Redirect to the newly created report
      navigate(`/reports/${docRef.id}`);
    } catch (error) {
      console.error("Error uploading report:", error);
      setError('Failed to upload report: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Check if user has permission to upload
  useEffect(() => {
    if (userRole !== 'admin' && userRole !== 'department_head') {
      setError('You do not have permission to upload reports');
    }
  }, [userRole]);

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-md-3 col-lg-2 d-md-block">
          <Sidebar />
        </div>
        
        <main className="col-md-9 ms-sm-auto col-lg-10 px-md-4">
          <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
            <h1 className="h2">Upload New Report</h1>
          </div>

          {error && <div className="alert alert-danger">{error}</div>}

          <div className="card">
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="title" className="form-label">Report Title <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    id="title"
                    className="form-control"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter report title"
                    required
                  />
                </div>
                
                <div className="mb-3">
                  <DepartmentSelector 
                    selectedDepartment={selectedDepartment}
                    setSelectedDepartment={setSelectedDepartment}
                  />
                </div>
                
                <div className="mb-3">
                  <label htmlFor="year" className="form-label">Report Year <span className="text-danger">*</span></label>
                  <select
                    id="year"
                    className="form-select"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    required
                  >
                    {years.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
                
                <div className="mb-3">
                  <label htmlFor="description" className="form-label">Description <span className="text-danger">*</span></label>
                  <textarea
                    id="description"
                    className="form-control"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter report description"
                    rows="4"
                    required
                  ></textarea>
                </div>
                
                <div className="mb-3">
                  <label htmlFor="file" className="form-label">Upload Report File <span className="text-danger">*</span></label>
                  <input
                    type="file"
                    id="file"
                    className="form-control"
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx"
                    required
                  />
                  <div className="form-text">Upload PDF or DOC/DOCX files (max size: 10 MB)</div>
                  
                  {file && (
                    <div className="mt-2 alert alert-success">
                      <i className="fas fa-file-alt me-2"></i> {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </div>
                  )}
                  
                  {loading && progress > 0 && (
                    <div className="progress mt-2">
                      <div 
                        className="progress-bar progress-bar-striped progress-bar-animated" 
                        role="progressbar" 
                        style={{ width: `${progress}%` }} 
                        aria-valuenow={progress} 
                        aria-valuemin="0" 
                        aria-valuemax="100"
                      >
                        {progress}%
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="mb-3 form-check">
                  <input
                    type="checkbox"
                    id="isPublic"
                    className="form-check-input"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                  />
                  <label htmlFor="isPublic" className="form-check-label">
                    Make report visible to all users
                  </label>
                </div>
                
                <div className="mb-3">
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={loading || !selectedDepartment || !file}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Uploading...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-upload me-2"></i> Upload Report
                      </>
                    )}
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-outline-secondary ms-2"
                    onClick={() => navigate('/reports')}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default ReportUpload;
