import { useEffect, useState } from 'react';
import { Users, ClipboardList, CheckCircle2, AlertCircle, LogIn } from 'lucide-react';
import { getAdminStats, getActiveUsers } from '../../services/api';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [activeUsers, setActiveUsers] = useState({ sales: [], it: [], total_active: 0 });
  const [loading, setLoading] = useState(true);
  

  useEffect(() => {
    const team = localStorage.getItem('adminTeam') || 'staff';
    fetchStats(team);
    fetchActiveUsers();

    const handler = (e) => {
      const newTeam = (e && e.detail && e.detail.team) || localStorage.getItem('adminTeam') || 'staff';
      fetchStats(newTeam);
    };
    window.addEventListener('adminTeamChanged', handler);
    return () => window.removeEventListener('adminTeamChanged', handler);
  }, []);

  const fetchStats = async (team) => {
    try {
      const data = await getAdminStats(team);
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveUsers = async () => {
    try {
      const data = await getActiveUsers();
      setActiveUsers(data);
    } catch (error) {
      console.error('Failed to fetch active users:', error);
    }
  };

  

  const StatCard = ({ icon: Icon, label, value, color }) => (
    <div className="bg-white rounded-lg shadow-md p-6 flex items-center space-x-4">
      <div className={`w-12 h-12 rounded-lg ${color} flex items-center justify-center`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-gray-600 text-sm">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return <div className="text-center py-12 text-gray-600">Failed to load stats</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome to the admin dashboard</p>
        </div>

        <div />
      </div>
      

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={Users} label="Total Users" value={stats.totalUsers} color="bg-blue-500" />
        <StatCard icon={LogIn} label="Active Users" value={activeUsers.total_active} color="bg-green-500" />
        <StatCard icon={AlertCircle} label="Pending" value={stats.pendingTasks} color="bg-red-500" />
        <StatCard icon={CheckCircle2} label="Completed" value={stats.completedTasks} color="bg-green-600" />
      </div>

      {/* Active Users Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Active Users */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-blue-600 px-6 py-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <LogIn className="w-5 h-5" />
              Active Sales Users
            </h2>
            <span className="bg-blue-400 text-white text-xs font-bold px-3 py-1 rounded-full">
              ACTIVE ({activeUsers.sales.length})
            </span>
          </div>
          <div className="p-6">
            {activeUsers.sales.length === 0 ? (
              <p className="text-gray-600 text-center py-8">No active sales users</p>
            ) : (
              <div className="space-y-3">
                {activeUsers.sales.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900">{user.username}</p>
                        <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded-full">
                          ACTIVE
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{user.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-blue-600">
                        {user.check_in_time}
                      </p>
                      <p className="text-xs text-gray-500">Check-in</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* IT/Staff Active Users */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-purple-600 px-6 py-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <LogIn className="w-5 h-5" />
              Active IT/Staff Users
            </h2>
            <span className="bg-purple-400 text-white text-xs font-bold px-3 py-1 rounded-full">
              ACTIVE ({activeUsers.it.length})
            </span>
          </div>
          <div className="p-6">
            {activeUsers.it.length === 0 ? (
              <p className="text-gray-600 text-center py-8">No active IT/Staff users</p>
            ) : (
              <div className="space-y-3">
                {activeUsers.it.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 bg-purple-50 rounded-lg border border-purple-200"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900">{user.username}</p>
                        <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded-full">
                          ACTIVE
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{user.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-purple-600">
                        {user.check_in_time}
                      </p>
                      <p className="text-xs text-gray-500">Check-in</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
