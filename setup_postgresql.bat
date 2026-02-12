@echo off
REM PostgreSQL Setup Script for Moneykrishna Education Platform
REM This script will help you set up PostgreSQL and migrate your data

echo.
echo ====================================================
echo PostgreSQL Configuration for Moneykrishna Platform
echo ====================================================
echo.

echo Step 1: Checking PostgreSQL Installation...
psql --version
if errorlevel 1 (
    echo.
    echo ERROR: PostgreSQL is not installed or psql is not in PATH
    echo Please install PostgreSQL from: https://www.postgresql.org/download/windows/
    echo.
    pause
    exit /b 1
)

echo.
echo Step 2: Creating Database...
echo.

REM Set the PGPASSWORD environment variable
set PGPASSWORD=postgres

REM Create the database
psql -U postgres -h localhost -c "CREATE DATABASE moneykrishna_db;" 2>nul
if errorlevel 1 (
    echo Checking if database already exists...
    psql -U postgres -h localhost -c "SELECT 1 FROM pg_database WHERE datname = 'moneykrishna_db';" >nul 2>&1
    if not errorlevel 1 (
        echo Database 'moneykrishna_db' already exists. Continuing...
    )
) else (
    echo Database 'moneykrishna_db' created successfully!
)

echo.
echo Step 3: Running Django Migrations...
echo.

cd /d "%~dp0backend" || exit /b 1

python manage.py migrate

if errorlevel 1 (
    echo.
    echo ERROR: Migration failed!
    echo Possible causes:
    echo - PostgreSQL is not running
    echo - Database connection failed
    echo - Django installation issue
    echo.
    pause
    exit /b 1
)

echo.
echo ====================================================
echo SUCCESS! PostgreSQL setup is complete!
echo ====================================================
echo.
echo Database Configuration:
echo - Engine: PostgreSQL
echo - Database: moneykrishna_db
echo - Host: localhost
echo - Port: 5432
echo - User: postgres
echo.
echo You can now start the Django server:
echo   cd backend
echo   python manage.py runserver
echo.
echo ====================================================
echo.
pause
