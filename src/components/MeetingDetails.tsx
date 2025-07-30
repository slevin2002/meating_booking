import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaTimes, FaExclamationTriangle } from "react-icons/fa";
import { API_CONFIG } from "../config/api";
import { meetingAPI } from "../services/api";
import { useAuth } from "../contexts/AuthContext";

const MeetingDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [meeting, setMeeting] = useState<any>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const fetchMeeting = async () => {
      try {
        const response = await meetingAPI.getById(id!);
        setMeeting(response);
      } catch (error) {
        console.error("Failed to fetch meeting:", error);
      }
    };

    fetchMeeting();
  }, [id]);

  if (!meeting)
    return <div style={{ padding: 32, color: "#555" }}>Loading...</div>;

  // Format time for display
  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString();
  };

  const handleCancelMeeting = async () => {
    if (!cancelReason.trim()) {
      setCancelError("Please provide a reason for cancellation");
      return;
    }

    setCancelling(true);
    setCancelError(null);

    try {
      const response = await meetingAPI.cancel(id!, cancelReason.trim());

      if (response.meeting) {
        setMeeting(response.meeting);
        setShowCancelModal(false);
        setCancelReason("");

        // Add email notification information to success message
        let successMessage =
          "The meeting has been cancelled by " +
          (user?.name || "you") +
          " and the reason has been recorded in the system.";

        if (response.emailNotifications) {
          const { total, successful, failed } = response.emailNotifications;
          if (successful > 0) {
            successMessage += `\n\n📧 Cancellation notifications sent to ${successful} out of ${total} attendees.`;
            if (failed > 0) {
              successMessage += `\n⚠️ Failed to send ${failed} email(s).`;
            }
          } else if (failed > 0) {
            successMessage += `\n\n⚠️ Failed to send cancellation notifications to ${failed} attendees.`;
          }
        }

        // Store the success message in state or pass it to the modal
        setSuccessMessage(successMessage);
        setShowSuccessModal(true);
      } else {
        setCancelError(response.error || "Failed to cancel meeting");
      }
    } catch (error: any) {
      setCancelError(error.message || "Network error. Please try again.");
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #7f9cf5 0%, #a18cd1 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 0",
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 18,
          boxShadow: "0 8px 32px rgba(102, 126, 234, 0.18)",
          padding: "36px 32px 28px 32px",
          maxWidth: 420,
          width: "100%",
          margin: "0 16px",
          position: "relative",
        }}
      >
        <button
          onClick={() => navigate(-1)}
          style={{
            position: "absolute",
            top: 18,
            left: 18,
            background: "linear-gradient(135deg, #667eea, #764ba2)",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            padding: "6px 16px",
            fontWeight: 600,
            cursor: "pointer",
            fontSize: 14,
            boxShadow: "0 2px 8px rgba(102, 126, 234, 0.12)",
          }}
        >
          ← Back
        </button>
        <h2
          style={{
            textAlign: "center",
            marginBottom: 18,
            fontWeight: 800,
            fontSize: 28,
            background: "linear-gradient(135deg, #667eea, #764ba2)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          {meeting.title}
        </h2>
        <div style={{ marginBottom: 16 }}>
          <span style={{ color: "#888", fontWeight: 600 }}>Team:</span>
          <span style={{ marginLeft: 8, color: "#333", fontWeight: 500 }}>
            {meeting.teamName || meeting.teamId?.name}
          </span>
        </div>
        <div style={{ marginBottom: 16 }}>
          <span style={{ color: "#888", fontWeight: 600 }}>Time:</span>
          <span style={{ marginLeft: 8, color: "#333", fontWeight: 500 }}>
            {formatTime(meeting.startTime)} - {formatTime(meeting.endTime)}
          </span>
        </div>
        <div style={{ marginBottom: 16 }}>
          <span style={{ color: "#888", fontWeight: 600 }}>Room:</span>
          <span style={{ marginLeft: 8, color: "#333", fontWeight: 500 }}>
            {meeting.room}
          </span>
        </div>
        <div style={{ marginBottom: 16 }}>
          <span style={{ color: "#888", fontWeight: 600 }}>Attendees:</span>
          <span style={{ marginLeft: 8, color: "#333", fontWeight: 500 }}>
            {(meeting.attendees || []).join(", ")}
          </span>
        </div>
        {meeting.description && (
          <div style={{ marginBottom: 16 }}>
            <span style={{ color: "#888", fontWeight: 600 }}>Description:</span>
            <span style={{ marginLeft: 8, color: "#333", fontWeight: 500 }}>
              {meeting.description}
            </span>
          </div>
        )}
        <div style={{ marginBottom: 16 }}>
          <span style={{ color: "#888", fontWeight: 600 }}>Status:</span>
          <span style={{ marginLeft: 8, color: "#333", fontWeight: 500 }}>
            {meeting.status}
          </span>
        </div>
        <div style={{ marginBottom: 0 }}>
          <span style={{ color: "#888", fontWeight: 600 }}>Created At:</span>
          <span style={{ marginLeft: 8, color: "#333", fontWeight: 500 }}>
            {formatTime(meeting.createdAt)}
          </span>
        </div>
        {meeting.createdBy && (
          <div style={{ marginBottom: 0 }}>
            <span style={{ color: "#888", fontWeight: 600 }}>Booked by:</span>
            <span style={{ marginLeft: 8, color: "#333", fontWeight: 500 }}>
              {meeting.createdBy.name}
            </span>
          </div>
        )}

        {meeting.cancelledBy && (
          <div style={{ marginBottom: 0 }}>
            <span style={{ color: "#dc2626", fontWeight: 600 }}>
              Cancelled by:
            </span>
            <span style={{ marginLeft: 8, color: "#dc2626", fontWeight: 500 }}>
              {meeting.cancelledBy.name}
            </span>
          </div>
        )}

        {meeting.cancelReason && (
          <div style={{ marginTop: 16, marginBottom: 16 }}>
            <span style={{ color: "#dc2626", fontWeight: 600 }}>
              Cancel Reason:
            </span>
            <span style={{ marginLeft: 8, color: "#dc2626", fontWeight: 500 }}>
              {meeting.cancelReason}
            </span>
          </div>
        )}

        {meeting.status === "scheduled" && (
          <button
            onClick={() => setShowCancelModal(true)}
            style={{
              background: "linear-gradient(135deg, #dc2626, #b91c1c)",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "12px 24px",
              fontWeight: 600,
              cursor: "pointer",
              fontSize: 14,
              marginTop: 20,
              width: "100%",
              boxShadow: "0 2px 8px rgba(220, 38, 38, 0.12)",
            }}
          >
            <FaExclamationTriangle style={{ marginRight: 8 }} />
            Cancel Meeting
          </button>
        )}
      </div>

      {/* Cancel Meeting Modal */}
      {showCancelModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              padding: "24px",
              maxWidth: 400,
              width: "90%",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
            }}
          >
            <h3 style={{ marginBottom: 16, color: "#dc2626", fontWeight: 600 }}>
              Cancel Meeting
            </h3>
            <p style={{ marginBottom: 16, color: "#666" }}>
              Please provide a reason for cancelling this meeting. This
              information will be recorded.
            </p>

            {cancelError && (
              <div
                style={{
                  color: "#dc2626",
                  fontSize: 14,
                  marginBottom: 16,
                  padding: "8px 12px",
                  backgroundColor: "#fef2f2",
                  border: "1px solid #fecaca",
                  borderRadius: 6,
                }}
              >
                {cancelError}
              </div>
            )}

            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Enter cancellation reason (required)"
              style={{
                width: "100%",
                minHeight: 100,
                padding: "12px",
                border: "1px solid #d1d5db",
                borderRadius: 6,
                fontSize: 14,
                resize: "vertical",
                marginBottom: 16,
              }}
              maxLength={500}
            />
            <div style={{ fontSize: 12, color: "#666", marginBottom: 16 }}>
              {cancelReason.length}/500 characters
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelReason("");
                  setCancelError(null);
                }}
                style={{
                  flex: 1,
                  padding: "10px 16px",
                  border: "1px solid #d1d5db",
                  borderRadius: 6,
                  background: "#fff",
                  color: "#666",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
                disabled={cancelling}
              >
                Cancel
              </button>
              <button
                onClick={handleCancelMeeting}
                style={{
                  flex: 1,
                  padding: "10px 16px",
                  border: "none",
                  borderRadius: 6,
                  background: "#dc2626",
                  color: "#fff",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
                disabled={cancelling || !cancelReason.trim()}
              >
                {cancelling ? "Cancelling..." : "Confirm Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            animation: "fadeIn 0.3s ease-out",
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: "16px",
              padding: "32px",
              maxWidth: "450px",
              width: "90%",
              textAlign: "center",
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
              animation: "slideUp 0.4s ease-out",
              border: "1px solid rgba(16, 185, 129, 0.2)",
            }}
          >
            <div
              style={{
                width: "80px",
                height: "80px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #10b981, #059669)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 24px auto",
                fontSize: "32px",
                boxShadow: "0 8px 24px rgba(16, 185, 129, 0.3)",
                animation: "bounceIn 0.6s ease-out",
              }}
            >
              ✅
            </div>
            <h3
              style={{
                margin: "0 0 16px 0",
                fontSize: "24px",
                fontWeight: "700",
                color: "#1f2937",
                background: "linear-gradient(135deg, #10b981, #059669)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Meeting Cancelled Successfully!
            </h3>
            <div
              style={{
                margin: "0 0 24px 0",
                fontSize: "16px",
                color: "#6b7280",
                lineHeight: "1.6",
                textAlign: "left",
                whiteSpace: "pre-line",
              }}
            >
              {successMessage ||
                `The meeting has been cancelled by ${
                  user?.name || "you"
                } and the reason has been recorded in the system.`}
            </div>
            <div
              style={{
                display: "flex",
                gap: "12px",
                justifyContent: "center",
              }}
            >
              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  navigate(-1);
                }}
                style={{
                  background: "linear-gradient(135deg, #10b981, #059669)",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  padding: "12px 24px",
                  fontSize: "16px",
                  fontWeight: "600",
                  cursor: "pointer",
                  minWidth: "120px",
                  boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
                  transition: "all 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow =
                    "0 6px 16px rgba(16, 185, 129, 0.4)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow =
                    "0 4px 12px rgba(16, 185, 129, 0.3)";
                }}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          
          @keyframes slideUp {
            from { 
              opacity: 0; 
              transform: translateY(30px); 
            }
            to { 
              opacity: 1; 
              transform: translateY(0); 
            }
          }
          
          @keyframes bounceIn {
            0% { 
              transform: scale(0.3); 
              opacity: 0; 
            }
            50% { 
              transform: scale(1.05); 
            }
            70% { 
              transform: scale(0.9); 
            }
            100% { 
              transform: scale(1); 
              opacity: 1; 
            }
          }
        `}
      </style>
    </div>
  );
};

export default MeetingDetails;
