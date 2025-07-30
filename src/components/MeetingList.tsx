import React, { useState } from "react";
import { format } from "date-fns";
import { Meeting, Team } from "../types";
import { meetingRooms } from "../data/teams";
import "./MeetingList.css";
import { FaInfoCircle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

interface MeetingListProps {
  meetings: Meeting[];
  teams: Team[];
  onDeleteMeeting: (meetingId: string) => void;
  onEditMeeting?: (id: string, data: Partial<Meeting>) => Promise<void>;
}

const MeetingList: React.FC<MeetingListProps> = ({
  meetings,
  teams,
  onDeleteMeeting,
  onEditMeeting,
}) => {
  const [sortBy, setSortBy] = useState<"date" | "team" | "title">("date");
  const [filterTeam, setFilterTeam] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<"all" | "scheduled">(
    "scheduled"
  );
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState<any>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [meetingToCancel, setMeetingToCancel] = useState<Meeting | null>(null);

  const navigate = useNavigate();

  const sortMeetings = (meetingsToSort: Meeting[]) => {
    return [...meetingsToSort].sort((a, b) => {
      switch (sortBy) {
        case "date":
          const dateA = new Date(a.startTime);
          const dateB = new Date(b.startTime);
          if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
            return 0;
          }
          return dateA.getTime() - dateB.getTime();
        case "team":
          const teamA = teams.find((t: Team) => t.id === a.teamId)?.name || "";
          const teamB = teams.find((t: Team) => t.id === b.teamId)?.name || "";
          return teamA.localeCompare(teamB);
        case "title":
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });
  };

  const filterMeetings = (meetingsToFilter: Meeting[]) => {
    return meetingsToFilter.filter((meeting) => {
      const matchesTeam = !filterTeam || meeting.teamId === filterTeam;
      const matchesSearch =
        !searchTerm ||
        meeting.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        meeting.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "scheduled" && meeting.status === "scheduled");
      return matchesTeam && matchesSearch && matchesStatus;
    });
  };

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

  const handleDelete = (meetingId: string) => {
    if (window.confirm("Are you sure you want to delete this meeting?")) {
      onDeleteMeeting(meetingId);
    }
  };

  const formatDateTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return "Invalid date";
      }

      // Extract the original time from the ISO string without timezone conversion
      const isoString = date.toISOString();
      const timePart = isoString.split("T")[1].split(".")[0]; // Get HH:MM:SS
      const [hours, minutes] = timePart.split(":").map(Number);

      // Format the date parts
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();

      // Convert to 12-hour format
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

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return "Invalid time";
      }
      return format(date, "h:mm a");
    } catch (error) {
      return "Invalid time";
    }
  };

  const filteredAndSortedMeetings = sortMeetings(filterMeetings(meetings));

  const openViewModal = (meeting: Meeting) => {
    setSelectedMeeting(meeting);
    setShowViewModal(true);
  };
  const closeViewModal = () => {
    setShowViewModal(false);
    setSelectedMeeting(null);
  };

  const openEditModal = (meeting: Meeting) => {
    // Format time for HTML time input (HH:mm)
    const formatTimeForInput = (dateString: string) => {
      try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return "09:00";
        return date.toTimeString().slice(0, 5); // "HH:mm"
      } catch (error) {
        return "09:00";
      }
    };

    setEditForm({
      title: meeting.title,
      teamId:
        typeof meeting.teamId === "object" && meeting.teamId !== null
          ? meeting.teamId._id
          : meeting.teamId,
      room: meeting.room,
      startTime: formatTimeForInput(meeting.startTime),
      endTime: formatTimeForInput(meeting.endTime),
      description: meeting.description,
      attendees: meeting.attendees || [],
    });
    setSelectedMeeting(meeting);
    setShowEditModal(true);
    setEditError(null);
  };
  const closeEditModal = () => {
    setShowEditModal(false);
    setSelectedMeeting(null);
    setEditForm(null);
    setEditError(null);
  };
  const handleEditChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMeeting) return;
    setEditLoading(true);
    setEditError(null);
    try {
      if (onEditMeeting) {
        // Get the date from the original meeting
        const originalDate = new Date(selectedMeeting.startTime);
        const dateString = originalDate.toISOString().slice(0, 10);

        // Create new start and end times
        const startTime = new Date(`${dateString}T${editForm.startTime}:00`);
        const endTime = new Date(`${dateString}T${editForm.endTime}:00`);

        if (endTime <= startTime) {
          setEditError("End time must be after start time.");
          setEditLoading(false);
          return;
        }

        const meetingId = selectedMeeting.id || selectedMeeting._id;
        if (!meetingId) {
          setEditError("Meeting ID is missing.");
          setEditLoading(false);
          return;
        }

        await onEditMeeting(meetingId, {
          title: editForm.title,
          teamId: editForm.teamId,
          room: editForm.room,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          description: editForm.description,
          attendees: editForm.attendees || [],
        });
        closeEditModal();
      }
    } catch (err: any) {
      setEditError(err.message || "Failed to update meeting.");
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <div className="meeting-list">
      <div className="list-header">
        <h2>Meeting List</h2>
        <p>View and manage scheduled meetings</p>
      </div>

      <div className="controls">
        <div className="search-container">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search meetings..."
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
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as "all" | "scheduled")
            }
            className="filter-select"
          >
            <option value="all">All Meetings</option>
            <option value="scheduled">Scheduled Only</option>
          </select>
          <button
            onClick={() => navigate("/past-meetings")}
            style={{
              background: "linear-gradient(135deg, #667eea, #764ba2)",
              color: "white",
              border: "none",
              borderRadius: "6px",
              padding: "8px 16px",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
            title="View Past Meetings History"
          >
            📅 Past Meetings
          </button>
        </div>
      </div>

      <div className="meeting-list-single-line">
        {filteredAndSortedMeetings.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📅</div>
            <h3>No meetings found</h3>
            <p>
              Try adjusting your search criteria or filters to find the meetings
              you're looking for.
            </p>
          </div>
        ) : (
          <ul className="meeting-list-ul">
            {filteredAndSortedMeetings.map((meeting, idx) => {
              const team = getTeamInfo(meeting.teamId);
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
                  }}
                >
                  <div>
                    {/* Remove the meeting title */}
                    <span style={{ fontWeight: 700, color: "#333" }}>
                      Team:
                    </span>
                    <span
                      style={{ marginLeft: 6, color: "#666", fontWeight: 500 }}
                    >
                      {team?.name || "Unknown"}
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
                      style={{ marginLeft: 16, fontWeight: 700, color: "#333" }}
                    >
                      Booked by:
                    </span>
                    <span
                      style={{ marginLeft: 4, color: "#666", fontWeight: 500 }}
                    >
                      {meeting.createdBy?.name || "Unknown"}
                    </span>
                  </div>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 12 }}
                  >
                    {meeting.status === "scheduled" && (
                      <button
                        onClick={() => {
                          setMeetingToCancel(meeting);
                          setShowCancelModal(true);
                        }}
                        style={{
                          background: "#dc2626",
                          color: "#fff",
                          border: "none",
                          borderRadius: 6,
                          padding: "6px 12px",
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                        title="Cancel Meeting"
                      >
                        Cancel
                      </button>
                    )}

                    <span
                      style={{
                        cursor: "pointer",
                        color: "#2563eb",
                        fontSize: 20,
                        display: "flex",
                        alignItems: "center",
                      }}
                      title="View Details"
                      onClick={() =>
                        navigate(`/meeting/${meeting.id || meeting._id}`)
                      }
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

      {/* Custom Cancel Confirmation Modal */}
      {showCancelModal && (
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
              borderRadius: "8px",
              padding: "24px",
              maxWidth: "400px",
              width: "90%",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
            }}
          >
            <h3
              style={{
                margin: "0 0 16px 0",
                fontSize: "18px",
                fontWeight: "600",
                color: "#1f2937",
              }}
            >
              Cancel Meeting
            </h3>
            <p
              style={{
                margin: "0 0 20px 0",
                fontSize: "14px",
                color: "#6b7280",
                lineHeight: "1.5",
              }}
            >
              Are you sure you want to cancel this meeting? You will need to
              provide a reason.
            </p>
            <div
              style={{
                display: "flex",
                gap: "12px",
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={() => setShowCancelModal(false)}
                style={{
                  background: "#f3f4f6",
                  color: "#374151",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  padding: "8px 16px",
                  fontSize: "14px",
                  fontWeight: "500",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (meetingToCancel) {
                    navigate(
                      `/meeting/${meetingToCancel.id || meetingToCancel._id}`
                    );
                  }
                  setShowCancelModal(false);
                }}
                style={{
                  background: "#dc2626",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  padding: "8px 16px",
                  fontSize: "14px",
                  fontWeight: "500",
                  cursor: "pointer",
                }}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeetingList;
