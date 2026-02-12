// routes.jsx
// This file will handle route definitions for the frontend.

import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'

import Login from '../common/Login'
import Analytics from '../admin/Analytics'
import ManageTasks from '../admin/ManageTasks'
import ManageUsers from '../admin/ManageUsers'
import StaffIndex from '../staff/index'
import AdminIndex from '../admin/index'
import AddTask from '../common/AddTask'

const AppRoutes = ({ user, role }) => (
  <Router>
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* Admin routes */}
      <Route path="/admin/analytics" element={<Analytics user={user} />} />
      <Route path="/admin/manage-tasks" element={<ManageTasks user={user} />} />
      <Route path="/admin/manage-users" element={<ManageUsers user={user} />} />
      <Route path="/admin/add" element={<AddTask user={user} />} />
      <Route path="/admin" element={<AdminIndex user={user} />} />

      {/* Staff routes */}
      <Route path="/staff" element={<StaffIndex user={user} />} />

      {/* Root: redirect based on auth/role */}
      <Route
        path="/"
        element={
          !user ? (
            <Navigate to="/" replace />
          ) : role === 'admin' ? (
            <Navigate to="/admin" replace />
          ) : (
            <Navigate to="/staff" replace />
          )
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </Router>
)

export default AppRoutes
