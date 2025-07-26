import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaInfoCircle, FaExclamationTriangle } from "react-icons/fa";
import "./MeetingList.css";

interface CancelledMeeting {
  _id: string;
  title: string;
  teamId: {
    _id: string;
    name: string;
    color: string;
  };
  teamName: string;
  startTime: string;
  endTime: string;
  room: string;
  attendees: string[];
  status: string;
  cancelReason: string;
  createdAt: string;
  cancelledAt?: string;
}

const CancelledMeetings: React.FC = () => {
  const [cancelledMeetings, setCancelledMeetings] = useState<
    CancelledMeeting[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTeam, setFilterTeam] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "team" | "title">("date");
  const navigate = useNavigate();

  useEffect(() => {
    fetchCancelledMeetings();
  }, []);

  const fetchCancelledMeetings = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        "http://localhost:5000/api/meetings?status=cancelled"
      );
      if (response.ok) {
        const data = await response.json();
        setCancelledMeetings(data.meetings || data);
      } else {
        setError("Failed to fetch cancelled meetings");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return "Invalid date";
      }

      const isoString = date.toISOString();
      const timePart = isoString.split("T")[1].split(".")[0];
      const [hours, minutes] = timePart.split(":").map(Number);

      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();

      const ampm = hours >= 12 ? "PM" : "AM";
      const displayHours = hours % 12 || 12;
      const displayMinutes = minutes.toString().padStart(2, "0");

      const monthNames = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];

      return `${
        monthNames[month - 1]
      } ${day}, ${year} ${displayHours}:${displayMinutes} ${ampm}`;
    } catch (error) {
      return "Invalid date";
    }
  };

  const sortMeetings = (meetings: CancelledMeeting[]) => {
    return [...meetings].sort((a, b) => {
      switch (sortBy) {
        case "date":
          const dateA = new Date(a.startTime);
          const dateB = new Date(b.startTime);
          return dateB.getTime() - dateA.getTime(); // Most recent first
        case "team":
          return a.teamName.localeCompare(b.teamName);
        case "title":
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });
  };

  const filterMeetings = (meetings: CancelledMeeting[]) => {
    return meetings.filter((meeting) => {
      const matchesSearch =
        !searchTerm ||
        meeting.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        meeting.teamName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        meeting.cancelReason.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesTeam = !filterTeam || meeting.teamId._id === filterTeam;

      return matchesSearch && matchesTeam;
    });
  };

  const filteredAndSortedMeetings = sortMeetings(
    filterMeetings(cancelledMeetings)
  );

  if (loading) {
    return (
      <div className="meeting-list">
        <div className="placeholder-content">
          <div className="loading">Loading cancelled meetings...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="meeting-list">
        <div className="placeholder-content">
          <div className="error">
            <h3>Error</h3>
            <p>{error}</p>
            <button onClick={fetchCancelledMeetings} className="retry-btn">
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="meeting-list">
      <div className="list-header">
        <h2>Cancelled Meetings</h2>
        <p>View all cancelled meetings and their reasons</p>
      </div>

      <div className="controls">
        <div className="search-container">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search cancelled meetings..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="filters">
          <select
            value={sortBy}
            onChange={(e) =>
              setSortBy(e.target.value as "date" | "team" | "title")
            }
            className="filter-select"
          >
            <option value="date">Sort by Date</option>
            <option value="team">Sort by Team</option>
            <option value="title">Sort by Title</option>
          </select>
        </div>
      </div>

      <div className="meeting-list-single-line">
        {filteredAndSortedMeetings.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📅</div>
            <h3>No cancelled meetings found</h3>
            <p>
              {cancelledMeetings.length === 0
                ? "No meetings have been cancelled yet."
                : "Try adjusting your search criteria to find the cancelled meetings you're looking for."}
            </p>
          </div>
        ) : (
          <ul className="meeting-list-ul">
            {filteredAndSortedMeetings.map((meeting) => {
              const team = meeting.teamId;
              return (
                <li
                  key={meeting._id}
                  className="meeting-list-li"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "1rem",
                    borderBottom: "1px solid #eee",
                    backgroundColor: "#fef2f2",
                    borderLeft: "4px solid #dc2626",
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 700, color: "#333" }}>
                      Team:
                    </span>
                    <span
                      style={{ marginLeft: 6, color: "#666", fontWeight: 500 }}
                    >
                      {team?.name || meeting.teamName || "Unknown"}
                    </span>
                    <span
                      style={{ marginLeft: 16, fontWeight: 700, color: "#333" }}
                    >
                      Start:
                    </span>
                    <span
                      style={{ marginLeft: 4, color: "#666", fontWeight: 500 }}
                    >
                      {formatDateTime(meeting.startTime)}
                    </span>
                    <span
                      style={{ marginLeft: 12, fontWeight: 700, color: "#333" }}
                    >
                      End:
                    </span>
                    <span
                      style={{ marginLeft: 4, color: "#666", fontWeight: 500 }}
                    >
                      {formatDateTime(meeting.endTime)}
                    </span>
                    <span
                      style={{
                        marginLeft: 12,
                        fontWeight: 700,
                        color: "#dc2626",
                      }}
                    >
                      Reason:
                    </span>
                    <span
                      style={{
                        marginLeft: 4,
                        color: "#dc2626",
                        fontWeight: 500,
                        maxWidth: "200px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                      title={meeting.cancelReason}
                    >
                      {meeting.cancelReason}
                    </span>
                  </div>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 12 }}
                  >
                    <span
                      style={{
                        color: "#dc2626",
                        fontSize: 12,
                        fontWeight: 600,
                        padding: "4px 8px",
                        backgroundColor: "#fecaca",
                        borderRadius: "12px",
                        border: "1px solid #fca5a5",
                      }}
                    >
                      ❌ Cancelled
                    </span>
                    <span
                      style={{
                        cursor: "pointer",
                        color: "#2563eb",
                        fontSize: 20,
                        display: "flex",
                        alignItems: "center",
                      }}
                      title="View Details"
                      onClick={() => navigate(`/meeting/${meeting._id}`)}
                    >
                      <FaInfoCircle />
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default CancelledMeetings;
