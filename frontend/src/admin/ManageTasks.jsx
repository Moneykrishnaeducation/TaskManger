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
    if (editingId) {
      setTasks((prev) => prev.map((t) => (t.id === editingId ? { ...t, title, desc, deadline } : t)))
    } else {
      const newTask = {
        id: Date.now(),
        title: title.trim(),
        desc: desc.trim(),
        deadline: deadline || null,
        completed: false,
      }
      setTasks((prev) => [newTask, ...prev])

      // Try to send to backend add API (best-effort; backend may not exist yet)
      try {
        await fetch('/api/add/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newTask),
        })
      } catch (err) {
        // Network errors are non-fatal for local-only mode
        console.warn('Add API request failed', err)
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
      {/* Form and Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
        {/* Create Task Form */}
        <form onSubmit={handleCreate} className="bg-white rounded-xl shadow-md p-4 sm:p-6">
          <h3 className="text-lg font-semibold mb-3">{editingId ? 'Edit Task' : 'Create Task'}</h3>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Task title"
            className="w-full px-3 py-2 border rounded-lg mb-3"
          />
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Description (optional)"
            className="w-full px-3 py-2 border rounded-lg mb-3"
            rows={3}
          />
          <label className="text-sm text-gray-600 mb-1 block">Deadline</label>
          <input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg mb-3"
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
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
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
