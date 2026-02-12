// routes.jsx
// This file will handle route definitions for the frontend.

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Example route components
import Login from '../common/Login';
import Analytics from '../admin/Analytics';
import ManageTasks from '../admin/ManageTasks';
import StaffIndex from '../staff/index';
import AdminIndex from '../admin/index';

const AppRoutes = () => (
  <Router>
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/admin/analytics" element={<Analytics />} />
      <Route path="/admin/manage-tasks" element={<ManageTasks />} />
      <Route path="/admin" element={<AdminIndex />} />
      <Route path="/staff" element={<StaffIndex />} />
      {/* Add more routes as needed */}
    </Routes>
  </Router>
);

export default AppRoutes;
