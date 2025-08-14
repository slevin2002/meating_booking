# 🎥 Custom Video Conferencing System

## Overview

This is a **custom video conferencing solution** built with **WebRTC** technology, providing you with complete control over your video meetings without relying on third-party services like Zoom.

## ✨ Features

### 🎯 Core Features

- **Peer-to-Peer Video/Audio**: Direct connections between participants
- **Screen Sharing**: Share your screen with other participants
- **Mute/Unmute**: Control your microphone
- **Video On/Off**: Control your camera
- **Room Management**: Create and join rooms with unique IDs
- **Host Controls**: Automatic host assignment and transfer
- **Real-time Communication**: WebSocket-based signaling

### 🛡️ Privacy & Control

- **No Third-Party Dependencies**: Your data stays on your servers
- **Custom Branding**: Fully customizable interface
- **Complete Ownership**: All code and data belong to you
- **No External APIs**: No reliance on Zoom, Teams, or other services

## 🚀 Getting Started

### 1. Start the Signaling Server

The signaling server handles WebRTC connection establishment:

```bash
cd backend
npm run signaling
```

This starts the WebRTC signaling server on port 3001.

### 2. Start the Main Application

```bash
# Terminal 1: Backend API server
cd backend
npm start

# Terminal 2: Frontend application
cd ..
npm start
```

### 3. Access Video Conferencing

1. Open your browser to `http://localhost:3000`
2. Navigate to the **"Video Conference"** tab
3. Enter your name and optionally a room ID
4. Click **"Create Room"** or **"Join Room"**

## 📱 How to Use

### Creating a Room

1. Click the **"Video Conference"** tab
2. Enter your name
3. Leave the room ID field empty
4. Click **"Create Room"**
5. Share the generated room ID with others

### Joining a Room

1. Click the **"Video Conference"** tab
2. Enter your name
3. Enter the room ID provided by the host
4. Click **"Join Room"**

### Controls

- **🎤 Mute/Unmute**: Toggle your microphone
- **📹 Video On/Off**: Toggle your camera
- **🖥️ Screen Share**: Share your screen with participants
- **❌ Leave Room**: Exit the video conference

## 🔧 Technical Architecture

### Frontend Components

- **`VideoConference.tsx`**: Main video conferencing interface
- **`webrtcService.ts`**: WebRTC connection management
- **`VideoConference.css`**: Styling and responsive design

### Backend Services

- **`signalingServer.js`**: WebSocket server for signaling
- **Socket.IO**: Real-time communication
- **WebRTC**: Peer-to-peer video/audio connections

### Technology Stack

- **Frontend**: React, TypeScript, Socket.IO Client
- **Backend**: Node.js, Express, Socket.IO
- **Video**: WebRTC (getUserMedia, RTCPeerConnection)
- **Signaling**: WebSocket (Socket.IO)

## 🌐 Network Configuration

### Ports Used

- **Frontend**: `http://localhost:3000`
- **Backend API**: `http://localhost:4444`
- **Signaling Server**: `http://localhost:3001`

### Environment Variables

Add to your `.env` file:

```env
REACT_APP_SIGNALING_URL=http://localhost:3001
SIGNALING_PORT=3001
```

## 🔒 Security Features

### WebRTC Security

- **STUN Servers**: Google's public STUN servers for NAT traversal
- **Peer-to-Peer**: Direct connections between participants
- **No Server Recording**: Video/audio never passes through your servers

### Room Security

- **Unique Room IDs**: 6-character alphanumeric codes
- **No Password Required**: Simple room-based access
- **Automatic Cleanup**: Inactive rooms are automatically removed

## 📊 Room Management

### Room Lifecycle

1. **Creation**: Room is created when first participant joins
2. **Active**: Room remains active while participants are present
3. **Host Transfer**: If host leaves, host role transfers to next participant
4. **Cleanup**: Room is deleted when empty for 1 hour

### Participant Management

- **Host Assignment**: First participant becomes host
- **Automatic Transfer**: Host role transfers when host leaves
- **Real-time Updates**: All participants see join/leave events

## 🎨 Customization

### Styling

The video conferencing interface can be customized by modifying:

- `src/components/VideoConference.css`
- Color schemes, layouts, and responsive design

### Features

Add new features by extending:

- `src/services/webrtcService.ts` for WebRTC functionality
- `src/components/VideoConference.tsx` for UI components
- `backend/signalingServer.js` for server-side features

## 🔧 Troubleshooting

### Common Issues

#### Camera/Microphone Access

**Problem**: "Unable to access camera/microphone"
**Solution**:

1. Check browser permissions
2. Ensure HTTPS in production
3. Verify camera/microphone are not in use by other applications

#### Connection Issues

**Problem**: Participants can't see/hear each other
**Solution**:

1. Check if signaling server is running (`npm run signaling`)
2. Verify firewall settings
3. Check browser console for WebRTC errors

#### Screen Sharing Not Working

**Problem**: Screen share button doesn't work
**Solution**:

1. Ensure browser supports `getDisplayMedia()`
2. Check for browser extensions blocking screen share
3. Verify HTTPS in production (required for screen sharing)

### Debug Mode

Enable debug logging by adding to browser console:

```javascript
localStorage.setItem("webrtc-debug", "true");
```

## 🚀 Production Deployment

### Requirements

- **HTTPS**: Required for WebRTC in production
- **STUN/TURN Servers**: For NAT traversal
- **WebSocket Support**: For signaling server

### Deployment Steps

1. **Build Frontend**: `npm run build`
2. **Deploy Backend**: Deploy Node.js backend with signaling server
3. **Configure Domain**: Set up domain and SSL certificates
4. **Update Environment**: Set production environment variables

### Environment Variables (Production)

```env
NODE_ENV=production
FRONTEND_URL=https://yourdomain.com
SIGNALING_PORT=3001
```

## 📈 Performance Optimization

### WebRTC Optimization

- **Video Quality**: Adjust resolution based on bandwidth
- **Audio Codecs**: Use Opus for better audio quality
- **Bandwidth Management**: Implement adaptive bitrate

### Server Optimization

- **Connection Pooling**: Optimize Socket.IO connections
- **Memory Management**: Clean up inactive rooms
- **Load Balancing**: Scale signaling servers horizontally

## 🔮 Future Enhancements

### Planned Features

- **Recording**: Local recording capabilities
- **Chat**: Text chat during video calls
- **File Sharing**: Share files during meetings
- **Breakout Rooms**: Split participants into smaller groups
- **Whiteboard**: Collaborative drawing tools
- **Meeting Scheduling**: Integrate with existing meeting system

### Advanced Features

- **AI Noise Reduction**: Background noise suppression
- **Virtual Backgrounds**: Custom video backgrounds
- **Meeting Analytics**: Usage statistics and insights
- **Mobile Support**: Native mobile applications

## 📞 Support

For technical support or feature requests:

1. Check the troubleshooting section above
2. Review browser console for error messages
3. Verify all services are running correctly
4. Test with different browsers and devices

## 🎉 Benefits of Custom Solution

### ✅ Advantages

- **Complete Control**: Full ownership of code and data
- **No Monthly Fees**: No recurring costs for video conferencing
- **Custom Branding**: Match your application's design
- **Privacy**: No third-party data collection
- **Scalability**: Scale according to your needs
- **Integration**: Seamless integration with existing systems

### 🔧 Technical Benefits

- **WebRTC**: Modern, efficient video technology
- **Peer-to-Peer**: Reduced server bandwidth usage
- **Real-time**: Low latency communication
- **Cross-platform**: Works on all modern browsers
- **Mobile-friendly**: Responsive design for all devices

---

**🎥 Your own video conferencing solution - no third-party dependencies required!**

