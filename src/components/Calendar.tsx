import React, { useState } from "react";
import { Booking } from "../types";
import { meetingRooms } from "../data/teams";
import "./Calendar.css";

interface TimeSlot {
  id: string;
  time: string;
  available: boolean;
  bookedBy?: string;
}

interface Team {
  _id: string;
  name: string;
  project: string;
  lead: string;
  members: string[];
  status: string;
  color: string;
}

interface MemberConflict {
  member: string;
  conflicts: Array<{
    title: string;
    startTime: string;
    endTime: string;
    teamName: string;
    room: string;
  }>;
}

interface CalendarProps {
  onBookingSubmit?: (booking: Booking) => void;
  teams?: Team[];
}

const Calendar: React.FC<CalendarProps> = ({ onBookingSubmit, teams = [] }) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedStartTime, setSelectedStartTime] = useState<string>("");
  const [selectedEndTime, setSelectedEndTime] = useState<string>("");
  const [selectedTeam, setSelectedTeam] = useState<string>("");
  const [meetingTitle, setMeetingTitle] = useState<string>("");
  const [showBookingForm, setShowBookingForm] = useState<boolean>(false);
  const [selectedRoom, setSelectedRoom] = useState<string>("");
  const [selectedAttendees, setSelectedAttendees] = useState<string[]>([]);
  const [memberConflicts, setMemberConflicts] = useState<MemberConflict[]>([]);
  const [checkingConflicts, setCheckingConflicts] = useState<boolean>(false);
  const [memberBusyMap, setMemberBusyMap] = useState<{
    [member: string]: boolean;
  }>({});

  // Check each member's availability when team, start, or end time changes
  React.useEffect(() => {
    const checkAllMembers = async () => {
      if (
        !selectedTeam ||
        !selectedDate ||
        !selectedStartTime ||
        !selectedEndTime
      ) {
        setMemberBusyMap({});
        return;
      }
      // Validate time format (HH:mm or HH:mm:ss)
      const timeRegex = /^([01][0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;
      if (
        !timeRegex.test(selectedStartTime) ||
        !timeRegex.test(selectedEndTime)
      ) {
        setMemberBusyMap({});
        return;
      }
      // Ensure end time is after start time
      const [startHour, startMinute] = selectedStartTime.split(":").map(Number);
      const [endHour, endMinute] = selectedEndTime.split(":").map(Number);
      if (
        endHour < startHour ||
        (endHour === startHour && endMinute <= startMinute)
      ) {
        setMemberBusyMap({});
        return;
      }
      const teamObj = teams.find((t) => t.name === selectedTeam);
      if (!teamObj) return;
      const busyMap: { [member: string]: boolean } = {};
      await Promise.all(
        teamObj.members.map(async (member) => {
          const response = await fetch(
            `http://localhost:5000/api/meetings/check-member-availability?member=${encodeURIComponent(
              member
            )}&date=${
              selectedDate.toISOString().split("T")[0]
            }&startTime=${selectedStartTime}&endTime=${selectedEndTime}`
          );
          if (response.ok) {
            const data = await response.json();
            busyMap[member] = data.status === "busy";
          } else {
            busyMap[member] = false;
          }
        })
      );
      setMemberBusyMap(busyMap);
      // Auto-deselect any busy members from selectedAttendees
      setSelectedAttendees((prev) => prev.filter((member) => !busyMap[member]));
    };
    checkAllMembers();
  }, [selectedTeam, selectedDate, selectedStartTime, selectedEndTime, teams]);

  // Generate calendar days
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const timeSlots: TimeSlot[] = [
    { id: "1", time: "09:00 AM", available: true },
    { id: "2", time: "10:00 AM", available: true },
    { id: "3", time: "11:00 AM", available: true },
    { id: "4", time: "12:00 PM", available: false, bookedBy: "Team Alpha" },
    { id: "5", time: "01:00 PM", available: true },
    { id: "6", time: "02:00 PM", available: true },
    { id: "7", time: "03:00 PM", available: false, bookedBy: "Team Beta" },
    { id: "8", time: "04:00 PM", available: true },
    { id: "9", time: "05:00 PM", available: true },
  ];

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setShowBookingForm(true);
  };

  const checkMemberConflicts = async () => {
    if (
      !selectedAttendees.length ||
      !selectedDate ||
      !selectedStartTime ||
      !selectedEndTime
    ) {
      return;
    }

    setCheckingConflicts(true);
    setMemberConflicts([]);

    try {
      const conflicts: MemberConflict[] = [];

      for (const member of selectedAttendees) {
        const response = await fetch(
          `http://localhost:5000/api/meetings/check-member-availability?member=${encodeURIComponent(
            member
          )}&date=${
            selectedDate.toISOString().split("T")[0]
          }&startTime=${selectedStartTime}&endTime=${selectedEndTime}`
        );

        if (response.ok) {
          const data = await response.json();
          if (data.status === "busy" && data.conflicts.length > 0) {
            conflicts.push({
              member,
              conflicts: data.conflicts.map((conflict: any) => ({
                title: conflict.title,
                startTime: conflict.startTime,
                endTime: conflict.endTime,
                teamName: conflict.teamId?.name || "Unknown Team",
                room: conflict.room,
              })),
            });
          }
        }
      }

      setMemberConflicts(conflicts);
    } catch (error) {
      console.error("Error checking member conflicts:", error);
    } finally {
      setCheckingConflicts(false);
    }
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      selectedStartTime &&
      selectedEndTime &&
      selectedTeam &&
      meetingTitle &&
      selectedRoom
    ) {
      // Validate end time is after start time
      const start = selectedStartTime;
      const end = selectedEndTime;
      if (end <= start) {
        alert("End time must be after start time.");
        return;
      }

      // Calculate duration in minutes
      const [startHour, startMinute] = start.split(":").map(Number);
      const [endHour, endMinute] = end.split(":").map(Number);
      const startTotalMinutes = startHour * 60 + startMinute;
      const endTotalMinutes = endHour * 60 + endMinute;
      const durationMinutes = endTotalMinutes - startTotalMinutes;

      if (durationMinutes < 15) {
        alert("Meeting duration must be at least 15 minutes.");
        return;
      }

      if (durationMinutes > 480) {
        alert("Meeting duration cannot exceed 8 hours (480 minutes).");
        return;
      }

      // Final validation: check if any selected attendee is busy
      const busyAttendees: string[] = [];
      for (const member of selectedAttendees) {
        const response = await fetch(
          `http://localhost:5000/api/meetings/check-member-availability?member=${encodeURIComponent(
            member
          )}&date=${
            selectedDate.toISOString().split("T")[0]
          }&startTime=${selectedStartTime}&endTime=${selectedEndTime}`
        );
        if (response.ok) {
          const data = await response.json();
          if (data.status === "busy") {
            busyAttendees.push(member);
          }
        }
      }
      if (busyAttendees.length > 0) {
        alert(
          `Cannot book meeting. The following attendees are busy during the selected time: \n${busyAttendees.join(
            ", "
          )}`
        );
        return;
      }

      // Check for member conflicts before booking
      await checkMemberConflicts();

      // If there are conflicts, show them but don't proceed
      if (memberConflicts.length > 0) {
        alert(
          `Cannot book meeting. ${memberConflicts.length} member(s) have conflicts. Please check the conflict details below.`
        );
        return;
      }

      console.log("Selected attendees before booking:", selectedAttendees);

      // Format date in local timezone to avoid timezone conversion issues
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
      const day = String(selectedDate.getDate()).padStart(2, "0");
      const localDateString = `${year}-${month}-${day}`;

      console.log(`Selected date: ${selectedDate.toDateString()}`);
      console.log(`Formatted date: ${localDateString}`);

      const booking = {
        date: localDateString,
        startTime: selectedStartTime,
        endTime: selectedEndTime,
        team: selectedTeam,
        title: meetingTitle,
        room: selectedRoom,
        attendees: selectedAttendees,
      };

      console.log("Booking object being sent:", booking);
      onBookingSubmit?.(booking);
      setShowBookingForm(false);
      setSelectedStartTime("");
      setSelectedEndTime("");
      setSelectedTeam("");
      setMeetingTitle("");
      setSelectedRoom("");
      setSelectedAttendees([]);
      setMemberConflicts([]);
    }
  };

  const formatDateTime = (dateString: string) => {
    try {
      const date = new Date(dateString);

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

      const formatted = `${
        monthNames[month - 1]
      } ${day}, ${year} ${displayHours}:${displayMinutes} ${ampm}`;
      console.log(
        `formatDateTime: "${dateString}" -> "${formatted}" (original time: ${hours}:${minutes})`
      );
      return formatted;
    } catch (error) {
      return "Invalid date";
    }
  };

  const days = getDaysInMonth(selectedDate);
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <h2>Calendar View</h2>
        <p>Select a date and time slot to book a meeting</p>
      </div>

      <div className="calendar-content">
        <div className="calendar-grid">
          <div className="calendar-nav">
            <button
              onClick={() =>
                setSelectedDate(
                  new Date(
                    selectedDate.getFullYear(),
                    selectedDate.getMonth() - 1
                  )
                )
              }
              className="nav-btn"
            >
              ‹
            </button>
            <h3>
              {monthNames[selectedDate.getMonth()]} {selectedDate.getFullYear()}
            </h3>
            <button
              onClick={() =>
                setSelectedDate(
                  new Date(
                    selectedDate.getFullYear(),
                    selectedDate.getMonth() + 1
                  )
                )
              }
              className="nav-btn"
            >
              ›
            </button>
          </div>

          <div className="calendar-days">
            <div className="day-header">Sun</div>
            <div className="day-header">Mon</div>
            <div className="day-header">Tue</div>
            <div className="day-header">Wed</div>
            <div className="day-header">Thu</div>
            <div className="day-header">Fri</div>
            <div className="day-header">Sat</div>

            {days.map((day, index) => (
              <div
                key={index}
                className={`calendar-day ${!day ? "empty" : ""} ${
                  day && day.toDateString() === new Date().toDateString()
                    ? "today"
                    : ""
                }`}
                onClick={() => day && handleDateClick(day)}
              >
                {day ? day.getDate() : ""}
              </div>
            ))}
          </div>
        </div>

        {showBookingForm && (
          <div className="booking-form">
            <h3>Book Meeting for {selectedDate.toDateString()}</h3>
            <form onSubmit={handleBookingSubmit}>
              <div className="form-group">
                <label>Meeting Title:</label>
                <input
                  type="text"
                  value={meetingTitle}
                  onChange={(e) => setMeetingTitle(e.target.value)}
                  placeholder="Enter meeting title"
                  required
                />
              </div>

              <div className="form-group">
                <label>Select Team:</label>
                <select
                  value={selectedTeam}
                  onChange={(e) => setSelectedTeam(e.target.value)}
                  required
                >
                  <option value="">Choose a team</option>
                  {teams.map((team) => (
                    <option key={team._id} value={team.name}>
                      {team.name} - {team.project}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Select Start Time:</label>
                <input
                  type="time"
                  value={selectedStartTime}
                  onChange={(e) => setSelectedStartTime(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Select End Time:</label>
                <input
                  type="time"
                  value={selectedEndTime}
                  onChange={(e) => setSelectedEndTime(e.target.value)}
                  required
                  min={selectedStartTime}
                  disabled={!selectedStartTime}
                />
              </div>

              <div className="form-group">
                <label>Select Room:</label>
                <select
                  value={selectedRoom}
                  onChange={(e) => setSelectedRoom(e.target.value)}
                  required
                >
                  <option value="">Choose a room</option>
                  {meetingRooms.map((room) => (
                    <option key={room} value={room}>
                      {room}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Select Attendees:</label>
                <div className="attendees-selection">
                  {selectedTeam &&
                    teams.find((t) => t.name === selectedTeam) && (
                      <div className="team-members">
                        <p className="team-members-label">Team Members:</p>
                        {teams
                          .find((t) => t.name === selectedTeam)
                          ?.members.map((member) => (
                            <label
                              key={member}
                              className="attendee-checkbox"
                              style={{
                                opacity: memberBusyMap[member] ? 0.5 : 1,
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={selectedAttendees.includes(member)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedAttendees([
                                      ...selectedAttendees,
                                      member,
                                    ]);
                                  } else {
                                    setSelectedAttendees(
                                      selectedAttendees.filter(
                                        (a) => a !== member
                                      )
                                    );
                                  }
                                }}
                                disabled={!!memberBusyMap[member]}
                              />
                              <span className="attendee-name">{member}</span>
                              {memberBusyMap[member] && (
                                <span
                                  style={{
                                    color: "#c00",
                                    fontSize: 12,
                                    marginLeft: 6,
                                  }}
                                  title="This member is busy during the selected time."
                                >
                                  Busy
                                </span>
                              )}
                            </label>
                          ))}
                      </div>
                    )}
                  {!selectedTeam && (
                    <p className="select-team-first">
                      Please select a team first to see available members
                    </p>
                  )}
                </div>
              </div>

              {selectedAttendees.length > 0 &&
                selectedDate &&
                selectedStartTime &&
                selectedEndTime && (
                  <div className="form-group">
                    <button
                      type="button"
                      onClick={checkMemberConflicts}
                      disabled={checkingConflicts}
                      className="btn-check-conflicts"
                    >
                      {checkingConflicts
                        ? "Checking..."
                        : "Check Member Conflicts"}
                    </button>
                  </div>
                )}

              {memberConflicts.length > 0 && (
                <div className="conflicts-section">
                  <h4>⚠️ Member Conflicts Detected</h4>
                  <p>The following members have conflicts during this time:</p>
                  {memberConflicts.map((conflict) => (
                    <div key={conflict.member} className="member-conflict">
                      <h5>{conflict.member}</h5>
                      <div className="conflict-meetings">
                        {conflict.conflicts.map((meeting, index) => (
                          <div key={index} className="conflict-meeting">
                            <strong>{meeting.title}</strong>
                            <p>Team: {meeting.teamName}</p>
                            <p>Room: {meeting.room}</p>
                            <p>
                              Time: {formatDateTime(meeting.startTime)} -{" "}
                              {formatDateTime(meeting.endTime)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="form-actions">
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={memberConflicts.length > 0}
                >
                  Book Meeting
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setShowBookingForm(false);
                    setMemberConflicts([]);
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Calendar;
