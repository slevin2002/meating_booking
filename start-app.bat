@echo off
echo Starting Meeting Booking App...
echo.

echo Checking if MongoDB is running...
netstat -an | findstr :27017 >nul
if %errorlevel% neq 0 (
    echo WARNING: MongoDB might not be running!
    echo Please start MongoDB first:
    echo   - Windows: Start MongoDB service
    echo   - Or run: mongod
    echo.
    pause
)

echo Installing dependencies...
npm install
if %errorlevel% neq 0 (
    echo Failed to install frontend dependencies
    pause
    exit /b 1
)

echo Installing backend dependencies...
cd backend
npm install
if %errorlevel% neq 0 (
    echo Failed to install backend dependencies
    pause
    exit /b 1
)
cd ..

echo.
echo Dependencies installed successfully!
echo.
echo To start the application, you need to run TWO terminals:
echo.
echo TERMINAL 1 - Start Backend:
echo   npm run backend
echo.
echo TERMINAL 2 - Start Frontend:
echo   npm start
echo.
echo Frontend will be available at: http://localhost:3000
echo Backend API will be available at: http://localhost:5000
echo.
pause 