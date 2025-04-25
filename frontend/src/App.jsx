import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ReportGenerator from './components/Reports/ReportGenerator';
import SimpleHeader from './components/Layout/SimpleHeader';

function App() {
  const [user, setUser] = useState(null);
  
  const login = () => {
    setUser({
      displayName: 'Demo User',
      email: 'user@example.com'
    });
  };
  
  const logout = () => {
    setUser(null);
  };

  return (
    <div className="app">
      <SimpleHeader user={user} login={login} logout={logout} />
      <div className="container-fluid mt-4">
        <Routes>
          <Route path="/" element={<ReportGenerator user={user} />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
