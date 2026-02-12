# PostgreSQL Setup Guide for Moneykrishna Education Platform

## Current Configuration
Database: PostgreSQL
Host: localhost
Port: 5432
Database Name: moneykrishna_db
Username: postgres
Password: postgres

## Installation Steps

### 1. Install PostgreSQL
Download and install PostgreSQL from: https://www.postgresql.org/download/windows/
- Remember the superuser (postgres) password you set during installation
- Default port is 5432

### 2. Create Database and User

**Option A: Using pgAdmin (GUI)**
1. Open pgAdmin (installed with PostgreSQL)
2. Right-click on Servers → Create → Server
3. Right-click on Databases → Create → Database
4. Name: `moneykrishna_db`

**Option B: Using Command Line (psql)**
1. Open Command Prompt or PowerShell
2. Connect to PostgreSQL:
   ```
   psql -U postgres
   ```
3. Run these commands:
   ```sql
   CREATE DATABASE moneykrishna_db;
   ```
4. Press `\q` to exit psql

### 3. Update Backend Configuration (Already Done!)
The `settings.py` has been updated with:
```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'moneykrishna_db',
        'USER': 'postgres',
        'PASSWORD': 'postgres',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}
```

### 4. Run Migrations
```bash
cd backend
python manage.py migrate
```

### 5. Create Superuser (Optional)
```bash
python manage.py createsuperuser
```

### 6. Start the Server
```bash
python manage.py runserver
```

## Verify Connection
The Django server will display an error if it can't connect to PostgreSQL.
Common issues:
- PostgreSQL service not running
- Wrong credentials
- Database doesn't exist
- Port 5432 already in use

## Custom Configuration
If you want to use different credentials, update `backend/backend/settings.py`:
```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'your_db_name',
        'USER': 'your_username',
        'PASSWORD': 'your_password',
        'HOST': 'your_host',
        'PORT': 'your_port',
    }
}
```

## Useful PostgreSQL Commands
```bash
# Connect to PostgreSQL
psql -U postgres

# List all databases
\l

# Connect to a database
\c moneykrishna_db

# List all tables
\dt

# View table structure
\d api_user

# Exit psql
\q
```

## Benefits of PostgreSQL over SQLite
✅ Multi-user support
✅ Better performance for large datasets
✅ Advanced features (JSON, Full-text search, etc.)
✅ Better concurrency handling
✅ Production-ready database
