@echo off
REM VegiX Quick Start Script - Windows
REM This script helps set up and run the VegiX project quickly

setlocal enabledelayedexpansion

echo.
echo ====================================================================
echo         VegiX - Sri Lanka Vegetable Market System
echo              Quick Start Script (Windows)
echo ====================================================================
echo.

REM Check if Node.js is installed
echo [1/5] Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed!
    echo Please download and install Node.js from https://nodejs.org
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo       ✓ Found Node.js %NODE_VERSION%

REM Check if npm is installed
echo [2/5] Checking npm installation...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: npm is not installed!
    echo Please reinstall Node.js
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo       ✓ Found npm %NPM_VERSION%

echo.
echo [3/5] Installing Backend Dependencies...
cd backend
if exist node_modules (
    echo       Dependencies already installed, skipping...
) else (
    echo       Installing npm packages...
    call npm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install backend dependencies
        pause
        exit /b 1
    )
)
echo       ✓ Backend dependencies ready
cd ..

echo.
echo [4/5] Installing Frontend Dependencies...
cd frontend
if exist node_modules (
    echo       Dependencies already installed, skipping...
) else (
    echo       Installing npm packages...
    call npm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install frontend dependencies
        pause
        exit /b 1
    )
)
echo       ✓ Frontend dependencies ready
cd ..

echo.
echo [5/5] Configuration Check...
if exist backend\.env (
    echo       ✓ Backend .env found
) else (
    echo       ! backend\.env not found - creating with defaults...
    (
        echo MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/vegix?retryWrites=true^&w=majority
        echo JWT_SECRET=your-secret-key-change-this-in-production-at-least-32-characters
        echo PORT=5000
        echo NODE_ENV=development
    ) > backend\.env
    echo       ⚠ Created backend\.env - UPDATE MONGO_URI with your MongoDB connection string!
)

echo.
echo ====================================================================
echo              Setup Complete! Ready to Start
echo ====================================================================
echo.
echo Next steps:
echo   1. UPDATE MongoDB Connection:
echo      - Edit backend\.env
echo      - Replace MONGO_URI with your MongoDB Atlas connection string
echo      - Create free cluster: https://www.mongodb.com/cloud/atlas
echo.
echo   2. START BACKEND (in new Command Prompt):
echo      - cd backend
echo      - npm run dev
echo      - Wait for "✓ MongoDB Connected" message
echo.
echo   3. START FRONTEND (in another Command Prompt):
echo      - cd frontend
echo      - npm run dev
echo      - Will open http://localhost:3000
echo.
echo   4. LOGIN with Demo Credentials:
echo      - Email: admin@vegix.com
echo      - Password: password123
echo.
echo Available Roles to Test:
echo      - Admin: admin@vegix.com
echo      - Farmer: farmer@vegix.com
echo      - Broker: broker@vegix.com
echo      - Buyer: buyer@vegix.com
echo.
echo For detailed setup, see: SETUP_GUIDE.md
echo For troubleshooting, see: TROUBLESHOOTING.md
echo For API reference, see: API_REFERENCE.md
echo.
echo ====================================================================
echo.
pause
