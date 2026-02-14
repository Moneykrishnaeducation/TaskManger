import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../services/api';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await loginUser(email, password);
      if (response.success) {
        localStorage.setItem('access_token', response.tokens.access);
        localStorage.setItem('refresh_token', response.tokens.refresh);
        localStorage.setItem('user', JSON.stringify(response.user));
        
        // Store attendance information if available
        if (response.attendance) {
          localStorage.setItem('attendance', JSON.stringify(response.attendance));
        }

        if (response.user.user_type === 'admin' || response.user.is_superuser) {
          navigate('/admin/dashboard');
        } else if (response.user.user_type === 'sales') {
          navigate('/sales/dashboard');
        } else if (response.user.user_type === 'staff' || response.user.is_staff) {
          navigate('/staff/dashboard');
        } else {
          navigate('/staff/dashboard');
        }
      } else {
        setError(response.message || 'Login failed');
      }
    } catch (err) {
      // Handle different error response formats
      const errorMessage = err.response?.data?.detail || 
                          err.response?.data?.message ||
                          err.response?.data?.non_field_errors?.[0] ||
                          (typeof err.response?.data === 'string' ? err.response.data : null) ||
                          'Invalid credentials or server error';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-300 to-purple-400">
        <div className="flex w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Welcome Panel */}
          <div className="hidden md:flex flex-col justify-center items-center bg-gradient-to-br from-blue-700 to-blue-400 text-white p-10 w-1/2">
            <div className="flex flex-col items-center">
              <div className="mb-6">
                <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center mb-4 mx-auto">
                  {/* Lucide User (profile) icon as logo, centered */}
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-14 h-14 text-blue-700">
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 20c0-2.21 3.58-4 8-4s8 1.79 8 4" />
                  </svg>
                </div>
                <div className="text-lg font-semibold tracking-wider">MoneyKrishna Education</div>
              </div>
              <h2 className="text-3xl font-bold mb-2">Hello, welcome!</h2>
              <p className="mb-6 text-center text-blue-100 max-w-xs">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Phasellus nisi risus.
              </p>
              <button className="bg-white text-blue-700 font-semibold px-6 py-2 rounded-lg shadow hover:bg-blue-50 transition">View more</button>
            </div>
          </div>

          {/* Login Form Panel */}
          <div className="flex-1 flex flex-col justify-center p-8 md:p-14">
            <h1 className="text-3xl font-bold text-center text-gray-900 mb-8">Task Manager</h1>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="flex items-center justify-between text-sm mb-2">
                <div className="flex items-center">
                  <input id="remember" type="checkbox" className="mr-2" />
                  <label htmlFor="remember" className="text-gray-600">Remember me</label>
                </div>
                <a href="#" className="text-blue-600 hover:underline">Forgot password?</a>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Login'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Not a member yet?{' '}
                <a href="/signup" className="text-blue-600 font-semibold hover:text-blue-700 underline">
                  Sign up
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
};

export default Login;
