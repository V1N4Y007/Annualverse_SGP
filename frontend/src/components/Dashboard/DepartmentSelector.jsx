import React, { useState, useEffect } from 'react';
import { collection, getDocs, db } from '../../firebase';

function DepartmentSelector({ selectedDepartment, setSelectedDepartment }) {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const departmentsSnapshot = await getDocs(collection(db, 'departments'));
        const departmentsList = departmentsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setDepartments(departmentsList);
        
        // If no department is selected and we have departments, select the first one
        if (!selectedDepartment && departmentsList.length > 0) {
          setSelectedDepartment(departmentsList[0].id);
        }
      } catch (error) {
        console.error("Error fetching departments:", error);
        setError('Failed to load departments');
      } finally {
        setLoading(false);
      }
    };

    fetchDepartments();
  }, [selectedDepartment, setSelectedDepartment]);

  if (loading) {
    return (
      <div className="spinner-border spinner-border-sm text-primary me-2" role="status">
        <span className="visually-hidden">Loading departments...</span>
      </div>
    );
  }

  if (error) {
    return <div className="text-danger">{error}</div>;
  }

  return (
    <div className="department-selector mb-3">
      <label htmlFor="departmentSelect" className="form-label">Select Department</label>
      <select
        id="departmentSelect"
        className="form-select"
        value={selectedDepartment || ''}
        onChange={(e) => setSelectedDepartment(e.target.value)}
      >
        <option value="" disabled>Choose a department</option>
        {departments.map(department => (
          <option key={department.id} value={department.id}>
            {department.name}
          </option>
        ))}
      </select>
    </div>
  );
}

export default DepartmentSelector;
