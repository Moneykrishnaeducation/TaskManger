import { useState, useEffect } from 'react';
import { getMyAttendanceRecords, getTodayAttendance, markCheckout } from '../../services/api';

const SalesAttendance = () => {
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [checkedOut, setCheckedOut] = useState(false);

  useEffect(() => {
    fetchAttendance();
  }, []);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [records, today] = await Promise.all([
        getMyAttendanceRecords(),
        getTodayAttendance(),
      ]);
      
      setAttendanceRecords(records);
      setTodayAttendance(today);
      setCheckedOut(today?.time_out !== null);
    } catch (err) {
      setError('Failed to fetch attendance records');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async () => {
    try {
      const response = await markCheckout();
      if (response.success) {
        setTodayAttendance(response.attendance);
        setCheckedOut(true);
        alert('Check-out recorded successfully');
        await fetchAttendance();
      }
    } catch (err) {
      alert('Failed to record check-out');
      console.error(err);
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

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Attendance Management</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Today's Attendance Card */}
      {todayAttendance && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Today's Attendance</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-gray-600 text-sm">Date</p>
              <p className="text-lg font-semibold text-gray-900">
                {formatDate(todayAttendance.date)}
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-gray-600 text-sm">Check In</p>
              <p className="text-lg font-semibold text-gray-900">
                {formatTime(todayAttendance.time_in)}
              </p>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <p className="text-gray-600 text-sm">Check Out</p>
              <p className="text-lg font-semibold text-gray-900">
                {formatTime(todayAttendance.time_out)}
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-gray-600 text-sm">Status</p>
              <p className="mt-1">{getStatusBadge(todayAttendance.status)}</p>
            </div>
          </div>

          {!checkedOut && (
            <button
              onClick={handleCheckout}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-6 rounded-lg transition"
            >
              Mark Check-Out
            </button>
          )}
          {checkedOut && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
              ✓ You have already checked out today
            </div>
          )}
        </div>
      )}

      {/* Attendance Records Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <h2 className="text-2xl font-semibold text-gray-900 p-6 border-b">
          Attendance Records
        </h2>

        {loading ? (
          <div className="p-6 text-center">
            <p className="text-gray-600">Loading attendance records...</p>
          </div>
        ) : attendanceRecords.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-gray-600">No attendance records found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b">
                <tr>
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
                {attendanceRecords.map((record, index) => (
                  <tr
                    key={record.id}
                    className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}
                  >
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

export default SalesAttendance;
