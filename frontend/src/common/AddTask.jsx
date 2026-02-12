import React, { useState } from 'react'

export default function AddTask() {
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [deadline, setDeadline] = useState('')
  const [status, setStatus] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!title.trim()) return

    const payload = {
      title: title.trim(),
      desc: desc.trim(),
      deadline: deadline || null,
    }

    try {
      const res = await fetch('/api/add/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        setStatus({ ok: true, message: 'Task added (server).' })
        setTitle('')
        setDesc('')
        setDeadline('')
      } else {
        const txt = await res.text()
        setStatus({ ok: false, message: `Server error: ${res.status} ${txt}` })
      }
    } catch (err) {
      setStatus({ ok: false, message: 'Network error (could not reach backend).' })
      console.warn('AddTask submit error', err)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
      <h3 className="text-lg font-semibold mb-3">Add Task (API)</h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Task title"
          className="w-full px-3 py-2 border rounded-lg"
        />
        <textarea
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="Description (optional)"
          className="w-full px-3 py-2 border rounded-lg"
          rows={3}
        />
        <input
          type="date"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg"
        />
        <div className="flex gap-2">
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg">Add</button>
        </div>
      </form>
      {status && (
        <p className={`mt-3 text-sm ${status.ok ? 'text-green-700' : 'text-red-700'}`}>{status.message}</p>
      )}
    </div>
  )
}
