# Meeting Booking App

A modern, full-stack meeting booking application with a beautiful UI and MongoDB database integration.

## 🚀 Features

- **Modern UI/UX**: Glassmorphism design with smooth animations
- **Database Integration**: MongoDB with Mongoose ODM
- **Real-time Data**: All data is saved to and loaded from the database
- **Team Management**: View and manage project teams
- **Meeting Scheduling**: Calendar-based meeting booking
- **Search & Filter**: Advanced search and filtering capabilities
- **Responsive Design**: Works on all devices
- **Error Handling**: Comprehensive error handling and user feedback

## 🛠️ Tech Stack

### Frontend

- **React 18** with TypeScript
- **Modern CSS** with glassmorphism effects
- **Date-fns** for date manipulation
- **Fetch API** for HTTP requests

### Backend

- **Node.js** with Express
- **MongoDB** with Mongoose
- **JWT** for authentication
- **Express Validator** for input validation
- **Helmet** for security
- **Rate Limiting** for API protection

## 📋 Prerequisites

Before running this application, make sure you have:

- **Node.js** (v16 or higher)
- **MongoDB** installed and running locally
- **npm** or **yarn** package manager

## 🚀 Quick Start

### 1. Clone and Setup

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
npm run install-backend

# Or run the complete setup
npm run setup
```

### 2. Start MongoDB

Make sure MongoDB is running on your system:

```bash
# On Windows
mongod

# On macOS/Linux
sudo systemctl start mongod
# or
brew services start mongodb-community
```

### 3. Start the Application

You need to run TWO terminals to start both servers:

#### Terminal 1 - Start Backend
```bash
npm run backend
```

#### Terminal 2 - Start Frontend
```bash
npm start
```

**Alternative: Development Mode**
```bash
# Terminal 1 - Backend with auto-reload
npm run backend-dev

# Terminal 2 - Frontend
npm start
```

### 4. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Health Check**: http://localhost:5000/api/health

## 📁 Project Structure

```
meeting-booking-app/
├── src/
│   ├── components/          # React components
│   │   ├── Calendar.tsx     # Calendar component
│   │   ├── MeetingList.tsx  # Meeting list component
│   │   ├── TeamOverview.tsx # Team overview component
│   │   └── *.css           # Component styles
│   ├── services/
│   │   └── api.ts          # API service layer
│   ├── types/              # TypeScript type definitions
│   ├── data/               # Static data
│   ├── App.tsx             # Main app component
│   └── App.css             # Main app styles
├── backend/
│   ├── models/             # MongoDB models
│   ├── routes/             # API routes
│   ├── server.js           # Express server
│   └── config.env          # Environment variables
├── public/                 # Static files
└── package.json            # Frontend dependencies
```

## 🗄️ Database Schema

### Meeting Model

```javascript
{
  title: String,
  description: String,
  startTime: Date,
  endTime: Date,
  duration: Number,
  teamId: ObjectId,
  teamName: String,
  attendees: [String],
  room: String,
  status: String,
  createdBy: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Team Model

```javascript
{
  name: String,
  project: String,
  lead: String,
  members: [String],
  status: String,
  color: String,
  createdAt: Date,
  updatedAt: Date
}
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
REACT_APP_API_URL=http://localhost:5000/api
```

The backend configuration is in `backend/config.env`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/meeting_booking
JWT_SECRET=your_jwt_secret_key_here_change_in_production
NODE_ENV=development
```

## 📡 API Endpoints

### Meetings

- `GET /api/meetings` - Get all meetings
- `GET /api/meetings/:id` - Get meeting by ID
- `POST /api/meetings` - Create new meeting
- `PUT /api/meetings/:id` - Update meeting
- `DELETE /api/meetings/:id` - Delete meeting

### Teams

- `GET /api/teams` - Get all teams
- `GET /api/teams/:id` - Get team by ID
- `POST /api/teams` - Create new team
- `PUT /api/teams/:id` - Update team
- `DELETE /api/teams/:id` - Delete team

### Users

- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

## 🎨 UI Features

### Modern Design Elements

- **Glassmorphism**: Semi-transparent backgrounds with blur effects
- **Gradient Design**: Purple-blue gradient theme
- **Smooth Animations**: Hover effects and transitions
- **Responsive Layout**: Mobile-first design
- **Loading States**: Professional loading animations
- **Error Handling**: User-friendly error messages

### Interactive Components

- **Calendar**: Interactive date selection
- **Meeting Cards**: Detailed meeting information
- **Team Overview**: Team management interface
- **Search & Filter**: Advanced filtering capabilities
- **Modal Dialogs**: Detailed information display

## 🚨 Troubleshooting

### Common Issues

1. **MongoDB Connection Error**

   ```bash
   # Make sure MongoDB is running
   mongod
   ```

2. **Port Already in Use**

   ```bash
   # Kill process on port 5000
   lsof -ti:5000 | xargs kill -9
   ```

3. **CORS Issues**

   - Backend is configured with CORS for localhost:3000
   - Check if backend is running on port 5000

4. **API Connection Issues**
   - Verify backend is running: http://localhost:5000/api/health
   - Check browser console for network errors

### Debug Mode

Start the backend in development mode:

```bash
cd backend
npm run dev
```

## 🧪 Testing

```bash
# Frontend tests
npm test

# Backend tests
cd backend && npm test
```

## 📦 Deployment

### Frontend Deployment

```bash
npm run build
```

### Backend Deployment

- Set `NODE_ENV=production`
- Update MongoDB URI for production
- Use environment variables for sensitive data

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

If you encounter any issues:

1. Check the troubleshooting section
2. Verify MongoDB is running
3. Check both frontend and backend console logs
4. Ensure all dependencies are installed

## 🎯 Next Steps

- [ ] Add user authentication
- [ ] Implement real-time notifications
- [ ] Add meeting reminders
- [ ] Create admin dashboard
- [ ] Add file upload for meeting attachments
- [ ] Implement meeting recurring patterns
