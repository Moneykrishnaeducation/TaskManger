import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import ManageTasks from './ManageTasks'
import Analytics from './Analytics'

export default function AdminPage({ user }) {
  const navigate = useNavigate()

  useEffect(() => {
    try {
      const u = user || JSON.parse(localStorage.getItem('user') || 'null')
      if (!u) {
        navigate('/login', { replace: true })
        return
      }

      // Allow superusers or explicit admin user_type
      const isSuper = !!u.is_superuser
      const isAdminType = (u.user_type || '').toLowerCase() === 'admin'
      if (!(isSuper || isAdminType)) {
        // Not an admin -> send to staff dashboard
        navigate('/staff', { replace: true })
      }
    } catch (err) {
      navigate('/login', { replace: true })
    }
  }, [user, navigate])
  const [activeNav, setActiveNav] = React.useState('home')

  // Mock stats data
  const stats = {
    totalStaff: 456,
    pendingTasks: 48,
    completedTasks: 187,
  }

  return (
    <div className="space-y-8 px-4 sm:px-6 lg:px-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl shadow-lg p-8 text-white">
        <h1 className="text-4xl font-bold mb-2">Welcome, Admin!</h1>
        <p className="text-blue-100">Manage the entire Moneykrishna Education platform</p>
      </div>

      {/* Navigation Menu */}
      <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 border border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:gap-3 flex-1">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveNav('home')}
                className={`px-4 sm:px-6 py-2 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2 whitespace-nowrap ${
                  activeNav === 'home'
                    ? 'bg-blue-600 text-white shadow-lg scale-105'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-3m0 0l7-4 7 4M5 9v10a1 1 0 001 1h3m10-11l2 3m-2-3v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span>Home</span>
              </button>
              <button
                onClick={() => setActiveNav('tasks')}
                className={`px-4 sm:px-6 py-2 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2 whitespace-nowrap ${
                  activeNav === 'tasks'
                    ? 'bg-orange-600 text-white shadow-lg scale-105'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                <span>Tasks</span>
                <span className="ml-1 px-2 py-0.5 bg-white bg-opacity-20 rounded-full text-xs font-bold">{stats.pendingTasks}</span>
              </button>
              <button
                onClick={() => setActiveNav('analytics')}
                className={`px-4 sm:px-6 py-2 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2 whitespace-nowrap ${
                  activeNav === 'analytics'
                    ? 'bg-purple-600 text-white shadow-lg scale-105'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span>Analytics</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* HOME SECTION */}
      {activeNav === 'home' && (
        <div className="space-y-8 animate-fadeIn">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Total Staff Card */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-6 border border-blue-200 hover:border-l-8 hover:border-l-blue-600 group">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-blue-200 p-3 rounded-lg group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 19H9a6 6 0 016-6v0a6 6 0 016 6v0Z" />
              </svg>
            </div>
            <span className="text-xs font-semibold text-blue-700 bg-blue-200 px-3 py-1 rounded-full">Team</span>
          </div>
          <h3 className="text-gray-600 text-sm font-semibold">Total Staff</h3>
          <p className="text-3xl font-bold text-blue-900 mt-2 group-hover:text-blue-700 transition-colors">{stats.totalStaff}</p>
          <div className="mt-4 space-y-2 bg-white bg-opacity-50 p-3 rounded-lg">
            <div className="flex justify-between text-xs">
              <span className="text-gray-700">Sales Team</span>
              <span className="font-bold text-blue-900">234</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-700">IT Team</span>
              <span className="font-bold text-blue-900">222</span>
            </div>
          </div>
        </div>

        {/* Pending Tasks Card */}
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-6 border border-orange-200 hover:border-l-8 hover:border-l-orange-600 group">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-orange-200 p-3 rounded-lg group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <span className="text-xs font-semibold text-orange-700 bg-orange-200 px-3 py-1 rounded-full">⚠️ Action</span>
          </div>
          <h3 className="text-gray-600 text-sm font-semibold">Pending Tasks</h3>
          <p className="text-3xl font-bold text-orange-900 mt-2 group-hover:text-orange-700 transition-colors">{stats.pendingTasks}</p>
          <p className="text-xs text-gray-600 mt-2 font-medium">Require attention</p>
        </div>

        {/* Completed Tasks Card */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-6 border border-green-200 hover:border-l-8 hover:border-l-green-600 group">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-green-200 p-3 rounded-lg group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-xs font-semibold text-green-700 bg-green-200 px-3 py-1 rounded-full">✓ +24%</span>
          </div>
          <h3 className="text-gray-600 text-sm font-semibold">Completed Tasks</h3>
          <p className="text-3xl font-bold text-green-900 mt-2 group-hover:text-green-700 transition-colors">{stats.completedTasks}</p>
          <p className="text-xs text-gray-600 mt-2 font-medium">This month</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Management Section */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-md p-6 border border-blue-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-8 bg-blue-600 rounded-full"></div>
            <h3 className="text-xl font-bold text-gray-900">Quick Actions</h3>
          </div>
          <div className="space-y-3">
            <button className="w-full text-left px-4 py-3 bg-white hover:bg-blue-50 rounded-lg transition-all duration-200 flex items-center gap-3 hover:shadow-md border border-blue-100 hover:border-blue-300 group" onClick={() => window.location.href = '/admin/manage-tasks'}>
              <div className="bg-blue-100 p-2 rounded-lg group-hover:bg-blue-200 transition-colors">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <span className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">Manage Tasks</span>
              <svg className="w-4 h-4 ml-auto text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <button className="w-full text-left px-4 py-3 bg-white hover:bg-blue-50 rounded-lg transition-all duration-200 flex items-center gap-3 hover:shadow-md border border-blue-100 hover:border-blue-300 group" onClick={() => window.location.href = '/admin/manage-users'}>
              <div className="bg-blue-100 p-2 rounded-lg transition-colors">
                <svg className="w-5 h-5 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11c1.657 0 3-1.567 3-3.5S17.657 4 16 4s-3 1.567-3 3.5S14.343 11 16 11zM8 7a4 4 0 100 8 4 4 0 000-8zM8 19v-2a4 4 0 014-4h0a4 4 0 014 4v2"/></svg>
              </div>
              <span className="font-semibold text-gray-900">Manage Users</span>
            </button>
          </div>
        </div>

        {/* Profile Information */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow-md p-6 border border-purple-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-8 bg-purple-600 rounded-full"></div>
            <h3 className="text-xl font-bold text-gray-900">Your Profile</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900">Administrator</p>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>
            </div>
            <div className="border-t pt-4">
              <p className="text-sm font-semibold text-gray-600 mb-2">Account Status</p>
              <span className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-1 h-8 bg-gray-600 rounded-full"></div>
          <h3 className="text-xl font-bold text-gray-900">Recent Activity</h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4 4a2 2 0 012-2h4.586a2 2 0 011.414.586l7.414 7.414a2 2 0 010 2.828l-7.414 7.414a2 2 0 01-2.828 0L6 13.172A2 2 0 014 11.586V4z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">New staff member registered</p>
                <p className="text-xs text-gray-500">2 hours ago</p>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between border-b pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Course successfully published</p>
                <p className="text-xs text-gray-500">5 hours ago</p>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                  <path fillRule="evenodd" d="M4 5a2 2 0 012-2 1 1 0 100 2H4a1 1 0 00-1 1v10a1 1 0 001 1h12a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 100 2h2v10H4V5z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">System backup completed</p>
                <p className="text-xs text-gray-500">1 day ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
      )}

      {/* MANAGE TASK SECTION */}
      {activeNav === 'tasks' && (
      <div className="space-y-8 animate-fadeIn">
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-8 bg-indigo-600 rounded-full"></div>
            <h2 className="text-2xl font-bold text-gray-900">Manage Tasks</h2>
          </div>
          <ManageTasks />
        </div>
      </div>
      )}

      {/* ANALYTICS SECTION */}
      {activeNav === 'analytics' && (
      <div className="space-y-8 animate-fadeIn">
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-8 bg-purple-600 rounded-full"></div>
            <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
          </div>
          <Analytics />
        </div>
      </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  )
}
