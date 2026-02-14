import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerUser } from '../services/api';

const Signup = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password2: '',
    first_name: '',
    last_name: '',
    user_type: 'IT',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validate passwords match
    if (formData.password !== formData.password2) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      // Map friendly options to backend user_type values
      const payloadUserType = formData.user_type === 'IT' ? 'staff' : formData.user_type.toLowerCase();

      const response = await registerUser({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        first_name: formData.first_name,
        last_name: formData.last_name,
        user_type: payloadUserType,
      });

      if (response.success) {
        // Automatically log in the user
        localStorage.setItem('access_token', response.tokens.access);
        localStorage.setItem('refresh_token', response.tokens.refresh);
        localStorage.setItem('user', JSON.stringify(response.user));

        if (response.user.user_type === 'admin' || response.user.is_superuser) {
          navigate('/admin/dashboard');
        } else if (response.user.user_type === 'staff' || response.user.is_staff) {
          // IT users are registered as 'staff' on the backend
          navigate('/staff/dashboard');
        } else if (response.user.user_type === 'sales') {
          navigate('/sales/dashboard');
        } else {
          navigate('/login');
        }
      } else {
        setError(response.message || 'Registration failed');
      }
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-90 flex items-center justify-center bg-gradient-to-br from-blue-300 to-purple-400">
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
            <h2 className="text-3xl font-bold mb-2">Join Us!</h2>
            <p className="mb-6 text-center text-blue-100 max-w-xs">
              Create your account to access the Task Manager platform and collaborate with your team.
            </p>
            <button className="bg-white text-blue-700 font-semibold px-6 py-2 rounded-lg shadow hover:bg-blue-50 transition">Learn more</button>
          </div>
        </div>

        {/* Signup Form Panel */}
        <div className="flex-1 flex flex-col justify-center p-8 md:p-14">
          <h1 className="text-3xl font-bold text-center text-gray-900 mb-8">Create Account</h1>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
              <input
                type="text"
                name="name"
                value={formData.username}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            {/* <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div> */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">User Type</label>
              <select
                name="user_type"
                value={formData.user_type}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select user type</option>
                <option value="IT">IT</option>
                <option value="Sales">Sales</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
              <input
                type="password"
                name="password2"
                value={formData.password2}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition disabled:opacity-50 mt-2"
            >
              {loading ? 'Creating Account...' : 'Sign Up'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <a href="/login" className="text-blue-600 font-semibold hover:text-blue-700 underline">
                Login here
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
