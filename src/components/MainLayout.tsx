import React, { useState } from "react";
import Calendar from "./Calendar";
import MeetingList from "./MeetingList";
import TeamOverview from "./TeamOverview";
import AllEmployeesAvailability from "./AllEmployeesAvailability";
import AllEmployees from "./AllEmployees";
import AllRooms from "./AllRooms";

interface MainLayoutProps {
  meetings: any[];
  teams: any[];
  onDeleteMeeting: (id: string) => void;
  children?: React.ReactNode;
}

const tabs = [
  { id: "calendar", label: "Calendar", icon: "📅" },
  { id: "meetings", label: "Meetings", icon: "📋" },
  { id: "teams", label: "Teams", icon: "👥" },
  { id: "availability", label: "Availability", icon: "✅" },
  { id: "employees", label: "Employees", icon: "🧑‍💼" },
  { id: "rooms", label: "Rooms", icon: "🏢" },
];

const MainLayout: React.FC<MainLayoutProps> = ({
  meetings,
  teams,
  onDeleteMeeting,
  children,
}) => {
  const [activeTab, setActiveTab] = useState("calendar");

  return (
    <div className="app">
      <div className="header">
        <h1>Meeting Booking App</h1>
        <p>Schedule meetings for your 12 project teams</p>
      </div>
      <div className="container">
        <div className="tab-navigation">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`tab-btn ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="tab-icon">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
        <div className="tab-content">
          {activeTab === "calendar" && <Calendar teams={teams} />}
          {activeTab === "meetings" && (
            <MeetingList
              meetings={meetings}
              teams={teams}
              onDeleteMeeting={onDeleteMeeting}
            />
          )}
          {activeTab === "teams" && <TeamOverview />}
          {activeTab === "availability" && <AllEmployeesAvailability />}
          {activeTab === "employees" && <AllEmployees teams={teams} />}
          {activeTab === "rooms" && <AllRooms teams={teams} />}
        </div>
        {children}
      </div>
    </div>
  );
};

export default MainLayout;
