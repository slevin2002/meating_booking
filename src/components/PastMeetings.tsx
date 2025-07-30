import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Meeting, Team } from "../types";

interface PastMeetingsProps {
  meetings: Meeting[];
  teams: Team[];
}

const PastMeetings: React.FC<PastMeetingsProps> = ({ meetings, teams }) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTeam, setFilterTeam] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "team" | "title">("date");

  // Filter past meetings
  const now = new Date();
  const pastMeetings = meetings.filter((meeting) => {
    const meetingDate = new Date(meeting.startTime);
    return meetingDate < now;
  });

  // Get team info helper
  const getTeamInfo = (teamId: any) => {
    // If teamId is an object (populated), use its _id
    const id =
      typeof teamId === "object" && teamId !== null ? teamId._id : teamId;
    return teams.find(
      (team: Team) =>
        team.id === id ||
        team._id === id ||
        String(team.id) === String(id) ||
        String(team._id) === String(id)
    );
  };

  // Format time helper
  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } catch (error) {
      return "Invalid time";
    }
  };

  // Sort meetings
  const sortMeetings = (meetingsToSort: Meeting[]) => {
    switch (sortBy) {
      case "date":
        return [...meetingsToSort].sort(
          (a, b) =>
            new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
        );
      case "team":
        return [...meetingsToSort].sort((a, b) => {
          const teamA = getTeamInfo(a.teamId)?.name || "";
          const teamB = getTeamInfo(b.teamId)?.name || "";
          return teamA.localeCompare(teamB);
        });
      case "title":
        return [...meetingsToSort].sort((a, b) =>
          (a.title || "").localeCompare(b.title || "")
        );
      default:
        return meetingsToSort;
    }
  };

  // Filter meetings
  const filterMeetings = (meetingsToFilter: Meeting[]) => {
    return meetingsToFilter.filter((meeting) => {
      const matchesSearch =
        meeting.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getTeamInfo(meeting.teamId)
          ?.name?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        meeting.room?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesTeam =
        !filterTeam ||
        getTeamInfo(meeting.teamId)?.id === filterTeam ||
        getTeamInfo(meeting.teamId)?._id === filterTeam;

      return matchesSearch && matchesTeam;
    });
  };

  const filteredAndSortedMeetings = sortMeetings(filterMeetings(pastMeetings));

  return (
    <div className="meeting-list">
      <div className="list-header">
        <h2>📅 Past Meetings History</h2>
        <p>View all meetings that have been held in the past</p>
      </div>

      <div className="controls">
        <div className="search-container">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search past meetings..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="filters">
          <select
            value={filterTeam}
            onChange={(e) => setFilterTeam(e.target.value)}
            className="filter-select"
          >
            <option value="">All Teams</option>
            {teams.map((team: Team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
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
            <h3>No past meetings found</h3>
            <p>
              {pastMeetings.length === 0
                ? "No meetings have been held in the past."
                : "Try adjusting your search criteria or filters to find the meetings you're looking for."}
            </p>
          </div>
        ) : (
          <ul className="meeting-list-ul">
            {filteredAndSortedMeetings.map((meeting, idx) => {
              const team = getTeamInfo(meeting.teamId);
              const meetingDate = new Date(meeting.startTime);
              const isToday = meetingDate.toDateString() === now.toDateString();
              const isYesterday =
                meetingDate.toDateString() ===
                new Date(now.getTime() - 24 * 60 * 60 * 1000).toDateString();

              let dateLabel = "";
              if (isToday) {
                dateLabel = "Today";
              } else if (isYesterday) {
                dateLabel = "Yesterday";
              } else {
                dateLabel = meetingDate.toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                });
              }

              return (
                <li
                  key={meeting.id || meeting._id}
                  className="meeting-list-li"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "1rem",
                    borderBottom: "1px solid #eee",
                    background:
                      meeting.status === "cancelled" ? "#fef2f2" : "#fff",
                    borderLeft:
                      meeting.status === "cancelled"
                        ? "4px solid #dc2626"
                        : "4px solid #10b981",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "16px",
                        marginBottom: "4px",
                      }}
                    >
                      <span style={{ fontWeight: 700, color: "#333" }}>
                        {meeting.title}
                      </span>
                      {meeting.status === "cancelled" && (
                        <span
                          style={{
                            fontSize: "11px",
                            color: "#dc2626",
                            fontWeight: "600",
                            padding: "2px 6px",
                            backgroundColor: "#fecaca",
                            borderRadius: "4px",
                          }}
                        >
                          ❌ Cancelled
                        </span>
                      )}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "16px",
                        fontSize: "14px",
                        color: "#666",
                      }}
                    >
                      <span>
                        <span style={{ fontWeight: 600, color: "#333" }}>
                          Team:
                        </span>{" "}
                        {team?.name || "Unknown"}
                      </span>
                      <span>
                        <span style={{ fontWeight: 600, color: "#333" }}>
                          Date:
                        </span>{" "}
                        <span style={{ color: "#10b981", fontWeight: "600" }}>
                          {dateLabel}
                        </span>
                      </span>
                      <span>
                        <span style={{ fontWeight: 600, color: "#333" }}>
                          Time:
                        </span>{" "}
                        {formatTime(meeting.startTime)} -{" "}
                        {formatTime(meeting.endTime)}
                      </span>
                      <span>
                        <span style={{ fontWeight: 600, color: "#333" }}>
                          Room:
                        </span>{" "}
                        {meeting.room}
                      </span>
                      <span>
                        <span style={{ fontWeight: 600, color: "#333" }}>
                          Attendees:
                        </span>{" "}
                        {meeting.attendees?.length || 0}
                      </span>
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <button
                      onClick={() =>
                        navigate(`/meeting/${meeting.id || meeting._id}`)
                      }
                      style={{
                        background: "#667eea",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        padding: "6px 12px",
                        fontSize: "12px",
                        cursor: "pointer",
                        fontWeight: "500",
                      }}
                    >
                      View Details
                    </button>
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

export default PastMeetings;
