# Task Manager - Unified Login & Role-Based Architecture

## Overview

This project uses a **unified single login endpoint** that routes users to their role-specific dashboards:
- **Admin** → Admin Dashboard (full task/user management)
- **Staff** → Staff Dashboard (task updates, cannot delete)

The frontend is a **single React application** running on one port that internally routes based on user role.

## Architecture

### Central Auth Backend (`backend/`)
- **Port:** 8000
- **Purpose:** Single authentication service for all roles
- **Key endpoint:** `POST /api/login/` → returns user info with `user_type`
- **Response includes:**
  ```json
  {
    "success": true,
    "message": "Login successful.",
    "user": {
      "id": 1,
      "username": "admin_user",
      "email": "admin@example.com",
      "user_type": "admin",
      "is_verified": true
    },
    "tokens": {
      "access": "eyJ0...",
      "refresh": "eyJ0..."
    }
  }
  ```

### Staff Backend (`staffbackend/`)
- **Port:** 8001
- **Purpose:** Staff-specific task APIs (view/update, no delete)
- **Auth:** Accepts JWT tokens from central backend (shared signing key)
- **Endpoint:** `GET /api/staff/tasks/`, `PATCH /api/staff/tasks/{id}/update_status/`

### Admin Backend (`adminbackend/`)
- **Port:** 8002
- **Purpose:** Admin-specific task/user management (full CRUD)
- **Auth:** Accepts JWT tokens from central backend (shared signing key)
- **Endpoints:** `/api/tasks/`, `/api/users/`

### Unified Frontend (`frontend/`)
- **Port:** 5173 (Vite dev server)
- **Purpose:** Single React app with role-based internal routing
- **Architecture:**
  - `/login` → Unified login page (no role guard)
  - `/admin/*` → Admin routes (guarded by AdminPrivateRoute)
  - `/staff/*` → Staff routes (guarded by StaffPrivateRoute)
- **Technology:** React 18 + Vite + React Router + Tailwind CSS

## Shared JWT Configuration

All backends use the same `AUTH_SIGNING_KEY` environment variable to verify JWT tokens. This allows a token issued by the central backend to be accepted by staff and admin backends.

### Setup Environment Variable

1. **Copy `.env.example` to `.env` in project root:**
   ```bash
   cp .env.example .env
   ```

2. **Generate a secure key and update `.env`:**
   ```bash
   python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
   ```
   Copy the output and set it in `.env`:
   ```
   AUTH_SIGNING_KEY=your-generated-key-here
   ```

3. **Load environment variables in each backend** (already configured in settings.py)

## Local Setup & Run

### 1. Central Backend (Auth Service)
```bash
cd d:\Mn\TaskManger\backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser   # Create admin account
python manage.py runserver 8000
```

### 2. Staff Backend
```bash
cd d:\Mn\TaskManger\staffbackend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser   # Optional, for testing
python manage.py runserver 8001
```

### 3. Admin Backend
```bash
cd d:\Mn\TaskManger\adminbackend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser   # Optional, for testing
python manage.py runserver 8002
```

### 4. Unified Frontend
```bash
cd d:\Mn\TaskManger\frontend
npm install
npm run dev
```
Runs on http://localhost:5173

## Login Flow

### User Journey
1. User opens the unified frontend on http://localhost:5173
2. User is redirected to `/login` page (if not authenticated)
3. User enters credentials and submits login form
4. Frontend calls **central backend**: `POST http://localhost:8000/api/login/`
5. Response includes `user.user_type` (admin/staff)
6. Frontend stores JWT tokens in localStorage
7. Frontend automatically routes user:
   - `user_type === 'admin'` → redirect to `/admin/dashboard`
   - `user_type === 'staff'` → redirect to `/staff/dashboard`
8. Subsequent API calls use role-specific backend:
   - Admin pages call admin backend (port 8002)
   - Staff pages call staff backend (port 8001)
9. All backends verify token using shared `AUTH_SIGNING_KEY`

### Example Frontend Login Code
```javascript
// In a React login component
const handleLogin = async (email, password) => {
  const response = await fetch('http://localhost:8000/api/login/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();
  if (data.success) {
    localStorage.setItem('access_token', data.tokens.access);
    localStorage.setItem('refresh_token', data.tokens.refresh);
    localStorage.setItem('user', JSON.stringify(data.user));

    // Frontend router automatically routes based on role
    if (data.user.user_type === 'admin') {
      navigate('/admin/dashboard');
    } else if (data.user.user_type === 'staff') {
      navigate('/staff/dashboard');
    }
  }
};
```

## API Endpoints

### Central Backend (Port 8000)
- `POST /api/register/` – Register new user
- `POST /api/login/` – Login (returns tokens + user info)
- `POST /api/token/refresh/` – Refresh JWT token
- `GET /api/users/me/` – Get current user profile
- `POST /api/users/{id}/change_role/` – Change user role (admin only)

### Staff Backend (Port 8001)
- `GET /api/staff/tasks/` – List all tasks
- `GET /api/staff/tasks/{id}/` – Get task details
- `PATCH /api/staff/tasks/{id}/update_status/` – Update task status
- `PATCH /api/staff/tasks/{id}/update_details/` – Update task details

### Admin Backend (Port 8002)
- `GET /api/tasks/` – List all tasks
- `GET /api/tasks/{id}/` – Get task details
- `POST /api/tasks/` – Create task
- `PUT /api/tasks/{id}/` – Update task
- `PATCH /api/tasks/{id}/update_status/` – Update task status
- `DELETE /api/tasks/{id}/` – Delete task
- `GET /api/users/` – List all users
- `POST /api/users/{id}/change_role/` – Change user role

## Testing the Login

### Create a test user via Admin
```bash
# In backend directory with venv activated
python manage.py createsuperuser
# Username: testadmin
# Email: admin@test.com
# Password: TestPass123
```

### Login via cURL
```bash
curl -X POST http://localhost:8000/api/login/ \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@test.com", "password": "TestPass123"}'
```

### Response (sample)
```json
{
  "success": true,
  "message": "Login successful.",
  "user": {
    "id": 1,
    "username": "testadmin",
    "email": "admin@test.com",
    "user_type": "admin",
    "is_verified": false
  },
  "tokens": {
    "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
  }
}
```

## Frontend Integration

Both Admin and Staff apps should be updated to:
1. POST to `http://localhost:8000/api/login/` (central auth)
2. Use returned `access_token` to call their respective backend APIs
3. Route based on `user.user_type` after successful login

### Example Service Layer (React + Axios)
```javascript
// services/authService.js
import axios from 'axios';

export const authService = {
  login: async (email, password) => {
    const response = await axios.post('http://localhost:8000/api/login/', {
      email,
      password,
    });
    return response.data;
  },

  refreshToken: async (refreshToken) => {
    const response = await axios.post('http://localhost:8000/api/token/refresh/', {
      refresh: refreshToken,
    });
    return response.data;
  },
};

// services/apiService.js (for admin backend)
export const adminApi = axios.create({
  baseURL: 'http://localhost:8002/api',
});

adminApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// services/staffApiService.js (for staff backend)
export const staffApi = axios.create({
  baseURL: 'http://localhost:8001/api',
});

staffApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

## Troubleshooting

### "Invalid signing key" Error
- Ensure all backends have the same `AUTH_SIGNING_KEY` environment variable set
- Verify it's loaded before Django starts

### Token Not Accepted
- Check that the token was issued from the central backend
- Verify `SIMPLE_JWT['SIGNING_KEY']` matches across all backends
- Ensure token hasn't expired (default lifetime: 1 hour)

### CORS Errors
- Verify frontend ports (5173 admin, 5174 staff) are in `CORS_ALLOWED_ORIGINS` in each backend settings
- Check that requests include proper `Content-Type: application/json` header

## Production Considerations

1. **Environment variables:** Set `AUTH_SIGNING_KEY` via secure environment management (not in code)
2. **HTTPS:** Use HTTPS in production
3. **Secret key:** Generate unique, strong keys for production
4. **Database:** Use PostgreSQL or MySQL in production (not SQLite)
5. **Token expiry:** Adjust `ACCESS_TOKEN_LIFETIME` as needed
6. **CORS:** Restrict `CORS_ALLOWED_ORIGINS` to only production URLs