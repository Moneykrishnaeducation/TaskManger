import { useEffect, useState } from 'react';
import { Trash2, Edit2 } from 'lucide-react';
import { getAdminUsers, deleteAdminUser, changeUserRole } from '../../services/api';

const AdminManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const team = localStorage.getItem('adminTeam') || 'staff';
    fetchUsers(team);

    const handler = (e) => {
      const newTeam = (e && e.detail && e.detail.team) || localStorage.getItem('adminTeam') || 'staff';
      fetchUsers(newTeam);
    };
    window.addEventListener('adminTeamChanged', handler);
    return () => window.removeEventListener('adminTeamChanged', handler);
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await getAdminUsers();
      const list = Array.isArray(data) ? data : [];
      const team = localStorage.getItem('adminTeam') || 'staff';
      const filtered = list.filter(u => {
        if (team === 'sales') return u.user_type === 'sales';
        return u.user_type === 'staff' || u.is_staff;
      });
      setUsers(filtered);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await deleteAdminUser(id);
        setUsers(users.filter(u => u.id !== id));
      } catch (error) {
        console.error('Failed to delete user:', error);
      }
    }
  };

  const handleRoleChange = async (id, role) => {
    try {
      await changeUserRole(id, role);
      fetchUsers();
    } catch (error) {
      console.error('Failed to change role:', error);
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
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Users</h1>
        <p className="text-gray-600 mt-2">Manage user accounts and roles</p>
      </div>

      {users.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <p className="text-gray-600">No users found</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Username</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Email</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Role</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">{user.username}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                  <td className="px-6 py-4 text-sm">
                    <select
                      value={user.is_superuser ? 'admin' : user.is_staff ? 'staff' : 'user'}
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      className="px-2 py-1 border border-gray-300 rounded text-sm"
                    >
                      <option value="user">User</option>
                      <option value="sales">Sales</option>
                      <option value="staff">Staff</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 text-sm space-x-2">
                    <button className="text-blue-600 hover:text-blue-900">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(user.id)} className="text-red-600 hover:text-red-900">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminManageUsers;
