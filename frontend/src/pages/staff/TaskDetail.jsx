import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock } from 'lucide-react';
import { getStaffTaskById, updateStaffTaskStatus, updateStaffTaskDetails } from '../../services/api';

const StaffTaskDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    fetchTask();
  }, [id]);

  const fetchTask = async () => {
    try {
      const data = await getStaffTaskById(id);
      setTask(data);
      setFormData({
        title: data.title,
        description: data.description,
        status: data.status,
        priority: data.priority,
        deadline: data.deadline,
      });
    } catch (error) {
      console.error('Failed to fetch task:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await updateStaffTaskStatus(id, newStatus);
      setTask({ ...task, status: newStatus });
      setFormData({ ...formData, status: newStatus });
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleSaveDetails = async () => {
    try {
      await updateStaffTaskDetails(id, formData);
      setTask({ ...task, ...formData });
      setEditing(false);
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Task not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/staff/tasks')}
        className="flex items-center space-x-2 text-green-600 hover:text-green-700 font-medium"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Back to Tasks</span>
      </button>

      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="mb-6">
          {editing ? (
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="text-3xl font-bold text-gray-900 border-b-2 border-green-500 pb-2 w-full focus:outline-none"
            />
          ) : (
            <h1 className="text-3xl font-bold text-gray-900">{task.title}</h1>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 pb-8 border-b border-gray-200">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={formData.status}
              onChange={(e) => {
                setFormData({ ...formData, status: e.target.value });
                handleStatusChange(e.target.value);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            >
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
            {editing ? (
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            ) : (
              <span className={`px-4 py-2 rounded-lg text-sm font-medium inline-block ${
                task.priority === 'high' ? 'bg-red-100 text-red-800' :
                task.priority === 'medium' ? 'bg-orange-100 text-orange-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {task.priority}
              </span>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Deadline</label>
            {editing ? (
              <input
                type="datetime-local"
                value={formData.deadline ? new Date(formData.deadline).toISOString().slice(0, 16) : ''}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            ) : (
              <div className="flex items-center space-x-2 text-gray-600">
                <Clock className="w-5 h-5" />
                <span>{task.deadline ? new Date(task.deadline).toLocaleDateString() : 'No deadline'}</span>
              </div>
            )}
          </div>
        </div>

        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
          {editing ? (
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 min-h-[120px]"
            />
          ) : (
            <p className="text-gray-600">{task.description || 'No description'}</p>
          )}
        </div>

        <div className="flex items-center space-x-3">
          {editing ? (
            <>
              <button
                onClick={handleSaveDetails}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium"
              >
                Save Changes
              </button>
              <button
                onClick={() => setEditing(false)}
                className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-900 rounded-lg font-medium"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
            >
              Edit Task
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default StaffTaskDetail;
