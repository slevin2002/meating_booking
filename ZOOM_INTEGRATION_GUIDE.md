# Zoom Meeting Integration Guide

This guide will help you set up Zoom meeting integration in your Meeting Booking System.

## Prerequisites

1. **Zoom Developer Account**: You need a Zoom Developer account to access the Zoom API
2. **Zoom App**: Create a JWT App in your Zoom Developer account
3. **Node.js Backend**: Ensure your backend is running and accessible

## Step-by-Step Setup

### 1. Create Zoom Developer Account

1. Go to [Zoom Developer Portal](https://developers.zoom.us/)
2. Sign up for a free developer account
3. Verify your email address

### 2. Create a JWT App

1. Log in to your Zoom Developer account
2. Navigate to "Build App" → "Create App"
3. Choose "JWT" as the app type
4. Fill in the app information:
   - **App name**: Meeting Booking System
   - **App type**: Meeting
   - **User email**: Your Zoom account email
5. Click "Create"

### 3. Configure JWT App Settings

1. In your JWT app dashboard, go to "App Credentials"
2. Copy the **API Key** and **API Secret**
3. Go to "Meeting" → "Add" to enable meeting functionality
4. Configure meeting settings as needed

### 4. Update Environment Variables

1. Open `backend/config.env`
2. Add your Zoom credentials:

```env
# Zoom API Configuration
ZOOM_API_KEY=your_zoom_api_key_here
ZOOM_API_SECRET=your_zoom_api_secret_here
```

### 5. Install Dependencies

1. Navigate to the backend directory:

```bash
cd backend
```

2. Install the Zoom SDK:

```bash
npm install @zoom/meetings
```

3. Install additional dependencies if needed:

```bash
npm install axios jsonwebtoken
```

### 6. Test the Integration

1. Start your backend server:

```bash
npm start
```

2. Start your frontend application:

```bash
npm start
```

3. Navigate to the "Zoom Meeting" tab in your application
4. Try creating a Zoom meeting

## Features Included

### ✅ Backend Features

- **Zoom Service**: Complete Zoom API integration
- **Meeting Creation**: Automatic Zoom meeting creation
- **Meeting Management**: Update, delete, and join meetings
- **Email Notifications**: Send invitations to attendees
- **Database Integration**: Store Zoom meeting details
- **Error Handling**: Comprehensive error management

### ✅ Frontend Features

- **Zoom Meeting Form**: User-friendly meeting creation interface
- **Team Selection**: Choose teams for meetings
- **Attendee Management**: Select meeting participants
- **Schedule Management**: Date and time selection
- **Real-time Validation**: Form validation and error handling
- **Success Notifications**: Meeting creation confirmations

### ✅ API Endpoints

- `POST /api/zoom/create` - Create Zoom meeting
- `GET /api/zoom` - Get all Zoom meetings
- `GET /api/zoom/:id` - Get specific Zoom meeting
- `PUT /api/zoom/:id` - Update Zoom meeting
- `DELETE /api/zoom/:id` - Delete Zoom meeting
- `POST /api/zoom/:id/join` - Join Zoom meeting
- `GET /api/zoom/stats/overview` - Get Zoom meeting statistics

## Usage Guide

### Creating a Zoom Meeting

1. **Navigate to Zoom Tab**: Click on the "🎥 Zoom Meeting" tab
2. **Select Team**: Choose the team for the meeting
3. **Enter Details**: Fill in meeting title and description
4. **Set Schedule**: Choose date, start time, and end time
5. **Select Attendees**: Choose team members to invite
6. **Create Meeting**: Click "🎥 Create Zoom Meeting"

### Meeting Information

After creating a meeting, you'll receive:

- **Join URL**: For participants to join the meeting
- **Start URL**: For the host to start the meeting
- **Meeting ID**: Unique identifier for the meeting
- **Password**: Meeting password (if required)

### Email Notifications

The system automatically sends email invitations to:

- All selected attendees
- Meeting creator (host)
- Team members (optional)

## Security Features

- **JWT Authentication**: Secure API communication
- **Token Expiration**: Automatic token refresh
- **Meeting Passwords**: Optional meeting security
- **Host Controls**: Meeting management capabilities
- **Waiting Room**: Optional participant approval

## Troubleshooting

### Common Issues

1. **"Invalid API Key" Error**

   - Verify your Zoom API credentials in `config.env`
   - Ensure the API key and secret are correct

2. **"Meeting Creation Failed"**

   - Check your Zoom account permissions
   - Verify your Zoom app is properly configured
   - Check the backend logs for detailed error messages

3. **"Email Notifications Failed"**

   - Verify email service configuration
   - Check attendee email addresses
   - Review email service logs

4. **"Cannot Join Meeting"**
   - Verify the meeting exists in Zoom
   - Check meeting start time and duration
   - Ensure you have proper permissions

### Debug Steps

1. **Check Backend Logs**:

```bash
cd backend
npm start
# Look for error messages in the console
```

2. **Test Zoom API Directly**:

```bash
curl -X POST "https://api.zoom.us/v2/users/me/meetings" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"topic":"Test Meeting","type":2,"start_time":"2024-01-01T10:00:00Z","duration":60}'
```

3. **Verify Environment Variables**:

```bash
# Check if Zoom variables are loaded
echo $ZOOM_API_KEY
echo $ZOOM_API_SECRET
```

## Advanced Configuration

### Custom Meeting Settings

You can customize meeting settings in `backend/utils/zoomService.js`:

```javascript
settings: {
  host_video: true,           // Host video on by default
  participant_video: true,    // Participant video on by default
  join_before_host: true,     // Allow joining before host
  mute_upon_entry: false,     // Don't mute participants
  watermark: false,           // No watermark
  use_pmi: false,            // Don't use Personal Meeting ID
  approval_type: 0,          // No approval required
  audio: 'both',             // Allow both telephony and computer audio
  auto_recording: 'none',    // No automatic recording
  waiting_room: false,       // No waiting room
  meeting_authentication: false, // No authentication required
  registrants_email_notification: true, // Send email notifications
}
```

### Webhook Integration (Optional)

For advanced features, you can set up Zoom webhooks:

1. Create a webhook endpoint in your backend
2. Configure webhook events in Zoom Developer Portal
3. Handle meeting events (start, end, join, leave)

## Support

If you encounter issues:

1. Check the [Zoom API Documentation](https://marketplace.zoom.us/docs/api-reference/zoom-api)
2. Review the backend logs for error messages
3. Verify your Zoom app configuration
4. Test with a simple API call first

## License

This integration is part of the Meeting Booking System and follows the same license terms.


