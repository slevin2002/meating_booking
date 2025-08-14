# Gmail App Password Setup Guide

## Problem

You're getting this error when trying to send emails:

```
Error: Invalid login: 535-5.7.8 Username and Password not accepted. For more information, go to
535 5.7.8  https://support.google.com/mail/?p=BadCredentials
```

This happens because Gmail no longer allows "less secure app access" for regular passwords.

## Solution: Use Gmail App Password

### Step 1: Enable 2-Factor Authentication

1. Go to [Google Account Settings](https://myaccount.google.com/)
2. Click on "Security" in the left sidebar
3. Under "Signing in to Google", click on "2-Step Verification"
4. Follow the steps to enable 2-Step Verification if not already enabled

### Step 2: Generate an App Password

1. Go to [Google Account Settings](https://myaccount.google.com/)
2. Click on "Security" in the left sidebar
3. Under "2-Step Verification", click on "App passwords"
4. You may need to sign in again
5. Under "Select app", choose "Mail"
6. Under "Select device", choose "Other (Custom name)"
7. Enter a name like "Meeting Booking System"
8. Click "Generate"
9. **Copy the 16-character password** (it will look like: `abcd efgh ijkl mnop`)

### Step 3: Update Your Configuration

1. Open `backend/config.env`
2. Replace the current `EMAIL_PASS` value with your new App Password
3. Make sure there are no spaces in the password

Example:

```env
EMAIL_USER=meetingbooking2373@gmail.com
EMAIL_PASS=abcd efgh ijkl mnop
```

### Step 4: Test the Configuration

1. Restart your backend server
2. Try sending a test email or creating a meeting with email notifications

## Alternative Solutions

### Option 1: Use OAuth2 (More Secure)

For production applications, consider using OAuth2 instead of App Passwords. This requires more setup but is more secure.

### Option 2: Use a Different Email Service

Consider using services like:

- SendGrid
- Mailgun
- AWS SES
- Resend

These services are designed for application email sending and have better deliverability.

## Security Notes

- Never commit your App Password to version control
- Keep your App Password secure and don't share it
- Consider rotating App Passwords periodically
- For production, use environment variables or a secure secrets management system

## Troubleshooting

- Make sure 2-Factor Authentication is enabled
- Ensure you're using the correct Gmail address
- Check that the App Password was copied correctly (no extra spaces)
- Verify that the App Password is for the "Mail" app
- If still having issues, try generating a new App Password

