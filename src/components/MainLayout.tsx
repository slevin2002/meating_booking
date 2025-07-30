import React, { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const tabs = [
  { id: "calendar", label: "Calendar", icon: "📅", path: "/calendar" },
  { id: "meetings", label: "Meetings", icon: "📋", path: "/meetings" },
  { id: "cancelled", label: "Cancelled", icon: "❌", path: "/cancelled" },
  { id: "teams", label: "Teams", icon: "👥", path: "/teams" },
  {
    id: "availability",
    label: "Availability",
    icon: "✅",
    path: "/availability",
  },
  { id: "employees", label: "Employees", icon: "🧑‍💼", path: "/employees" },
  { id: "rooms", label: "Rooms", icon: "🏢", path: "/rooms" },
];

const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="app">
      <div className="main-content">
        <div className="header">
          <div className="header-content">
            <h1>Meeting Booking System</h1>
            <div className="header-actions">
              <span className="user-name">{user?.name || "User"}</span>
              <button className="logout-btn" onClick={handleLogout}>
                <span className="logout-icon">🚪</span>
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>

        <div className="tab-navigation">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`tab-btn${
                location.pathname === tab.path ? " active" : ""
              }`}
              onClick={() => navigate(tab.path)}
            >
              <span className="tab-icon">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
        <div className="tab-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
