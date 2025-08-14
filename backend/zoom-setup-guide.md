# Zoom Integration Setup Guide

## Option 1: Create a New JWT App (Recommended)

### Step 1: Create JWT App

1. Go to [Zoom Developer Console](https://developers.zoom.us/)
2. Click "Build App"
3. Choose "JWT" (not Server-to-Server OAuth)
4. Name: "Meeting Booking JWT"

### Step 2: Configure App

1. **App Credentials**: Copy API Key and API Secret
2. **Information**:
   - Account ID: `IHnPJxwWROKEFeJQYftGog`
   - App Type: JWT
3. **Scopes**: Add these scopes:
   - `meeting:write`
   - `meeting:read`

### Step 3: Activate App

1. Go to "Activation" tab
2. Click "Activate"
3. Wait for approval (usually instant)

### Step 4: Update Configuration

Replace in `backend/config.env`:

```env
ZOOM_API_KEY=YOUR_NEW_JWT_API_KEY
ZOOM_API_SECRET=YOUR_NEW_JWT_API_SECRET
```

### Step 5: Switch to JWT Implementation

Update `backend/utils/zoomService.js` to use JWT instead of OAuth.

## Option 2: Fix Current Server-to-Server OAuth App

### Step 1: Verify App Configuration

1. Go to [Zoom Developer Console](https://developers.zoom.us/)
2. Select your app (Client ID: `bRxz4Jj3SP2nbbeqn5bbTg`)

### Step 2: Check Information Tab

- Account ID: `IHnPJxwWROKEFeJQYftGog`
- App Type: Server-to-Server OAuth

### Step 3: Check Scopes Tab

- Add: `meeting:write:admin`
- Add: `meeting:read:admin`

### Step 4: Check Activation Tab

- Ensure app is activated

## Testing

After setup, run:

```bash
cd backend
node test-zoom-oauth-detailed.js
```

## Recommendation

**Use JWT** - it's simpler and more reliable for server-side integrations.


