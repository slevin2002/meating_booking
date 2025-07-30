# Authentication System Implementation

This document describes the email and password authentication system implemented for the Meeting Booking Application.

## Features Implemented

### Backend Authentication

- ✅ User registration with email and password
- ✅ User login with email and password
- ✅ JWT token-based authentication
- ✅ Password hashing with bcrypt
- ✅ Input validation and error handling
- ✅ User roles (admin/user)
- ✅ Email uniqueness validation

### Frontend Authentication

- ✅ Modern login and registration forms
- ✅ Authentication context for state management
- ✅ Protected routes
- ✅ User menu with logout functionality
- ✅ Automatic token management
- ✅ Password strength indicator
- ✅ Form validation
- ✅ Responsive design

## Backend Implementation

### Dependencies

- `bcryptjs` - Password hashing
- `jsonwebtoken` - JWT token generation
- `express-validator` - Input validation
- `mongoose` - Database operations

### API Endpoints

#### POST `/api/users/register`

Register a new user.

**Request Body:**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "user"
}
```

**Response:**

```json
{
  "message": "User registered successfully",
  "user": {
    "_id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "isActive": true
  },
  "token": "jwt_token_here"
}
```

#### POST `/api/users/login`

Login with email and password.

**Request Body:**

```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**

```json
{
  "message": "Login successful",
  "user": {
    "_id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "isActive": true
  },
  "token": "jwt_token_here"
}
```

### Security Features

- Password hashing with bcrypt (salt rounds: 10)
- JWT tokens with 24-hour expiration
- Input validation and sanitization
- Email uniqueness enforcement
- Role-based access control

## Frontend Implementation

### Components Created

#### `Login.tsx`

- Email and password form
- Error handling and display
- Loading states
- Navigation to registration

#### `Register.tsx`

- Full user registration form
- Password strength indicator
- Password confirmation
- Role selection
- Form validation

#### `ProtectedRoute.tsx`

- Route protection based on authentication
- Admin role protection
- Loading states during auth check
- Automatic redirect to login

#### `AuthContext.tsx`

- Global authentication state management
- Token and user data persistence
- Login/logout functions
- User data updates

### Authentication Flow

1. **App Initialization**

   - Check for existing token in localStorage
   - Validate token and set user state
   - Show loading spinner during check

2. **Login Process**

   - User enters email and password
   - Form validation
   - API call to login endpoint
   - Store token and user data
   - Navigate to protected route

3. **Registration Process**

   - User fills registration form
   - Password strength validation
   - API call to register endpoint
   - Store token and user data
   - Navigate to main app

4. **Protected Routes**

   - Check authentication status
   - Redirect to login if not authenticated
   - Check admin role if required
   - Render protected content

5. **Logout Process**
   - Clear token and user data
   - Navigate to login page
   - Reset authentication state

### User Interface Features

#### Login Form

- Clean, modern design
- Email and password fields
- Error message display
- Loading states
- Link to registration

#### Registration Form

- Full name, email, password fields
- Password confirmation
- Role selection (user/admin)
- Password strength indicator
- Form validation
- Link to login

#### User Menu

- User avatar with initials
- User name and role display
- Dropdown menu
- Logout functionality
- Responsive design

## Testing

### Backend Testing

Run the authentication test script:

```bash
cd backend
node test-auth.js
```

This will test:

- User registration
- User login
- Invalid credentials
- Duplicate registration
- Input validation

### Frontend Testing

1. Start the development server
2. Navigate to `/login` or `/register`
3. Test registration with new user
4. Test login with valid credentials
5. Test protected routes
6. Test logout functionality

## Security Considerations

### Backend Security

- ✅ Password hashing with bcrypt
- ✅ JWT token expiration
- ✅ Input validation and sanitization
- ✅ Email uniqueness enforcement
- ✅ Role-based access control
- ✅ Error handling without information leakage

### Frontend Security

- ✅ Token storage in localStorage
- ✅ Automatic token inclusion in API requests
- ✅ Protected route implementation
- ✅ Automatic logout on 401 errors
- ✅ Form validation
- ✅ Secure password handling

## Environment Variables

### Backend (.env)

```
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key_here_change_in_production
NODE_ENV=development
```

### Frontend

The frontend automatically detects the backend URL based on the environment.

## Usage Instructions

### For Developers

1. **Start Backend:**

   ```bash
   cd backend
   npm install
   npm start
   ```

2. **Start Frontend:**

   ```bash
   npm install
   npm start
   ```

3. **Test Authentication:**
   ```bash
   cd backend
   node test-auth.js
   ```

### For Users

1. **First Time Setup:**

   - Navigate to `/register`
   - Fill in your details
   - Choose your role
   - Create account

2. **Regular Login:**

   - Navigate to `/login`
   - Enter email and password
   - Access the application

3. **Logout:**
   - Click on your user menu (top right)
   - Click "Logout"

## Future Enhancements

- [ ] Password reset functionality
- [ ] Email verification
- [ ] Two-factor authentication
- [ ] Remember me functionality
- [ ] Session management
- [ ] Account settings page
- [ ] Password change functionality
- [ ] User profile management

## Troubleshooting

### Common Issues

1. **"Authentication failed" error**

   - Check if backend is running
   - Verify JWT_SECRET is set
   - Clear localStorage and try again

2. **"User already exists" error**

   - Use a different email address
   - Check if user exists in database

3. **Protected routes not working**

   - Ensure token is stored in localStorage
   - Check if token is valid
   - Verify AuthProvider is wrapping the app

4. **API requests failing**
   - Check if token is included in headers
   - Verify backend is running on correct port
   - Check CORS configuration

### Debug Steps

1. Check browser console for errors
2. Verify localStorage has token and user data
3. Test backend endpoints directly
4. Check network tab for API calls
5. Verify environment variables are set correctly
