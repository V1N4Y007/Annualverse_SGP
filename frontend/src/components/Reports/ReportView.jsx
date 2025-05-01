import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';

function ReportView() {
  const { currentUser } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      if (!currentUser) return;

      try {
        const q = query(collection(db, 'reports'), where('createdBy', '==', currentUser.email));
        const querySnapshot = await getDocs(q);
        const fetchedReports = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setReports(fetchedReports);
      } catch (error) {
        console.error('Error fetching reports:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [currentUser]);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="container mt-4">
      <h2>My Reports</h2>
      <p>Total Reports: <strong>{reports.length}</strong></p>
      <ul className="list-group">
        {reports.map((report) => (
          <li key={report.id} className="list-group-item d-flex justify-content-between align-items-center">
            <Link to={`/reports/${report.id}`}>{report.title || 'Untitled Report'}</Link>
            <span className="text-muted">
              Created: {report.createdAt?.toDate?.().toLocaleString() || 'N/A'}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ReportView;
