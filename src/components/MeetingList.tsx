import React, { useState } from "react";
import { format } from "date-fns";
import { Meeting, Team } from "../types";
import { meetingRooms } from "../data/teams";
import "./MeetingList.css";

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
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState<any>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [editLoading, setEditLoading] = useState(false);

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
      return matchesTeam && matchesSearch;
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
        <p>View and manage all scheduled meetings</p>
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
        </div>
      </div>

      <div className="meetings-container">
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
          filteredAndSortedMeetings.map((meeting) => {
            const team = getTeamInfo(meeting.teamId);
            return (
              <div key={meeting.id} className="meeting-item">
                <div className="meeting-header">
                  <h3 className="meeting-title">{meeting.title}</h3>
                  <span className={`meeting-status status-${meeting.status}`}>
                    {meeting.status}
                  </span>
                </div>

                <div className="meeting-details">
                  <div className="detail-item">
                    <span className="detail-icon">🕒</span>
                    <div className="detail-content">
                      <div className="detail-label">Time</div>
                      <div className="detail-value">
                        {formatDateTime(meeting.startTime)} -{" "}
                        {formatDateTime(meeting.endTime)}
                      </div>
                    </div>
                  </div>

                  <div className="detail-item">
                    <span className="detail-icon">🏢</span>
                    <div className="detail-content">
                      <div className="detail-label">Team</div>
                      <div className="detail-value">
                        {team?.name || "Unknown Team"}
                      </div>
                    </div>
                  </div>

                  <div className="detail-item">
                    <span className="detail-icon">📍</span>
                    <div className="detail-content">
                      <div className="detail-label">Room</div>
                      <div className="detail-value">{meeting.room}</div>
                    </div>
                  </div>

                  <div className="detail-item">
                    <span className="detail-icon">⏱️</span>
                    <div className="detail-content">
                      <div className="detail-label">Duration</div>
                      <div className="detail-value">
                        {meeting.duration} minutes
                      </div>
                    </div>
                  </div>
                </div>

                {meeting.description && (
                  <p className="meeting-description">{meeting.description}</p>
                )}

                <div className="meeting-attendees">
                  {meeting.attendees.slice(0, 3).map((attendee, index) => (
                    <div
                      key={index}
                      className="attendee-avatar"
                      title={attendee}
                    >
                      {attendee.charAt(0).toUpperCase()}
                    </div>
                  ))}
                  {meeting.attendees.length > 3 && (
                    <span className="more-attendees">
                      +{meeting.attendees.length - 3} more
                    </span>
                  )}
                </div>

                <div className="meeting-actions">
                  <button
                    className="action-btn btn-view"
                    onClick={() => openViewModal(meeting)}
                  >
                    <span>👁️</span> View
                  </button>
                  <button
                    className="action-btn btn-edit"
                    onClick={() => openEditModal(meeting)}
                  >
                    <span>✏️</span> Edit
                  </button>
                  {(meeting.id || meeting._id) && (
                    <button
                      onClick={() =>
                        handleDelete(meeting.id || meeting._id || "")
                      }
                      className="action-btn btn-delete"
                    >
                      <span>🗑️</span> Delete
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* View Modal */}
      {showViewModal && selectedMeeting && (
        <div className="modal-overlay" onClick={closeViewModal}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 600 }}
          >
            <div className="modal-header">
              <h2>{selectedMeeting.title}</h2>
              <button className="close-btn" onClick={closeViewModal}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="detail-row">
                <strong>Date:</strong>{" "}
                {formatDateTime(selectedMeeting.startTime).split(" ")[0]}
              </div>
              <div className="detail-row">
                <strong>Time:</strong> {formatTime(selectedMeeting.startTime)} -{" "}
                {formatTime(selectedMeeting.endTime)}
              </div>
              <div className="detail-row">
                <strong>Team:</strong>{" "}
                {getTeamInfo(selectedMeeting.teamId)?.name || "Unknown Team"}
              </div>
              <div className="detail-row">
                <strong>Room:</strong> {selectedMeeting.room}
              </div>
              <div className="detail-row">
                <strong>Status:</strong> {selectedMeeting.status}
              </div>
              <div className="detail-row">
                <strong>Duration:</strong> {selectedMeeting.duration} minutes
              </div>
              <div className="detail-row">
                <strong>Description:</strong> {selectedMeeting.description}
              </div>
              <div className="detail-row">
                <strong>Attendees:</strong>{" "}
                {selectedMeeting.attendees &&
                selectedMeeting.attendees.length > 0
                  ? selectedMeeting.attendees.join(", ")
                  : "None"}
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={closeViewModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedMeeting && editForm && (
        <div className="modal-overlay" onClick={closeEditModal}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 600 }}
          >
            <div className="modal-header">
              <h2>Edit Meeting</h2>
              <button className="close-btn" onClick={closeEditModal}>
                ×
              </button>
            </div>
            <form className="modal-body" onSubmit={handleEditSubmit}>
              <div className="form-group">
                <label>Title</label>
                <input
                  name="title"
                  value={editForm.title}
                  onChange={handleEditChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Team</label>
                <select
                  name="teamId"
                  value={editForm.teamId}
                  onChange={handleEditChange}
                  required
                >
                  <option value="">Select team</option>
                  {teams.map((team) => (
                    <option
                      key={team.id || team._id}
                      value={team.id || team._id}
                    >
                      {team.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Room</label>
                <select
                  name="room"
                  value={editForm.room}
                  onChange={handleEditChange}
                  required
                >
                  <option value="">Choose a room</option>
                  {meetingRooms.map((room) => (
                    <option key={room} value={room}>
                      {room}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Start Time</label>
                <input
                  type="time"
                  name="startTime"
                  value={editForm.startTime}
                  onChange={handleEditChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>End Time</label>
                <input
                  type="time"
                  name="endTime"
                  value={editForm.endTime}
                  onChange={handleEditChange}
                  required
                  min={editForm.startTime}
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  value={editForm.description}
                  onChange={handleEditChange}
                />
              </div>

              <div className="form-group">
                <label>Attendees</label>
                <div className="attendees-selection">
                  {teams.find(
                    (t) => t.id === editForm.teamId || t._id === editForm.teamId
                  ) && (
                    <div className="team-members">
                      <p className="team-members-label">Team Members:</p>
                      {teams
                        .find(
                          (t) =>
                            t.id === editForm.teamId ||
                            t._id === editForm.teamId
                        )
                        ?.members.map((member) => (
                          <label key={member} className="attendee-checkbox">
                            <input
                              type="checkbox"
                              checked={
                                editForm.attendees?.includes(member) || false
                              }
                              onChange={(e) => {
                                const currentAttendees =
                                  editForm.attendees || [];
                                if (e.target.checked) {
                                  setEditForm({
                                    ...editForm,
                                    attendees: [...currentAttendees, member],
                                  });
                                } else {
                                  setEditForm({
                                    ...editForm,
                                    attendees: currentAttendees.filter(
                                      (a: string) => a !== member
                                    ),
                                  });
                                }
                              }}
                            />
                            <span className="attendee-name">{member}</span>
                          </label>
                        ))}
                    </div>
                  )}
                  {!editForm.teamId && (
                    <p className="select-team-first">
                      Please select a team first to see available members
                    </p>
                  )}
                </div>
              </div>
              {editError && <div className="error-banner">{editError}</div>}
              <div className="modal-actions">
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={editLoading}
                >
                  {editLoading ? "Saving..." : "Save"}
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={closeEditModal}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeetingList;
