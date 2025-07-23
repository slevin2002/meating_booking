import React, { useState, useEffect } from "react";
import { Team } from "../types";
import { teamAPI } from "../services/api";
import "./TeamOverview.css";

const TeamOverview: React.FC = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showAddTeamModal, setShowAddTeamModal] = useState(false);
  const [newTeam, setNewTeam] = useState({
    name: "",
    project: "",
    lead: "",
    members: [""],
    status: "active",
    color: "#667eea",
  });

  // Load teams from database on component mount
  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await teamAPI.getAll();
      setTeams(response.teams || response);
    } catch (err) {
      console.error("Failed to load teams:", err);
      setError(
        "Failed to load teams. Please check if the backend server is running."
      );
    } finally {
      setLoading(false);
    }
  };

  const filteredTeams = teams.filter(
    (team) =>
      team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.project.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.lead.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleTeamClick = (team: Team) => {
    setSelectedTeam(team);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedTeam(null);
  };

  const handleAddTeam = async () => {
    try {
      setLoading(true);
      setError(null);

      // Filter out empty member names
      const filteredMembers = newTeam.members.filter(
        (member) => member.trim() !== ""
      );

      const teamData = {
        ...newTeam,
        members: filteredMembers,
      };

      const createdTeam = await teamAPI.create(teamData);
      setTeams((prev) => [...prev, createdTeam]);
      setShowAddTeamModal(false);
      setNewTeam({
        name: "",
        project: "",
        lead: "",
        members: [""],
        status: "active",
        color: "#667eea",
      });
    } catch (err) {
      console.error("Failed to create team:", err);
      setError("Failed to create team. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const addMemberField = () => {
    setNewTeam((prev) => ({
      ...prev,
      members: [...prev.members, ""],
    }));
  };

  const removeMemberField = (index: number) => {
    setNewTeam((prev) => ({
      ...prev,
      members: prev.members.filter((_, i) => i !== index),
    }));
  };

  const updateMember = (index: number, value: string) => {
    setNewTeam((prev) => ({
      ...prev,
      members: prev.members.map((member, i) => (i === index ? value : member)),
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "#4CAF50";
      case "completed":
        return "#2196F3";
      case "on-hold":
        return "#FF9800";
      default:
        return "#9E9E9E";
    }
  };

  if (loading && teams.length === 0) {
    return (
      <div className="team-overview">
        <div className="overview-header">
          <h2>Team Overview</h2>
          <p>View and manage your project teams</p>
        </div>
        <div className="placeholder-content">
          <div className="loading">Loading teams...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="team-overview">
      <div className="overview-header">
        <h2>Team Overview</h2>
        <p>View and manage your project teams</p>
      </div>

      {error && (
        <div
          className="error-banner"
          style={{
            background: "linear-gradient(135deg, #ef4444, #dc2626)",
            color: "white",
            padding: "1rem",
            marginBottom: "2rem",
            borderRadius: "12px",
            textAlign: "center",
            boxShadow: "0 4px 15px rgba(239, 68, 68, 0.3)",
          }}
        >
          {error}
          <button
            onClick={() => setError(null)}
            style={{
              background: "rgba(255, 255, 255, 0.2)",
              border: "none",
              color: "white",
              padding: "0.5rem 1rem",
              borderRadius: "8px",
              marginLeft: "1rem",
              cursor: "pointer",
            }}
          >
            ✕
          </button>
        </div>
      )}

      <div className="search-section">
        <div className="search-container">
          <input
            type="text"
            placeholder="Search teams, projects, or leads..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <span className="search-icon">🔍</span>
        </div>
        <div className="stats">
          <div className="stat-item">
            <span className="stat-number">{teams.length}</span>
            <span className="stat-label">Total Teams</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">
              {teams.filter((t) => t.status === "active").length}
            </span>
            <span className="stat-label">Active</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">
              {teams.filter((t) => t.status === "completed").length}
            </span>
            <span className="stat-label">Completed</span>
          </div>
        </div>
        <button
          onClick={() => setShowAddTeamModal(true)}
          className="add-team-btn"
          style={{
            background: "linear-gradient(135deg, #667eea, #764ba2)",
            color: "white",
            border: "none",
            padding: "0.75rem 1.5rem",
            borderRadius: "12px",
            cursor: "pointer",
            fontSize: "0.9rem",
            fontWeight: "600",
            boxShadow: "0 4px 15px rgba(102, 126, 234, 0.4)",
            transition: "all 0.3s ease",
          }}
        >
          ➕ Add Team
        </button>
      </div>

      <div className="teams-grid">
        {filteredTeams.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">👥</div>
            <h3>No teams found</h3>
            <p>
              Try adjusting your search criteria or check if teams are loaded
              from the database.
            </p>
          </div>
        ) : (
          filteredTeams.map((team) => (
            <div
              key={team.id}
              className="team-card"
              onClick={() => handleTeamClick(team)}
            >
              <div className="team-header">
                <h3>{team.name}</h3>
                <span
                  className="status-badge"
                  style={{ backgroundColor: getStatusColor(team.status) }}
                >
                  {team.status}
                </span>
              </div>

              <div className="team-info">
                <p className="project-name">{team.project}</p>
                <p className="team-lead">Lead: {team.lead}</p>
                <p className="member-count">{team.members.length} members</p>
              </div>

              <div className="team-members-preview">
                {team.members.slice(0, 3).map((member, index) => (
                  <span key={index} className="member-avatar">
                    {member.charAt(0).toUpperCase()}
                  </span>
                ))}
                {team.members.length > 3 && (
                  <span className="more-members">
                    +{team.members.length - 3}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && selectedTeam && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedTeam.name}</h2>
              <button className="close-btn" onClick={closeModal}>
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="team-details">
                <div className="detail-row">
                  <span className="detail-label">Project:</span>
                  <span className="detail-value">{selectedTeam.project}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Team Lead:</span>
                  <span className="detail-value">{selectedTeam.lead}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Status:</span>
                  <span
                    className="detail-value status"
                    style={{
                      backgroundColor: getStatusColor(selectedTeam.status),
                    }}
                  >
                    {selectedTeam.status}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">
                    Members ({selectedTeam.members.length}):
                  </span>
                  <div className="members-list">
                    {selectedTeam.members.map((member, index) => (
                      <span key={index} className="member-item">
                        {member}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn-secondary" onClick={closeModal}>
                Close
              </button>
              <button className="btn-primary">Edit Team</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Team Modal */}
      {showAddTeamModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowAddTeamModal(false)}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "600px" }}
          >
            <div className="modal-header">
              <h2>Add New Team</h2>
              <button
                className="close-btn"
                onClick={() => setShowAddTeamModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Team Name *</label>
                <input
                  type="text"
                  value={newTeam.name}
                  onChange={(e) =>
                    setNewTeam((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Enter team name"
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    fontSize: "0.9rem",
                  }}
                />
              </div>

              <div className="form-group">
                <label>Project *</label>
                <input
                  type="text"
                  value={newTeam.project}
                  onChange={(e) =>
                    setNewTeam((prev) => ({ ...prev, project: e.target.value }))
                  }
                  placeholder="Enter project name"
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    fontSize: "0.9rem",
                  }}
                />
              </div>

              <div className="form-group">
                <label>Team Lead *</label>
                <input
                  type="text"
                  value={newTeam.lead}
                  onChange={(e) =>
                    setNewTeam((prev) => ({ ...prev, lead: e.target.value }))
                  }
                  placeholder="Enter team lead name"
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    fontSize: "0.9rem",
                  }}
                />
              </div>

              <div className="form-group">
                <label>Team Color</label>
                <input
                  type="color"
                  value={newTeam.color}
                  onChange={(e) =>
                    setNewTeam((prev) => ({ ...prev, color: e.target.value }))
                  }
                  style={{
                    width: "60px",
                    height: "40px",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                  }}
                />
              </div>

              <div className="form-group">
                <label>Team Members *</label>
                {newTeam.members.map((member, index) => (
                  <div
                    key={index}
                    style={{
                      display: "flex",
                      gap: "0.5rem",
                      marginBottom: "0.5rem",
                    }}
                  >
                    <input
                      type="text"
                      value={member}
                      onChange={(e) => updateMember(index, e.target.value)}
                      placeholder={`Member ${index + 1}`}
                      style={{
                        flex: 1,
                        padding: "0.75rem",
                        border: "1px solid #e2e8f0",
                        borderRadius: "8px",
                        fontSize: "0.9rem",
                      }}
                    />
                    {newTeam.members.length > 1 && (
                      <button
                        onClick={() => removeMemberField(index)}
                        style={{
                          background: "#ef4444",
                          color: "white",
                          border: "none",
                          padding: "0.75rem",
                          borderRadius: "8px",
                          cursor: "pointer",
                        }}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={addMemberField}
                  style={{
                    background: "#10b981",
                    color: "white",
                    border: "none",
                    padding: "0.5rem 1rem",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontSize: "0.8rem",
                  }}
                >
                  ➕ Add Member
                </button>
              </div>
            </div>

            <div className="modal-actions">
              <button
                onClick={handleAddTeam}
                disabled={
                  !newTeam.name ||
                  !newTeam.project ||
                  !newTeam.lead ||
                  newTeam.members.every((m) => !m.trim())
                }
                className="btn-primary"
                style={{
                  opacity:
                    !newTeam.name ||
                    !newTeam.project ||
                    !newTeam.lead ||
                    newTeam.members.every((m) => !m.trim())
                      ? 0.5
                      : 1,
                }}
              >
                Create Team
              </button>
              <button
                className="btn-secondary"
                onClick={() => setShowAddTeamModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamOverview;
