import React, { useEffect, useMemo, useState } from 'react'

export default function ManageTasks() {
  const [tasks, setTasks] = useState(() => {
    try {
      const raw = localStorage.getItem('mk_tasks')
      return raw ? JSON.parse(raw) : []
    } catch (e) {
      console.error('load tasks', e)
      return []
    }
  })
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [deadline, setDeadline] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [filter, setFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('any')
  const [exportFormat, setExportFormat] = useState('json')
  const [exportLoading, setExportLoading] = useState(false)
  const [exportError, setExportError] = useState('')
  const [authToken, setAuthToken] = useState(() => localStorage.getItem('access_token') || localStorage.getItem('authToken') || '')
  const [usersList, setUsersList] = useState([])
  const [assigneeId, setAssigneeId] = useState(() => {
    try {
      const u = JSON.parse(localStorage.getItem('user') || 'null')
      return u?.id || ''
    } catch (e) {
      return ''
    }
  })

  useEffect(() => {
    // Keep authToken state in sync with localStorage (handles SPA login and other tabs)
    const readToken = () => {
      const t = localStorage.getItem('access_token') || localStorage.getItem('authToken') || ''
      setAuthToken(t)
      console.debug('ManageTasks: authToken read (present?):', !!t)
    }

    // Initial read
    readToken()

    // Update when storage changes in other tabs
    const onStorage = (e) => {
      if (!e) return
      if (e.key === 'access_token' || e.key === 'authToken' || e.key === 'user') {
        readToken()
      }
    }

    // Also update when the window regains focus (login may happen in same tab without reload)
    window.addEventListener('storage', onStorage)
    window.addEventListener('focus', readToken)

    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('focus', readToken)
    }
  }, [])

  // Fetch users list for assignee select (public GET should be allowed)
  useEffect(() => {
    let mounted = true
    fetch('/api/users/')
      .then((r) => r.json())
      .then((data) => {
        if (!mounted) return
        // Router returns { results: [...] } or plain list depending on DRF settings
        const list = Array.isArray(data) ? data : data.results || []
        setUsersList(list)
      })
      .catch((err) => console.debug('Failed to load users list', err))
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    localStorage.setItem('mk_tasks', JSON.stringify(tasks))
  }, [tasks])

  function resetForm() {
    setTitle('')
    setDesc('')
    setDeadline('')
    setEditingId(null)
  }

  async function handleCreate(e) {
    e.preventDefault()
    if (!title.trim()) return
    
    const token = localStorage.getItem('access_token') || localStorage.getItem('authToken')
    console.debug('handleCreate: authToken present?', !!token)
    
    if (editingId) {
      // Update existing task
      const taskToUpdate = tasks.find(t => t.id === editingId)
      if (!taskToUpdate) return
      
      const updatedData = {
        title: title.trim(),
        description: desc.trim(),
        deadline: deadline || null,
        status: taskToUpdate.completed ? 'completed' : 'pending',
        priority: 'medium',
      }
      
      // Update local state
      setTasks((prev) => prev.map((t) => (t.id === editingId ? { ...t, ...updatedData } : t)))
      
      // Try to update on backend
      if (token && taskToUpdate.backendId) {
        try {
          await fetch(`/api/tasks/${taskToUpdate.backendId}/`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(updatedData),
          })
        } catch (err) {
          console.warn('Task update API request failed', err)
        }
      }
    } else {
      // Create new task
      const newTask = {
        id: Date.now(),
        title: title.trim(),
        desc: desc.trim(),
        description: desc.trim(),
        deadline: deadline || null,
        completed: false,
        status: 'pending',
        priority: 'medium',
        backendId: null,
      }
      
      setTasks((prev) => [newTask, ...prev])

      // Try to send to backend API
      if (token) {
        try {
          const payload = {
            title: newTask.title,
            description: newTask.description,
            status: newTask.status,
            priority: newTask.priority,
            deadline: newTask.deadline,
          }
          // include assignee if selected (admin/staff only on backend will accept)
          if (assigneeId) payload.user = assigneeId

          const response = await fetch('/api/tasks/', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
                body: JSON.stringify(payload),
          })
          console.debug('Task create response status:', response.status)
          if (response.ok) {
            const backendTask = await response.json()
            // Update local task with backend ID
            setTasks((prev) => prev.map((t) => 
              t.id === newTask.id ? { ...t, backendId: backendTask.id } : t
            ))
          } else {
            const errText = await response.text().catch(() => '')
            console.warn('Task create failed:', response.status, errText)
          }
        } catch (err) {
          // Network errors are non-fatal for local-only mode
          console.warn('Task creation API request failed', err)
        }
      }
    }
    resetForm()
  }

  function handleCancel() {
    resetForm()
  }

  function handleEdit(task) {
    setEditingId(task.id)
    setTitle(task.title)
    setDesc(task.desc)
    setDeadline(task.deadline || '')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleDelete(id) {
    if (!confirm('Delete this task?')) return
    setTasks((prev) => prev.filter((t) => t.id !== id))
  }

  function toggleComplete(id) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)))
  }

  async function handleExport() {
    try {
      setExportLoading(true)
      setExportError('')
      
      // Get auth token from localStorage
      const token = localStorage.getItem('access_token') || localStorage.getItem('authToken')
      if (!token) {
        setExportError('Please login to export tasks')
        return
      }

      const response = await fetch('/api/tasks/export/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          format: exportFormat,
          status: 'all',
          priority: 'all'
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Export failed')
      }

      // Get filename from content-disposition header or use default
      const contentDisposition = response.headers.get('content-disposition')
      let filename = `tasks_export.${exportFormat}`
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^"]+)"?/)
        if (match) filename = match[1]
      }

      // Download the file
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Export error:', error)
      setExportError(error.message || 'Failed to export tasks')
    } finally {
      setExportLoading(false)
    }
  }

  const counts = useMemo(() => {
    const total = tasks.length
    const completed = tasks.filter((t) => t.completed).length
    const pending = total - completed
    return { total, completed, pending }
  }, [tasks])

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      if (filter === 'pending' && t.completed) return false
      if (filter === 'completed' && !t.completed) return false
      // date-based filters
      if (dateFilter !== 'any') {
        const dl = t.deadline ? new Date(t.deadline) : null
        const now = new Date()
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
        if (dateFilter === 'overdue') {
          if (!dl) return false
          if (!(dl < startOfToday && !t.completed)) return false
        }
        if (dateFilter === 'today') {
          if (!dl) return false
          if (!(dl >= startOfToday && dl <= endOfToday)) return false
        }
        if (dateFilter === 'week') {
          if (!dl) return false
          const endOfWeek = new Date(startOfToday)
          endOfWeek.setDate(endOfWeek.getDate() + 7)
          if (!(dl >= startOfToday && dl <= endOfWeek)) return false
        }
        if (dateFilter === 'no-deadline') {
          if (dl) return false
        }
      }
      return true
    })
  }, [tasks, filter, dateFilter])

  return (
    <div className="space-y-6">
      {/* Auth status banner */}
      {!authToken ? (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 p-3 rounded">
          You are not logged in. Tasks will be stored locally and not synced to the server. Log in to enable API sync.
        </div>
      ) : (
        <div className="bg-green-50 border-l-4 border-green-400 text-green-800 p-3 rounded">
          Logged in: API sync enabled.
        </div>
      )}
      {/* Form and Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
        {/* Create Task Form */}
        <form onSubmit={handleCreate} className="bg-white rounded-xl shadow-md p-4 sm:p-6">
          <h3 className="text-lg font-semibold mb-4">{editingId ? 'Edit Task' : 'Create Task'}</h3>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Task title"
            className="w-full px-4 py-3 mb-4 bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:from-blue-50 focus:to-blue-100 transition-all duration-200 font-medium placeholder-gray-400 shadow-sm hover:border-gray-300"
          />
          <label className="text-sm font-medium text-gray-700 mb-1 block">Assign To</label>
          <select
            value={assigneeId}
            onChange={(e) => setAssigneeId(e.target.value)}
            className="w-full px-4 py-2 mb-4 bg-white border-2 border-gray-200 rounded-lg focus:outline-none"
          >
            <option value="">Assign to me (default)</option>
            {usersList.map((u) => (
              <option key={u.id} value={u.id}>
                {u.first_name ? `${u.first_name} ${u.last_name || ''}` : (u.username || u.email)}
              </option>
            ))}
          </select>
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Description (optional)"
            className="w-full px-4 py-3 mb-4 bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:from-blue-50 focus:to-blue-100 transition-all duration-200 placeholder-gray-400 shadow-sm hover:border-gray-300"
            rows={3}
          />
          <label className="text-sm font-medium text-gray-700 mb-2 block">Deadline</label>
          <input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="w-full px-4 py-3 mb-4 bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:from-blue-50 focus:to-blue-100 transition-all duration-200 placeholder-gray-400 shadow-sm hover:border-gray-300"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={!title.trim()}
              className={`px-4 py-2 rounded-lg text-white ${
                title.trim() ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-300 cursor-not-allowed'
              }`}
            >
              {editingId ? 'Save' : 'Create'}
            </button>
            {editingId && (
              <button type="button" onClick={handleCancel} className="px-4 py-2 bg-gray-100 rounded-lg">
                Cancel
              </button>
            )}
          </div>
        </form>

        {/* Stats and Filters */}
        <div className="md:col-span-2 bg-white rounded-xl shadow-md p-4 sm:p-6">
          {/* Task Counts */}
          <div className="mb-4 flex flex-col sm:flex-row sm:gap-6">
            <div>
              <p className="text-xs text-gray-500">Total Tasks</p>
              <p className="text-2xl font-bold">{counts.total}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Pending</p>
              <p className="text-2xl font-bold text-orange-600">{counts.pending}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Completed</p>
              <p className="text-2xl font-bold text-green-600">{counts.completed}</p>
            </div>
          </div>

          {/* Filter Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-4 border-b">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-3 py-2 rounded-lg ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilter('pending')}
                  className={`px-3 py-2 rounded-lg ${filter === 'pending' ? 'bg-orange-600 text-white' : 'bg-gray-100'}`}
                >
                  Pending
                </button>
                <button
                  onClick={() => setFilter('completed')}
                  className={`px-3 py-2 rounded-lg ${filter === 'completed' ? 'bg-green-600 text-white' : 'bg-gray-100'}`}
                >
                  Completed
                </button>
              </div>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-3 py-2 border rounded-lg w-full sm:w-auto"
              >
                <option value="any">Any</option>
                <option value="overdue">Overdue</option>
                <option value="today">Today</option>
                <option value="week">This week</option>
                <option value="no-deadline">No deadline</option>
              </select>
            </div>
          </div>

          {/* Export Section */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Export Format:</label>
              <select
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value)}
                className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 transition-colors bg-gradient-to-r from-gray-50 to-gray-100"
              >
                <option value="json">📄 JSON (Data Interchange)</option>
                <option value="csv">📊 CSV (Spreadsheet)</option>
                <option value="xml">🔗 XML (Enterprise)</option>
                <option value="pdf">📑 PDF (Professional)</option>
              </select>
            </div>
            <button
              onClick={handleExport}
              disabled={exportLoading || counts.total === 0}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                exportLoading || counts.total === 0
                  ? 'bg-gray-300 cursor-not-allowed text-gray-600'
                  : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-md hover:shadow-lg'
              }`}
            >
              {exportLoading ? 'Exporting...' : '⬇️ Export'}
            </button>
            {exportError && (
              <div className="w-full sm:w-auto text-red-600 text-sm bg-red-50 p-2 rounded-lg">
                {exportError}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tasks List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <svg className="w-20 h-20 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="font-semibold text-gray-600">No tasks match your filters</p>
            <p className="text-sm text-gray-500">Try creating a new task or clear filters</p>
          </div>
        ) : (
          filtered.map((task) => (
            <div key={task.id} className="bg-white rounded-xl shadow-sm p-4 flex flex-col sm:flex-row sm:items-start justify-between border">
              <div className="flex items-start gap-4 flex-1">
                <input
                  type="checkbox"
                  checked={!!task.completed}
                  onChange={() => toggleComplete(task.id)}
                  className="mt-1"
                />
                <div className="flex-1 min-w-0">
                  <h4 className={`font-semibold break-words ${task.completed ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                    {task.title}
                  </h4>
                  {task.desc && <p className="text-sm text-gray-500 mt-1 break-words">{task.desc}</p>}
                  <p className="text-xs text-gray-400 mt-2">Created: {new Date(task.id).toLocaleString()}</p>
                  {task.deadline && (
                    <p
                      className={`text-xs mt-1 ${
                        !task.completed && new Date(task.deadline) < new Date() ? 'text-red-600 font-semibold' : 'text-gray-500'
                      }`}
                    >
                      Due: {new Date(task.deadline).toLocaleDateString()}
                      {!task.completed && new Date(task.deadline) < new Date() ? ' · Overdue' : ''}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3 sm:mt-0 sm:ml-4 w-full sm:w-auto">
                <button
                  onClick={() => handleEdit(task)}
                  className="flex-1 sm:flex-none px-3 py-1 bg-yellow-50 text-yellow-700 rounded hover:bg-yellow-100 text-sm"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(task.id)}
                  className="flex-1 sm:flex-none px-3 py-1 bg-red-50 text-red-700 rounded hover:bg-red-100 text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
