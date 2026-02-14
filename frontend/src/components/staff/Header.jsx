import { useNavigate } from 'react-router-dom';
import { LogOut, User, ChevronDown } from 'lucide-react';
import { useState } from 'react';

const Header = () => {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Staff Dashboard</h1>
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="flex items-center space-x-2 text-gray-700 hover:text-gray-900"
            >
              <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-white">
                <User className="w-6 h-6" />
              </div>
              <span>{user.username}</span>
              <ChevronDown className="w-4 h-4" />
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg z-10">
                <button
                  onClick={() => {
                    setShowMenu(false);
                    navigate('/staff/profile');
                  }}
                  className="w-full flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-t-lg"
                >
                  <User className="w-4 h-4" />
                  <span>Profile</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-b-lg"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
