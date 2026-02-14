import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

import Login from './pages/Login';
import Signup from './pages/Signup';

import AdminPrivateRoute from './components/admin/PrivateRoute';
import AdminLayout from './components/admin/AdminLayout';
import AdminDashboard from './pages/admin/Dashboard';
import AdminManageTasks from './pages/admin/ManageTasks';
import AdminManageUsers from './pages/admin/ManageUsers';
import AdminAnalytics from './pages/admin/Analytics';
import AdminManageAttendance from './pages/admin/ManageAttendance';
import AdminManageLeads from './pages/admin/ManageLeads';

import StaffPrivateRoute from './components/staff/PrivateRoute';
import StaffLayout from './components/staff/StaffLayout';
import StaffDashboard from './pages/staff/Dashboard';
import StaffMyTasks from './pages/staff/MyTasks';
import StaffTaskDetail from './pages/staff/TaskDetail';
import StaffAttendance from './pages/staff/Attendance';

import SalesPrivateRoute from './components/sales/PrivateRoute';
import SalesLayout from './components/sales/SalesLayout';
import SalesDashboard from './pages/sales/Dashboard';
import SalesLeads from './pages/sales/Leads';
import AccountOpening from './pages/sales/AccountOpening';
import StatusUpdate from './pages/sales/StatusUpdate';
import SalesAttendance from './pages/sales/Attendance';

function App() {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    const accessToken = localStorage.getItem('access_token');

    if (user && accessToken) {
      // Already logged in
    }
    setInitialized(true);
  }, []);

  if (!initialized) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        <Route element={<AdminPrivateRoute><AdminLayout /></AdminPrivateRoute>}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/tasks" element={<AdminManageTasks />} />
          <Route path="/admin/users" element={<AdminManageUsers />} />
          <Route path="/admin/attendance" element={<AdminManageAttendance />} />
          <Route path="/admin/leads" element={<AdminManageLeads />} />
          <Route path="/admin/analytics" element={<AdminAnalytics />} />
        </Route>

        <Route element={<StaffPrivateRoute><StaffLayout /></StaffPrivateRoute>}>
          <Route path="/staff/dashboard" element={<StaffDashboard />} />
          <Route path="/staff/tasks" element={<StaffMyTasks />} />
          <Route path="/staff/tasks/:id" element={<StaffTaskDetail />} />
          <Route path="/staff/attendance" element={<StaffAttendance />} />
        </Route>

        <Route element={<SalesPrivateRoute><SalesLayout /></SalesPrivateRoute>}>
          <Route path="/sales/dashboard" element={<SalesDashboard />} />
          <Route path="/sales/leads" element={<SalesLeads />} />
          <Route path="/sales/account-opening" element={<AccountOpening />} />
          <Route path="/sales/status-update" element={<StatusUpdate />} />
          <Route path="/sales/attendance" element={<SalesAttendance />} />
        </Route>

        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
