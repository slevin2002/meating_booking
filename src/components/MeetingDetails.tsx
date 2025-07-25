import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const MeetingDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [meeting, setMeeting] = useState<any>(null);

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
      </div>
    </div>
  );
};

export default MeetingDetails;
