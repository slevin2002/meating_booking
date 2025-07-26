import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaTimes, FaExclamationTriangle } from "react-icons/fa";

const MeetingDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [meeting, setMeeting] = useState<any>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    fetch(`http://localhost:5000/api/meetings/${id}`)
      .then((res) => res.json())
      .then((data) => setMeeting(data));
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
      const response = await fetch(
        `http://localhost:5000/api/meetings/${id}/cancel`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ cancelReason: cancelReason.trim() }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setMeeting(data.meeting);
        setShowCancelModal(false);
        setCancelReason("");
        setShowSuccessModal(true);
      } else {
        const errorData = await response.json();
        setCancelError(errorData.error || "Failed to cancel meeting");
      }
    } catch (error) {
      setCancelError("Network error. Please try again.");
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
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: "12px",
              padding: "24px",
              maxWidth: "400px",
              width: "90%",
              textAlign: "center",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
            }}
          >
            <div
              style={{
                width: "60px",
                height: "60px",
                borderRadius: "50%",
                background: "#10b981",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px auto",
                fontSize: "24px",
              }}
            >
              ✅
            </div>
            <h3
              style={{
                margin: "0 0 12px 0",
                fontSize: "18px",
                fontWeight: "600",
                color: "#1f2937",
              }}
            >
              Meeting Cancelled Successfully!
            </h3>
            <p
              style={{
                margin: "0 0 20px 0",
                fontSize: "14px",
                color: "#6b7280",
                lineHeight: "1.5",
              }}
            >
              The meeting has been cancelled and the reason has been recorded.
            </p>
            <button
              onClick={() => {
                setShowSuccessModal(false);
                navigate(-1);
              }}
              style={{
                background: "#10b981",
                color: "white",
                border: "none",
                borderRadius: "6px",
                padding: "10px 20px",
                fontSize: "14px",
                fontWeight: "500",
                cursor: "pointer",
                minWidth: "100px",
              }}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeetingDetails;
