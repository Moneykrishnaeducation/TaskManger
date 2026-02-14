import { Link, useLocation } from 'react-router-dom';
import { BarChart3, ClipboardList, Calendar } from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();

  const isActive = (path) => location.pathname.startsWith(path);

  const menuItems = [
    { path: '/sales/dashboard', label: 'Dashboard', icon: BarChart3 },
    { path: '/sales/leads', label: 'Lead', icon: BarChart3 },
    { path: '/sales/account-opening', label: 'Account Opening', icon: ClipboardList },
    { path: '/sales/status-update', label: 'Status Update', icon: ClipboardList },
    { path: '/sales/attendance', label: 'Attendance', icon: Calendar },
  ];

  return (
    <aside className="w-64 bg-blue-900 text-white flex flex-col">
      <div className="p-6">
        <h2 className="text-2xl font-bold">Task Manager</h2>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center space-x-3 px-4 py-2 rounded-lg transition ${
                active ? 'bg-blue-700' : 'hover:bg-blue-800'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;
