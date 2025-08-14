import { io, Socket } from "socket.io-client";

export interface Participant {
  id: string;
  name: string;
  isHost: boolean;
  isMuted?: boolean;
  isVideoOff?: boolean;
  stream?: MediaStream;
}

export interface WebRTCEvents {
  onUserJoined: (participant: Participant) => void;
  onUserLeft: (participantId: string) => void;
  onOffer: (from: string, offer: RTCSessionDescriptionInit) => void;
  onAnswer: (from: string, answer: RTCSessionDescriptionInit) => void;
  onIceCandidate: (from: string, candidate: RTCIceCandidateInit) => void;
  onParticipantMuteChanged: (participantId: string, isMuted: boolean) => void;
  onParticipantVideoChanged: (
    participantId: string,
    isVideoOff: boolean
  ) => void;
  onScreenShareStarted: (from: string, fromName: string) => void;
  onScreenShareStopped: (from: string) => void;
  onHostChanged: (newHost: string, newHostName: string) => void;
}

class WebRTCService {
  private socket: Socket | null = null;
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private localStream: MediaStream | null = null;
  private screenStream: MediaStream | null = null;
  private events: WebRTCEvents | null = null;
  private roomId: string | null = null;
  private userName: string | null = null;
  private participants: Map<string, Participant> = new Map();

  // ICE servers configuration for WebRTC
  private readonly iceServers = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
      // Add TURN server for better connectivity
      {
        urls: "turn:openrelay.metered.ca:80",
        username: "openrelayproject",
        credential: "openrelayproject",
      },
      {
        urls: "turn:openrelay.metered.ca:443",
        username: "openrelayproject",
        credential: "openrelayproject",
      },
      {
        urls: "turn:openrelay.metered.ca:443?transport=tcp",
        username: "openrelayproject",
        credential: "openrelayproject",
      },
    ],
  };

  constructor() {
    this.setupSocket();
  }

  private setupSocket() {
    const signalingUrl =
      process.env.REACT_APP_SIGNALING_URL || "http://192.168.2.136:4444";

    console.log("🔌 Attempting to connect to signaling server:", signalingUrl);

    this.socket = io(signalingUrl, {
      transports: ["websocket", "polling"], // Force WebSocket first, fallback to polling
      timeout: 10000, // 10 second timeout
      forceNew: true,
    });

    this.socket.on("connect", () => {
      console.log(
        "✅ Connected to signaling server, socket ID:",
        this.socket?.id
      );
    });

    this.socket.on("connect_error", (error) => {
      console.error("❌ Connection error:", error);
    });

    this.socket.on("disconnect", (reason) => {
      console.log("❌ Disconnected from signaling server, reason:", reason);
    });

    this.socket.on("room-joined", (data) => {
      console.log("Joined room:", data);
      // Update local participant's host status
      this.events?.onUserJoined({
        id: "local",
        name: this.userName || "Unknown",
        isHost: data.isHost,
        isMuted: false,
        isVideoOff: false,
        stream: this.localStream || undefined,
      });
      this.handleExistingParticipants(data.participants);
    });

    this.socket.on("user-joined", (participant) => {
      console.log("👋 User joined:", participant);
      // Store participant info
      this.participants.set(participant.id, participant);
      console.log(
        "📝 Stored new participant info for:",
        participant.name,
        "ID:",
        participant.id
      );
      this.events?.onUserJoined(participant);
      this.createPeerConnection(participant.id);
    });

    this.socket.on("user-left", (data) => {
      console.log("User left:", data);
      this.events?.onUserLeft(data.id);
      this.removePeerConnection(data.id);
      this.participants.delete(data.id);
    });

    this.socket.on("offer", async (data) => {
      console.log("Received offer from:", data.from);
      await this.handleOffer(data.from, data.offer);
    });

    this.socket.on("answer", async (data) => {
      console.log("Received answer from:", data.from);
      await this.handleAnswer(data.from, data.answer);
    });

    this.socket.on("ice-candidate", (data) => {
      console.log("Received ICE candidate from:", data.from);
      this.handleIceCandidate(data.from, data.candidate);
    });

    this.socket.on("participant-mute-changed", (data) => {
      this.events?.onParticipantMuteChanged(data.id, data.isMuted);
    });

    this.socket.on("participant-video-changed", (data) => {
      this.events?.onParticipantVideoChanged(data.id, data.isVideoOff);
    });

    this.socket.on("screen-share-started", (data) => {
      this.events?.onScreenShareStarted(data.from, data.fromName);
    });

    this.socket.on("screen-share-stopped", (data) => {
      this.events?.onScreenShareStopped(data.from);
    });

    this.socket.on("host-changed", (data) => {
      this.events?.onHostChanged(data.newHost, data.newHostName);
    });
  }

  async joinRoom(
    roomId: string,
    userName: string,
    events: WebRTCEvents
  ): Promise<void> {
    console.log("🚀 Attempting to join room:", roomId, "as user:", userName);

    this.roomId = roomId;
    this.userName = userName;
    this.events = events;

    if (!this.socket) {
      console.error("❌ Socket not initialized");
      throw new Error("Socket not initialized");
    }

    if (!this.socket.connected) {
      console.error("❌ Socket not connected, attempting to reconnect...");
      try {
        await new Promise<void>((resolve, reject) => {
          this.socket!.connect();
          this.socket!.once("connect", () => resolve());
          this.socket!.once("connect_error", (error) => reject(error));
          setTimeout(() => reject(new Error("Connection timeout")), 10000);
        });
        console.log("✅ Socket reconnected successfully");
      } catch (error) {
        console.error("❌ Failed to reconnect socket:", error);
        throw new Error("Failed to connect to signaling server");
      }
    }

    console.log("✅ Socket connected, getting local stream...");

    // Check if mediaDevices is available
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.log("❌ mediaDevices not available, creating virtual camera");
      this.localStream = this.createVirtualCamera();
      console.log("⚠️ Created virtual camera for testing");
    } else {
      // Get local media stream with fallback options
      try {
        // First try: video + audio
        this.localStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        console.log(
          "✅ Got video+audio stream, tracks:",
          this.localStream.getTracks().length
        );
      } catch (videoAudioError) {
        console.log(
          "❌ Video+Audio failed, trying video only:",
          videoAudioError
        );
        try {
          // Second try: video only
          this.localStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
          console.log(
            "✅ Got video-only stream, tracks:",
            this.localStream.getTracks().length
          );
        } catch (videoOnlyError) {
          console.log(
            "❌ Video only failed, trying audio only:",
            videoOnlyError
          );
          try {
            // Third try: audio only
            this.localStream = await navigator.mediaDevices.getUserMedia({
              video: false,
              audio: true,
            });
            console.log(
              "✅ Got audio-only stream, tracks:",
              this.localStream.getTracks().length
            );
          } catch (audioOnlyError) {
            console.log(
              "❌ Audio only failed, creating virtual camera for testing:",
              audioOnlyError
            );
            // Create a virtual camera using canvas for testing
            this.localStream = this.createVirtualCamera();
            console.log("⚠️ Created virtual camera for testing");
          }
        }
      }
    }

    console.log(
      "🎯 Local stream obtained:",
      !!this.localStream,
      "tracks:",
      this.localStream?.getTracks().length
    );

    // Join the room
    this.socket.emit("join-room", { roomId, userName });
    console.log("🎯 Emitted join-room event");
  }

  private async handleExistingParticipants(participants: Participant[]) {
    console.log("🎯 Handling existing participants:", participants);
    for (const participant of participants) {
      // Store participant info
      this.participants.set(participant.id, participant);
      console.log(
        "📝 Stored participant info for:",
        participant.name,
        "ID:",
        participant.id
      );

      // Notify the component about existing participants (without stream yet)
      this.events?.onUserJoined({
        ...participant,
        stream: undefined, // Stream will come later via ontrack
      });

      // Create peer connection after notifying about participant
      await this.createPeerConnection(participant.id);
    }
  }

  private async createPeerConnection(participantId: string): Promise<void> {
    if (this.peerConnections.has(participantId)) {
      console.log("Peer connection already exists for:", participantId);
      return;
    }

    console.log("Creating peer connection for:", participantId);
    const peerConnection = new RTCPeerConnection(this.iceServers);
    this.peerConnections.set(participantId, peerConnection);

    // Add local stream tracks to the peer connection
    if (this.localStream) {
      console.log(
        "Adding local tracks to peer connection:",
        this.localStream.getTracks().length
      );
      this.localStream.getTracks().forEach((track) => {
        console.log(
          "Adding track:",
          track.kind,
          "to peer connection for:",
          participantId
        );
        peerConnection.addTrack(track, this.localStream!);
      });
    } else {
      console.log("No local stream available for peer connection");
    }

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.socket?.emit("ice-candidate", {
          to: participantId,
          candidate: event.candidate,
        });
      }
    };

    // Handle incoming tracks
    peerConnection.ontrack = (event) => {
      console.log(
        "🎥 Received remote track from:",
        participantId,
        "streams:",
        event.streams.length,
        "stream tracks:",
        event.streams[0]?.getTracks().length
      );

      // Get stored participant info or create default
      const participant = this.participants.get(participantId) || {
        id: participantId,
        name: participantId,
        isHost: false,
        isMuted: false,
        isVideoOff: false,
      };

      // Update the participant with the stream
      const updatedParticipant = {
        ...participant,
        stream: event.streams[0],
      };

      // Store the updated participant info
      this.participants.set(participantId, updatedParticipant);

      // Notify the component about the updated participant
      this.events?.onUserJoined(updatedParticipant);

      console.log(
        "✅ Updated participant with stream:",
        participant.name,
        "stream tracks:",
        event.streams[0]?.getTracks().length
      );
    };

    // Create and send offer
    try {
      console.log("Creating offer for:", participantId);
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      console.log(
        "Offer created and set as local description for:",
        participantId
      );

      this.socket?.emit("offer", {
        to: participantId,
        offer: offer,
      });
      console.log("Offer sent to:", participantId);
    } catch (error) {
      console.error("Error creating offer:", error);
    }
  }

  private async handleOffer(
    from: string,
    offer: RTCSessionDescriptionInit
  ): Promise<void> {
    console.log("Handling offer from:", from);
    let peerConnection = this.peerConnections.get(from);
    if (!peerConnection) {
      console.log("Creating peer connection for incoming offer from:", from);
      await this.createPeerConnection(from);
      peerConnection = this.peerConnections.get(from);
    }

    if (peerConnection) {
      try {
        await peerConnection.setRemoteDescription(
          new RTCSessionDescription(offer)
        );
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);

        this.socket?.emit("answer", {
          to: from,
          answer: answer,
        });
      } catch (error) {
        console.error("Error handling offer:", error);
      }
    }
  }

  private async handleAnswer(
    from: string,
    answer: RTCSessionDescriptionInit
  ): Promise<void> {
    const peerConnection = this.peerConnections.get(from);
    if (peerConnection) {
      try {
        // Check if we're in the right state to set remote description
        if (peerConnection.signalingState === "have-local-offer") {
          await peerConnection.setRemoteDescription(
            new RTCSessionDescription(answer)
          );
        } else {
          console.log(
            "Ignoring answer - wrong signaling state:",
            peerConnection.signalingState
          );
        }
      } catch (error) {
        console.error("Error handling answer:", error);
      }
    }
  }

  private handleIceCandidate(
    from: string,
    candidate: RTCIceCandidateInit
  ): void {
    const peerConnection = this.peerConnections.get(from);
    if (peerConnection) {
      try {
        // Only add ICE candidate if connection is not closed
        if (
          peerConnection.connectionState !== "closed" &&
          peerConnection.iceConnectionState !== "closed"
        ) {
          peerConnection
            .addIceCandidate(new RTCIceCandidate(candidate))
            .catch((error) => {
              console.warn("Failed to add ICE candidate:", error);
              // This is often not critical, so we just warn instead of error
            });
        }
      } catch (error) {
        console.warn("Error adding ICE candidate:", error);
      }
    }
  }

  private removePeerConnection(participantId: string): void {
    const peerConnection = this.peerConnections.get(participantId);
    if (peerConnection) {
      peerConnection.close();
      this.peerConnections.delete(participantId);
    }
  }

  // Control methods
  toggleMute(isMuted: boolean): void {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !isMuted;
      }
    }
    this.socket?.emit("toggle-mute", { isMuted });
  }

  toggleVideo(isVideoOff: boolean): void {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !isVideoOff;
      }
    }
    this.socket?.emit("toggle-video", { isVideoOff });
  }

  async startScreenShare(): Promise<MediaStream> {
    try {
      this.screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      });

      // Replace video track in all peer connections
      const videoTrack = this.screenStream.getVideoTracks()[0];
      for (const [participantId, peerConnection] of Array.from(
        this.peerConnections.entries()
      )) {
        const sender = peerConnection
          .getSenders()
          .find((s: RTCRtpSender) => s.track?.kind === "video");
        if (sender) {
          sender.replaceTrack(videoTrack);
        }
      }

      this.socket?.emit("screen-share-started");
      return this.screenStream;
    } catch (error) {
      console.error("Error starting screen share:", error);
      throw error;
    }
  }

  stopScreenShare(): void {
    if (this.screenStream) {
      this.screenStream.getTracks().forEach((track) => track.stop());
      this.screenStream = null;

      // Restore original video track
      if (this.localStream) {
        const originalVideoTrack = this.localStream.getVideoTracks()[0];
        for (const [participantId, peerConnection] of Array.from(
          this.peerConnections.entries()
        )) {
          const sender = peerConnection
            .getSenders()
            .find((s: RTCRtpSender) => s.track?.kind === "video");
          if (sender && originalVideoTrack) {
            sender.replaceTrack(originalVideoTrack);
          }
        }
      }

      this.socket?.emit("screen-share-stopped");
    }
  }

  leaveRoom(): void {
    // Stop all media streams
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }

    if (this.screenStream) {
      this.screenStream.getTracks().forEach((track) => track.stop());
      this.screenStream = null;
    }

    // Close all peer connections
    for (const [participantId, peerConnection] of Array.from(
      this.peerConnections.entries()
    )) {
      peerConnection.close();
    }
    this.peerConnections.clear();
    this.participants.clear();

    // Disconnect socket
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    // Reset state
    this.roomId = null;
    this.userName = null;
    this.events = null;
    this.participants.clear();
  }

  getLocalStream(): MediaStream | null {
    console.log(
      "🔍 getLocalStream called, stream exists:",
      !!this.localStream,
      "tracks:",
      this.localStream?.getTracks().length
    );
    return this.localStream;
  }

  // Force refresh local stream for debugging
  async refreshLocalStream(): Promise<MediaStream | null> {
    console.log("🔄 Refreshing local stream...");
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
    }

    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      console.log(
        "✅ Local stream refreshed, tracks:",
        this.localStream.getTracks().length
      );
      return this.localStream;
    } catch (error) {
      console.error("❌ Failed to refresh local stream:", error);
      return null;
    }
  }

  // Create a virtual camera using canvas for testing
  private createVirtualCamera(): MediaStream {
    const canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext("2d");

    if (ctx) {
      // Create an animated virtual camera
      let frame = 0;
      const animate = () => {
        // Clear canvas
        ctx.fillStyle = "#2c3e50";
        ctx.fillRect(0, 0, 640, 480);

        // Draw animated background
        ctx.fillStyle = `hsl(${(frame * 2) % 360}, 70%, 60%)`;
        ctx.fillRect(50, 50, 540, 380);

        // Draw text
        ctx.fillStyle = "white";
        ctx.font = "bold 32px Arial";
        ctx.textAlign = "center";
        ctx.fillText("Virtual Camera", 320, 200);
        ctx.fillText(this.userName || "User", 320, 250);
        ctx.fillText(`Frame: ${frame}`, 320, 300);

        // Draw animated circle
        ctx.fillStyle = "#e74c3c";
        ctx.beginPath();
        ctx.arc(320 + Math.sin(frame * 0.1) * 100, 350, 20, 0, 2 * Math.PI);
        ctx.fill();

        frame++;
        requestAnimationFrame(animate);
      };
      animate();
    }

    return canvas.captureStream(30); // 30 FPS
  }

  // Debug method to check current state
  debugState(): void {
    console.log("🔍 WebRTC Service Debug State:");
    console.log("📊 Participants stored:", this.participants.size);
    this.participants.forEach((participant, id) => {
      console.log(
        `  - ${
          participant.name
        } (${id}): stream=${!!participant.stream}, tracks=${
          participant.stream?.getTracks().length || 0
        }`
      );
    });
    console.log("🔗 Peer connections:", this.peerConnections.size);
    this.peerConnections.forEach((connection, id) => {
      console.log(
        `  - ${id}: signalingState=${connection.signalingState}, connectionState=${connection.connectionState}`
      );
    });
    console.log(
      "🎥 Local stream:",
      !!this.localStream,
      "tracks:",
      this.localStream?.getTracks().length
    );
  }

  getScreenStream(): MediaStream | null {
    return this.screenStream;
  }
}

export default new WebRTCService();
