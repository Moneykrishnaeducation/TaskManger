import axios from 'axios';

const AUTH_BASE_URL = 'http://127.0.0.1:8000/api';
// Single backend: use the same base for admin and staff APIs
const ADMIN_BASE_URL = AUTH_BASE_URL;
const STAFF_BASE_URL = AUTH_BASE_URL;


const authApi = axios.create({
  baseURL: AUTH_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const adminApi = axios.create({
  baseURL: ADMIN_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const staffApi = axios.create({
  baseURL: STAFF_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const addTokenToRequests = (instance, excludeEndpoints = []) => {
  instance.interceptors.request.use(
    (config) => {
      // Don't add token to login and register endpoints
      const shouldExclude = excludeEndpoints.some(endpoint => config.url.includes(endpoint));
      
      if (!shouldExclude) {
        const token = localStorage.getItem('access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
      return config;
    },
    (error) => Promise.reject(error)
  );
};

addTokenToRequests(authApi, ['/login/', '/register/', '/token/refresh/']);
addTokenToRequests(adminApi);
addTokenToRequests(staffApi);

// AUTH APIs
export const loginUser = async (email, password) => {
  const response = await authApi.post('/login/', { email, password });
  return response.data;
};

export const registerUser = async (userData) => {
  const response = await authApi.post('/register/', userData);
  return response.data;
};

export const refreshToken = async (refreshToken) => {
  const response = await authApi.post('/token/refresh/', { refresh: refreshToken });
  return response.data;
};

export const getUsers = async () => {
  try {
    const response = await authApi.get('/users/');
    return response.data.results || response.data;
  } catch (error) {
    console.error('Failed to fetch users:', error);
    return [];
  }
};

// ATTENDANCE APIs
export const markAttendance = async () => {
  const response = await authApi.post('/attendance/mark_attendance/');
  return response.data;
};

export const markCheckout = async () => {
  const response = await authApi.post('/attendance/mark_checkout/');
  return response.data;
};

export const getTodayAttendance = async () => {
  try {
    const response = await authApi.get('/attendance/today/');
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      return null;
    }
    throw error;
  }
};

export const getMyAttendanceRecords = async () => {
  const response = await authApi.get('/attendance/my_records/');
  return response.data;
};

export const getUserAttendance = async (userId) => {
  const response = await authApi.get('/attendance/user_attendance/', { params: { user_id: userId } });
  return response.data;
};

export const getAllAttendanceRecords = async () => {
  const response = await authApi.get('/attendance/');
  return response.data.results || response.data;
};

export const getActiveUsers = async () => {
  try {
    const response = await adminApi.get('/attendance/active_users/');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch active users:', error);
    return { sales: [], it: [], total_active: 0 };
  }
};

// ADMIN APIs
export const getAdminTasks = async (team) => {
  // If a team is provided, fetch tasks then filter by users belonging to that team
  const response = await adminApi.get('/tasks/');
  const allTasks = response.data.results || response.data;

  if (!team) return allTasks;

  // fetch users and filter by team
  try {
    const users = await getUsers();
    const list = Array.isArray(users) ? users : [];
    const filteredUsers = list.filter(u => {
      if (team === 'sales') return u.user_type === 'sales';
      return u.user_type === 'staff' || u.is_staff;
    });
    const allowed = new Set(filteredUsers.map(u => u.id));
    const filteredTasks = (Array.isArray(allTasks) ? allTasks : []).filter(t => allowed.has(t.assigned_to));
    return filteredTasks;
  } catch (err) {
    console.error('Failed to filter tasks by team:', err);
    return allTasks;
  }
};

export const getAdminTaskById = async (id) => {
  const response = await adminApi.get(`/tasks/${id}/`);
  return response.data;
};

export const createAdminTask = async (taskData) => {
  const response = await adminApi.post('/tasks/', taskData);
  return response.data;
};

export const updateAdminTask = async (id, taskData) => {
  const response = await adminApi.put(`/tasks/${id}/`, taskData);
  return response.data;
};

export const deleteAdminTask = async (id) => {
  const response = await adminApi.delete(`/tasks/${id}/`);
  return response.data;
};

export const getAdminUsers = async () => {
  const response = await adminApi.get('/users/');
  return response.data.results || response.data;
};

export const getAdminUserById = async (id) => {
  const response = await adminApi.get(`/users/${id}/`);
  return response.data;
};

export const changeUserRole = async (id, role) => {
  const response = await adminApi.post(`/users/${id}/change_role/`, { target: role });
  return response.data;
};

export const deleteAdminUser = async (id) => {
  const response = await adminApi.delete(`/users/${id}/`);
  return response.data;
};

export const getAdminStats = async () => {
  try {
    // accept optional team parameter
    const team = arguments[0];
    const tasks = await getAdminTasks(team);
    const users = await getAdminUsers();

    // Filter users client-side based on team selection
    const filteredUsers = Array.isArray(users)
      ? users.filter(u => {
          if (team === 'sales') return u.user_type === 'sales';
          // 'staff' team represents IT
          if (team === 'staff') return u.user_type === 'staff' || u.is_staff;
          return true;
        })
      : [];

    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const pendingTasks = tasks.filter(t => t.status === 'pending').length;
    const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;

    return {
      totalUsers: filteredUsers.length || 0,
      totalTasks: tasks.length || 0,
      completedTasks,
      pendingTasks,
      inProgressTasks,
    };
  } catch (error) {
    console.error('Failed to fetch admin stats:', error);
    return {
      totalUsers: 0,
      totalTasks: 0,
      completedTasks: 0,
      pendingTasks: 0,
      inProgressTasks: 0,
    };
  }
};

export const uploadLeadsCSV = async (file) => {
  const form = new FormData();
  form.append('file', file);

  const response = await adminApi.post('/upload_leads_csv/', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 120000,
  });
  return response.data;
};

export const getLeads = async () => {
  const response = await authApi.get('/leads/');
  return response.data;
};

export const setLeadStatus = async (leadId, status) => {
  const response = await authApi.post(`/leads/${leadId}/set_status/`, { status });
  return response.data;
};

export const uploadIndicatorProof = async (leadId, file, notes = '') => {
  const form = new FormData();
  form.append('file', file);
  if (notes) form.append('notes', notes);
  const response = await authApi.post(`/leads/${leadId}/indicator_upload/`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 120000,
  });
  return response.data;
};

export const createFollowUp = async (leadId, scheduledDate, notes = '') => {
  const response = await authApi.post(`/leads/${leadId}/followups/`, { scheduled_date: scheduledDate, notes });
  return response.data;
};

export const getFollowUps = async () => {
  const response = await authApi.get('/followups/');
  return response.data;
};

export const createAccountOpening = async (leadId, depositAmount, notes = '') => {
  const response = await authApi.post('/account_openings/', { lead: leadId, deposit_amount: depositAmount, notes });
  return response.data;
};

// STAFF APIs
export const getStaffTasks = async () => {
  const response = await staffApi.get('/staff/tasks/');
  return response.data.results || response.data;
};

export const getStaffTaskById = async (id) => {
  const response = await staffApi.get(`/staff/tasks/${id}/`);
  return response.data;
};

export const updateStaffTaskStatus = async (id, status, completionNotes = '') => {
  const response = await staffApi.patch(`/staff/tasks/${id}/update_status/`, { 
    status,
    completion_notes: completionNotes
  });
  return response.data;
};

export const updateStaffTaskDetails = async (id, taskData) => {
  const response = await staffApi.patch(`/staff/tasks/${id}/update_details/`, taskData);
  return response.data;
};

export const getStaffStats = async () => {
  try {
    const tasksResponse = await getStaffTasks();
    const todayAttendance = await getTodayAttendance();
    
    const completed = tasksResponse.filter(t => t.status === 'completed').length;
    const pending = tasksResponse.filter(t => t.status === 'pending').length;
    const inProgress = tasksResponse.filter(t => t.status === 'in_progress').length;

    return {
      totalTasks: tasksResponse.length,
      completedTasks: completed,
      pendingTasks: pending,
      inProgressTasks: inProgress,
      checkIn: todayAttendance?.date ? `${todayAttendance.date} ${todayAttendance?.time_in}` : null,
      checkOut: todayAttendance?.date ? `${todayAttendance.date} ${todayAttendance?.time_out}` : null,
    };
  } catch (error) {
    console.error('Failed to fetch staff stats:', error);
    return {
      totalTasks: 0,
      completedTasks: 0,
      pendingTasks: 0,
      inProgressTasks: 0,
      checkIn: null,
      checkOut: null,
    };
  }
};

export default authApi;
