#!/bin/bash

echo "Starting Meeting Booking App..."
echo

echo "Checking if MongoDB is running..."
if ! pgrep -x "mongod" > /dev/null; then
    echo "WARNING: MongoDB might not be running!"
    echo "Please start MongoDB first:"
    echo "  - macOS: brew services start mongodb-community"
    echo "  - Linux: sudo systemctl start mongod"
    echo "  - Or run: mongod"
    echo
    read -p "Press Enter to continue anyway..."
fi

echo "Installing dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "Failed to install frontend dependencies"
    exit 1
fi

echo "Installing backend dependencies..."
cd backend
npm install
if [ $? -ne 0 ]; then
    echo "Failed to install backend dependencies"
    exit 1
fi
cd ..

echo
echo "Dependencies installed successfully!"
echo
echo "To start the application, you need to run TWO terminals:"
echo
echo "TERMINAL 1 - Start Backend:"
echo "  npm run backend"
echo
echo "TERMINAL 2 - Start Frontend:"
echo "  npm start"
echo
echo "Frontend will be available at: http://localhost:3000"
echo "Backend API will be available at: http://localhost:5000"
echo
read -p "Press Enter to continue..." 