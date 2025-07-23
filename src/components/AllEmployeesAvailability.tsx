import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { meetingAPI, teamAPI } from "../services/api";
import "./AllEmployeesAvailability.css";

interface Team {
  _id: string;
  name: string;
  project: string;
  lead: string;
  members: string[];
  status: string;
  color: string;
}

interface Meeting {
  _id: string;
  title: string;
  startTime: string;
  endTime: string;
  teamId: { name: string; color: string };
  room: string;
  status: string;
}

const AllEmployeesAvailability: React.FC = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedMember, setSelectedMember] = useState<string>("");
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = async () => {
    try {
      const response = await teamAPI.getAll();
      const teamsData = response.teams || response;
      setTeams(teamsData);
    } catch (err) {
      console.error("Failed to load teams:", err);
      setError("Failed to load teams");
    }
  };

  const loadMemberMeetings = async (member: string) => {
    if (!member) {
      setMeetings([]);
      return;
    }

    setLoading(true);
    setError(null);
    setMeetings([]);

    try {
      const response = await fetch(
        `http://localhost:5000/api/meetings/member-meetings?member=${encodeURIComponent(
          member
        )}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to load meetings");
      }

      const data = await response.json();
      setMeetings(data.meetings || data);
    } catch (err: any) {
      setError(err.message || "Failed to load meetings");
    } finally {
      setLoading(false);
    }
  };

  const handleMemberSelect = (member: string) => {
    setSelectedMember(member);
    if (member) {
      loadMemberMeetings(member);
    } else {
      setMeetings([]);
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
      return format(date, "h:mm a");
    } catch (error) {
      return "Invalid time";
    }
  };

  const isMeetingPast = (meetingDate: string) => {
    const meetingTime = new Date(meetingDate);
    const now = new Date();
    return meetingTime < now;
  };

  const isMeetingToday = (meetingDate: string) => {
    const meetingTime = new Date(meetingDate);
    const today = new Date();
    return meetingTime.toDateString() === today.toDateString();
  };

  // Get all unique members from all teams
  const allMembers = Array.from(
    new Set(teams.flatMap((team) => team.members))
  ).sort();

  // Sort meetings by date (upcoming first, then past)
  const sortedMeetings = [...meetings].sort((a, b) => {
    const dateA = new Date(a.startTime);
    const dateB = new Date(b.startTime);
    return dateA.getTime() - dateB.getTime();
  });

  // Determine availability status
  const isAvailable = meetings.length === 0;
  const status = isAvailable ? "free" : "busy";

  return (
    <div className="all-employees-availability">
      <div className="availability-header">
        <h2>Employee Availability Checker</h2>
        <p>Select an employee to see their availability status and meetings</p>
      </div>

      <div className="availability-content">
        <div className="availability-form">
          <div className="form-group">
            <label>Select Employee:</label>
            <select
              value={selectedMember}
              onChange={(e) => handleMemberSelect(e.target.value)}
            >
              <option value="">Choose an employee</option>
              {allMembers.map((member) => (
                <option key={member} value={member}>
                  {member}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="error-banner">
            {error}
            <button onClick={() => setError(null)}>✕</button>
          </div>
        )}

        {loading && (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading meetings...</p>
          </div>
        )}

        {selectedMember && !loading && (
          <div className="result-container">
            <div className="member-header">
              <h3>{selectedMember}</h3>
              <div className={`status-badge ${status}`}>
                {status === "free" ? "Free" : "Busy"}
              </div>
            </div>

            <div className={`result-status ${status}`}>
              <div className="status-icon">
                {status === "free" ? "✅" : "❌"}
              </div>
              <div className="status-content">
                <p>
                  {status === "free"
                    ? `${selectedMember} is free and has no meetings scheduled.`
                    : `${selectedMember} is busy and has ${
                        meetings.length
                      } meeting${meetings.length !== 1 ? "s" : ""} scheduled.`}
                </p>
              </div>
            </div>

            {meetings.length > 0 && (
              <div className="meetings-section">
                <h4>All Meetings:</h4>
                <div className="meetings-list">
                  {sortedMeetings.map((meeting) => (
                    <div
                      key={meeting._id}
                      className={`meeting-item ${
                        isMeetingPast(meeting.startTime)
                          ? "past"
                          : isMeetingToday(meeting.startTime)
                          ? "today"
                          : "upcoming"
                      }`}
                    >
                      <div className="meeting-header">
                        <h5>{meeting.title}</h5>
                        <span
                          className={`status-badge status-${meeting.status}`}
                        >
                          {meeting.status}
                        </span>
                      </div>
                      <div className="meeting-details">
                        <div className="detail-row">
                          <span className="detail-label">Date & Time:</span>
                          <span className="detail-value">
                            {formatDateTime(meeting.startTime)} -{" "}
                            {formatDateTime(meeting.endTime)}
                          </span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">Team:</span>
                          <span className="detail-value">
                            {meeting.teamId?.name || "Unknown Team"}
                          </span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">Room:</span>
                          <span className="detail-value">{meeting.room}</span>
                        </div>
                      </div>
                      <div className="meeting-timeline">
                        {isMeetingPast(meeting.startTime) && (
                          <span className="timeline-badge past">Past</span>
                        )}
                        {isMeetingToday(meeting.startTime) && (
                          <span className="timeline-badge today">Today</span>
                        )}
                        {!isMeetingPast(meeting.startTime) &&
                          !isMeetingToday(meeting.startTime) && (
                            <span className="timeline-badge upcoming">
                              Upcoming
                            </span>
                          )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AllEmployeesAvailability;
