import { useState, useEffect } from 'react';
import { getAllAttendanceRecords, getUsers } from '../../services/api';

const ManageAttendance = () => {
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));

  useEffect(() => {
    fetchData();
    const handler = (e) => {
      const newTeam = (e && e.detail && e.detail.team) || localStorage.getItem('adminTeam') || 'staff';
      fetchData(newTeam);
    };
    window.addEventListener('adminTeamChanged', handler);
    return () => window.removeEventListener('adminTeamChanged', handler);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [records, userList] = await Promise.all([
        getAllAttendanceRecords(),
        getUsers(),
      ]);

      const list = Array.isArray(userList) ? userList : [];
      const team = localStorage.getItem('adminTeam') || 'staff';
      const filteredUsers = list.filter(u => {
        if (team === 'sales') return u.user_type === 'sales';
        return u.user_type === 'staff' || u.is_staff;
      });

      const filteredUserIds = new Set(filteredUsers.map(u => u.id));
      const filteredRecords = (Array.isArray(records) ? records : []).filter(r => filteredUserIds.has(r.user));

      setAttendanceRecords(filteredRecords);
      setUsers(filteredUsers);
    } catch (err) {
      setError('Failed to fetch attendance data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '-';
    return new Date(`2000-01-01T${timeStr}`).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString([], {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status) => {
    const statusColorMap = {
      present: 'bg-green-100 text-green-800',
      absent: 'bg-red-100 text-red-800',
      late: 'bg-yellow-100 text-yellow-800',
      permission: 'bg-blue-100 text-blue-800',
    };

    return (
      <span
        className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
          statusColorMap[status] || 'bg-gray-100 text-gray-800'
        }`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  // Filter records based on selected filters
  const filteredRecords = attendanceRecords.filter((record) => {
    if (selectedUser && record.user !== parseInt(selectedUser)) {
      return false;
    }
    if (selectedStatus && record.status !== selectedStatus) {
      return false;
    }
    // filter by selected date (default: today)
    if (selectedDate) {
      const recordDate = record.date ? record.date.slice(0, 10) : '';
      if (recordDate !== selectedDate) return false;
    }
    return true;
  });

  // Calculate statistics
  const stats = {
    total: filteredRecords.length,
    present: filteredRecords.filter((r) => r.status === 'present').length,
    absent: filteredRecords.filter((r) => r.status === 'absent').length,
    late: filteredRecords.filter((r) => r.status === 'late').length,
    permission: filteredRecords.filter((r) => r.status === 'permission').length,
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Manage Attendance</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-600 text-sm">Total Records</p>
          <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-green-50 rounded-lg shadow p-4">
          <p className="text-gray-600 text-sm">Present</p>
          <p className="text-3xl font-bold text-green-600">{stats.present}</p>
        </div>
        <div className="bg-red-50 rounded-lg shadow p-4">
          <p className="text-gray-600 text-sm">Absent</p>
          <p className="text-3xl font-bold text-red-600">{stats.absent}</p>
        </div>
        <div className="bg-yellow-50 rounded-lg shadow p-4">
          <p className="text-gray-600 text-sm">Late</p>
          <p className="text-3xl font-bold text-yellow-600">{stats.late}</p>
        </div>
        <div className="bg-blue-50 rounded-lg shadow p-4">
          <p className="text-gray-600 text-sm">Permission</p>
          <p className="text-3xl font-bold text-blue-600">{stats.permission}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[220px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">User</label>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Users</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.username} ({user.email})
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 min-w-[180px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="late">Late</option>
              <option value="permission">Permission</option>
            </select>
          </div>

          <div className="min-w-[180px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={() => { setSelectedUser(''); setSelectedStatus(''); setSelectedDate(new Date().toISOString().slice(0,10)); }}
              className="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg border"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Attendance Records Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="p-6 text-center">
            <p className="text-gray-600">Loading attendance records...</p>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-gray-600">No attendance records found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Check In
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Check Out
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Remarks
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((record, index) => (
                  <tr
                    key={record.id}
                    className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}
                  >
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {record.user_name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {record.user_email}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {formatDate(record.date)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {formatTime(record.time_in)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {formatTime(record.time_out)}
                    </td>
                    <td className="px-6 py-4 text-sm">{getStatusBadge(record.status)}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {record.remarks || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageAttendance;
