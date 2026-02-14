import { useEffect, useState } from 'react';
import { Trash2, Edit2, Plus } from 'lucide-react';
import { getAdminTasks, deleteAdminTask, createAdminTask, updateAdminTask, getUsers } from '../../services/api';

const AdminManageTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const team = localStorage.getItem('adminTeam') || 'staff';
    fetchTasks(team);
    // fetch users for assignment and filter by team
    (async () => {
      try {
        const u = await getUsers();
        const list = Array.isArray(u) ? u : [];
        const filtered = list.filter(user => {
          if (team === 'sales') return user.user_type === 'sales';
          return user.user_type === 'staff' || user.is_staff;
        });
        setUsers(filtered);
      } catch (err) {
        console.error('Failed to fetch users', err);
      }
    })();

    const handler = (e) => {
      const newTeam = (e && e.detail && e.detail.team) || localStorage.getItem('adminTeam') || 'staff';
      fetchTasks(newTeam);
      (async () => {
        try {
          const u = await getUsers();
          const list = Array.isArray(u) ? u : [];
          const filtered = list.filter(user => {
            if (newTeam === 'sales') return user.user_type === 'sales';
            return user.user_type === 'staff' || user.is_staff;
          });
          setUsers(filtered);
        } catch (err) {
          console.error('Failed to fetch users', err);
        }
      })();
    };
    window.addEventListener('adminTeamChanged', handler);
    return () => window.removeEventListener('adminTeamChanged', handler);
  }, []);

  const fetchTasks = async (team) => {
    try {
      const data = await getAdminTasks(team);
      setTasks(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', assigned_to: '', deadline: '' });
  const [users, setUsers] = useState([]);

  const openCreate = () => {
    setEditingTask(null);
    setForm({ title: '', description: '', status: 'pending', priority: 'medium', assigned_to: '', deadline: '' });
    setIsModalOpen(true);
  };

  const openEdit = (task) => {
    setEditingTask(task);
    // prepare deadline for datetime-local input (local time without timezone)
    let deadlineVal = '';
    if (task.deadline) {
      try {
        const d = new Date(task.deadline);
        const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
        deadlineVal = local.toISOString().slice(0,16);
      } catch (e) {
        deadlineVal = '';
      }
    }
    setForm({ title: task.title || '', description: task.description || '', assigned_to: task.assigned_to || '', deadline: deadlineVal });
    setIsModalOpen(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form };
      // convert datetime-local to ISO string if provided
      if (payload.deadline) {
        try {
          payload.deadline = new Date(payload.deadline).toISOString();
        } catch (e) {
          // leave as-is
        }
      } else {
        delete payload.deadline;
      }
      // ensure assigned_to is null or integer
      if (!payload.assigned_to) payload.assigned_to = null;
      if (editingTask) {
        const updated = await updateAdminTask(editingTask.id, payload);
        setTasks(tasks.map(t => t.id === updated.id ? updated : t));
        alert('Task updated');
      } else {
        const created = await createAdminTask(payload);
        setTasks([created, ...tasks]);
        alert('Task created');
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('Failed to save task', err);
      alert('Failed to save task');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await deleteAdminTask(id);
        setTasks(tasks.filter(t => t.id !== id));
      } catch (error) {
        console.error('Failed to delete task:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tasks</h1>
          <p className="text-gray-600 mt-2">Manage all tasks</p>
        </div>
        <div>
          <button onClick={openCreate} className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded">
            <Plus className="w-4 h-4" /> Create Task
          </button>
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <p className="text-gray-600">No tasks found</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Title</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Deadline</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Assignee</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {tasks.map((task) => (
                <tr key={task.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">{task.title}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{task.deadline ? new Date(task.deadline).toLocaleString() : '—'}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{(() => {
                    // Prefer server-provided assigned_to_name, then assigned_to_username, fallback to users list lookup
                    if (task.assigned_to_name) return task.assigned_to_name;
                    if (task.assigned_to_username) return task.assigned_to_username;
                    const u = users.find(usr => usr.id == task.assigned_to); // loose equality to handle string vs number
                    if (!u) return '-';
                    const full = `${u.first_name || ''} ${u.last_name || ''}`.trim();
                    return full || u.username;
                  })()}</td>
                  
                  <td className="px-6 py-4 text-sm space-x-2">
                    <button onClick={() => openEdit(task)} className="text-blue-600 hover:text-blue-900">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(task.id)} className="text-red-600 hover:text-red-900">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-xl p-6">
            <h2 className="text-xl font-semibold mb-4">{editingTask ? 'Edit Task' : 'Create Task'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input name="title" value={form.title} onChange={handleFormChange} required className="w-full px-3 py-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea name="description" value={form.description} onChange={handleFormChange} className="w-full px-3 py-2 border rounded" rows={4} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assign To</label>
                <select name="assigned_to" value={form.assigned_to || ''} onChange={handleFormChange} className="w-full px-3 py-2 border rounded">
                  <option value="">Unassigned</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.username} ({u.email})</option>
                  ))}
                </select>
              </div>
              {/* deadline input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
                <input
                  name="deadline"
                  type="datetime-local"
                  value={form.deadline || ''}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              {/* status & priority removed - handled server-side or defaulted */}

              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminManageTasks;
