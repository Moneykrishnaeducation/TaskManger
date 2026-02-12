import React, { useEffect, useState } from 'react'

export default function ManageUsers({ user: propUser }) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const currentUser = propUser || JSON.parse(localStorage.getItem('user') || 'null')
  const token = localStorage.getItem('access_token')

  useEffect(() => {
    fetchUsers()
  }, [])

  async function fetchUsers() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/users/')
      if (!res.ok) throw new Error(`${res.status}`)
      const data = await res.json()
      // DRF returns a list for router.list
      setUsers(data)
    } catch (err) {
      setError('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  function canManage() {
    if (!currentUser) return false
    return !!currentUser.is_superuser || (currentUser.user_type || '').toLowerCase() === 'admin'
  }

  async function changeRole(targetUser, targetRole) {
    if (!canManage()) {
      alert('Permission denied')
      return
    }

    if (targetUser.is_superuser) {
      alert('Cannot modify superuser')
      return
    }

    const confirmMsg = `Change ${targetUser.email} role to ${targetRole}?`
    if (!confirm(confirmMsg)) return

    try {
      const res = await fetch(`/api/users/${targetUser.id}/change_role/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ target: targetRole }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'server')

      // Update local list
      setUsers((prev) => prev.map((u) => (u.id === data.user.id ? data.user : u)))
      alert('Role updated')
    } catch (err) {
      console.error(err)
      alert('Failed to update role')
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h2 className="text-2xl font-bold mb-4">Manage Users</h2>
      {loading ? (
        <p>Loading users…</p>
      ) : error ? (
        <p className="text-red-600">{error}</p>
      ) : (
        <div className="space-y-3">
          {users.length === 0 ? (
            <p className="text-gray-600">No users found.</p>
          ) : (
            users.map((u) => (
              <div key={u.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-semibold">{u.email} {u.is_superuser ? '(superuser)' : ''}</p>
                  <p className="text-sm text-gray-500">Role: {(u.user_type || 'student')}</p>
                </div>
                <div className="flex gap-2">
                  {canManage() && (
                    u.is_superuser ? (
                      <button className="px-3 py-1 bg-gray-200 rounded">superuser</button>
                    ) : u.user_type === 'admin' ? (
                      <button onClick={() => changeRole(u, 'staff')} className="px-3 py-1 bg-red-500 text-white rounded">Demote to Staff</button>
                    ) : (
                      <button onClick={() => changeRole(u, 'admin')} className="px-3 py-1 bg-green-600 text-white rounded">Promote to Admin</button>
                    )
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
