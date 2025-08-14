const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
require("dotenv").config({ path: "./config.env" });

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

// Store active rooms and participants
const rooms = new Map();
const participants = new Map();

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Signaling server is running" });
});

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Join a room
  socket.on("join-room", ({ roomId, userName }) => {
    console.log(`User ${userName} (${socket.id}) joining room: ${roomId}`);

    // Join the socket room
    socket.join(roomId);

    // Store participant info
    participants.set(socket.id, {
      id: socket.id,
      name: userName,
      roomId: roomId,
      isHost: false,
    });

    // Initialize room if it doesn't exist
    if (!rooms.has(roomId)) {
      rooms.set(roomId, {
        id: roomId,
        participants: new Set(),
        host: socket.id,
        createdAt: new Date(),
      });
    }

    const room = rooms.get(roomId);
    room.participants.add(socket.id);

    // Set host if this is the first participant
    if (room.participants.size === 1) {
      room.host = socket.id;
      participants.get(socket.id).isHost = true;
    }

    // Get existing participants for the joining user
    const existingParticipants = Array.from(room.participants)
      .filter((pid) => pid !== socket.id)
      .map((pid) => participants.get(pid))
      .filter((p) => p);

    socket.emit("room-joined", {
      roomId,
      participants: existingParticipants,
      isHost: participants.get(socket.id).isHost,
    });

    // Notify other participants about the new user
    socket.to(roomId).emit("user-joined", {
      id: socket.id,
      name: userName,
      isHost: participants.get(socket.id).isHost,
    });

    console.log(
      `Room ${roomId} now has ${room.participants.size} participants`
    );
  });

  // Handle WebRTC signaling
  socket.on("offer", ({ to, offer }) => {
    console.log(`Offer from ${socket.id} to ${to}`);
    socket.to(to).emit("offer", {
      from: socket.id,
      offer: offer,
    });
  });

  socket.on("answer", ({ to, answer }) => {
    console.log(`Answer from ${socket.id} to ${to}`);
    socket.to(to).emit("answer", {
      from: socket.id,
      answer: answer,
    });
  });

  socket.on("ice-candidate", ({ to, candidate }) => {
    socket.to(to).emit("ice-candidate", {
      from: socket.id,
      candidate: candidate,
    });
  });

  // Handle participant actions
  socket.on("toggle-mute", ({ isMuted }) => {
    const participant = participants.get(socket.id);
    if (participant) {
      participant.isMuted = isMuted;
      socket.to(participant.roomId).emit("participant-mute-changed", {
        id: socket.id,
        isMuted: isMuted,
      });
    }
  });

  socket.on("toggle-video", ({ isVideoOff }) => {
    const participant = participants.get(socket.id);
    if (participant) {
      participant.isVideoOff = isVideoOff;
      socket.to(participant.roomId).emit("participant-video-changed", {
        id: socket.id,
        isVideoOff: isVideoOff,
      });
    }
  });

  socket.on("screen-share-started", () => {
    const participant = participants.get(socket.id);
    if (participant) {
      socket.to(participant.roomId).emit("screen-share-started", {
        from: socket.id,
        fromName: participant.name,
      });
    }
  });

  socket.on("screen-share-stopped", () => {
    const participant = participants.get(socket.id);
    if (participant) {
      socket.to(participant.roomId).emit("screen-share-stopped", {
        from: socket.id,
      });
    }
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);

    const participant = participants.get(socket.id);
    if (participant) {
      const room = rooms.get(participant.roomId);
      if (room) {
        room.participants.delete(socket.id);

        // Notify other participants
        socket.to(participant.roomId).emit("user-left", {
          id: socket.id,
          name: participant.name,
        });

        // Clean up empty rooms
        if (room.participants.size === 0) {
          rooms.delete(participant.roomId);
          console.log(`Room ${participant.roomId} deleted (empty)`);
        } else {
          // Transfer host if the host left
          if (room.host === socket.id) {
            const newHost = Array.from(room.participants)[0];
            room.host = newHost;
            participants.get(newHost).isHost = true;

            socket.to(participant.roomId).emit("host-changed", {
              newHost: newHost,
              newHostName: participants.get(newHost).name,
            });
          }
        }
      }

      participants.delete(socket.id);
    }
  });

  // Handle room info requests
  socket.on("get-room-info", (roomId) => {
    const room = rooms.get(roomId);
    if (room) {
      const roomParticipants = Array.from(room.participants)
        .map((pid) => participants.get(pid))
        .filter((p) => p);

      socket.emit("room-info", {
        roomId,
        participants: roomParticipants,
        host: room.host,
        participantCount: room.participants.size,
      });
    } else {
      socket.emit("room-not-found", { roomId });
    }
  });
});

// API endpoints for room management
app.get("/api/rooms", (req, res) => {
  const roomsList = Array.from(rooms.values()).map((room) => ({
    id: room.id,
    participantCount: room.participants.size,
    createdAt: room.createdAt,
    host: room.host,
  }));

  res.json({ rooms: roomsList });
});

app.get("/api/rooms/:roomId", (req, res) => {
  const room = rooms.get(req.params.roomId);
  if (room) {
    const roomParticipants = Array.from(room.participants)
      .map((pid) => participants.get(pid))
      .filter((p) => p);

    res.json({
      id: room.id,
      participants: roomParticipants,
      host: room.host,
      participantCount: room.participants.size,
      createdAt: room.createdAt,
    });
  } else {
    res.status(404).json({ error: "Room not found" });
  }
});

// Clean up inactive rooms periodically
setInterval(() => {
  const now = new Date();
  for (const [roomId, room] of rooms.entries()) {
    // Remove rooms that have been empty for more than 1 hour
    if (room.participants.size === 0 && now - room.createdAt > 60 * 60 * 1000) {
      rooms.delete(roomId);
      console.log(`Cleaned up inactive room: ${roomId}`);
    }
  }
}, 5 * 60 * 1000); // Check every 5 minutes

const PORT = process.env.SIGNALING_PORT || 3001;

server.listen(PORT, () => {
  console.log(`🎥 Signaling server running on port ${PORT}`);
  console.log(`📡 WebSocket server ready for WebRTC connections`);
  console.log(
    `🌐 CORS enabled for: ${
      process.env.FRONTEND_URL || "http://localhost:3000"
    }`
  );
});

module.exports = { app, server, io };
