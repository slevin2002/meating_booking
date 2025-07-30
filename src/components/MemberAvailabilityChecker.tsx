import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { meetingAPI, teamAPI } from "../services/api";
import "./MemberAvailabilityChecker.css";
import { API_CONFIG } from "../config/api";

interface Team {
  _id: string;
  name: string;
  project: string;
  lead: string;
  members: string[];
  status: string;
  color: string;
}

interface Conflict {
  _id: string;
  title: string;
  startTime: string;
  endTime: string;
  teamId: { name: string; color: string };
  room: string;
  status: string;
}

interface AvailabilityResult {
  status: "busy" | "free";
  conflicts: Conflict[];
  message?: string;
}

interface MemberAvailability {
  member: string;
  result: AvailabilityResult;
}

const MemberAvailabilityChecker: React.FC = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [startTime, setStartTime] = useState<string>("");
  const [endTime, setEndTime] = useState<string>("");
  const [results, setResults] = useState<MemberAvailability[]>([]);
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

  const handleCheckAvailability = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !startTime || !endTime) {
      setError("Please fill in all fields");
      return;
    }

    if (endTime <= startTime) {
      setError("End time must be after start time");
      return;
    }

    setLoading(true);
    setError(null);
    setResults([]);

    try {
      // Get all unique members from all teams
      const allMembers = Array.from(
        new Set(teams.flatMap((team) => team.members))
      ).sort();

      // Check availability for all members
      const availabilityPromises = allMembers.map(async (member) => {
        try {
          const response = await fetch(
            `${API_CONFIG.BASE_URL}/api/meetings/check-member-availability?member=${encodeURIComponent(
              member
            )}&date=${selectedDate}&startTime=${startTime}&endTime=${endTime}`
          );

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(
              errorData.message || "Failed to check availability"
            );
          }

          const data = await response.json();
          return { member, result: data };
        } catch (err: any) {
          console.error(`Failed to check availability for ${member}:`, err);
          return {
            member,
            result: {
              status: "busy" as const,
              conflicts: [],
              message: `Failed to check availability: ${err.message}`,
            },
          };
        }
      });

      const results = await Promise.all(availabilityPromises);
      setResults(results);
    } catch (err: any) {
      setError(err.message || "Failed to check availability");
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "MMM d, yyyy h:mm a");
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

  return (
    <div className="availability-checker">
      <div className="checker-header">
        <h2>All Employees Availability Checker</h2>
        <p>Check availability for all team members during a specific time</p>
      </div>

      <div className="checker-content">
        <div className="checker-form">
          <form onSubmit={handleCheckAvailability}>
            <div className="form-group">
              <label>Date:</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Start Time:</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>End Time:</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                min={startTime}
                disabled={!startTime}
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-check" disabled={loading}>
                {loading ? "Checking..." : "Check All Members Availability"}
              </button>
            </div>
          </form>
        </div>

        {error && (
          <div className="error-banner">
            {error}
            <button onClick={() => setError(null)}>✕</button>
          </div>
        )}

        {results.length > 0 && (
          <div className="results-container">
            <h3>Availability Results</h3>
            <div className="members-grid">
              {results.map(({ member, result }) => (
                <div key={member} className="member-result">
                  <div className="member-header">
                    <h4>{member}</h4>
                    <div className={`status-badge ${result.status}`}>
                      {result.status === "free" ? "Available" : "Busy"}
                    </div>
                  </div>

                  <div className={`result-status ${result.status}`}>
                    <div className="status-icon">
                      {result.status === "free" ? "✅" : "❌"}
                    </div>
                    <div className="status-content">
                      <p>
                        {result.message ||
                          `${member} is ${
                            result.status === "free" ? "available" : "busy"
                          } during the selected time.`}
                      </p>
                    </div>
                  </div>

                  {result.status === "busy" && result.conflicts.length > 0 && (
                    <div className="conflicts-section">
                      <h5>Conflicting Meetings:</h5>
                      <div className="conflicts-list">
                        {result.conflicts.map((conflict) => (
                          <div key={conflict._id} className="conflict-item">
                            <div className="conflict-header">
                              <h6>{conflict.title}</h6>
                              <span
                                className={`status-badge status-${conflict.status}`}
                              >
                                {conflict.status}
                              </span>
                            </div>
                            <div className="conflict-details">
                              <div className="detail-row">
                                <span className="detail-label">
                                  Date & Time:
                                </span>
                                <span className="detail-value">
                                  {formatDateTime(conflict.startTime)} -{" "}
                                  {formatTime(conflict.endTime)}
                                </span>
                              </div>
                              <div className="detail-row">
                                <span className="detail-label">Team:</span>
                                <span className="detail-value">
                                  {conflict.teamId?.name || "Unknown Team"}
                                </span>
                              </div>
                              <div className="detail-row">
                                <span className="detail-label">Room:</span>
                                <span className="detail-value">
                                  {conflict.room}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MemberAvailabilityChecker;
