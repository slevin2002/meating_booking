import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import webrtcService, {
  Participant,
  WebRTCEvents,
} from "../services/webrtcService";
import "./VideoConference.css";

interface VideoConferenceProps {
  roomId?: string;
}

interface LocalParticipant {
  id: string;
  name: string;
  stream?: MediaStream;
  isHost: boolean;
  isMuted: boolean;
  isVideoOff: boolean;
}

const VideoConference: React.FC<VideoConferenceProps> = ({
  roomId: propRoomId,
}) => {
  const { roomId: urlRoomId } = useParams<{ roomId: string }>();
  const roomId = propRoomId || urlRoomId;

  const [participants, setParticipants] = useState<LocalParticipant[]>([]);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [roomName, setRoomName] = useState(roomId || "");
  const [isInRoom, setIsInRoom] = useState(false);
  const [userName, setUserName] = useState("");
  const [showJoinForm, setShowJoinForm] = useState(!roomId);
  const [error, setError] = useState<string | null>(null);
  const [videoElementReady, setVideoElementReady] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const screenShareRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());
  const navigate = useNavigate();

  // Handle local video display (consolidated for both create and join room)
  useEffect(() => {
    console.log("🎥 Local video useEffect triggered for:", userName);
    console.log("  - localStream exists:", !!localStream);
    console.log("  - localVideoRef exists:", !!localVideoRef.current);
    console.log("  - participants count:", participants.length);

    // Priority 1: Use localStream if available
    if (localStream && localVideoRef.current) {
      console.log(
        "🎥 Setting local stream in video element, tracks:",
        localStream.getTracks().length,
        "for user:",
        userName
      );

      // Set stream immediately
      localVideoRef.current.srcObject = localStream;

      // Force play local video immediately
      localVideoRef.current.play().catch((err) => {
        console.log("Local video play failed:", err);
        if (err.name === "NotAllowedError") {
          localVideoRef.current!.muted = true;
          localVideoRef.current!.play().then(() => {
            setTimeout(() => {
              localVideoRef.current!.muted = false;
              console.log("✅ Local video unmuted for:", userName);
            }, 100);
          });
        }
      });
    }
    // Priority 2: Use local participant stream if localStream is not available
    else {
      const localParticipant = participants.find((p) => p.id === "local");
      if (
        localParticipant &&
        localParticipant.stream &&
        localVideoRef.current
      ) {
        console.log(
          "🎥 Setting local participant stream, tracks:",
          localParticipant.stream.getTracks().length,
          "for user:",
          userName
        );
        localVideoRef.current.srcObject = localParticipant.stream;

        // Force play local video
        localVideoRef.current.play().catch((err) => {
          console.log("Local video play failed:", err);
          if (err.name === "NotAllowedError") {
            localVideoRef.current!.muted = true;
            localVideoRef.current!.play().then(() => {
              setTimeout(() => {
                localVideoRef.current!.muted = false;
              }, 100);
            });
          }
        });
      } else {
        console.log(
          "⚠️ No local stream or video element available for:",
          userName
        );
      }
    }
  }, [localStream, participants, userName]);

  // Handle local video element mounting
  useEffect(() => {
    if (videoElementReady && localStream) {
      console.log(
        "🎥 Video element ready, setting local stream for:",
        userName
      );
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStream;
        localVideoRef.current
          .play()
          .catch((err: any) =>
            console.log("🎥 Mounted video play failed:", err)
          );
      }
    }
  }, [videoElementReady, localStream, userName]);

  // Handle remote video streams - simplified to avoid conflicts
  useEffect(() => {
    participants.forEach((participant) => {
      if (participant.id !== "local" && participant.stream) {
        const videoElement = remoteVideoRefs.current.get(participant.id);
        if (videoElement && videoElement.srcObject !== participant.stream) {
          console.log(
            "Setting stream for participant:",
            participant.name,
            "stream tracks:",
            participant.stream.getTracks().length
          );

          // Ensure video element is properly configured
          videoElement.srcObject = participant.stream;
          videoElement.muted = false;
          videoElement.autoplay = true;
          videoElement.playsInline = true;

          // Force play the video with multiple attempts
          const attemptPlay = async (attempts = 0) => {
            try {
              await videoElement.play();
              console.log("Video playing for:", participant.name);
            } catch (err: any) {
              console.log(
                `Play attempt ${attempts + 1} failed for:`,
                participant.name,
                err
              );

              if (err.name === "NotAllowedError" && attempts < 3) {
                // Try muted play
                videoElement.muted = true;
                try {
                  await videoElement.play();
                  setTimeout(() => {
                    videoElement.muted = false;
                    console.log("Unmuted video for:", participant.name);
                  }, 100);
                } catch (mutedErr) {
                  console.log("Muted play failed, retrying...");
                  setTimeout(() => attemptPlay(attempts + 1), 500);
                }
              } else if (attempts < 3) {
                // Retry after delay
                setTimeout(() => attemptPlay(attempts + 1), 1000);
              }
            }
          };

          // Start play attempts
          setTimeout(() => attemptPlay(), 200);
        }
      }
    });
  }, [participants]);

  const generateRoomId = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const createRoom = () => {
    const newRoomId = generateRoomId();
    setRoomName(newRoomId);
    setShowJoinForm(false);
    console.log("🎯 Creating room:", newRoomId, "for user:", userName);
    joinRoom(newRoomId);
  };

  const joinRoom = async (room: string) => {
    console.log("🎯 joinRoom function called for:", userName, "room:", room);

    if (!userName.trim()) {
      setError("Please enter your name");
      return;
    }

    try {
      setError(null);
      console.log("🎯 Starting joinRoom process for:", userName, "room:", room);
      console.log("🎯 This is a CREATE or JOIN operation for:", userName);

      // Set up WebRTC event handlers
      const webrtcEvents: WebRTCEvents = {
        onUserJoined: (participant: Participant) => {
          console.log("onUserJoined called with:", participant);
          setParticipants((prev) => {
            // Check if participant already exists
            const existingIndex = prev.findIndex(
              (p) => p.id === participant.id
            );
            if (existingIndex >= 0) {
              // Update existing participant with stream
              console.log(
                "Updating existing participant:",
                participant.name,
                "with stream:",
                !!participant.stream
              );
              const updated = [...prev];
              updated[existingIndex] = {
                ...updated[existingIndex],
                stream: participant.stream,
                name: participant.name,
                isHost: participant.isHost,
              };
              return updated;
            } else {
              // Add new participant
              console.log(
                "Adding new participant:",
                participant.name,
                "with stream:",
                !!participant.stream
              );
              return [
                ...prev,
                {
                  id: participant.id,
                  name: participant.name,
                  stream: participant.stream,
                  isHost: participant.isHost,
                  isMuted: participant.isMuted || false,
                  isVideoOff: participant.isVideoOff || false,
                },
              ];
            }
          });
        },
        onUserLeft: (participantId: string) => {
          setParticipants((prev) => prev.filter((p) => p.id !== participantId));
        },
        onOffer: () => {}, // Handled by WebRTC service
        onAnswer: () => {}, // Handled by WebRTC service
        onIceCandidate: () => {}, // Handled by WebRTC service
        onParticipantMuteChanged: (participantId: string, isMuted: boolean) => {
          setParticipants((prev) =>
            prev.map((p) => (p.id === participantId ? { ...p, isMuted } : p))
          );
        },
        onParticipantVideoChanged: (
          participantId: string,
          isVideoOff: boolean
        ) => {
          setParticipants((prev) =>
            prev.map((p) => (p.id === participantId ? { ...p, isVideoOff } : p))
          );
        },
        onScreenShareStarted: (from: string, fromName: string) => {
          setIsScreenSharing(true);
        },
        onScreenShareStopped: (from: string) => {
          setIsScreenSharing(false);
        },
        onHostChanged: (newHost: string, newHostName: string) => {
          setParticipants((prev) =>
            prev.map((p) => ({
              ...p,
              isHost: p.id === newHost,
            }))
          );
        },
      };

      // Join the room using WebRTC service
      console.log("🔌 Calling webrtcService.joinRoom...");
      await webrtcService.joinRoom(room, userName, webrtcEvents);
      console.log("✅ webrtcService.joinRoom completed");

      // Get local stream from WebRTC service (same as create room)
      const stream = webrtcService.getLocalStream();
      console.log(
        "🎯 Got local stream from WebRTC service:",
        !!stream,
        "tracks:",
        stream?.getTracks().length,
        "for user:",
        userName
      );

      // Set local stream immediately (same as create room)
      if (stream && stream.getTracks().length > 0) {
        setLocalStream(stream);
        console.log("✅ Local stream set successfully for:", userName);
      } else {
        console.log(
          "❌ No camera/microphone available - creating test stream for:",
          userName
        );
        // Create a test video element for demonstration
        const canvas = document.createElement("canvas");
        canvas.width = 640;
        canvas.height = 480;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.fillStyle = "#3498db";
          ctx.fillRect(0, 0, 640, 480);
          ctx.fillStyle = "white";
          ctx.font = "48px Arial";
          ctx.textAlign = "center";
          ctx.fillText("Test Video", 320, 240);
          ctx.fillText(userName, 320, 300);
        }
        const testStream = canvas.captureStream();
        setLocalStream(testStream);
        console.log("✅ Test stream created and set for:", userName);
      }

      // Add local participant with the actual stream from WebRTC service (same as create room)
      const localParticipant: LocalParticipant = {
        id: "local",
        name: userName,
        stream: stream || undefined, // Use the stream we just got
        isHost: false, // Will be updated when we get room-joined event
        isMuted: false,
        isVideoOff: false,
      };

      console.log(
        "🎯 Setting up local participant with stream:",
        !!stream,
        "tracks:",
        stream?.getTracks().length,
        "participant name:",
        userName
      );

      // Set participants immediately (same as create room)
      setParticipants([localParticipant]);
      console.log("✅ Local participant added to state for:", userName);

      // FORCE local video display immediately (bypass useEffect)
      console.log("🎯 FORCING local video display for:", userName);
      console.log("🎯 About to force local video in 100ms for:", userName);
      setTimeout(() => {
        if (localVideoRef.current && stream) {
          console.log("🔄 FORCE setting local video for:", userName);
          localVideoRef.current.srcObject = stream;
          localVideoRef.current
            .play()
            .then(() =>
              console.log("✅ FORCE local video playing for:", userName)
            )
            .catch((err) => console.log("❌ FORCE local video failed:", err));
        } else {
          console.log("❌ Cannot FORCE local video - missing ref or stream");
          console.log("  - localVideoRef exists:", !!localVideoRef.current);
          console.log("  - stream exists:", !!stream);
        }
      }, 100);

      setIsInRoom(true);
      setRoomName(room);
    } catch (error) {
      console.error("Error joining room:", error);
      setError(error instanceof Error ? error.message : "Failed to join room");
    }
  };

  const leaveRoom = () => {
    webrtcService.leaveRoom();
    setLocalStream(null);
    setParticipants([]);
    setIsInRoom(false);
    setShowJoinForm(true);
    setError(null);
  };

  const toggleMute = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    webrtcService.toggleMute(newMutedState);
  };

  const toggleVideo = () => {
    const newVideoState = !isVideoOff;
    setIsVideoOff(newVideoState);
    webrtcService.toggleVideo(newVideoState);
  };

  const startScreenShare = async () => {
    try {
      const screenStream = await webrtcService.startScreenShare();

      if (screenShareRef.current) {
        screenShareRef.current.srcObject = screenStream;
      }

      setIsScreenSharing(true);

      // Handle screen share stop
      screenStream.getVideoTracks()[0].onended = () => {
        setIsScreenSharing(false);
        if (screenShareRef.current) {
          screenShareRef.current.srcObject = null;
        }
      };
    } catch (error) {
      console.error("Error starting screen share:", error);
      setError("Unable to start screen sharing");
    }
  };

  const stopScreenShare = () => {
    webrtcService.stopScreenShare();
    if (screenShareRef.current) {
      screenShareRef.current.srcObject = null;
    }
    setIsScreenSharing(false);
  };

  if (showJoinForm) {
    return (
      <div className="video-conference-container">
        <div className="join-form">
          <h2>🎥 Custom Video Conference</h2>
          <p>Create or join a video conference room</p>

          <div className="form-group">
            <label htmlFor="userName">Your Name:</label>
            <input
              type="text"
              id="userName"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Enter your name"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="roomId">Room ID (optional):</label>
            <input
              type="text"
              id="roomId"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="Enter room ID or leave empty to create new"
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="button-group">
            <button
              className="btn btn-primary"
              onClick={() => {
                console.log("🎯 Button clicked for:", userName);
                console.log("🎯 roomName:", roomName);
                console.log(
                  "🎯 Will call:",
                  roomName ? "joinRoom" : "createRoom"
                );
                if (roomName) {
                  joinRoom(roomName);
                } else {
                  createRoom();
                }
              }}
            >
              {roomName ? "Join Room" : "Create Room"}
            </button>
            <button className="btn btn-secondary" onClick={() => navigate("/")}>
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="video-conference-container">
      <div className="conference-header">
        <h2>🎥 Video Conference</h2>
        <div className="room-info">
          <span>Room: {roomName}</span>
          <span>Participants: {participants.length}</span>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="video-grid">
        {/* Debug info */}
        <div
          style={{
            gridColumn: "1 / -1",
            background: "#fff",
            padding: "10px",
            borderRadius: "8px",
            marginBottom: "10px",
          }}
        >
          <strong>Debug Info:</strong> Participants: {participants.length} |
          Remote participants:{" "}
          {participants.filter((p) => p.id !== "local").length} | Remote with
          streams:{" "}
          {participants.filter((p) => p.id !== "local" && p.stream).length}
        </div>

        {/* Local video */}
        <div className="video-item local-video">
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            controls={false}
            className={isVideoOff ? "video-off" : ""}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
              border: "3px solid #3498db",
              background: "#34495e",
              minHeight: "200px",
            }}
            onLoadedMetadata={() => {
              console.log(
                "🎥 Local video metadata loaded, videoWidth:",
                localVideoRef.current?.videoWidth,
                "videoHeight:",
                localVideoRef.current?.videoHeight,
                "for user:",
                userName
              );
              setVideoElementReady(true);
            }}
            onCanPlay={() => {
              console.log("🎥 Local video can play for:", userName);
            }}
            onPlay={() => {
              console.log("🎥 Local video started playing for:", userName);
            }}
            onError={(e) => {
              console.error("❌ Local video error for:", userName, e);
            }}
          />
          <div className="video-overlay">
            <span className="participant-name">{userName} (You)</span>
            {isMuted && <span className="mute-indicator">🔇</span>}
            {isVideoOff && <span className="video-off-indicator">📷</span>}
          </div>
        </div>

        {/* Screen share */}
        {isScreenSharing && (
          <div className="video-item screen-share">
            <video ref={screenShareRef} autoPlay playsInline />
            <div className="video-overlay">
              <span className="participant-name">Screen Share</span>
            </div>
          </div>
        )}

        {/* Remote participants will be added here */}
        {participants
          .filter((p) => p.id !== "local")
          .map((participant) => (
            <div
              key={`${participant.id}-${
                participant.stream ? "with-stream" : "no-stream"
              }-${Date.now()}`}
              className="video-item"
            >
              <video
                ref={(el) => {
                  if (el) {
                    remoteVideoRefs.current.set(participant.id, el);
                    console.log("Video element created for:", participant.name);

                    // Set stream immediately if available
                    if (participant.stream) {
                      console.log(
                        "Setting stream immediately for:",
                        participant.name,
                        "stream tracks:",
                        participant.stream.getTracks().length
                      );

                      // Ensure proper video element configuration for WebRTC
                      el.srcObject = participant.stream;
                      el.autoplay = true;
                      el.playsInline = true;
                      el.muted = false;
                      el.controls = false;
                      el.style.width = "100%";
                      el.style.height = "100%";
                      el.style.objectFit = "cover";

                      // Add event listeners for debugging
                      el.onloadedmetadata = () => {
                        console.log(
                          "Video metadata loaded for:",
                          participant.name,
                          "videoWidth:",
                          el.videoWidth,
                          "videoHeight:",
                          el.videoHeight
                        );

                        // Force video element to have dimensions if they're zero
                        if (el.videoWidth === 0 || el.videoHeight === 0) {
                          console.log(
                            "⚠️ Zero dimensions detected, forcing video element setup"
                          );
                          el.style.width = "100%";
                          el.style.height = "100%";
                          el.style.minHeight = "200px";
                          el.style.objectFit = "cover";
                          el.style.display = "block";

                          // Try to force play again
                          setTimeout(() => {
                            el.play().catch((err) =>
                              console.log("Force play failed:", err)
                            );
                          }, 100);
                        }
                      };
                      el.oncanplay = () => {
                        console.log("Video can play for:", participant.name);
                      };
                      el.onplay = () => {
                        console.log(
                          "Video started playing for:",
                          participant.name
                        );
                      };
                      el.onerror = (e) => {
                        console.error("Video error for:", participant.name, e);
                      };
                      el.onloadeddata = () => {
                        console.log("Video data loaded for:", participant.name);
                      };
                      el.onprogress = () => {
                        console.log("Video progress for:", participant.name);
                      };

                      // Use a more robust play strategy
                      const playVideo = async () => {
                        try {
                          // Force video element to have proper dimensions
                          el.style.width = "100%";
                          el.style.height = "100%";
                          el.style.minHeight = "200px";
                          el.style.objectFit = "cover";
                          el.style.display = "block";

                          await el.play();
                          console.log("Video playing for:", participant.name);

                          // Force a re-render after play
                          setTimeout(() => {
                            el.style.width = "100%";
                            el.style.height = "100%";
                            el.style.minHeight = "200px";
                            el.style.objectFit = "cover";
                            el.style.display = "block";
                          }, 100);
                        } catch (err: any) {
                          console.error(
                            "Failed to play immediately for:",
                            participant.name,
                            err
                          );
                          if (err.name === "NotAllowedError") {
                            try {
                              el.muted = true;
                              await el.play();
                              setTimeout(() => {
                                el.muted = false;
                                console.log(
                                  "Unmuted video for:",
                                  participant.name
                                );
                              }, 100);
                            } catch (mutedErr) {
                              console.error(
                                "Muted play also failed for:",
                                participant.name,
                                mutedErr
                              );
                            }
                          }
                        }
                      };

                      // Enhanced play strategy with multiple attempts
                      const attemptPlayWithRetry = async (attempts = 0) => {
                        try {
                          await playVideo();
                        } catch (err) {
                          console.log(
                            `Play attempt ${attempts + 1} failed for ${
                              participant.name
                            }:`,
                            err
                          );
                          if (attempts < 3) {
                            setTimeout(
                              () => attemptPlayWithRetry(attempts + 1),
                              500
                            );
                          }
                        }
                      };

                      // Delay play to avoid AbortError and try multiple times
                      setTimeout(() => attemptPlayWithRetry(), 100);

                      // Force video element to be visible and playing
                      setTimeout(() => {
                        if (el.videoWidth === 0 || el.videoHeight === 0) {
                          console.log(
                            "🔄 Force re-setting stream for:",
                            participant.name
                          );
                          el.srcObject = null;
                          setTimeout(() => {
                            el.srcObject = participant.stream || null;
                            el.play().catch((err) =>
                              console.log("Force play failed:", err)
                            );
                          }, 50);
                        }
                      }, 500);
                    }
                  } else {
                    remoteVideoRefs.current.delete(participant.id);
                  }
                }}
                autoPlay
                playsInline
                muted={false}
                controls={false}
                className={participant.isVideoOff ? "video-off" : ""}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                }}
              />
              <div className="video-overlay">
                <span className="participant-name">{participant.name}</span>
                <span style={{ fontSize: "12px", opacity: 0.8 }}>
                  Stream: {participant.stream ? "✅" : "❌"} | Video:{" "}
                  {participant.isVideoOff ? "❌" : "✅"}
                </span>
                {participant.isMuted && (
                  <span className="mute-indicator">🔇</span>
                )}
                {participant.isVideoOff && (
                  <span className="video-off-indicator">📷</span>
                )}
              </div>
            </div>
          ))}
      </div>

      <div className="conference-controls">
        {/* Debug button to force video playback */}
        <button
          className="control-btn"
          onClick={() => {
            console.log("Manual video playback test");
            participants.forEach((participant) => {
              if (participant.id !== "local" && participant.stream) {
                const videoElement = remoteVideoRefs.current.get(
                  participant.id
                );
                if (videoElement) {
                  console.log("Forcing play for:", participant.name);
                  videoElement
                    .play()
                    .catch((e) => console.error("Manual play failed:", e));
                }
              }
            });
          }}
          title="Debug: Force video playback"
          style={{ background: "#f39c12", color: "white" }}
        >
          🔧
        </button>

        {/* Debug button to refresh local stream */}
        <button
          className="control-btn"
          onClick={async () => {
            console.log("🔄 Manual local stream refresh");
            const newStream = await webrtcService.refreshLocalStream();
            if (newStream) {
              setLocalStream(newStream);
              console.log("✅ Local stream refreshed in component");
            }
          }}
          title="Debug: Refresh local stream"
          style={{ background: "#e74c3c", color: "white" }}
        >
          🔄
        </button>

        {/* Debug button to fix remote video */}
        <button
          className="control-btn"
          onClick={() => {
            console.log("🔧 Manual remote video fix");
            participants.forEach((participant) => {
              if (participant.id !== "local" && participant.stream) {
                const videoElement = remoteVideoRefs.current.get(
                  participant.id
                );
                if (videoElement) {
                  console.log("🔧 Fixing remote video for:", participant.name);
                  // Force re-set the stream with null first
                  videoElement.srcObject = null;
                  setTimeout(() => {
                    videoElement.srcObject = participant.stream || null;
                    videoElement.style.width = "100%";
                    videoElement.style.height = "100%";
                    videoElement.style.minHeight = "200px";
                    videoElement.style.objectFit = "cover";
                    videoElement.style.display = "block";

                    // Force play
                    videoElement
                      .play()
                      .catch((err) =>
                        console.log("Manual fix play failed:", err)
                      );
                  }, 100);
                }
              }
            });
          }}
          title="Debug: Fix remote video"
          style={{ background: "#9b59b6", color: "white" }}
        >
          🔧
        </button>

        {/* Debug button to check WebRTC state */}
        <button
          className="control-btn"
          onClick={() => {
            console.log("🔍 Checking WebRTC state...");
            webrtcService.debugState();
          }}
          title="Debug: Check WebRTC state"
          style={{ background: "#2c3e50", color: "white" }}
        >
          🔍
        </button>

        {/* Debug button to check local stream */}
        <button
          className="control-btn"
          onClick={() => {
            console.log("🎥 Local Stream Debug Info:");
            console.log("  - Local stream exists:", !!localStream);
            console.log(
              "  - Local stream tracks:",
              localStream?.getTracks().length
            );
            console.log("  - Video element exists:", !!localVideoRef.current);
            console.log(
              "  - Video element srcObject:",
              !!localVideoRef.current?.srcObject
            );
            console.log("  - Current user:", userName);
            console.log(
              "  - Local participant in state:",
              participants.find((p) => p.id === "local")
            );
          }}
          title="Debug: Check local stream"
          style={{ background: "#16a085", color: "white" }}
        >
          🎥
        </button>

        {/* Mobile debug button */}
        <button
          className="control-btn"
          onClick={() => {
            console.log("📱 Mobile Debug Info:");
            console.log("  - User Agent:", navigator.userAgent);
            console.log("  - Platform:", navigator.platform);
            console.log("  - Connection:", (navigator as any).connection);
            console.log("  - WebRTC Support:", !!navigator.mediaDevices);
            webrtcService.debugState();
          }}
          title="Debug: Mobile info"
          style={{ background: "#e67e22", color: "white" }}
        >
          📱
        </button>

        {/* Local video debug button */}
        <button
          className="control-btn"
          onClick={() => {
            console.log("🎥 Local Video Debug:");
            console.log("  - localVideoRef exists:", !!localVideoRef.current);
            console.log("  - localStream exists:", !!localStream);
            console.log(
              "  - localStream tracks:",
              localStream?.getTracks().length
            );
            console.log("  - Current user:", userName);
            console.log("  - Participants count:", participants.length);

            const localParticipant = participants.find((p) => p.id === "local");
            console.log("  - Local participant exists:", !!localParticipant);
            console.log(
              "  - Local participant stream:",
              !!localParticipant?.stream
            );

            if (localVideoRef.current && localStream) {
              console.log("🔄 Manually setting local video...");
              localVideoRef.current.srcObject = localStream;
              localVideoRef.current
                .play()
                .then(() =>
                  console.log("✅ Manual local video play successful")
                )
                .catch((err) =>
                  console.log("❌ Manual local video play failed:", err)
                );
            } else if (localVideoRef.current && localParticipant?.stream) {
              console.log("🔄 Manually setting local participant video...");
              localVideoRef.current.srcObject = localParticipant.stream;
              localVideoRef.current
                .play()
                .then(() =>
                  console.log(
                    "✅ Manual local participant video play successful"
                  )
                )
                .catch((err) =>
                  console.log(
                    "❌ Manual local participant video play failed:",
                    err
                  )
                );
            }
          }}
          title="Debug: Local video"
          style={{ background: "#8e44ad", color: "white" }}
        >
          🎥
        </button>

        <button
          className={`control-btn ${isMuted ? "active" : ""}`}
          onClick={toggleMute}
          title={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? "🔇" : "🎤"}
        </button>

        <button
          className={`control-btn ${isVideoOff ? "active" : ""}`}
          onClick={toggleVideo}
          title={isVideoOff ? "Turn on video" : "Turn off video"}
        >
          {isVideoOff ? "📷" : "📹"}
        </button>

        <button
          className={`control-btn ${isScreenSharing ? "active" : ""}`}
          onClick={isScreenSharing ? stopScreenShare : startScreenShare}
          title={isScreenSharing ? "Stop sharing" : "Share screen"}
        >
          {isScreenSharing ? "🖥️" : "🖥️"}
        </button>

        <button
          className="control-btn leave-btn"
          onClick={leaveRoom}
          title="Leave room"
        >
          ❌
        </button>
      </div>

      <div className="conference-info">
        <p>
          🔗 Share this room ID with others: <strong>{roomName}</strong>
        </p>
        <p>📱 This is a custom video conferencing solution built with WebRTC</p>
      </div>
    </div>
  );
};

export default VideoConference;
