import { useState } from 'react'

const API_BASE = '/api'

const styles = `
  @keyframes fadeInDown {
    from {
      opacity: 0;
      transform: translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  @keyframes slideInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  @keyframes animateGradient {
    0% {
      background-position: 0% 50%;
    }
    50% {
      background-position: 100% 50%;
    }
    100% {
      background-position: 0% 50%;
    }
  }
  @keyframes floatOrb {
    0% {
      transform: translate(0, 0);
      opacity: 0.3;
    }
    50% {
      transform: translate(30px, -30px);
      opacity: 0.5;
    }
    100% {
      transform: translate(0, 0);
      opacity: 0.3;
    }
  }
  @keyframes floatOrb2 {
    0% {
      transform: translate(0, 0);
      opacity: 0.2;
    }
    50% {
      transform: translate(-30px, 30px);
      opacity: 0.4;
    }
    100% {
      transform: translate(0, 0);
      opacity: 0.2;
    }
  }
  .animate-fade-in-down {
    animation: fadeInDown 0.8s ease-out;
  }
  .animate-slide-in-up {
    animation: slideInUp 0.8s ease-out 0.2s both;
  }
  .animate-gradient {
    animation: animateGradient 8s ease infinite;
  }
  .gradient-text {
    background: linear-gradient(90deg, #1e40af 0%, #16a34a 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .text-blue-title {
    color: #1e40af;
  }
  .text-green-title {
    color: #16a34a;
  }
  .bg-animated-purple {
    background: linear-gradient(-45deg, #e9d5ff, #f3e8ff, #ddd6fe, #ede9fe);
    background-size: 400% 400%;
    animation: animateGradient 8s ease infinite;
    position: relative;
    overflow: hidden;
  }
  .bg-animated-purple::before {
    content: '';
    position: absolute;
    top: -50%;
    right: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle, rgba(168, 85, 247, 0.1) 0%, transparent 70%);
    animation: floatOrb 8s ease-in-out infinite;
    pointer-events: none;
  }
  .bg-animated-purple::after {
    content: '';
    position: absolute;
    bottom: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 70%);
    animation: floatOrb2 10s ease-in-out infinite;
    pointer-events: none;
  }
  .bg-animated-green {
    background: linear-gradient(-45deg, #dcfce7, #f0fdf4, #d1fae5, #ecfdf5);
    background-size: 400% 400%;
    animation: animateGradient 8s ease infinite;
    position: relative;
    overflow: hidden;
  }
  .bg-animated-green::before {
    content: '';
    position: absolute;
    top: -50%;
    right: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle, rgba(34, 197, 94, 0.1) 0%, transparent 70%);
    animation: floatOrb 8s ease-in-out infinite;
    pointer-events: none;
  }
  .bg-animated-green::after {
    content: '';
    position: absolute;
    bottom: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle, rgba(21, 128, 61, 0.1) 0%, transparent 70%);
    animation: floatOrb2 10s ease-in-out infinite;
    pointer-events: none;
  }
`

export default function Login({ defaultRole = 'staff', onLogin }) {
  const logoUrl = `${import.meta.env.BASE_URL || '/'}logo.webp`
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [userType, setUserType] = useState(defaultRole)
  const [formMode, setFormMode] = useState('login')
  const [signupType, setSignupType] = useState('staff')
  const [signupName, setSignupName] = useState('')
  const [signupEmail, setSignupEmail] = useState('')
  const [signupPassword, setSignupPassword] = useState('')
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('')
  const [showSignupPassword, setShowSignupPassword] = useState(false)
  const [showSignupConfirmPassword, setShowSignupConfirmPassword] = useState(false)
  
  // New state for loading, errors, and messages
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccessMessage('')

    if (!email || !password) {
      setError('Please enter both email and password')
      setLoading(false)
      return
    }

    try {
      // Only send credentials; do not send a selected role to avoid
      // "Selected role does not match this account" errors when the
      // frontend default differs from the actual user role.
      const payload = { email: email, password: password }

      const response = await fetch(`${API_BASE}/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        // Support possible error shapes
        setError(data.detail || data.message || (data.errors && Object.values(data.errors)[0]?.[0]) || 'Login failed. Please check your credentials.')
        return
      }

      // Backend returns { success, message, user, tokens: { refresh, access } }
      const user = data.user || data.user || null
      // Normalize backend superuser flag to frontend role
      if (user && (user.is_superuser || user.is_superuser === true)) {
        user.user_type = 'admin'
      }
      const tokens = data.tokens || { access: data.access, refresh: data.refresh }

      if (tokens?.access) localStorage.setItem('access_token', tokens.access)
      if (tokens?.refresh) localStorage.setItem('refresh_token', tokens.refresh)
      if (user) localStorage.setItem('user', JSON.stringify(user))

      setSuccessMessage(`Welcome back, ${user?.first_name || user?.email || ''}!`)

      // Clear form
      setEmail('')
      setPassword('')

      // Decide redirect based on actual user_type
      const target = (() => {
        if (!user) return '/dashboard'
        if (user.user_type === 'admin') return '/admin'
        if (user.user_type === 'staff') return '/staff'
        return '/dashboard'
      })()

      // Call onLogin callback with user data
      if (onLogin) {
        setTimeout(() => onLogin(user), 1000)
      } else {
        setTimeout(() => {
          window.location.href = target
        }, 1500)
      }
    } catch (err) {
      console.error('Login error:', err)
      setError(err.message || 'Connection error. Please check if the server is running on port 8000.')
    } finally {
      setLoading(false)
    }
  }

  const handleSignup = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccessMessage('')

    if (!signupName || !signupEmail || !signupPassword || !signupConfirmPassword) {
      setError('Please fill in all fields')
      setLoading(false)
      return
    }

    if (signupPassword !== signupConfirmPassword) {
      setError('Passwords do not match!')
      setLoading(false)
      return
    }

    if (signupPassword.length < 8) {
      setError('Password must be at least 8 characters long')
      setLoading(false)
      return
    }

    try {
      // First check email availability
      const emailCheckRes = await fetch(`${API_BASE}/check-email/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: signupEmail }),
      })
      const emailCheck = await emailCheckRes.json()
      
      if (!emailCheck.available) {
        setError('This email is already registered. Try logging in instead.')
        setLoading(false)
        return
      }

      // Check username availability
      const usernameSlug = signupName.toLowerCase().replace(/\s+/g, '_')
      const usernameCheckRes = await fetch(`${API_BASE}/check-username/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: usernameSlug }),
      })
      const usernameCheck = await usernameCheckRes.json()
      
      if (!usernameCheck.available) {
        setError('This username is already taken. Try a different name.')
        setLoading(false)
        return
      }

      // Register user
      const [firstName, ...lastNameParts] = signupName.trim().split(' ')
      const lastName = lastNameParts.join(' ') || ''

      const response = await fetch(`${API_BASE}/register/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: signupEmail,
          username: usernameSlug,
          first_name: firstName,
          last_name: lastName,
          password: signupPassword,
          password_confirm: signupConfirmPassword,
          user_type: signupType,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Handle specific error messages from backend
        if (data.errors) {
          const errorMsg = Object.values(data.errors)[0]?.[0] || 'Registration failed'
          setError(errorMsg)
        } else {
          setError(data.message || data.detail || 'Registration failed')
        }
        console.error('Registration error:', data)
        return
      }

      // Store tokens after successful registration (guard for different response shapes)
      const accessToken = data.tokens?.access || data.access
      const refreshToken = data.tokens?.refresh || data.refresh
      if (accessToken) localStorage.setItem('access_token', accessToken)
      if (refreshToken) localStorage.setItem('refresh_token', refreshToken)
      if (data.user) localStorage.setItem('user', JSON.stringify(data.user))

      setSuccessMessage(`Account created! Welcome, ${data.user?.first_name || data.user?.email || ''}!`)

      // Decide redirect based on actual user_type (ensure redirect even if parent doesn't)
      const target = (() => {
        if (!data.user) return '/dashboard'
        if (data.user.user_type === 'admin') return '/admin'
        if (data.user.user_type === 'staff') return '/staff'
        return '/dashboard'
      })()

      setTimeout(() => {
        resetSignupForm()
        setFormMode('login')
        try {
          if (onLogin) onLogin(data.user)
        } catch (e) {
          console.error('onLogin callback error:', e)
        }
        // Always navigate to the determined target to avoid stuck flows
        window.location.href = target
      }, 1200)
    } catch (err) {
      console.error('Signup error:', err)
      setError(err.message || 'Connection error. Please check if the server is running on port 8000.')
    } finally {
      setLoading(false)
    }
  }

  const resetSignupForm = () => {
    setSignupName('')
    setSignupEmail('')
    setSignupPassword('')
    setSignupConfirmPassword('')
    setShowSignupPassword(false)
    setShowSignupConfirmPassword(false)
    setSignupType('staff')
  }

  const getBackgroundStyle = () => {
    if (formMode === 'login') {
      return { backgroundImage: `url('/bg1.jpg')` }
    }
    return {}
  }

  const getBackgroundClass = () => {
    if (formMode === 'signup') {
      return 'bg-animated-green'
    }
    return ''
  }

  return (
    <>
      <style>{styles}</style>
      <div 
        className={`min-h-screen flex items-center justify-center p-4 bg-cover bg-center transition-all duration-500 ${getBackgroundClass()}`}
        style={getBackgroundStyle()}
      >
      <div className="w-full max-w-md">
        {/* Card Container */}
        <div className="rounded-3xl shadow-2xl overflow-hidden border border-gray-100 animate-slide-in-up backdrop-blur-sm bg-white/95">
          
          {/* Top curved image section with gradient */}
          <div className="relative h-20 bg-white rounded-b-3xl overflow-hidden flex items-start justify-center -pt-1">
            {/* Logo */}
            <img
              src={logoUrl}
              alt="Moneykrishna Education"
              className="h-14 object-contain"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
            {/* Overlay gradient for depth */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white/10"></div>
            
            {/* Profile Avatar - Enhanced */}
            <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
              <div className="w-18 h-18 bg-white rounded-full border-4 border-white shadow-2xl flex items-center justify-center ring-4 ring-green-100">
                <svg className="w-12 h-12 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>

          {/* Form Content */}
          <div className="px-8 pt-12 pb-6">
            
            {/* Title - Enhanced */}
            {formMode === 'login' && (
              <p className="text-center bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent text-xs font-semibold mb-4 animate-fade-in-down">Welcome back! Sign in to access your learning dashboard</p>
            )}
            {formMode === 'signup' && (
              <h2 className="text-center text-2xl font-bold text-gray-900 mb-4 animate-fade-in-down">Create {signupType.charAt(0).toUpperCase() + signupType.slice(1)} Account</h2>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-3 mb-4 rounded-md animate-slide-in-up">
                <p className="text-red-700 text-sm font-medium flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  {error}
                </p>
              </div>
            )}

            {/* Success Message */}
            {successMessage && (
              <div className="bg-green-50 border-l-4 border-green-500 p-3 mb-4 rounded-md animate-slide-in-up">
                <p className="text-green-700 text-sm font-medium flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  {successMessage}
                </p>
              </div>
            )}

            {/* LOGIN FORM */}
            {formMode === 'login' && (
              <>
                {/* User Type Selector - Enhanced */}
                {/* <div className="flex gap-3 mb-4 bg-gray-100 p-1 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setUserType('admin')}
                    className={`flex-1 py-1.5 text-sm rounded-md font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                      userType === 'admin'
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/50 transform scale-105'
                        : 'bg-transparent text-gray-600 hover:text-gray-900 hover:bg-blue-50'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM9 6a3 3 0 11-6 0 3 3 0 016 0zM9 11a6 6 0 01-6 6H3a1 1 0 00-1-1h-.5A.5.5 0 010 14v-2a1 1 0 011-1h.5A.5.5 0 011 11a1 1 0 001-1v-2a1 1 0 01.5-.5H4a1 1 0 01.5.5v2a1 1 0 001 1h.5a.5.5 0 01.5.5v2a.5.5 0 01-.5.5H3a1 1 0 00-1 1v2a1 1 0 01-1 1h-.5A.5.5 0 010 14v-2a1 1 0 011-1h.5A.5.5 0 011 11a1 1 0 001-1v-2a1 1 0 01.5-.5H4a1 1 0 01.5.5v2a1 1 0 001 1h.5a.5.5 0 01.5.5v2a.5.5 0 01-.5.5H3a1 1 0 00-1 1v2a1 1 0 01-1 1h-.5A.5.5 0 010 14zm11-8a3 3 0 11-6 0 3 3 0 016 0zM13 9a3 3 0 100-6 3 3 0 000 6z" />
                    </svg>
                    Admin
                  </button>
                  <button
                    type="button"
                    onClick={() => setUserType('staff')}
                    className={`flex-1 py-1.5 text-sm rounded-md font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                      userType === 'staff'
                        ? 'bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg shadow-green-500/50 transform scale-105'
                        : 'bg-transparent text-gray-600 hover:text-gray-900 hover:bg-green-50'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                    Staff
                  </button>
                </div> */}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-3">
                  
                  {/* Email Input - Enhanced */}
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <input
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                      className="w-full pl-12 pr-4 py-2 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-300 outline-none placeholder-gray-400 text-gray-900 transition-all duration-300 bg-gray-50 focus:bg-white hover:border-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
                      required
                    />
                  </div>

                  {/* Password Input - Enhanced */}
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      className="w-full pl-12 pr-12 py-2 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-300 outline-none placeholder-gray-400 text-gray-900 transition-all duration-300 bg-gray-50 focus:bg-white hover:border-green-400 disabled:opacity-50 disabled:cursor-not-allowed"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={loading}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-4.803m5.596-3.856a3.375 3.375 0 11-4.753 4.753m4.753-4.753L3.596 3.039m10.318 10.318L21 21" />
                        </svg>
                      )}
                    </button>
                  </div>

                  {/* Login Button - Enhanced */}
                  <button
                    type="submit"
                    disabled={loading}
                    className={`w-full bg-gradient-to-r from-blue-600 via-blue-700 to-green-600 hover:from-blue-700 hover:via-blue-800 hover:to-green-700 text-white py-2.5 rounded-xl font-bold text-sm transition-all duration-300 shadow-lg hover:shadow-2xl shadow-green-500/50 hover:shadow-green-500/70 transform hover:scale-105 active:scale-95 mt-4 flex items-center justify-center gap-2 ${
                      loading ? 'opacity-70 cursor-not-allowed' : ''
                    }`}
                  >
                    {loading ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Logging in...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        LOGIN
                      </>
                    )}
                  </button>
                </form>

                {/* Divider */}
                <div className="flex items-center gap-4 my-2">
                  <div className="flex-1 h-px bg-gray-200"></div>
                  <span className="text-gray-400 text-xs">OR</span>
                  <div className="flex-1 h-px bg-gray-200"></div>
                </div>

                

                {/* Join Link - Enhanced */}
                <p className="text-center text-gray-600 text-sm">
                  Not a member yet?{' '}
                  <button onClick={() => setFormMode('signup')} className="text-orange-500 font-bold hover:text-orange-600 transition-colors bg-none border-none cursor-pointer">
                    Join Now
                  </button>
                </p>
              </>
            )}

            {/* SIGNUP FORM */}
            {formMode === 'signup' && (
              <>
                {/* Account Type Selector - Tabs */}
                {/* <div className="flex gap-3 mb-4 bg-gray-100 p-1 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setSignupType('admin')}
                    className={`flex-1 py-1.5 text-sm rounded-md font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                      signupType === 'admin'
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/50 transform scale-105'
                        : 'bg-transparent text-gray-600 hover:text-gray-900 hover:bg-blue-50'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM9 6a3 3 0 11-6 0 3 3 0 016 0zM9 11a6 6 0 01-6 6H3a1 1 0 00-1-1h-.5A.5.5 0 010 14v-2a1 1 0 011-1h.5A.5.5 0 011 11a1 1 0 001-1v-2a1 1 0 01.5-.5H4a1 1 0 01.5.5v2a1 1 0 001 1h.5a.5.5 0 01.5.5v2a.5.5 0 01-.5.5H3a1 1 0 00-1 1v2a1 1 0 01-1 1h-.5A.5.5 0 010 14v-2a1 1 0 011-1h.5A.5.5 0 011 11a1 1 0 001-1v-2a1 1 0 01.5-.5H4a1 1 0 01.5.5v2a1 1 0 001 1h.5a.5.5 0 01.5.5v2a.5.5 0 01-.5.5H3a1 1 0 00-1 1v2a1 1 0 01-1 1h-.5A.5.5 0 010 14zm11-8a3 3 0 11-6 0 3 3 0 016 0zM13 9a3 3 0 100-6 3 3 0 000 6z" />
                    </svg>
                    Admin
                  </button>
                  <button
                    type="button"
                    onClick={() => setSignupType('staff')}
                    className={`flex-1 py-1.5 text-sm rounded-md font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                      signupType === 'staff'
                        ? 'bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg shadow-green-500/50 transform scale-105'
                        : 'bg-transparent text-gray-600 hover:text-gray-900 hover:bg-green-50'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                    Staff
                  </button>
                </div> */}

                {/* Form */}
                <form onSubmit={handleSignup} className="space-y-3">
                  
                  {/* Name Input - Enhanced */}
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      placeholder="Enter your full name"
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      disabled={loading}
                      className="w-full pl-12 pr-4 py-2 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-300 outline-none placeholder-gray-400 text-gray-900 transition-all duration-300 bg-gray-50 focus:bg-white hover:border-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
                      required
                    />
                  </div>

                  {/* Email Input - Enhanced */}
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <input
                      type="email"
                      placeholder="Enter your email"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      disabled={loading}
                      className="w-full pl-12 pr-4 py-2 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-300 outline-none placeholder-gray-400 text-gray-900 transition-all duration-300 bg-gray-50 focus:bg-white hover:border-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
                      required
                    />
                  </div>

                  {/* Password Input - Enhanced */}
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <input
                      type={showSignupPassword ? 'text' : 'password'}
                      placeholder="Create a password"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      disabled={loading}
                      className="w-full pl-12 pr-12 py-2 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-300 outline-none placeholder-gray-400 text-gray-900 transition-all duration-300 bg-gray-50 focus:bg-white hover:border-green-400 disabled:opacity-50 disabled:cursor-not-allowed"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignupPassword(!showSignupPassword)}
                      disabled={loading}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                    >
                      {showSignupPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-4.803m5.596-3.856a3.375 3.375 0 11-4.753 4.753m4.753-4.753L3.596 3.039m10.318 10.318L21 21" />
                        </svg>
                      )}
                    </button>
                  </div>

                  {/* Confirm Password Input - Enhanced */}
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <input
                      type={showSignupConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm your password"
                      value={signupConfirmPassword}
                      onChange={(e) => setSignupConfirmPassword(e.target.value)}
                      disabled={loading}
                      className="w-full pl-12 pr-12 py-2 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-300 outline-none placeholder-gray-400 text-gray-900 transition-all duration-300 bg-gray-50 focus:bg-white hover:border-green-400 disabled:opacity-50 disabled:cursor-not-allowed"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignupConfirmPassword(!showSignupConfirmPassword)}
                      disabled={loading}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                    >
                      {showSignupConfirmPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-4.803m5.596-3.856a3.375 3.375 0 11-4.753 4.753m4.753-4.753L3.596 3.039m10.318 10.318L21 21" />
                        </svg>
                      )}
                    </button>
                  </div>

                  {/* Signup Button - Enhanced */}
                  <button
                    type="submit"
                    disabled={loading}
                    className={`w-full bg-gradient-to-r from-blue-600 via-blue-700 to-green-600 hover:from-blue-700 hover:via-blue-800 hover:to-green-700 text-white py-2.5 rounded-xl font-bold text-sm transition-all duration-300 shadow-lg hover:shadow-2xl shadow-green-500/50 hover:shadow-green-500/70 transform hover:scale-105 active:scale-95 mt-4 flex items-center justify-center gap-2 ${
                      loading ? 'opacity-70 cursor-not-allowed' : ''
                    }`}
                  >
                    {loading ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Creating Account...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                        </svg>
                        CREATE ACCOUNT
                      </>
                    )}
                  </button>
                </form>

                {/* Back to Login Link */}
                <p className="text-center text-gray-600 text-sm mt-4">
                  <button onClick={() => { setFormMode('login'); resetSignupForm() }} className="text-blue-600 font-bold hover:text-blue-700 transition-colors bg-none border-none cursor-pointer">
                    Back to Login
                  </button>
                </p>
              </>
            )}
          </div>
        </div>

        {/* Footer - Enhanced */}
        <p className="text-center text-gray-500 text-xs mt-6">
          © 2026 Moneykrishna Education. All rights reserved
        </p>
      </div>
      </div>
    </>
  )
}
