import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import "./Sidebar.css";

const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
  };

  return (
    <div className={`sidebar ${isCollapsed ? "collapsed" : ""}`}>
      <div className="sidebar-header">
        <button
          className="collapse-btn"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? "→" : "←"}
        </button>
        {!isCollapsed && <h3>User Profile</h3>}
      </div>

      <div className="user-profile">
        <div className="user-avatar-large">
          {user?.name?.charAt(0).toUpperCase() || "U"}
        </div>
        {!isCollapsed && (
          <>
            <div className="user-info">
              <h4 className="user-name">{user?.name || "User"}</h4>
            </div>

            <div className="sidebar-actions">
              <button className="action-btn logout-btn" onClick={handleLogout}>
                <span className="icon">🚪</span>
                <span>Logout</span>
              </button>
            </div>
          </>
        )}
      </div>

      {!isCollapsed && (
        <div className="sidebar-footer">
          <p className="app-version">Meeting Booking System v1.0</p>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
