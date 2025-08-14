#!/usr/bin/env node

// Start the WebRTC signaling server
require("./signalingServer");

console.log("🎥 Video Conferencing Signaling Server Started");
console.log("📡 WebSocket server ready for WebRTC connections");
console.log(
  "🌐 Server will automatically handle peer-to-peer video connections"
);

