const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const morgan = require("morgan");
const http = require("http");
const socketIo = require("socket.io");
require("dotenv").config({ path: "./config.env" });

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: [
      process.env.FRONTEND_URL || "http://localhost:3000",
      "http://192.168.2.136:3000",
      "https://192.168.2.136:3000",
    ],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("combined"));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
// app.use(limiter); // Disabled for development to prevent 429 errors during testing

// Database connection
mongoose
  .connect(
    process.env.MONGO_URI || "mongodb://localhost:27017/meeting_booking",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Routes
app.use("/api/teams", require("./routes/teams"));
app.use("/api/meetings", require("./routes/meetings"));
app.use("/api/zoom", require("./routes/zoom"));
app.use("/api/users", require("./routes/users"));
app.use("/api/status", require("./routes/status"));
app.use("/api/admin", require("./routes/admin"));

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "Meeting Booking API is running" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: "Something went wrong!",
    message:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Internal server error",
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ error: "Route not found" });
});

const PORT = process.env.PORT || 5000;

// WebRTC Signaling Server Logic
const rooms = new Map();
const participants = new Map();

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on("join-room", ({ roomId, userName }) => {
    console.log(`User ${userName} (${socket.id}) joining room: ${roomId}`);

    // Join the room
    socket.join(roomId);

    // Store participant info
    const participant = {
      id: socket.id,
      name: userName,
      roomId: roomId,
      isHost: !rooms.has(roomId) || rooms.get(roomId).participants.size === 0,
    };

    participants.set(socket.id, participant);

    // Add to room
    if (!rooms.has(roomId)) {
      rooms.set(roomId, { participants: new Set() });
    }
    rooms.get(roomId).participants.add(socket.id);

    console.log(
      `Room ${roomId} now has ${
        rooms.get(roomId).participants.size
      } participants`
    );

    // Notify others in the room
    socket.to(roomId).emit("user-joined", participant);

    // Send existing participants to the joining user
    const existingParticipants = Array.from(rooms.get(roomId).participants)
      .filter((pid) => pid !== socket.id)
      .map((pid) => participants.get(pid))
      .filter((p) => p);

    socket.emit("room-joined", {
      roomId,
      participants: existingParticipants,
      isHost: participant.isHost,
    });

    // Send existing participants info to the joining user
    socket.emit("existing-participants", existingParticipants);
  });

  socket.on("offer", ({ to, offer }) => {
    console.log(`Offer from ${socket.id} to ${to}`);
    socket.to(to).emit("offer", { from: socket.id, offer });
  });

  socket.on("answer", ({ to, answer }) => {
    console.log(`Answer from ${socket.id} to ${to}`);
    socket.to(to).emit("answer", { from: socket.id, answer });
  });

  socket.on("ice-candidate", ({ to, candidate }) => {
    socket.to(to).emit("ice-candidate", { from: socket.id, candidate });
  });

  socket.on("toggle-mute", ({ isMuted }) => {
    const participant = participants.get(socket.id);
    if (participant) {
      participant.isMuted = isMuted;
      socket.to(participant.roomId).emit("participant-mute-changed", {
        id: socket.id,
        isMuted,
      });
    }
  });

  socket.on("toggle-video", ({ isVideoOff }) => {
    const participant = participants.get(socket.id);
    if (participant) {
      participant.isVideoOff = isVideoOff;
      socket.to(participant.roomId).emit("participant-video-changed", {
        id: socket.id,
        isVideoOff,
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

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
    const participant = participants.get(socket.id);

    if (participant) {
      const room = rooms.get(participant.roomId);
      if (room) {
        room.participants.delete(socket.id);

        // Notify others that user left
        socket.to(participant.roomId).emit("user-left", {
          id: socket.id,
          name: participant.name,
        });

        // If room is empty, delete it
        if (room.participants.size === 0) {
          rooms.delete(participant.roomId);
          console.log(`Room ${participant.roomId} deleted (empty)`);
        }
      }

      participants.delete(socket.id);
    }
  });
});

// Clean up empty rooms periodically
setInterval(() => {
  for (const [roomId, room] of rooms.entries()) {
    if (room.participants.size === 0) {
      rooms.delete(roomId);
      console.log(`Room ${roomId} deleted (empty)`);
    }
  }
}, 30000); // Check every 30 seconds

server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Main server running on port ${PORT}`);
  console.log(`🎥 WebRTC signaling server integrated`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`Server listening on http://localhost:${PORT}`);
  console.log(`🌐 Network access: http://192.168.2.136:${PORT}`);
  console.log(`WebSocket server ready for WebRTC connections`);
});
