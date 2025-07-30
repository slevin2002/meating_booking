# Email Notifications Feature

## Overview

The meeting booking system now includes automatic email notifications that are sent to selected attendees when meetings are booked or cancelled.

## Features

### Meeting Creation Notifications

- **When**: Automatically sent when a new meeting is created
- **Recipients**: All selected attendees for the meeting
- **Content**:
  - Meeting title and description
  - Date, time, and duration
  - Room location
  - Team information
  - Organizer details
  - List of all attendees
  - Direct link to view meeting details

### Meeting Cancellation Notifications

- **When**: Automatically sent when a meeting is cancelled
- **Recipients**: All attendees of the cancelled meeting
- **Content**:
  - Cancellation notice
  - Original meeting details
  - Who cancelled the meeting
  - Cancellation reason (if provided)

## Email Configuration

### Environment Variables

The following environment variables need to be configured in `backend/config.env`:

```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
FRONTEND_URL=http://localhost:3000
```

### Gmail Setup

1. Enable 2-factor authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a password for "Mail"
3. Use the generated password as `EMAIL_PASS`

## Email Templates

### Meeting Invitation Template

- **Subject**: `📅 Meeting Invitation: [Meeting Title]`
- **Format**: HTML with responsive design
- **Features**:
  - Professional styling with gradient header
  - Meeting details in organized layout
  - Attendee list
  - Direct link to meeting details
  - Fallback plain text version

### Cancellation Template

- **Subject**: `❌ Meeting Cancelled: [Meeting Title]`
- **Format**: HTML with red-themed styling
- **Features**:
  - Clear cancellation notice
  - Original meeting details
  - Cancellation information
  - Professional styling

## Implementation Details

### Backend Components

#### Email Service (`backend/utils/emailService.js`)

- `sendMeetingInvitations()`: Sends invitation emails to attendees
- `sendMeetingCancellationEmail()`: Sends cancellation emails
- `formatDateTime()`: Formats dates for email display
- `generateMeetingEmailHTML()`: Creates HTML email content
- `generateMeetingEmailText()`: Creates plain text email content

#### Integration Points

- **Meeting Creation**: `backend/routes/meetings.js` - POST `/` route
- **Meeting Cancellation**: `backend/routes/meetings.js` - PATCH `/:id/cancel` route

### Frontend Updates

#### Success Messages

- **App.tsx**: Enhanced success modal to show email notification results
- **MeetingDetails.tsx**: Updated cancellation success message with email status

#### User Feedback

- Shows number of successful/failed email notifications
- Displays warnings for failed email sends
- Maintains meeting creation/cancellation even if emails fail

## Error Handling

### Graceful Degradation

- Meeting creation/cancellation succeeds even if email sending fails
- Email errors are logged but don't block the main operation
- Users are informed of email notification status

### Email Validation

- Only sends emails to attendees who exist in the User collection
- Logs when attendees don't have corresponding user records
- Handles network and SMTP errors gracefully

## Testing

### Test Script

Run the email test script to verify functionality:

```bash
cd backend
node test-email.js
```

### Manual Testing

1. Create a new meeting with attendees
2. Check email inboxes for invitation emails
3. Cancel a meeting
4. Check for cancellation notification emails

## Security Considerations

### Email Security

- Uses Gmail's secure SMTP with app passwords
- No sensitive data in email content
- Emails only sent to verified attendees

### Data Privacy

- Only sends emails to attendees explicitly selected for the meeting
- Email addresses are validated against the User collection
- No email addresses are logged in plain text

## Troubleshooting

### Common Issues

1. **Emails not sending**

   - Check Gmail app password configuration
   - Verify EMAIL_USER and EMAIL_PASS in config.env
   - Check Gmail account security settings

2. **Attendees not receiving emails**

   - Verify attendee emails exist in User collection
   - Check email addresses are correctly formatted
   - Review server logs for email errors

3. **Email content issues**
   - Check FRONTEND_URL configuration
   - Verify meeting data structure
   - Review email template generation

### Debugging

- Email results are logged to console
- Check backend logs for email notification status
- Use test-email.js script for isolated testing

## Future Enhancements

### Potential Improvements

- Email templates customization
- Meeting reminder emails
- Calendar integration (ICS files)
- Email preferences per user
- Bulk email operations
- Email delivery tracking
