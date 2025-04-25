import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Dashboard = () => {
  const { currentUser } = useAuth();

  return (
    <div className="container mt-4">
      <div className="jumbotron bg-light p-4 rounded">
        <h1 className="display-4">Welcome to Annual Report Portal</h1>
        <p className="lead">
          {currentUser?.displayName 
            ? `Hello, ${currentUser.displayName}!` 
            : currentUser?.email 
              ? `Hello, ${currentUser.email}!` 
              : 'Hello!'}
        </p>
        <hr className="my-4" />
        <p>
          This platform allows institute departments to generate, manage, and share annual reports.
        </p>
      </div>

      <div className="row mt-4">
        <div className="col-md-4 mb-4">
          <div className="card h-100">
            <div className="card-body">
              <h5 className="card-title">Create New Report</h5>
              <p className="card-text">
                Generate a new annual report for your department with structured sections.
              </p>
              <Link to="/report/new" className="btn btn-primary">
                Create Report
              </Link>
            </div>
          </div>
        </div>

        <div className="col-md-4 mb-4">
          <div className="card h-100">
            <div className="card-body">
              <h5 className="card-title">View Reports</h5>
              <p className="card-text">
                Browse and search through all submitted annual reports.
              </p>
              <Link to="/reports" className="btn btn-primary">
                View Reports
              </Link>
            </div>
          </div>
        </div>

        <div className="col-md-4 mb-4">
          <div className="card h-100">
            <div className="card-body">
              <h5 className="card-title">Department Statistics</h5>
              <p className="card-text">
                View analytics and statistics based on department reports.
              </p>
              <Link to="/statistics" className="btn btn-primary">
                View Statistics
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;