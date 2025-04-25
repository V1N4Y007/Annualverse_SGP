import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import ReportGenerator from './Reports/ReportGenerator';

const Home = () => {
  const { currentUser } = useAuth();

  return (
    <div className="container mt-4">
      <div className="jumbotron">
        <h1 className="display-4">Welcome to Annual Report Portal</h1>
        <p className="lead">
          {currentUser?.displayName ? `Hello, ${currentUser.displayName}!` : 'Hello!'}
        </p>
        <hr className="my-4" />
        <p>
          This platform allows institute departments to upload, view, and analyze annual reports.
        </p>
      </div>
      
      <ReportGenerator user={currentUser} />
    </div>
  );
};

export default Home;