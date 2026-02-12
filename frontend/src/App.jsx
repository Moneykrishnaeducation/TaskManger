import { useState, useEffect } from 'react'
import './App.css'
import Login from './common/Login'
import AppRoutes from './routes/routes'

function App() {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null')
    } catch (e) {
      return null
    }
  })

  function handleLogin(payload) {
    setUser(payload)
    try {
      const role = payload?.user_type ?? payload?.userType ?? (payload?.is_superuser ? 'admin' : 'staff')
      const target = role === 'admin' ? '/admin' : '/staff'
      // navigate to appropriate dashboard
      window.location.href = target
    } catch (e) {
      // fallback: reload so routes update
      window.location.reload()
    }
  }

  function handleLogout() {
    setUser(null)
    localStorage.removeItem('user')
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    // ensure route resets
    window.location.href = '/login'
  }

  // keep localStorage in sync when user state changes (e.g., login callback)
  useEffect(() => {
    if (user) {
      try { localStorage.setItem('user', JSON.stringify(user)) } catch (e) {}
    }
  }, [user])

  if (!user) {
    return <Login defaultRole="admin" onLogin={handleLogin} />
  }

  const role = user?.user_type ?? user?.userType ?? 'staff'

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header with logout */}
      <header className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              role === 'admin'
                ? 'bg-gradient-to-br from-blue-600 to-blue-700'
                : 'bg-gradient-to-br from-green-600 to-emerald-600'
            }`}>
              {role === 'admin' ? (
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.5 1.5H5.75A2.25 2.25 0 003.5 3.75v12.5A2.25 2.25 0 005.75 18.5h8.5a2.25 2.25 0 002.25-2.25V9M10.5 1.5v4m0-4H6m4.5 4h3m-3 2.5h3m-3 2.5h3M3.5 15.5h13" />
                </svg>
              )}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {role === 'admin' ? 'Admin Dashboard' : 'Staff Dashboard'}
              </h1>
              <p className="text-xs text-gray-500">{user.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      </header>

      {/* Main Content (routes) */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <AppRoutes user={user} role={role} />
      </main>
    </div>
  )
}

export default App
