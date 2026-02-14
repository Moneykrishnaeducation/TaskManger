import { Link, useLocation } from 'react-router-dom';
import { BarChart3, ClipboardList, Users, TrendingUp, Calendar } from 'lucide-react';
import { useEffect, useState } from 'react';

const Sidebar = () => {
  const location = useLocation();
  const [team, setTeam] = useState(localStorage.getItem('adminTeam') || 'staff');

  useEffect(() => {
    const handler = (e) => {
      // try storage event first
      const t = localStorage.getItem('adminTeam') || 'staff';
      setTeam(t);
    };

    // custom event from header
    window.addEventListener('adminTeamChanged', handler);
    // storage event (other tabs)
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener('adminTeamChanged', handler);
      window.removeEventListener('storage', handler);
    };
  }, []);

  const isActive = (path) => location.pathname.startsWith(path);

  // build menu based on selected admin team
  const baseItems = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: BarChart3 },
    { path: '/admin/tasks', label: 'Tasks', icon: ClipboardList },
    { path: '/admin/attendance', label: 'Attendance', icon: Calendar },
  ];

  let menuItems = [];
  if (team === 'sales') {
    menuItems = [
      ...baseItems,
      { path: '/admin/leads', label: 'Manage Leads', icon: TrendingUp },
      { path: '/admin/analytics', label: 'Analytics', icon: TrendingUp },
    ];
  } else {
    // default to IT (staff)
    menuItems = [
      ...baseItems,
      { path: '/admin/analytics', label: 'Analytics', icon: TrendingUp },
    ];
  }

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
