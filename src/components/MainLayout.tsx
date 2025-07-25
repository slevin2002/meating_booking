import React from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";

const tabs = [
  { id: "calendar", label: "Calendar", icon: "📅", path: "/calendar" },
  { id: "meetings", label: "Meetings", icon: "📋", path: "/meetings" },
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

  return (
    <div className="app">
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
  );
};

export default MainLayout;
