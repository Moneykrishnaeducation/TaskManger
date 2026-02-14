import { useEffect, useState } from 'react';
import { CheckSquare, Clock, AlertCircle } from 'lucide-react';
import { getStaffStats, getStaffTasks } from '../../services/api';

const StaffDashboard = () => {
  const [stats, setStats] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatsAndTasks();
  }, []);

  const fetchStatsAndTasks = async () => {
    setLoading(true);
    try {
      const [statsData, tasksData] = await Promise.all([
        getStaffStats(),
        getStaffTasks(),
      ]);
      setStats(statsData);
      setTasks(tasksData);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

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

      {/* My Tasks Table */}
      <div className="bg-white rounded-xl shadow-md mt-8">
        <div className="px-6 pt-6 pb-2">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">My Tasks</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DeadLine</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Finished</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {tasks.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-gray-400">No tasks found</td>
                </tr>
              ) : (
                tasks.map((task) => (
                  <tr key={task.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900">{task.title || task.name}</td>
                    {/* <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold 
                        ${task.priority === 'High' ? 'bg-red-500 text-white' : ''}
                        ${task.priority === 'Medium' ? 'bg-yellow-400 text-white' : ''}
                        ${task.priority === 'Low' ? 'bg-green-500 text-white' : ''}
                      `}>
                        {task.priority}
                      </span>
                    </td> */}
                     <td className="px-6 py-4 max-w-xs text-sm text-gray-600">
                    <div className="line-clamp-2">{task.description}</div>
                  </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold 
                        ${task.status === 'Pending' || task.status === 'pending' ? 'bg-red-500 text-white' : ''}
                        ${task.status === 'In Progress' || task.status === 'in_progress' ? 'bg-yellow-400 text-white' : ''}
                        ${task.status === 'Completed' || task.status === 'completed' ? 'bg-green-500 text-white' : ''}
                      `}>
                        {task.status === 'in_progress' ? 'In Progress' : task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {task.deadline ? new Date(task.deadline).toLocaleString() : '—'}
                  </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {(task.status === 'Completed' || task.status === 'completed')
                        ? (task.completed_at
                            ? new Date(task.completed_at).toLocaleString()
                            : (task.deadline ? new Date(task.deadline).toLocaleString() : '—'))
                        : '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded-lg font-medium text-sm transition">View</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;
