# PostgreSQL Quick Reference

## Starting/Stopping PostgreSQL

### Windows
```bash
# Start PostgreSQL Service
net start postgresql-x64-15

# Stop PostgreSQL Service
net stop postgresql-x64-15
```

### Check if Running
```bash
# Using psql
psql -U postgres -c "SELECT version();"
```

---

## Database Commands

### Connect to PostgreSQL
```bash
psql -U postgres -h localhost
```

### Database Operations
```sql
-- List all databases
\l

-- Create database
CREATE DATABASE moneykrishna_db;

-- Connect to database
\c moneykrishna_db

-- Drop database (WARNING: removes all data)
DROP DATABASE moneykrishna_db;
```

### Table Operations
```sql
-- List all tables
\dt

-- Show table structure
\d api_user

-- Show table data
SELECT * FROM api_user;

-- Count rows
SELECT COUNT(*) FROM api_user;
```

### User Management
```sql
-- List all users
\du

-- Create new user
CREATE USER myuser WITH PASSWORD 'mypassword';

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE moneykrishna_db TO myuser;

-- Change password
ALTER USER postgres WITH PASSWORD 'newpassword';
```

---

## Django Commands

### Database Operations
```bash
# Create migrations
python manage.py makemigrations

# Run migrations
python manage.py migrate

# Check migration status
python manage.py showmigrations

# Revert a migration
python manage.py migrate appname 0001

# Create empty migration
python manage.py makemigrations --empty appname --name migration_name
```

### User Management
```bash
# Create superuser
python manage.py createsuperuser

# Create user in shell
python manage.py shell
# then:
from django.contrib.auth import get_user_model
User = get_user_model()
user = User.objects.create_user(username='test', email='test@example.com', password='password123')
```

### Database Shell
```bash
# Enter Django database shell
python manage.py shell

# Query users
from api.models import User
User.objects.all()
User.objects.filter(user_type='staff')
User.objects.get(email='user@example.com')
```

### Backup & Restore
```bash
# Backup database
pg_dump -U postgres moneykrishna_db > backup.sql

# Restore database
psql -U postgres moneykrishna_db < backup.sql

# Backup with Django
python manage.py dumpdata > backup.json
python manage.py loaddata backup.json
```

---

## API Testing

### Test Registration
```bash
curl -X POST http://localhost:8000/api/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "username": "testuser",
    "first_name": "Test",
    "last_name": "User",
    "password": "Password123!",
    "password_confirm": "Password123!",
    "user_type": "staff"
  }'
```

### Test Login
```bash
curl -X POST http://localhost:8000/api/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "user@example.com",
    "password": "Password123!"
  }'
```

### Test with Token
```bash
curl -X GET http://localhost:8000/api/users/me/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## Useful PostgreSQL Settings

### Edit PostgreSQL Configuration
**File**: `C:\Program Files\PostgreSQL\15\data\postgresql.conf`

```
# Enable remote connections (if needed)
listen_addresses = '*'

# Adjust max connections
max_connections = 200

# Adjust shared memory
shared_buffers = 256MB
```

### Monitor PostgreSQL
```sql
-- Show active connections
SELECT * FROM pg_stat_activity;

-- Show database size
SELECT pg_size_pretty(pg_database_size('moneykrishna_db'));

-- Show table sizes
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) 
FROM pg_tables 
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Show cache hit ratio
SELECT 
  sum(heap_blks_read) as heap_read, 
  sum(heap_blks_hit)  as heap_hit, 
  sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)) as ratio
FROM pg_statio_user_tables;
```

---

## Connection String Format

```
postgresql://username:password@host:port/database

Example:
postgresql://postgres:postgres@localhost:5432/moneykrishna_db
```

---

## Performance & Optimization

### Create Indexes
```sql
-- Create index on email (for faster lookups)
CREATE INDEX idx_user_email ON api_user(email);

-- Create index on username
CREATE INDEX idx_user_username ON api_user(username);

-- Create index on user_type
CREATE INDEX idx_user_type ON api_user(user_type);
```

### Check Index Usage
```sql
-- List all indexes
SELECT * FROM pg_indexes WHERE tablename='api_user';

-- Check index size
SELECT schemaname, tablename, indexname, pg_size_pretty(pg_relation_size(indexrelid))
FROM pg_indexes 
JOIN pg_class ON indexname = relname 
WHERE tablename = 'api_user';
```

---

## Troubleshooting

### Check PostgreSQL Status
```bash
# Windows Services
services.msc
# Look for "postgresql-x64-15" service

# Or check via psql
psql -U postgres -c "SELECT version();"
```

### Check Port
```bash
# See if port 5432 is in use
netstat -ano | findstr :5432

# Kill process on port 5432
taskkill /PID <PID> /F
```

### View PostgreSQL Logs
```bash
# Windows Logs Location
C:\Program Files\PostgreSQL\15\data\log\
```

---

## Security Best Practices

1. **Change default password**
   ```sql
   ALTER USER postgres WITH PASSWORD 'strong_password_123!';
   ```

2. **Create limited user for app**
   ```sql
   CREATE USER app_user WITH PASSWORD 'app_password_123!';
   GRANT CONNECT ON DATABASE moneykrishna_db TO app_user;
   GRANT USAGE ON SCHEMA public TO app_user;
   GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
   ```

3. **Enable SSL connections** (for production)

4. **Regular backups**
   ```bash
   pg_dump -U postgres moneykrishna_db > backup_$(date +%Y%m%d).sql
   ```

5. **Monitor connections**
   ```sql
   SELECT datname, usename, application_name, state FROM pg_stat_activity;
   ```

---

## Need Help?

- PostgreSQL Documentation: https://www.postgresql.org/docs/
- Django PostgreSQL Guide: https://docs.djangoproject.com/en/5.2/ref/databases/#postgresql
- pgAdmin (GUI Tool): https://www.pgadmin.org/

