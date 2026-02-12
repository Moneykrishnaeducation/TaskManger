import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function StaffPage({ user }) {
  const [activeNav, setActiveNav] = useState('assigned')
  const [dateFilter, setDateFilter] = useState('today')
  const navigate = useNavigate()

  useEffect(() => {
    try {
      const u = user || JSON.parse(localStorage.getItem('user') || 'null')
      if (!u) {
        navigate('/login', { replace: true })
        return
      }

      // If user is admin/superuser, redirect to admin dashboard
      const isAdminType = (u.user_type || '').toLowerCase() === 'admin'
      const isSuper = !!u.is_superuser
      if (isAdminType || isSuper) {
        navigate('/admin', { replace: true })
      }
    } catch (err) {
      navigate('/login', { replace: true })
    }
  }, [user, navigate])

  // Mock work data
  const assignedWork = [
    { id: 1, title: 'Prepare Lecture Slides', course: 'JavaScript Basics', dueDate: '2026-02-12', status: 'assigned' },
    { id: 2, title: 'Grade Assignments', course: 'React Fundamentals', dueDate: '2026-02-14', status: 'assigned' },
    { id: 3, title: 'Create Quiz', course: 'Web Design Concepts', dueDate: '2026-02-20', status: 'assigned' },
  ]

  const pendingWork = [
    { id: 4, title: 'Review Student Projects', course: 'JavaScript Basics', dueDate: '2026-02-12', priority: 'high' },
    { id: 5, title: 'Update Course Materials', course: 'React Fundamentals', dueDate: '2026-02-16', priority: 'medium' },
  ]

  const completedWork = [
    { id: 6, title: 'Monthly Report', course: 'General', completedDate: '2026-02-10' },
    { id: 7, title: 'Student Feedback Summary', course: 'Web Design Concepts', completedDate: '2026-02-09' },
    { id: 8, title: 'Curriculum Review', course: 'General', completedDate: '2026-02-05' },
  ]

  // Filter function for due dates
  const filterByDate = (items, dateType) => {
    if (dateType === 'any') return items
    
    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
    
    return items.filter((item) => {
      const dueDate = item.dueDate ? new Date(item.dueDate) : null
      if (!dueDate) {
        return dateType === 'no-deadline'
      }
      
      if (dateType === 'today') {
        return dueDate >= startOfToday && dueDate <= endOfToday
      }
      if (dateType === 'overdue') {
        return dueDate < startOfToday
      }
      if (dateType === 'week') {
        const endOfWeek = new Date(startOfToday)
        endOfWeek.setDate(endOfWeek.getDate() + 7)
        return dueDate >= startOfToday && dueDate <= endOfWeek
      }
      return true
    })
  }

  const filteredAssignedWork = filterByDate(assignedWork, dateFilter)
  const filteredPendingWork = filterByDate(pendingWork, dateFilter)
  const filteredCompletedWork = filterByDate(completedWork, dateFilter)

  const totalCounts = {
    assigned: assignedWork.length,
    pending: pendingWork.length,
    completed: completedWork.length,
  }

  return (
    <div className="space-y-8 px-4 sm:px-6 lg:px-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl shadow-lg p-8 text-white">
        <h1 className="text-4xl font-bold mb-2">Welcome, {user.email?.split('@')[0]}!</h1>
        <p className="text-green-100">Manage your work and track progress</p>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Assigned</p>
              <p className="text-3xl font-bold text-blue-900 mt-1">{totalCounts.assigned}</p>
            </div>
            <div className="bg-blue-200 p-3 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-600">Pending</p>
              <p className="text-3xl font-bold text-orange-900 mt-1">{totalCounts.pending}</p>
            </div>
            <div className="bg-orange-200 p-3 rounded-lg">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Completed</p>
              <p className="text-3xl font-bold text-green-900 mt-1">{totalCounts.completed}</p>
            </div>
            <div className="bg-green-200 p-3 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Work Navigation Menu */}
      <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 border border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:gap-3 flex-1">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveNav('assigned')}
                className={`px-4 sm:px-6 py-2 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2 whitespace-nowrap ${
                  activeNav === 'assigned'
                    ? 'bg-blue-600 text-white shadow-lg scale-105'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span>Assigned</span>
                <span className="ml-1 px-2 py-0.5 bg-white bg-opacity-20 rounded-full text-xs font-bold">{totalCounts.assigned}</span>
              </button>
              <button
                onClick={() => setActiveNav('pending')}
                className={`px-4 sm:px-6 py-2 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2 whitespace-nowrap ${
                  activeNav === 'pending'
                    ? 'bg-orange-600 text-white shadow-lg scale-105'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Pending</span>
                <span className="ml-1 px-2 py-0.5 bg-white bg-opacity-20 rounded-full text-xs font-bold">{totalCounts.pending}</span>
              </button>
              <button
                onClick={() => setActiveNav('completed')}
                className={`px-4 sm:px-6 py-2 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2 whitespace-nowrap ${
                  activeNav === 'completed'
                    ? 'bg-green-600 text-white shadow-lg scale-105'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Completed</span>
                <span className="ml-1 px-2 py-0.5 bg-white bg-opacity-20 rounded-full text-xs font-bold">{totalCounts.completed}</span>
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg w-full sm:w-auto bg-white font-medium text-gray-700 hover:border-gray-400 transition-colors"
            >
              <option value="today">Today</option>
              <option value="overdue">Overdue</option>
              <option value="week">This week</option>
              <option value="any">Any</option>
              <option value="no-deadline">No deadline</option>
            </select>
          </div>
        </div>
      </div>

      {/* ASSIGNED WORK SECTION */}
      {activeNav === 'assigned' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 bg-blue-600 rounded-full"></div>
            <h2 className="text-2xl font-bold text-gray-900">Assigned Work</h2>
            <span className="ml-auto px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">{filteredAssignedWork.length} tasks</span>
          </div>
          {filteredAssignedWork.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-12 text-center border border-gray-100">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <p className="text-lg font-semibold text-gray-600">No assigned work {dateFilter !== 'any' ? `for ${dateFilter}` : ''}</p>
              <p className="text-sm text-gray-500 mt-2">Tasks will appear here when they're assigned to you</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAssignedWork.map((work, idx) => (
                <div key={work.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 p-5 sm:p-6 border-l-4 border-blue-600 hover:border-l-8 group" style={{ animationDelay: `${idx * 50}ms` }}>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 text-lg group-hover:text-blue-600 transition-colors">{work.title}</h3>
                      <div className="flex flex-wrap items-center gap-3 mt-2">
                        <span className="inline-block px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">{work.course}</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-3">Due: <span className={`font-semibold ${new Date(work.dueDate) < new Date() ? 'text-red-600' : 'text-gray-700'}`}>{new Date(work.dueDate).toLocaleDateString()}</span></p>
                    </div>
                    <div className="flex gap-2 sm:flex-col lg:flex-row">
                      <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 font-medium text-sm hover:shadow-lg">Start</button>
                      <button className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-200 font-medium text-sm">Details</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* PENDING WORK SECTION */}
      {activeNav === 'pending' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 bg-orange-600 rounded-full"></div>
            <h2 className="text-2xl font-bold text-gray-900">Pending Work</h2>
            <span className="ml-auto px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-semibold">{filteredPendingWork.length} tasks</span>
          </div>
          {filteredPendingWork.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-12 text-center border border-gray-100">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-lg font-semibold text-gray-600">No pending work {dateFilter !== 'any' ? `for ${dateFilter}` : ''}</p>
              <p className="text-sm text-gray-500 mt-2">All caught up! No pending tasks for now</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredPendingWork.map((work, idx) => (
                <div key={work.id} className={`bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 p-5 sm:p-6 border-l-4 group ${work.priority === 'high' ? 'border-red-600 hover:border-l-8' : 'border-orange-600 hover:border-l-8'}`} style={{ animationDelay: `${idx * 50}ms` }}>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900 text-lg group-hover:text-orange-600 transition-colors">{work.title}</h3>
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${work.priority === 'high' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                          {work.priority === 'high' ? '🔴 High' : '🟠 Medium'}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 mt-2">
                        <span className="inline-block px-3 py-1 bg-orange-50 text-orange-700 rounded-full text-xs font-medium">{work.course}</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-3">Due: <span className={`font-semibold ${new Date(work.dueDate) < new Date() ? 'text-red-600' : 'text-gray-700'}`}>{new Date(work.dueDate).toLocaleDateString()}</span></p>
                    </div>
                    <div className="flex gap-2 sm:flex-col lg:flex-row">
                      <button className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-all duration-200 font-medium text-sm hover:shadow-lg">Continue</button>
                      <button className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-200 font-medium text-sm">Details</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* COMPLETED WORK SECTION */}
      {activeNav === 'completed' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 bg-green-600 rounded-full"></div>
            <h2 className="text-2xl font-bold text-gray-900">Completed Work</h2>
            <span className="ml-auto px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">{filteredCompletedWork.length} tasks</span>
          </div>
          {filteredCompletedWork.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-12 text-center border border-gray-100">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-lg font-semibold text-gray-600">No completed work {dateFilter !== 'any' ? `for ${dateFilter}` : ''}</p>
              <p className="text-sm text-gray-500 mt-2">Completed tasks will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredCompletedWork.map((work, idx) => (
                <div key={work.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 p-5 sm:p-6 border-l-4 border-green-600 hover:border-l-8 group" style={{ animationDelay: `${idx * 50}ms` }}>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <h3 className="font-semibold text-gray-900 text-lg group-hover:text-green-600 transition-colors line-through text-gray-500">{work.title}</h3>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 mt-2">
                        <span className="inline-block px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium">{work.course}</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-3">Completed: <span className="font-semibold text-green-700">{new Date(work.completedDate).toLocaleDateString()}</span></p>
                    </div>
                    <div>
                      <button className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-200 font-medium text-sm">Details</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
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
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}
