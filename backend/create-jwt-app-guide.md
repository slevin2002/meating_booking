# How to Create a JWT App in Zoom Developer Console

## Step 1: Create New App

1. Go to [Zoom Developer Console](https://developers.zoom.us/)
2. Click "Build App"
3. Choose "JWT" (not Server-to-Server OAuth)
4. Give it a name like "Meeting Booking JWT"

## Step 2: Configure App

1. **App Credentials**: Copy the API Key and API Secret
2. **Information**: Add your Account ID: `IHnPJxwWROKEFeJQYftGog`
3. **Scopes**: Add these scopes:
   - `meeting:write`
   - `meeting:read`

## Step 3: Activate App

1. Go to "Activation" tab
2. Click "Activate"
3. Wait for approval

## Step 4: Update Your Configuration

Replace your current credentials in `backend/config.env`:

```env
ZOOM_API_KEY=YOUR_NEW_JWT_API_KEY
ZOOM_API_SECRET=YOUR_NEW_JWT_API_SECRET
```

## Step 5: Test

Run the test script:

```bash
cd backend
node test-zoom-oauth.js
```

JWT apps are simpler and don't require the complex OAuth setup!


