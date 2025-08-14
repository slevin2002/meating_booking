import React, { useState, useEffect } from "react";
import { Meeting, TimeSlot, Booking } from "./types";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import MainLayout from "./components/MainLayout";
import Calendar from "./components/Calendar";
import MeetingList from "./components/MeetingList";
import TeamOverview from "./components/TeamOverview";
import AllEmployeesAvailability from "./components/AllEmployeesAvailability";
import AllEmployees from "./components/AllEmployees";
import AllRooms from "./components/AllRooms";
import AdminDashboard from "./components/AdminDashboard";
import CancelledMeetings from "./components/CancelledMeetings";
import PastMeetings from "./components/PastMeetings";
import IntroSlider from "./IntroSlider";
import MeetingDetails from "./components/MeetingDetails";
import ZoomMeeting from "./components/ZoomMeeting";
import VideoConference from "./components/VideoConference";
import Login from "./components/Auth/Login";
import Register from "./components/Auth/Register";
import ProtectedRoute from "./components/Auth/ProtectedRoute";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { meetingAPI, teamAPI } from "./services/api";
import "./App.css";

function AppContent() {
  const { isAuthenticated, loading: authLoading } = useAuth();
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
    | "calendar"
    | "meetings"
    | "teams"
    | "availability"
    | "employees"
    | "rooms"
    | "admin"
  >("calendar");
  const [activeTeamTab, setActiveTeamTab] = useState<
    "overview" | "management" | "dashboard"
  >("overview");
  const [showIntro, setShowIntro] = useState(true);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState<{
    title: string;
    message: string;
    type: "success" | "warning";
  } | null>(null);

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

      // Check if user is authenticated
      if (!isAuthenticated) {
        setError(
          "You must be logged in to book a meeting. Please login first."
        );
        return;
      }

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

      // Find team by _id and get its ID
      if (!booking.teamId) {
        throw new Error("No team selected for booking.");
      }
      const selectedTeam = teams.find((team) => team._id === booking.teamId);
      if (!selectedTeam) {
        throw new Error(
          `Team with ID "${booking.teamId}" not found. Please select a valid team.`
        );
      }

      console.log("Booking data received:", booking);
      console.log("Selected team:", selectedTeam);

      const meetingData = {
        title: booking.title,
        description: `Meeting for ${selectedTeam.name}`,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        duration,
        teamId: booking.teamId, // Now always a string
        room: booking.room,
        attendees: booking.attendees || [],
        status: "scheduled",
      };

      console.log("Meeting data to send:", meetingData);

      const response = await meetingAPI.create(meetingData);

      // Handle the new response format
      const newMeeting = response.meeting || response;
      setMeetings((prev) => [...prev, newMeeting]);

      // Show custom success modal instead of browser alert
      let message = "Your meeting has been scheduled.";
      let type: "success" | "warning" = "success";

      if (response.warning) {
        message = response.warning.message;
        type = "warning";
      }

      // Add email notification information
      if (response.emailNotifications) {
        const { total, successful, failed } = response.emailNotifications;
        if (successful > 0) {
          message += `\n\n📧 Email notifications sent to ${successful} out of ${total} attendees.`;
          if (failed > 0) {
            message += `\n⚠️ Failed to send ${failed} email(s).`;
          }
        } else if (failed > 0) {
          message += `\n\n⚠️ Failed to send email notifications to ${failed} attendees.`;
        }
      }

      setSuccessMessage({
        title: "Meeting Booked Successfully!",
        message: message,
        type: type,
      });
      setShowSuccessModal(true);

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
    { id: "cancelled", label: "Cancelled", icon: "❌" },
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

  // Removed loading screen - app will load directly

  if (showIntro && teams.length > 0) {
    return <IntroSlider teams={teams} onFinish={() => setShowIntro(false)} />;
  }

  // Show loading while authentication is being checked
  if (authLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  // If not authenticated, show intro or redirect to login
  if (!isAuthenticated) {
    return (
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Navigate to="/calendar" replace />} />
          <Route
            path="calendar"
            element={
              <ProtectedRoute>
                <Calendar teams={teams} onBookingSubmit={handleBookingSubmit} />
              </ProtectedRoute>
            }
          />
          <Route
            path="meetings"
            element={
              <ProtectedRoute>
                <MeetingList
                  meetings={meetings}
                  teams={teams}
                  onDeleteMeeting={handleDeleteMeeting}
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="cancelled"
            element={
              <ProtectedRoute>
                <CancelledMeetings />
              </ProtectedRoute>
            }
          />
          <Route
            path="zoom"
            element={
              <ProtectedRoute>
                <ZoomMeeting />
              </ProtectedRoute>
            }
          />
          <Route
            path="video-conference"
            element={
              <ProtectedRoute>
                <VideoConference />
              </ProtectedRoute>
            }
          />
          <Route
            path="video-conference/:roomId"
            element={
              <ProtectedRoute>
                <VideoConference />
              </ProtectedRoute>
            }
          />
          <Route
            path="past-meetings"
            element={
              <ProtectedRoute>
                <PastMeetings meetings={meetings} teams={teams} />
              </ProtectedRoute>
            }
          />
          <Route
            path="teams"
            element={
              <ProtectedRoute>
                <TeamOverview />
              </ProtectedRoute>
            }
          />
          <Route
            path="availability"
            element={
              <ProtectedRoute>
                <AllEmployeesAvailability />
              </ProtectedRoute>
            }
          />
          <Route
            path="employees"
            element={
              <ProtectedRoute>
                <AllEmployees teams={teams} />
              </ProtectedRoute>
            }
          />
          <Route
            path="rooms"
            element={
              <ProtectedRoute>
                <AllRooms teams={teams} />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin"
            element={
              <ProtectedRoute>
                <AdminDashboard teams={teams} />
              </ProtectedRoute>
            }
          />
        </Route>
        <Route
          path="/meeting/:id"
          element={
            <ProtectedRoute>
              <MeetingDetails />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/calendar" replace />} />
      </Routes>

      {/* Custom Success Modal */}
      {showSuccessModal && successMessage && (
        <div
          className="modal-overlay"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <div
            className="modal-dialog"
            style={{
              background: "white",
              borderRadius: "12px",
              padding: "24px",
              maxWidth: "500px",
              width: "90%",
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
              position: "relative",
            }}
          >
            <button
              className="modal-close"
              onClick={() => setShowSuccessModal(false)}
              style={{
                position: "absolute",
                top: "12px",
                right: "16px",
                background: "none",
                border: "none",
                fontSize: "24px",
                cursor: "pointer",
                color: "#666",
                width: "32px",
                height: "32px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "50%",
                transition: "background-color 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#f0f0f0";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              ×
            </button>

            <div style={{ textAlign: "center", marginBottom: "20px" }}>
              <div
                style={{
                  fontSize: "48px",
                  marginBottom: "16px",
                  color:
                    successMessage.type === "warning" ? "#f59e0b" : "#10b981",
                }}
              >
                {successMessage.type === "warning" ? "⚠️" : "✅"}
              </div>
              <h3
                style={{
                  margin: "0 0 12px 0",
                  color: "#333",
                  fontSize: "20px",
                  fontWeight: "600",
                }}
              >
                {successMessage.title}
              </h3>
              <div
                style={{
                  margin: "0",
                  color: "#666",
                  fontSize: "14px",
                  lineHeight: "1.6",
                  textAlign: "left",
                  whiteSpace: "pre-line",
                }}
              >
                {successMessage.message}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "12px",
              }}
            >
              <button
                onClick={() => setShowSuccessModal(false)}
                style={{
                  background:
                    successMessage.type === "warning" ? "#f59e0b" : "#10b981",
                  color: "white",
                  border: "none",
                  padding: "12px 24px",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "opacity 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = "0.8";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = "1";
                }}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
