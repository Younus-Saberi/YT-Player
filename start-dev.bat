@echo off
REM YouTube to MP3 Converter - Development Setup Script for Windows

echo.
echo ===================================================
echo YouTube to MP3 Converter - Development Server
echo ===================================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo Error: Node.js is not installed or not in PATH
    pause
    exit /b 1
)

REM Check if npm is installed
npm --version >nul 2>&1
if errorlevel 1 (
    echo Error: npm is not installed or not in PATH
    pause
    exit /b 1
)

REM Check if FFmpeg is installed
ffmpeg -version >nul 2>&1
if errorlevel 1 (
    echo Error: FFmpeg is not installed or not in PATH
    pause
    exit /b 1
)

echo [OK] All dependencies found
echo.

REM Setup backend
echo Setting up backend...
cd backend

if not exist "node_modules" (
    echo Installing Node dependencies...
    npm install --silent
)

if errorlevel 1 (
    echo Error: Failed to install backend dependencies
    pause
    exit /b 1
)

echo [OK] Backend setup complete
cd ..

REM Setup frontend
echo.
echo Setting up frontend...
cd frontend

if not exist "node_modules" (
    echo Installing Node dependencies...
    npm install --silent
)

if errorlevel 1 (
    echo Error: Failed to install frontend dependencies
    pause
    exit /b 1
)

echo [OK] Frontend setup complete
cd ..

echo.
echo ===================================================
echo [OK] Setup complete!
echo ===================================================
echo.
echo To start the development servers:
echo.
echo Terminal 1 - Backend:
echo   cd backend
echo   npm start
echo   REM or for development with auto-reload:
echo   REM npm run dev
echo.
echo Terminal 2 - Frontend:
echo   cd frontend
echo   npm start
echo.
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:3000
echo.
pause
