import React, { useState, useEffect } from 'react';
import { db, doc, getDoc, updateDoc, updateProfile, auth, collection, query, where, getDocs } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from '../Layout/Sidebar';

function UserProfile() {
  const { currentUser, userRole } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState('');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Fetch user data
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setDisplayName(userData.displayName || currentUser.displayName || '');
          setEmail(currentUser.email);
          
          if (userData.departmentId) {
            setSelectedDepartmentId(userData.departmentId);
            
            // Fetch department details
            const departmentDoc = await getDoc(doc(db, 'departments', userData.departmentId));
            if (departmentDoc.exists()) {
              setDepartment(departmentDoc.data());
            }
          }
        }
        
        // Fetch all departments
        const departmentsSnapshot = await getDocs(collection(db, 'departments'));
        const departmentsList = departmentsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setDepartments(departmentsList);
      } catch (error) {
        console.error("Error fetching user data:", error);
        setError('Failed to load user profile');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [currentUser]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    
    try {
      setUpdating(true);
      setError('');
      setSuccess('');
      
      // Update profile in Firebase Auth
      await updateProfile(auth.currentUser, { displayName });
      
      // Update profile in Firestore
      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, {
        displayName,
        departmentId: selectedDepartmentId,
        updatedAt: new Date()
      });
      
      setSuccess('Profile updated successfully');
    } catch (error) {
      console.error("Error updating profile:", error);
      setError('Failed to update profile: ' + error.message);
    } finally {
      setUpdating(false);
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

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-md-3 col-lg-2 d-md-block">
          <Sidebar />
        </div>
        
        <main className="col-md-9 ms-sm-auto col-lg-10 px-md-4">
          <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
            <h1 className="h2">My Profile</h1>
          </div>

          {error && <div className="alert alert-danger">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <div className="row">
            <div className="col-md-6">
              <div className="card shadow mb-4">
                <div className="card-header bg-light">
                  <h5 className="mb-0">Profile Information</h5>
                </div>
                <div className="card-body">
                  <form onSubmit={handleUpdateProfile}>
                    <div className="mb-3">
                      <label htmlFor="displayName" className="form-label">Full Name</label>
                      <input
                        type="text"
                        id="displayName"
                        className="form-control"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="mb-3">
                      <label htmlFor="email" className="form-label">Email</label>
                      <input
                        type="email"
                        id="email"
                        className="form-control"
                        value={email}
                        disabled
                      />
                      <div className="form-text">Email cannot be changed</div>
                    </div>
                    
                    <div className="mb-3">
                      <label htmlFor="department" className="form-label">Department</label>
                      <select
                        id="department"
                        className="form-select"
                        value={selectedDepartmentId}
                        onChange={(e) => setSelectedDepartmentId(e.target.value)}
                      >
                        <option value="">Select Department</option>
                        {departments.map(dept => (
                          <option key={dept.id} value={dept.id}>
                            {dept.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="mb-3">
                      <label htmlFor="role" className="form-label">Role</label>
                      <input
                        type="text"
                        id="role"
                        className="form-control"
                        value={userRole?.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') || ''}
                        disabled
                      />
                      <div className="form-text">Role cannot be changed. Contact administrator for role changes.</div>
                    </div>
                    
                    <button 
                      type="submit" 
                      className="btn btn-primary"
                      disabled={updating}
                    >
                      {updating ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Updating...
                        </>
                      ) : (
                        'Update Profile'
                      )}
                    </button>
                  </form>
                </div>
              </div>
            </div>
            
            <div className="col-md-6">
              <div className="card shadow mb-4">
                <div className="card-header bg-light">
                  <h5 className="mb-0">Account Information</h5>
                </div>
                <div className="card-body">
                  <div className="d-flex justify-content-center mb-4">
                    <div className="profile-avatar bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: '100px', height: '100px', fontSize: '2.5rem' }}>
                      {displayName ? displayName.charAt(0).toUpperCase() : email.charAt(0).toUpperCase()}
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <div className="fw-bold mb-1">Account Created</div>
                    <div>{currentUser.metadata.creationTime}</div>
                  </div>
                  
                  <div className="mb-3">
                    <div className="fw-bold mb-1">Last Login</div>
                    <div>{currentUser.metadata.lastSignInTime}</div>
                  </div>
                  
                  <div className="mb-3">
                    <div className="fw-bold mb-1">Email Verified</div>
                    <div>
                      {currentUser.emailVerified ? (
                        <span className="badge bg-success">Verified</span>
                      ) : (
                        <span className="badge bg-warning">Not Verified</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <div className="fw-bold mb-1">Department</div>
                    <div>{department?.name || 'Not assigned'}</div>
                  </div>
                </div>
              </div>
              
              <div className="card shadow">
                <div className="card-header bg-light">
                  <h5 className="mb-0">Security</h5>
                </div>
                <div className="card-body">
                  <p className="mb-3">Manage your account security settings</p>
                  <button 
                    className="btn btn-outline-primary"
                    onClick={() => alert('Password reset functionality would be implemented here')}
                  >
                    <i className="fas fa-key me-2"></i> Change Password
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default UserProfile;
