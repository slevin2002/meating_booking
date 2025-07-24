import React, { useState, useEffect } from "react";
import { Meeting, TimeSlot, Booking } from "./types";
import Calendar from "./components/Calendar";
import MeetingList from "./components/MeetingList";
import TeamOverview from "./components/TeamOverview";
import AllEmployeesAvailability from "./components/AllEmployeesAvailability";
import AllEmployees from "./components/AllEmployees";
import AllRooms from "./components/AllRooms";
import IntroSlider from "./IntroSlider";
import { meetingAPI, teamAPI } from "./services/api";
import "./App.css";

function App() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(
    null
  );
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "calendar" | "meetings" | "teams" | "availability" | "employees" | "rooms"
  >("calendar");
  const [activeTeamTab, setActiveTeamTab] = useState<
    "overview" | "management" | "dashboard"
  >("overview");
  const [showIntro, setShowIntro] = useState(true);

  // Load meetings and teams from database on component mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load teams first
      const teamsResponse = await teamAPI.getAll();
      const teamsDataRaw = teamsResponse.teams || teamsResponse;
      const teamsData = teamsDataRaw.map((team: any) => ({
        ...team,
        id: team._id || team.id,
      }));
      setTeams(teamsData);

      // Load meetings
      const meetingsResponse = await meetingAPI.getAll();
      const meetingsData = meetingsResponse?.meetings || [];
      setMeetings(meetingsData);
    } catch (err) {
      console.error("Failed to load data:", err);
      setError(
        "Failed to load data. Please check if the backend server is running and the database is seeded."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  const handleTimeSlotSelect = (timeSlot: TimeSlot) => {
    setSelectedTimeSlot(timeSlot);
    setShowBookingForm(true);
  };

  const handleBookingSubmit = async (booking: Booking) => {
    try {
      setLoading(true);
      setError(null);

      // Parse start and end time from booking (e.g., "09:00 AM")
      const parseTime = (dateStr: string, timeStr: string) => {
        const [raw, modifier] = timeStr.split(" ");
        let [hours, minutes] = raw.split(":").map(Number);
        if (modifier?.toUpperCase() === "PM" && hours !== 12) hours += 12;
        if (modifier?.toUpperCase() === "AM" && hours === 12) hours = 0;
        const date = new Date(dateStr);
        date.setHours(hours, minutes, 0, 0);
        return date;
      };

      // Parse time with proper timezone handling
      const parseTimeWithTimezone = (dateStr: string, timeStr: string) => {
        // Handle both 24-hour format (HH:MM) and 12-hour format (HH:MM AM/PM)
        let hours, minutes;

        if (timeStr.includes("AM") || timeStr.includes("PM")) {
          // 12-hour format
          const [raw, modifier] = timeStr.split(" ");
          [hours, minutes] = raw.split(":").map(Number);
          if (modifier?.toUpperCase() === "PM" && hours !== 12) hours += 12;
          if (modifier?.toUpperCase() === "AM" && hours === 12) hours = 0;
        } else {
          // 24-hour format
          [hours, minutes] = timeStr.split(":").map(Number);
        }

        // Create date in local timezone
        const [year, month, day] = dateStr.split("-").map(Number);
        const localDate = new Date(year, month - 1, day, hours, minutes, 0, 0);

        // Convert to UTC while preserving the local time
        const utcTime =
          localDate.getTime() - localDate.getTimezoneOffset() * 60000;
        const utcDate = new Date(utcTime);

        console.log(
          `Creating date: ${dateStr} ${timeStr} -> ${utcDate.toISOString()}`
        );

        return utcDate;
      };

      const startTime = parseTimeWithTimezone(booking.date, booking.startTime);
      const endTime = parseTimeWithTimezone(booking.date, booking.endTime);

      console.log("Date selected:", booking.date);
      console.log("Start time selected:", booking.startTime);
      console.log("End time selected:", booking.endTime);
      console.log("Parsed start time:", startTime);
      console.log("Parsed end time:", endTime);
      console.log("Start time ISO:", startTime.toISOString());
      console.log("End time ISO:", endTime.toISOString());

      const duration = Math.round(
        (endTime.getTime() - startTime.getTime()) / (1000 * 60)
      );
      console.log("Calculated duration:", duration, "minutes");

      if (duration <= 0) throw new Error("End time must be after start time.");

      // Find team by name and get its ID
      const selectedTeam = teams.find((team) => team.name === booking.team);
      if (!selectedTeam) {
        throw new Error(
          `Team "${booking.team}" not found. Please select a valid team.`
        );
      }

      console.log("Booking data received:", booking);
      console.log("Selected team:", selectedTeam);

      const meetingData = {
        title: booking.title,
        description: `Meeting for ${booking.team}`,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        duration,
        teamId: selectedTeam._id, // Use the actual MongoDB ObjectId
        room: booking.room,
        attendees: booking.attendees || [],
        status: "scheduled",
      };

      console.log("Meeting data to send:", meetingData);

      const newMeeting = await meetingAPI.create(meetingData);
      setMeetings((prev) => [...prev, newMeeting]);
      setShowBookingForm(false);
      setSelectedTimeSlot && setSelectedTimeSlot(null);
    } catch (err: any) {
      console.error("Failed to create meeting:", err);
      if (err.message?.includes("Room conflict detected")) {
        setError("This room is already booked for the selected time slot.");
      } else if (err.message?.includes("Time conflict detected")) {
        setError(
          "There is already a meeting scheduled for this team at the selected time."
        );
      } else if (err.message?.includes("Attendee conflict detected")) {
        // Extract busy attendees from error message if available
        const busyAttendeesMatch = err.message.match(
          /attendees are already booked for another meeting during this time: (.+)/
        );
        if (busyAttendeesMatch) {
          setError(
            `Cannot book meeting. The following attendees are busy: ${busyAttendeesMatch[1]}`
          );
        } else {
          setError(
            "Cannot book meeting. Some attendees are busy during the selected time."
          );
        }
      } else {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to create meeting. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = () => {
    setShowBookingForm(false);
    setSelectedTimeSlot(null);
  };

  const handleDeleteMeeting = async (meetingId: string) => {
    try {
      setLoading(true);
      setError(null);
      await meetingAPI.delete(meetingId);
      setMeetings((prev) => prev.filter((meeting) => meeting.id !== meetingId));
    } catch (err) {
      console.error("Failed to delete meeting:", err);
      setError("Failed to delete meeting. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditMeeting = async (id: string, data: Partial<Meeting>) => {
    try {
      setLoading(true);
      setError(null);
      // Ensure teamId is a string
      const updateData = {
        ...data,
        teamId:
          typeof data.teamId === "object" && data.teamId !== null
            ? data.teamId._id
            : data.teamId,
      };
      const updated = await meetingAPI.update(id, updateData);
      setMeetings((prev) =>
        prev.map((m) => (m.id === id || m._id === id ? updated : m))
      );
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: "calendar", label: "Calendar", icon: "📅" },
    { id: "meetings", label: "Meetings", icon: "📋" },
    { id: "teams", label: "Teams", icon: "👥" },
    { id: "availability", label: "Availability", icon: "👥" },
    { id: "employees", label: "Employees", icon: "👤" },
    { id: "rooms", label: "Rooms", icon: "🏢" },
  ];

  const teamTabs = [
    { id: "overview", label: "Overview", icon: "👁️" },
    { id: "management", label: "Management", icon: "⚙️" },
    { id: "dashboard", label: "Dashboard", icon: "📊" },
  ];

  if (loading && meetings.length === 0) {
    return (
      <div className="app">
        <div className="header">
          <h1>Meeting Booking App</h1>
          <p>Schedule meetings for your 12 project teams</p>
        </div>
        <div className="container">
          <div className="tab-content">
            <div className="placeholder-content">
              <div className="loading">Loading data...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (showIntro && teams.length > 0) {
    return <IntroSlider teams={teams} onFinish={() => setShowIntro(false)} />;
  }

  return (
    <div className="app">
      <div className="header">
        <h1>Meeting Booking App</h1>
        <p>Schedule meetings for your 12 project teams</p>
      </div>

      {error && (
        <div
          className="error-banner"
          style={{
            background: "linear-gradient(135deg, #ef4444, #dc2626)",
            color: "white",
            padding: "1rem",
            margin: "1rem",
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

      <div className="container">
        <div className="tab-navigation">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`tab-btn ${activeTab === tab.id ? "active" : ""}`}
              onClick={() =>
                setActiveTab(
                  tab.id as
                    | "calendar"
                    | "meetings"
                    | "teams"
                    | "availability"
                    | "employees"
                    | "rooms"
                )
              }
            >
              <span className="tab-icon">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="tab-content">
          {activeTab === "calendar" && (
            <Calendar onBookingSubmit={handleBookingSubmit} teams={teams} />
          )}

          {activeTab === "meetings" && (
            <MeetingList
              meetings={meetings}
              teams={teams}
              onDeleteMeeting={handleDeleteMeeting}
              onEditMeeting={handleEditMeeting}
            />
          )}

          {activeTab === "teams" && (
            <div className="teams-section">
              <div className="section-header">
                <h2>Team Management</h2>
                <p>View and manage your project teams</p>
              </div>

              <div className="sub-tab-navigation">
                {teamTabs.map((tab) => (
                  <button
                    key={tab.id}
                    className={`sub-tab-btn ${
                      activeTeamTab === tab.id ? "active" : ""
                    }`}
                    onClick={() =>
                      setActiveTeamTab(
                        tab.id as "overview" | "management" | "dashboard"
                      )
                    }
                  >
                    <span className="tab-icon">{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="sub-tab-content">
                {activeTeamTab === "overview" && <TeamOverview />}

                {activeTeamTab === "management" && (
                  <div className="placeholder-content">
                    <h3>Team Management Component</h3>
                    <p>
                      Team management functionality will be implemented here.
                    </p>
                  </div>
                )}

                {activeTeamTab === "dashboard" && (
                  <div className="placeholder-content">
                    <h3>Team Dashboard Component</h3>
                    <p>
                      Team dashboard functionality will be implemented here.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "availability" && <AllEmployeesAvailability />}
          {activeTab === "employees" && <AllEmployees teams={teams} />}
          {activeTab === "rooms" && <AllRooms teams={teams} />}
        </div>
      </div>

      {showBookingForm && selectedTimeSlot && (
        <div className="placeholder-content">
          <h3>Booking Form Component</h3>
          <p>Booking form functionality will be implemented here.</p>
        </div>
      )}
    </div>
  );
}

export default App;
