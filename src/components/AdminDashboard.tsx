import React, { useState, useEffect } from "react";
import "./AdminDashboard.css";
import { API_CONFIG } from "../config/api";

interface AdminStats {
  totalUsers: number;
  totalTeams: number;
  totalMeetings: number;
  activeMeetings: number;
  cancelledMeetings: number;
  totalRooms: number;
  busyRooms: number;
  freeRooms: number;
}

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
}

interface Team {
  _id: string;
  name: string;
  lead: string;
  members: string[];
  status: string;
  project: string;
}

interface Meeting {
  _id: string;
  title: string;
  teamName: string;
  room: string;
  startTime: string;
  endTime: string;
  status: string;
  attendees: string[];
  createdBy: string;
}

interface AdminDashboardProps {
  teams: any[];
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ teams }) => {
  const [activeTab, setActiveTab] = useState<
    "overview" | "users" | "teams" | "meetings" | "rooms" | "settings"
  >("overview");
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settings, setSettings] = useState<any>(null);

  // Fetch admin data
  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Test admin routes first
      try {
        const testResponse = await fetch(
          `${API_CONFIG.BASE_URL}/api/admin/test`
        );
        const testData = await testResponse.json();
        console.log("Admin test response:", testData);
      } catch (testErr) {
        console.error("Admin test failed:", testErr);
      }

      // Fetch settings
      try {
        const settingsResponse = await fetch(
          `${API_CONFIG.BASE_URL}/api/admin/settings`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        if (settingsResponse.ok) {
          const settingsData = await settingsResponse.json();
          setSettings(settingsData);
        }
      } catch (settingsErr) {
        console.error("Settings fetch failed:", settingsErr);
      }

      // Fetch admin statistics
      const statsResponse = await fetch(
        `${API_CONFIG.BASE_URL}/api/admin/stats`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (!statsResponse.ok) {
        throw new Error(`Stats API error: ${statsResponse.status}`);
      }
      const statsData = await statsResponse.json();

      // Fetch users
      const usersResponse = await fetch(
        `${API_CONFIG.BASE_URL}/api/admin/users`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (!usersResponse.ok) {
        throw new Error(`Users API error: ${usersResponse.status}`);
      }
      const usersData = await usersResponse.json();
      console.log("Users API response:", usersData);

      // Fetch meetings
      const meetingsResponse = await fetch(
        `${API_CONFIG.BASE_URL}/api/admin/meetings`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (!meetingsResponse.ok) {
        throw new Error(`Meetings API error: ${meetingsResponse.status}`);
      }
      const meetingsData = await meetingsResponse.json();
      console.log("Meetings API response:", meetingsData);

      // Calculate admin stats
      const adminStats: AdminStats = {
        totalUsers: statsData.totalUsers || 0,
        totalTeams: statsData.totalTeams || teams.length,
        totalMeetings: statsData.totalMeetings || 0,
        activeMeetings: statsData.activeMeetings || 0,
        cancelledMeetings: statsData.cancelledMeetings || 0,
        totalRooms: 5, // Fixed number of rooms
        busyRooms: 0, // Will be calculated from room status
        freeRooms: 5, // Will be calculated from room status
      };

      setStats(adminStats);
      setUsers(Array.isArray(usersData) ? usersData : []);
      setMeetings(Array.isArray(meetingsData) ? meetingsData : []);
    } catch (err) {
      console.error("Failed to fetch admin data:", err);
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(
        `Failed to load admin data: ${errorMessage}. Please check if the backend server is running.`
      );
      // Set default empty arrays to prevent filter errors
      setUsers([]);
      setMeetings([]);
      setStats({
        totalUsers: 0,
        totalTeams: teams.length,
        totalMeetings: 0,
        activeMeetings: 0,
        cancelledMeetings: 0,
        totalRooms: 5,
        busyRooms: 0,
        freeRooms: 5,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUserAction = async (userId: string, action: string) => {
    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/api/admin/users/${userId}/${action}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        fetchAdminData(); // Refresh data
      } else {
        setError(`Failed to ${action} user`);
      }
    } catch (err) {
      setError(`Error ${action}ing user`);
    }
  };

  const handleMeetingAction = async (meetingId: string, action: string) => {
    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/api/admin/meetings/${meetingId}/${action}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        fetchAdminData(); // Refresh data
      } else {
        setError(`Failed to ${action} meeting`);
      }
    } catch (err) {
      setError(`Error ${action}ing meeting`);
    }
  };

  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const handleViewMeeting = (meeting: Meeting) => {
    setSelectedMeeting(meeting);
    setShowMeetingModal(true);
  };

  const handleEditTeam = (team: any) => {
    // For now, just show an alert. In a real app, you'd open an edit modal
    alert(`Edit team: ${team.name}`);
  };

  const handleViewTeamDetails = (team: any) => {
    // For now, just show an alert. In a real app, you'd open a details modal
    alert(
      `View team details: ${team.name}\nLead: ${team.lead}\nMembers: ${
        team.members?.length || 0
      }`
    );
  };

  const handleViewRoomSchedule = (roomName: string) => {
    // For now, just show an alert. In a real app, you'd open a schedule modal
    alert(`View schedule for: ${roomName}`);
  };

  const handleRoomMaintenance = (roomName: string) => {
    // For now, just show an alert. In a real app, you'd open a maintenance modal
    alert(`Maintenance for: ${roomName}`);
  };

  const handleBackupDatabase = async () => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/admin/backup`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        alert("Database backup initiated successfully!");
      } else {
        setError("Failed to backup database");
      }
    } catch (err) {
      setError("Error backing up database");
    }
  };

  const handleClearCache = async () => {
    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/api/admin/clear-cache`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        alert("Cache cleared successfully!");
      } else {
        setError("Failed to clear cache");
      }
    } catch (err) {
      setError("Error clearing cache");
    }
  };

  const handleResetSystem = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to reset the system? This action cannot be undone."
    );
    if (!confirmed) return;

    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/api/admin/reset-system`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        alert("System reset initiated successfully!");
      } else {
        setError("Failed to reset system");
      }
    } catch (err) {
      setError("Error resetting system");
    }
  };

  const handleUpdateSettings = async (newSettings: any) => {
    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/api/admin/settings`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(newSettings),
        }
      );

      if (response.ok) {
        alert("Settings updated successfully!");
        setSettings(newSettings);
      } else {
        setError("Failed to update settings");
      }
    } catch (err) {
      setError("Error updating settings");
    }
  };

  const filteredUsers = Array.isArray(users)
    ? users.filter(
        (user) =>
          user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  const filteredMeetings = Array.isArray(meetings)
    ? meetings.filter(
        (meeting) =>
          meeting.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          meeting.teamName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          meeting.room.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-dashboard">
        <div className="error-message">
          <h3>Error</h3>
          <p>{error}</p>
          <button onClick={fetchAdminData}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>🔧 Admin Dashboard</h1>
        <p>System administration and monitoring</p>
      </div>

      <div className="admin-tabs">
        <button
          className={activeTab === "overview" ? "active" : ""}
          onClick={() => setActiveTab("overview")}
        >
          📊 Overview
        </button>
        <button
          className={activeTab === "users" ? "active" : ""}
          onClick={() => setActiveTab("users")}
        >
          👥 Users
        </button>
        <button
          className={activeTab === "teams" ? "active" : ""}
          onClick={() => setActiveTab("teams")}
        >
          🏢 Teams
        </button>
        <button
          className={activeTab === "meetings" ? "active" : ""}
          onClick={() => setActiveTab("meetings")}
        >
          📅 Meetings
        </button>
        <button
          className={activeTab === "rooms" ? "active" : ""}
          onClick={() => setActiveTab("rooms")}
        >
          🏠 Rooms
        </button>
        <button
          className={activeTab === "settings" ? "active" : ""}
          onClick={() => setActiveTab("settings")}
        >
          ⚙️ Settings
        </button>
      </div>

      <div className="admin-content">
        {activeTab === "overview" && (
          <div className="overview-section">
            <div className="stats-grid">
              <div className="stat-card">
                <h3>👥 Total Users</h3>
                <p className="stat-number">{stats?.totalUsers}</p>
              </div>
              <div className="stat-card">
                <h3>🏢 Total Teams</h3>
                <p className="stat-number">{stats?.totalTeams}</p>
              </div>
              <div className="stat-card">
                <h3>📅 Total Meetings</h3>
                <p className="stat-number">{stats?.totalMeetings}</p>
              </div>
              <div className="stat-card">
                <h3>✅ Active Meetings</h3>
                <p className="stat-number">{stats?.activeMeetings}</p>
              </div>
              <div className="stat-card">
                <h3>❌ Cancelled Meetings</h3>
                <p className="stat-number">{stats?.cancelledMeetings}</p>
              </div>
              <div className="stat-card">
                <h3>🏠 Total Rooms</h3>
                <p className="stat-number">{stats?.totalRooms}</p>
              </div>
              <div className="stat-card">
                <h3>🔴 Busy Rooms</h3>
                <p className="stat-number">{stats?.busyRooms}</p>
              </div>
              <div className="stat-card">
                <h3>🟢 Free Rooms</h3>
                <p className="stat-number">{stats?.freeRooms}</p>
              </div>
            </div>

            <div className="quick-actions">
              <h3>Quick Actions</h3>
              <div className="action-buttons">
                <button onClick={() => setActiveTab("users")}>
                  Manage Users
                </button>
                <button onClick={() => setActiveTab("meetings")}>
                  View Meetings
                </button>
                <button onClick={() => setActiveTab("rooms")}>
                  Room Status
                </button>
                <button onClick={fetchAdminData}>Refresh Data</button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "users" && (
          <div className="users-section">
            <div className="section-header">
              <h3>User Management</h3>
              <div className="search-box">
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="users-table">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user._id}>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>{user.role || "User"}</td>
                      <td>
                        <span className={`status ${user.status || "active"}`}>
                          {user.status || "Active"}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            onClick={() => handleViewUser(user)}
                            className="btn-secondary"
                          >
                            View
                          </button>
                          <button
                            onClick={() =>
                              handleUserAction(user._id, "suspend")
                            }
                            className="btn-warning"
                          >
                            Suspend
                          </button>
                          <button
                            onClick={() =>
                              handleUserAction(user._id, "activate")
                            }
                            className="btn-success"
                          >
                            Activate
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "teams" && (
          <div className="teams-section">
            <div className="section-header">
              <h3>Team Management</h3>
            </div>

            <div className="teams-grid">
              {teams.map((team) => (
                <div key={team._id} className="team-card">
                  <div className="team-header">
                    <h4>{team.name}</h4>
                    <span className="team-status">{team.status}</span>
                  </div>
                  <div className="team-details">
                    <p>
                      <strong>Lead:</strong> {team.lead}
                    </p>
                    <p>
                      <strong>Project:</strong> {team.project}
                    </p>
                    <p>
                      <strong>Members:</strong> {team.members?.length || 0}
                    </p>
                  </div>
                  <div className="team-actions">
                    <button
                      onClick={() => handleEditTeam(team)}
                      className="btn-primary"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleViewTeamDetails(team)}
                      className="btn-secondary"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "meetings" && (
          <div className="meetings-section">
            <div className="section-header">
              <h3>Meeting Management</h3>
              <div className="search-box">
                <input
                  type="text"
                  placeholder="Search meetings..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="meetings-table">
              <table>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Team</th>
                    <th>Room</th>
                    <th>Date/Time</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMeetings.map((meeting) => (
                    <tr key={meeting._id}>
                      <td>{meeting.title}</td>
                      <td>{meeting.teamName}</td>
                      <td>{meeting.room}</td>
                      <td>
                        {new Date(meeting.startTime).toLocaleDateString()}{" "}
                        {new Date(meeting.startTime).toLocaleTimeString()}
                      </td>
                      <td>
                        <span className={`status ${meeting.status}`}>
                          {meeting.status}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          {meeting.status !== "cancelled" && (
                            <button
                              onClick={() =>
                                handleMeetingAction(meeting._id, "cancel")
                              }
                              className="btn-danger"
                            >
                              Cancel
                            </button>
                          )}
                          <button
                            onClick={() => handleViewMeeting(meeting)}
                            className="btn-secondary"
                          >
                            View
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "rooms" && (
          <div className="rooms-section">
            <div className="section-header">
              <h3>Room Management</h3>
            </div>

            <div className="rooms-grid">
              {[
                "meeting room (Capacity: 10)",
                "Balcony (Capacity: 8)",
                "sit out (Capacity: 6)",
                "lunch hall (Capacity: 15)",
                "main hall (General Meetings only) (Capacity: 40)",
              ].map((room, index) => (
                <div key={index} className="room-card">
                  <div className="room-header">
                    <h4>{room.split(" (")[0]}</h4>
                    <span className="room-capacity">
                      {room.match(/Capacity: (\d+)/)?.[1]} people
                    </span>
                  </div>
                  <div className="room-details">
                    <p>{room}</p>
                    <p className="room-status">Available</p>
                  </div>
                  <div className="room-actions">
                    <button
                      onClick={() =>
                        handleViewRoomSchedule(room.split(" (")[0])
                      }
                      className="btn-primary"
                    >
                      View Schedule
                    </button>
                    <button
                      onClick={() => handleRoomMaintenance(room.split(" (")[0])}
                      className="btn-secondary"
                    >
                      Maintenance
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="settings-section">
            <div className="section-header">
              <h3>System Settings</h3>
            </div>

            <div className="settings-grid">
              <div className="setting-card">
                <h4>General Settings</h4>
                <div className="setting-item">
                  <label>System Name:</label>
                  <input type="text" defaultValue="Meeting Booking System" />
                </div>
                <div className="setting-item">
                  <label>Default Meeting Duration:</label>
                  <select defaultValue="60">
                    <option value="30">30 minutes</option>
                    <option value="60">1 hour</option>
                    <option value="90">1.5 hours</option>
                    <option value="120">2 hours</option>
                  </select>
                </div>
                <div className="setting-item">
                  <label>Booking Time Limit:</label>
                  <input type="number" defaultValue="24" /> hours
                </div>
              </div>

              <div className="setting-card">
                <h4>Email Settings</h4>
                <div className="setting-item">
                  <label>Email Notifications:</label>
                  <input type="checkbox" defaultChecked />
                </div>
                <div className="setting-item">
                  <label>OTP Expiry Time:</label>
                  <input type="number" defaultValue="5" /> minutes
                </div>
              </div>

              <div className="setting-card">
                <h4>Room Restrictions</h4>
                <div className="setting-item">
                  <label>Main Hall - General Meetings Only:</label>
                  <input type="checkbox" defaultChecked />
                </div>
                <div className="setting-item">
                  <label>OTP Required for General Meetings:</label>
                  <input type="checkbox" defaultChecked />
                </div>
              </div>

              <div className="setting-card">
                <h4>System Maintenance</h4>
                <div className="setting-item">
                  <button
                    onClick={handleBackupDatabase}
                    className="btn-primary"
                  >
                    Backup Database
                  </button>
                </div>
                <div className="setting-item">
                  <button onClick={handleClearCache} className="btn-warning">
                    Clear Cache
                  </button>
                </div>
                <div className="setting-item">
                  <button onClick={handleResetSystem} className="btn-danger">
                    Reset System
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* User Details Modal */}
      {showUserModal && selectedUser && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>User Details</h3>
              <button
                onClick={() => setShowUserModal(false)}
                className="modal-close"
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>
                <strong>Name:</strong> {selectedUser.name}
              </p>
              <p>
                <strong>Email:</strong> {selectedUser.email}
              </p>
              <p>
                <strong>Role:</strong> {selectedUser.role || "User"}
              </p>
              <p>
                <strong>Status:</strong> {selectedUser.status || "Active"}
              </p>
              <p>
                <strong>Created:</strong>{" "}
                {new Date(selectedUser.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="modal-footer">
              <button
                onClick={() => setShowUserModal(false)}
                className="btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Meeting Details Modal */}
      {showMeetingModal && selectedMeeting && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Meeting Details</h3>
              <button
                onClick={() => setShowMeetingModal(false)}
                className="modal-close"
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>
                <strong>Title:</strong> {selectedMeeting.title}
              </p>
              <p>
                <strong>Team:</strong> {selectedMeeting.teamName}
              </p>
              <p>
                <strong>Room:</strong> {selectedMeeting.room}
              </p>
              <p>
                <strong>Start Time:</strong>{" "}
                {new Date(selectedMeeting.startTime).toLocaleString()}
              </p>
              <p>
                <strong>End Time:</strong>{" "}
                {new Date(selectedMeeting.endTime).toLocaleString()}
              </p>
              <p>
                <strong>Status:</strong> {selectedMeeting.status}
              </p>
              <p>
                <strong>Created By:</strong> {selectedMeeting.createdBy}
              </p>
              <p>
                <strong>Attendees:</strong>{" "}
                {selectedMeeting.attendees?.length || 0}
              </p>
            </div>
            <div className="modal-footer">
              <button
                onClick={() => setShowMeetingModal(false)}
                className="btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
