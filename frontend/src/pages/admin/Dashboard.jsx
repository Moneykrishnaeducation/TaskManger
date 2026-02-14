import { useEffect, useState } from 'react';
import { Users, ClipboardList, CheckCircle2, AlertCircle } from 'lucide-react';
import { getAdminStats } from '../../services/api';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  

  useEffect(() => {
    const team = localStorage.getItem('adminTeam') || 'staff';
    fetchStats(team);

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
        <StatCard icon={ClipboardList} label="Total Tasks" value={stats.totalTasks} color="bg-purple-500" />
        <StatCard icon={AlertCircle} label="Pending" value={stats.pendingTasks} color="bg-red-500" />
        <StatCard icon={CheckCircle2} label="Completed" value={stats.completedTasks} color="bg-green-500" />
      </div>
    </div>
  );
};

export default AdminDashboard;
