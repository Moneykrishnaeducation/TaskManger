import { useEffect, useState } from 'react';
import { CheckSquare, Clock, AlertCircle } from 'lucide-react';
import { getStaffStats } from '../../services/api';

const StaffDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const data = await getStaffStats();
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
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
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
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Track your assigned tasks and progress</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={CheckSquare} label="Total Tasks" value={stats.totalTasks} color="bg-purple-500" />
        <StatCard icon={AlertCircle} label="Pending Tasks" value={stats.pendingTasks} color="bg-red-500" />
        <StatCard icon={Clock} label="In Progress" value={stats.inProgressTasks} color="bg-yellow-500" />
        <StatCard icon={CheckSquare} label="Completed" value={stats.completedTasks} color="bg-green-500" />
      </div>
    </div>
  );
};

export default StaffDashboard;
