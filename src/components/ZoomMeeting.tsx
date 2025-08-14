import React, { useState, useEffect } from "react";
import { teamAPI, zoomAPI } from "../services/api";
import "./ZoomMeeting.css";

interface Team {
  _id: string;
  name: string;
  project: string;
  lead: string;
  members: string[];
  status: string;
  color: string;
}

interface ZoomMeetingData {
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  duration: number;
  teamId: string;
  attendees: string[];
}

const ZoomMeeting: React.FC = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedStartTime, setSelectedStartTime] = useState<string>("");
  const [selectedEndTime, setSelectedEndTime] = useState<string>("");
  const [meetingTitle, setMeetingTitle] = useState<string>("");
  const [meetingDescription, setMeetingDescription] = useState<string>("");
  const [selectedAttendees, setSelectedAttendees] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>("");

  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = async () => {
    try {
      setLoading(true);
      const response = await teamAPI.getAll();
      const teamsData = response.teams || response;
      setTeams(teamsData);
    } catch (err) {
      console.error("Failed to load teams:", err);
      setError("Failed to load teams. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleTeamChange = (teamId: string) => {
    setSelectedTeam(teamId);
    setSelectedAttendees([]);
  };

  const handleAttendeeToggle = (attendee: string) => {
    setSelectedAttendees((prev) =>
      prev.includes(attendee)
        ? prev.filter((a) => a !== attendee)
        : [...prev, attendee]
    );
  };

  const calculateDuration = () => {
    if (!selectedStartTime || !selectedEndTime) return 0;

    const start = new Date(`2000-01-01T${selectedStartTime}`);
    const end = new Date(`2000-01-01T${selectedEndTime}`);
    const diffMs = end.getTime() - start.getTime();
    return Math.round(diffMs / (1000 * 60)); // Convert to minutes
  };

  const validateForm = () => {
    if (!selectedTeam) {
      setError("Please select a team");
      return false;
    }
    if (!selectedDate) {
      setError("Please select a date");
      return false;
    }
    if (!selectedStartTime || !selectedEndTime) {
      setError("Please select start and end times");
      return false;
    }
    if (!meetingTitle.trim()) {
      setError("Please enter a meeting title");
      return false;
    }
    if (calculateDuration() <= 0) {
      setError("End time must be after start time");
      return false;
    }
    if (calculateDuration() < 15) {
      setError("Meeting duration must be at least 15 minutes");
      return false;
    }
    return true;
  };

  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setIsCreating(true);
      setError(null);

      const meetingData: ZoomMeetingData = {
        title: meetingTitle,
        description: meetingDescription,
        startTime: `${selectedDate}T${selectedStartTime}:00.000Z`,
        endTime: `${selectedDate}T${selectedEndTime}:00.000Z`,
        duration: calculateDuration(),
        teamId: selectedTeam,
        attendees: selectedAttendees,
      };

      const result = await zoomAPI.create(meetingData);

      setSuccessMessage(
        `Zoom meeting created successfully! Join URL: ${result.zoomDetails.joinUrl}`
      );
      setShowSuccess(true);

      // Reset form
      setSelectedTeam("");
      setSelectedDate("");
      setSelectedStartTime("");
      setSelectedEndTime("");
      setMeetingTitle("");
      setMeetingDescription("");
      setSelectedAttendees([]);

      // Hide success message after 5 seconds
      setTimeout(() => setShowSuccess(false), 5000);
    } catch (err: any) {
      console.error("Failed to create Zoom meeting:", err);
      setError(err.message || "Failed to create Zoom meeting");
    } finally {
      setIsCreating(false);
    }
  };

  const getSelectedTeam = () => {
    return teams.find((team) => team._id === selectedTeam);
  };

  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 9; hour <= 17; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, "0")}:${minute
          .toString()
          .padStart(2, "0")}`;
        slots.push(time);
      }
    }
    return slots;
  };

  if (loading) {
    return (
      <div className="zoom-meeting-container">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  return (
    <div className="zoom-meeting-container">
      <div className="zoom-header">
        <h2>🎥 Create Zoom Meeting</h2>
        <p>Schedule a virtual meeting with your team using Zoom</p>
      </div>

      {error && (
        <div className="error-banner">
          <span>{error}</span>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {showSuccess && (
        <div className="success-banner">
          <span>{successMessage}</span>
          <button onClick={() => setShowSuccess(false)}>×</button>
        </div>
      )}

      <div className="zoom-content">
        <form onSubmit={handleCreateMeeting} className="zoom-form">
          <div className="form-section">
            <h3>📋 Meeting Details</h3>

            <div className="form-group">
              <label htmlFor="team">Select Team *</label>
              <select
                id="team"
                value={selectedTeam}
                onChange={(e) => handleTeamChange(e.target.value)}
                required
              >
                <option value="">Choose a team</option>
                {teams.map((team) => (
                  <option key={team._id} value={team._id}>
                    {team.name} - {team.project}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="title">Meeting Title *</label>
              <input
                type="text"
                id="title"
                value={meetingTitle}
                onChange={(e) => setMeetingTitle(e.target.value)}
                placeholder="Enter meeting title"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                value={meetingDescription}
                onChange={(e) => setMeetingDescription(e.target.value)}
                placeholder="Enter meeting description"
                rows={3}
              />
            </div>
          </div>

          <div className="form-section">
            <h3>📅 Schedule</h3>

            <div className="form-group">
              <label htmlFor="date">Date *</label>
              <input
                type="date"
                id="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                required
              />
            </div>

            <div className="time-group">
              <div className="form-group">
                <label htmlFor="startTime">Start Time *</label>
                <select
                  id="startTime"
                  value={selectedStartTime}
                  onChange={(e) => setSelectedStartTime(e.target.value)}
                  required
                >
                  <option value="">Select start time</option>
                  {generateTimeSlots().map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="endTime">End Time *</label>
                <select
                  id="endTime"
                  value={selectedEndTime}
                  onChange={(e) => setSelectedEndTime(e.target.value)}
                  required
                >
                  <option value="">Select end time</option>
                  {generateTimeSlots().map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {selectedStartTime && selectedEndTime && (
              <div className="duration-display">
                <strong>Duration: {calculateDuration()} minutes</strong>
              </div>
            )}
          </div>

          {selectedTeam && (
            <div className="form-section">
              <h3>👥 Attendees</h3>
              <p className="section-description">
                Select team members to invite to the meeting
              </p>

              <div className="attendees-grid">
                {getSelectedTeam()?.members.map((member) => (
                  <label key={member} className="attendee-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedAttendees.includes(member)}
                      onChange={() => handleAttendeeToggle(member)}
                    />
                    <span className="attendee-name">{member}</span>
                  </label>
                ))}
              </div>

              <div className="selected-count">
                {selectedAttendees.length} of{" "}
                {getSelectedTeam()?.members.length} members selected
              </div>
            </div>
          )}

          <div className="form-actions">
            <button type="submit" className="btn-create" disabled={isCreating}>
              {isCreating ? "Creating..." : "🎥 Create Zoom Meeting"}
            </button>
          </div>
        </form>

        <div className="zoom-info">
          <h3>ℹ️ About Zoom Meetings</h3>
          <ul>
            <li>✅ Automatic Zoom meeting creation</li>
            <li>✅ Email invitations sent to attendees</li>
            <li>✅ Join URL and password provided</li>
            <li>✅ Meeting details synced with calendar</li>
            <li>✅ Host controls and security settings</li>
          </ul>

          <div className="zoom-tips">
            <h4>💡 Tips for successful Zoom meetings:</h4>
            <ul>
              <li>Test your audio and video before joining</li>
              <li>Use a quiet environment with good lighting</li>
              <li>Have the meeting agenda ready</li>
              <li>Join 5 minutes early to ensure everything works</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ZoomMeeting;
