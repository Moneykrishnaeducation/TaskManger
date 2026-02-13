import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function StaffPage({ user }) {
  const [activeNav, setActiveNav] = useState('assigned')
  const [dateFilter, setDateFilter] = useState('today')
  const navigate = useNavigate()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [completingIds, setCompletingIds] = useState([])

  // Safe user derived from prop or localStorage
  const safeUser = user || (() => {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null')
    } catch (e) {
      return null
    }
  })()

  const displayName = safeUser?.email ? safeUser.email.split('@')[0] : (safeUser?.username || 'Staff')

  useEffect(() => {
    try {
      const u = safeUser
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

  useEffect(() => {
    let mounted = true
    const fetchTasks = async () => {
      setLoading(true)
      setError('')
      try {
        const token = localStorage.getItem('access_token') || localStorage.getItem('authToken')
        const res = await fetch('/api/tasks/view/', {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        })
        if (!mounted) return
        if (!res.ok) {
          const txt = await res.text().catch(() => '')
          setError(`Failed to load tasks: ${res.status} ${txt}`)
          setTasks([])
        } else {
          const data = await res.json()
          const list = Array.isArray(data) ? data : data.assigned || []
          setTasks(list)
        }
      } catch (err) {
        setError('Connection error while loading tasks')
        setTasks([])
      } finally {
        if (mounted) setLoading(false)
      }
    }

    fetchTasks()
    return () => { mounted = false }
  }, [])

  // Map tasks to UI-friendly shapes
  const assignedWork = tasks
    .filter((t) => {
      try {
        const currentUser = safeUser
        const ownerId = t && typeof t.user === 'object' ? t.user.id : t.user
        return ownerId === currentUser?.id
      } catch (e) { return false }
    })
    .map((t) => ({ id: t.id, title: t.title, course: t.description ? t.description.slice(0,40) : 'General', dueDate: t.deadline || null, status: t.status || 'assigned', raw: t }))

  const pendingWork = tasks
    .filter((t) => {
      try {
        const currentUser = safeUser
        const ownerId = t && typeof t.user === 'object' ? t.user.id : t.user
        return (t.status || 'pending') !== 'completed' && ownerId === currentUser?.id
      } catch (e) { return false }
    })
    .map((t) => ({ id: t.id, title: t.title, course: t.description ? t.description.slice(0,40) : 'General', dueDate: t.deadline || null, priority: t.priority || 'medium', raw: t }))

  const completedWork = tasks
    .filter((t) => {
      try {
        const currentUser = safeUser
        const ownerId = t && typeof t.user === 'object' ? t.user.id : t.user
        return (t.status || '') === 'completed' && ownerId === currentUser?.id
      } catch (e) { return false }
    })
    .map((t) => ({ id: t.id, title: t.title, course: t.description ? t.description.slice(0,40) : 'General', completedDate: t.updated_at || t.created_at || null, raw: t }))

  const formatDate = (d) => {
    if (!d) return '—'
    try { return new Date(d).toLocaleDateString() } catch (e) { return 'Invalid date' }
  }
  const isPast = (d) => { if (!d) return false; try { return new Date(d) < new Date() } catch (e) { return false } }

  const filterByDate = (items, dateType) => {
    if (dateType === 'any') return items
    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23,59,59,999)
    return items.filter((item) => {
      const dueDate = item.dueDate ? new Date(item.dueDate) : null
      if (!dueDate) return dateType === 'no-deadline'
      if (dateType === 'today') return dueDate >= startOfToday && dueDate <= endOfToday
      if (dateType === 'overdue') return dueDate < startOfToday
      if (dateType === 'week') { const endOfWeek = new Date(startOfToday); endOfWeek.setDate(endOfWeek.getDate()+7); return dueDate >= startOfToday && dueDate <= endOfWeek }
      return true
    })
  }

  const filteredAssignedWork = filterByDate(assignedWork, dateFilter)
  const filteredPendingWork = filterByDate(pendingWork, dateFilter)
  const filteredCompletedWork = filterByDate(completedWork, dateFilter)

  const getToken = () => localStorage.getItem('access_token') || localStorage.getItem('authToken')

  const handleMarkCompleted = async (taskId) => {
    if (!taskId) return
    const token = getToken()
    setCompletingIds((s) => [...s, taskId])
    try {
      const res = await fetch(`/api/tasks/${taskId}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ status: 'completed' })
      })
      if (!res.ok) {
        const txt = await res.text().catch(() => '')
        setError(`Failed to update task: ${res.status} ${txt}`)
        return
      }
      const updated = await res.json()
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
    } catch (e) {
      setError('Connection error while updating task')
    } finally {
      setCompletingIds((s) => s.filter((id) => id !== taskId))
    }
  }

  const activeItems = activeNav === 'assigned' ? filteredAssignedWork : activeNav === 'pending' ? filteredPendingWork : filteredCompletedWork

  return (
    <div className="space-y-8 px-4 sm:px-6 lg:px-8">
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl shadow-lg p-8 text-white">
        <h1 className="text-4xl font-bold mb-2">Welcome, {displayName}!</h1>
        <p className="text-green-100">Manage your work and track progress</p>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-white rounded-xl shadow px-2 py-2 flex gap-2">
            <button
              onClick={() => setActiveNav('assigned')}
              aria-pressed={activeNav === 'assigned'}
              className={`px-4 py-2 rounded-lg font-medium ${activeNav === 'assigned' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              Assigned
              <span className="ml-2 inline-block px-2 py-0.5 text-xs rounded-full bg-white text-blue-700 font-bold">{filteredAssignedWork.length}</span>
            </button>

            <button
              onClick={() => setActiveNav('pending')}
              aria-pressed={activeNav === 'pending'}
              className={`px-4 py-2 rounded-lg font-medium ${activeNav === 'pending' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              Pending
              <span className="ml-2 inline-block px-2 py-0.5 text-xs rounded-full bg-white text-orange-700 font-bold">{filteredPendingWork.length}</span>
            </button>

            <button
              onClick={() => setActiveNav('completed')}
              aria-pressed={activeNav === 'completed'}
              className={`px-4 py-2 rounded-lg font-medium ${activeNav === 'completed' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              Completed
              <span className="ml-2 inline-block px-2 py-0.5 text-xs rounded-full bg-white text-green-700 font-bold">{filteredCompletedWork.length}</span>
            </button>
          </div>

          <div>
            <h2 className="text-2xl font-extrabold text-gray-900">{activeNav === 'assigned' ? 'Assigned Work' : activeNav === 'pending' ? 'Pending Work' : 'Completed Work'}</h2>
            <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-semibold">{activeItems.length} {activeItems.length === 1 ? 'task' : 'tasks'}</span>
          </div>
        </div>

        <div>
          <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="px-3 py-2 border rounded-lg bg-white shadow-sm">
            <option value="today">Today</option>
            <option value="overdue">Overdue</option>
            <option value="week">This week</option>
            <option value="any">Any</option>
            <option value="no-deadline">No deadline</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow overflow-hidden">
        <table className="w-full table-auto min-w-[600px]">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-700">Title</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-700">Course</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-700">Due / Completed</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-700">Priority / Status</th>
              <th className="text-right px-6 py-3 text-sm font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [1,2,3].map((i) => (
                <tr key={`skel-${i}`} className="animate-pulse">
                  <td colSpan={5} className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-3/4"></div></td>
                </tr>
              ))
            ) : (!activeItems || activeItems.length === 0) ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">No {activeNav} tasks {dateFilter !== 'any' ? `for ${dateFilter}` : ''}</td>
              </tr>
            ) : (
              activeItems.map((work) => (
                <tr key={work.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-6 py-4 align-top">
                    <div className="font-semibold text-gray-900">{work.title}</div>
                  </td>
                  <td className="px-6 py-4 align-top">
                    <div className="text-sm text-gray-600">{work.course}</div>
                  </td>
                  <td className="px-6 py-4 align-top">
                    <div className={`text-sm ${isPast(work.dueDate || work.completedDate) ? 'text-red-600' : 'text-gray-700'}`}>{formatDate(work.dueDate || work.completedDate)}</div>
                  </td>
                  <td className="px-6 py-4 align-top">
                    <div className="text-sm text-gray-700">{work.priority ? (work.priority === 'high' ? 'High' : 'Medium') : work.status}</div>
                  </td>
                  <td className="px-6 py-4 text-right align-top">
                    <div className="flex items-center justify-end gap-2">
                      {(activeNav !== 'completed') && (
                        <button
                          onClick={() => handleMarkCompleted(work.raw?.id)}
                          disabled={completingIds.includes(work.raw?.id) || (work.raw?.status === 'completed')}
                          className={`px-3 py-1 rounded-md text-sm ${work.raw?.status === 'completed' ? 'bg-green-200 text-green-800' : 'bg-green-600 text-white hover:bg-green-700'} ${completingIds.includes(work.raw?.id) ? 'opacity-60 cursor-wait' : ''}`}
                        >
                          {work.raw?.status === 'completed' ? 'Completed' : (completingIds.includes(work.raw?.id) ? 'Completing...' : 'Mark Completed')}
                        </button>
                      )}

                      <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md text-sm hover:bg-gray-200">Details</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

    </div>
  )
}
