import React, { useState, useRef, useEffect } from "react";
import { Booking } from "../types";
import { meetingRooms } from "../data/teams";
import "./Calendar.css";
import {
  FaRegClock,
  FaUsers,
  FaDoorOpen,
  FaCalendarAlt,
  FaEdit,
  FaTrash,
  FaCopy,
  FaTimes,
  FaVideo,
} from "react-icons/fa";

interface TimeSlot {
  id: string;
  time: string;
  displayTime?: string;
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
  const [selectedStartSlot, setSelectedStartSlot] = useState<string>("");
  const [selectedEndSlot, setSelectedEndSlot] = useState<string>("");
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
  const [roomBusyMap, setRoomBusyMap] = useState<{
    [room: string]: boolean;
  }>({});
  const [checkingAvailability, setCheckingAvailability] =
    useState<boolean>(false);
  const [dayMeetings, setDayMeetings] = useState<any[]>([]);
  const [showDayMeetings, setShowDayMeetings] = useState(false);
  const [detailsMeeting, setDetailsMeeting] = useState<any | null>(null);
  const detailsModalRef = useRef<HTMLDivElement>(null);

  // Focus trap for details modal
  useEffect(() => {
    if (detailsMeeting && detailsModalRef.current) {
      detailsModalRef.current.focus();
    }
  }, [detailsMeeting]);

  // Debug memberBusyMap changes
  useEffect(() => {
    console.log("memberBusyMap changed:", memberBusyMap);
  }, [memberBusyMap]);

  // Debug roomBusyMap changes
  useEffect(() => {
    console.log("roomBusyMap changed:", roomBusyMap);
  }, [roomBusyMap]);

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
        setCheckingAvailability(false);
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

      setCheckingAvailability(true);
      const busyMap: { [member: string]: boolean } = {};
      await Promise.all(
        teamObj.members.map(async (member) => {
          try {
            // Format date consistently to avoid timezone issues
            const checkYear = selectedDate.getFullYear();
            const checkMonth = String(selectedDate.getMonth() + 1).padStart(
              2,
              "0"
            );
            const checkDay = String(selectedDate.getDate()).padStart(2, "0");
            const checkFormattedDate = `${checkYear}-${checkMonth}-${checkDay}`;

            const url = `http://localhost:5000/api/meetings/check-member-availability?member=${encodeURIComponent(
              member
            )}&date=${checkFormattedDate}&startTime=${selectedStartTime}&endTime=${selectedEndTime}`;

            console.log(`Checking availability for ${member}:`, url);

            const response = await fetch(url);
            if (response.ok) {
              const data = await response.json();
              console.log(`Response for ${member}:`, data);
              busyMap[member] = data.status === "busy";
            } else {
              console.error(
                `Error checking ${member}:`,
                response.status,
                response.statusText
              );
              busyMap[member] = false;
            }
          } catch (error) {
            console.error(`Exception checking ${member}:`, error);
            busyMap[member] = false;
          }
        })
      );
      console.log("Final busy map:", busyMap);
      console.log("Setting memberBusyMap state with:", busyMap);
      setMemberBusyMap(busyMap);

      // Check room availability
      const roomBusyMap: { [room: string]: boolean } = {};
      await Promise.all(
        meetingRooms.map(async (room) => {
          try {
            // Format date consistently to avoid timezone issues
            const checkYear = selectedDate.getFullYear();
            const checkMonth = String(selectedDate.getMonth() + 1).padStart(
              2,
              "0"
            );
            const checkDay = String(selectedDate.getDate()).padStart(2, "0");
            const checkFormattedDate = `${checkYear}-${checkMonth}-${checkDay}`;

            const url = `http://localhost:5000/api/meetings/check-room-availability?room=${encodeURIComponent(
              room
            )}&date=${checkFormattedDate}&startTime=${selectedStartTime}&endTime=${selectedEndTime}`;

            console.log(`Checking room availability for ${room}:`, url);

            const response = await fetch(url);
            if (response.ok) {
              const data = await response.json();
              console.log(`Room response for ${room}:`, data);
              roomBusyMap[room] = data.status === "busy";
            } else {
              console.error(
                `Error checking room ${room}:`,
                response.status,
                response.statusText
              );
              roomBusyMap[room] = false;
            }
          } catch (error) {
            console.error(`Exception checking room ${room}:`, error);
            roomBusyMap[room] = false;
          }
        })
      );

      console.log("Final room busy map:", roomBusyMap);
      setRoomBusyMap(roomBusyMap);
      setCheckingAvailability(false);

      // Auto-deselect any busy members from selectedAttendees
      setSelectedAttendees((prev) => prev.filter((member) => !busyMap[member]));

      // Log the selected date and time for debugging
      const debugYear = selectedDate.getFullYear();
      const debugMonth = String(selectedDate.getMonth() + 1).padStart(2, "0");
      const debugDay = String(selectedDate.getDate()).padStart(2, "0");
      const debugFormattedDate = `${debugYear}-${debugMonth}-${debugDay}`;
      console.log("Selected date for booking:", debugFormattedDate);
      console.log(
        "Selected time range:",
        selectedStartTime,
        "-",
        selectedEndTime
      );
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

  // Generate 15-minute time slots from 9:00 AM to 6:00 PM
  const generateTimeSlots = () => {
    const slots: TimeSlot[] = [];
    const startHour = 9; // 9 AM
    const endHour = 18; // 6 PM

    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const time = `${hour.toString().padStart(2, "0")}:${minute
          .toString()
          .padStart(2, "0")}`;
        const displayTime = new Date(
          `2000-01-01T${time}:00`
        ).toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        });

        slots.push({
          id: `${hour}-${minute}`,
          time: time,
          displayTime: displayTime,
          available: true,
        });
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  // Helper function to check if a time slot is available (at least 2 hours in advance)
  const isTimeSlotAvailable = (slot: TimeSlot) => {
    const now = new Date();
    const selectedDateTime = new Date(selectedDate);
    const [startHour, startMinute] = slot.time.split(":").map(Number);
    selectedDateTime.setHours(startHour, startMinute, 0, 0);

    const timeDifference = selectedDateTime.getTime() - now.getTime();
    const hoursDifference = timeDifference / (1000 * 60 * 60);

    return hoursDifference >= 2;
  };

  const handleDateClick = async (date: Date) => {
    setSelectedDate(date);
    // Fetch meetings for this date
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const localDateString = `${year}-${month}-${day}`;
    try {
      const response = await fetch(
        `http://localhost:5000/api/meetings?startDate=${localDateString}&endDate=${localDateString}`
      );
      const data = await response.json();
      setDayMeetings(data.meetings || []);
    } catch (error) {
      setDayMeetings([]);
    }
    setShowDayMeetings(true);
  };

  const handleTimeSlotSelect = (slotId: string, isStart: boolean) => {
    const slot = timeSlots.find((s) => s.id === slotId);
    if (!slot) return;

    // Check if this time slot is at least 2 hours in advance
    const now = new Date();
    const selectedDateTime = new Date(selectedDate);
    const [startHour, startMinute] = slot.time.split(":").map(Number);
    selectedDateTime.setHours(startHour, startMinute, 0, 0);

    const timeDifference = selectedDateTime.getTime() - now.getTime();
    const hoursDifference = timeDifference / (1000 * 60 * 60);

    if (hoursDifference < 2) {
      alert("Meetings must be booked at least 2 hours in advance.");
      return;
    }

    if (isStart) {
      setSelectedStartSlot(slotId);
      setSelectedStartTime(slot.time);
      // Reset end slot if it's before the new start slot
      if (selectedEndSlot && slotId >= selectedEndSlot) {
        setSelectedEndSlot("");
        setSelectedEndTime("");
      }
    } else {
      // Only allow end slot selection if start slot is selected and end slot is after start slot
      if (selectedStartSlot && slotId > selectedStartSlot) {
        setSelectedEndSlot(slotId);
        setSelectedEndTime(slot.time);
      }
    }
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
        // Format date consistently to avoid timezone issues
        const conflictYear = selectedDate.getFullYear();
        const conflictMonth = String(selectedDate.getMonth() + 1).padStart(
          2,
          "0"
        );
        const conflictDay = String(selectedDate.getDate()).padStart(2, "0");
        const conflictFormattedDate = `${conflictYear}-${conflictMonth}-${conflictDay}`;

        const response = await fetch(
          `http://localhost:5000/api/meetings/check-member-availability?member=${encodeURIComponent(
            member
          )}&date=${conflictFormattedDate}&startTime=${selectedStartTime}&endTime=${selectedEndTime}`
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
      // Check if meeting is at least 2 hours in advance
      const now = new Date();
      const selectedDateTime = new Date(selectedDate);
      const [advanceStartHour, advanceStartMinute] = selectedStartTime
        .split(":")
        .map(Number);
      selectedDateTime.setHours(advanceStartHour, advanceStartMinute, 0, 0);

      const timeDifference = selectedDateTime.getTime() - now.getTime();
      const hoursDifference = timeDifference / (1000 * 60 * 60);

      if (hoursDifference < 2) {
        alert("Meetings must be booked at least 2 hours in advance.");
        return;
      }

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
      console.log("=== FINAL VALIDATION ===");
      const finalYear = selectedDate.getFullYear();
      const finalMonth = String(selectedDate.getMonth() + 1).padStart(2, "0");
      const finalDay = String(selectedDate.getDate()).padStart(2, "0");
      const finalFormattedDate = `${finalYear}-${finalMonth}-${finalDay}`;
      console.log("Selected date:", finalFormattedDate);
      console.log(
        "Selected time range:",
        selectedStartTime,
        "-",
        selectedEndTime
      );
      console.log("Selected attendees:", selectedAttendees);
      console.log("Selected room:", selectedRoom);

      for (const member of selectedAttendees) {
        // Format date consistently to avoid timezone issues
        const validationYear = selectedDate.getFullYear();
        const validationMonth = String(selectedDate.getMonth() + 1).padStart(
          2,
          "0"
        );
        const validationDay = String(selectedDate.getDate()).padStart(2, "0");
        const validationFormattedDate = `${validationYear}-${validationMonth}-${validationDay}`;

        const url = `http://localhost:5000/api/meetings/check-member-availability?member=${encodeURIComponent(
          member
        )}&date=${validationFormattedDate}&startTime=${selectedStartTime}&endTime=${selectedEndTime}`;

        console.log(`Checking final availability for ${member}:`, url);

        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          console.log(`Final validation response for ${member}:`, data);
          if (data.status === "busy") {
            busyAttendees.push(member);
            console.log(`${member} is busy during final validation`);
          }
        } else {
          console.error(
            `Error in final validation for ${member}:`,
            response.status,
            response.statusText
          );
        }
      }

      // Check if selected room is busy
      if (selectedRoom) {
        const validationYear = selectedDate.getFullYear();
        const validationMonth = String(selectedDate.getMonth() + 1).padStart(
          2,
          "0"
        );
        const validationDay = String(selectedDate.getDate()).padStart(2, "0");
        const validationFormattedDate = `${validationYear}-${validationMonth}-${validationDay}`;

        const roomUrl = `http://localhost:5000/api/meetings/check-room-availability?room=${encodeURIComponent(
          selectedRoom
        )}&date=${validationFormattedDate}&startTime=${selectedStartTime}&endTime=${selectedEndTime}`;

        console.log(
          `Checking final room availability for ${selectedRoom}:`,
          roomUrl
        );

        const roomResponse = await fetch(roomUrl);
        if (roomResponse.ok) {
          const roomData = await roomResponse.json();
          console.log(
            `Final room validation response for ${selectedRoom}:`,
            roomData
          );
          if (roomData.status === "busy") {
            alert(
              `Cannot book meeting. The selected room "${selectedRoom}" is busy during the selected time.`
            );
            return;
          }
        } else {
          console.error(
            `Error in final room validation for ${selectedRoom}:`,
            roomResponse.status,
            roomResponse.statusText
          );
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
      setSelectedStartSlot("");
      setSelectedEndSlot("");
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

  // Before rendering, compute today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split("T")[0];
  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);

  // Helper for avatar color
  const avatarColors = [
    "#6C63FF",
    "#FF6584",
    "#43E6FC",
    "#FFD166",
    "#06D6A0",
    "#FFB703",
    "#EF476F",
    "#118AB2",
  ];
  const getAvatarColor = (name: string) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++)
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return avatarColors[Math.abs(hash) % avatarColors.length];
  };

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

            {days.map((day, index) => {
              const isPast = day && day < todayDate;
              if (!day) {
                return <div key={index} className="calendar-day empty"></div>;
              }
              return (
                <div
                  key={index}
                  className={`calendar-day ${
                    day.toDateString() === new Date().toDateString()
                      ? "today"
                      : ""
                  } ${isPast ? "disabled" : ""}`}
                  onClick={() => !isPast && handleDateClick(day)}
                  style={isPast ? { pointerEvents: "none", opacity: 0.4 } : {}}
                >
                  {day.getDate()}
                </div>
              );
            })}
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
                <label>Select Time Slots:</label>
                <div
                  style={{
                    background: "#e3f2fd",
                    border: "1px solid #bbdefb",
                    borderRadius: "6px",
                    padding: "8px 12px",
                    marginBottom: "15px",
                    fontSize: "12px",
                    color: "#1976d2",
                  }}
                >
                  ⏰ <strong>Booking Policy:</strong> Meetings must be booked at
                  least 2 hours in advance
                </div>
                <div className="time-slots-container">
                  <div className="time-slots-section">
                    <h4>Start Time:</h4>
                    <div className="time-slots-grid">
                      {timeSlots.map((slot) => {
                        const isAvailable = isTimeSlotAvailable(slot);
                        return (
                          <button
                            key={slot.id}
                            type="button"
                            className={`time-slot-btn ${
                              selectedStartSlot === slot.id ? "selected" : ""
                            } ${!isAvailable ? "unavailable" : ""}`}
                            onClick={() => handleTimeSlotSelect(slot.id, true)}
                            disabled={!isAvailable}
                            title={
                              !isAvailable
                                ? "Must book at least 2 hours in advance"
                                : ""
                            }
                          >
                            {slot.displayTime}
                            {!isAvailable && (
                              <span className="unavailable-indicator">⚠️</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="time-slots-section">
                    <h4>End Time:</h4>
                    <div className="time-slots-grid">
                      {timeSlots
                        .filter(
                          (slot) =>
                            !selectedStartSlot || slot.id > selectedStartSlot
                        )
                        .map((slot) => {
                          const isAvailable = isTimeSlotAvailable(slot);
                          return (
                            <button
                              key={slot.id}
                              type="button"
                              className={`time-slot-btn ${
                                selectedEndSlot === slot.id ? "selected" : ""
                              } ${!isAvailable ? "unavailable" : ""}`}
                              onClick={() =>
                                handleTimeSlotSelect(slot.id, false)
                              }
                              disabled={!selectedStartSlot || !isAvailable}
                              title={
                                !isAvailable
                                  ? "Must book at least 2 hours in advance"
                                  : ""
                              }
                            >
                              {slot.displayTime}
                              {!isAvailable && (
                                <span className="unavailable-indicator">
                                  ⚠️
                                </span>
                              )}
                            </button>
                          );
                        })}
                    </div>
                  </div>
                </div>

                {selectedStartTime && selectedEndTime && (
                  <div className="selected-time-display">
                    <strong>Selected Time:</strong> {selectedStartTime} -{" "}
                    {selectedEndTime}
                    <br />
                    <small>
                      Duration:{" "}
                      {Math.round(
                        (new Date(
                          `2000-01-01T${selectedEndTime}:00`
                        ).getTime() -
                          new Date(
                            `2000-01-01T${selectedStartTime}:00`
                          ).getTime()) /
                          (1000 * 60)
                      )}{" "}
                      minutes
                    </small>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Select Room:</label>
                <select
                  value={selectedRoom}
                  onChange={(e) => setSelectedRoom(e.target.value)}
                  required
                >
                  <option value="">Choose a room</option>
                  {meetingRooms.map((room) => {
                    const isBusy = roomBusyMap[room];
                    return (
                      <option
                        key={room}
                        value={room}
                        disabled={isBusy}
                        style={{
                          color: isBusy ? "#dc2626" : "inherit",
                          fontStyle: isBusy ? "italic" : "normal",
                        }}
                      >
                        {room} {isBusy ? "(Busy)" : ""}
                      </option>
                    );
                  })}
                </select>
                {selectedRoom && roomBusyMap[selectedRoom] && (
                  <div
                    style={{
                      color: "#dc2626",
                      fontSize: "12px",
                      marginTop: "4px",
                      padding: "4px 8px",
                      backgroundColor: "#fef2f2",
                      border: "1px solid #fecaca",
                      borderRadius: "4px",
                    }}
                  >
                    ⚠️ This room is busy during the selected time
                  </div>
                )}
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
                          ?.members.map((member) => {
                            console.log(
                              `Rendering member ${member}, busy status:`,
                              memberBusyMap[member]
                            );
                            return (
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
                                <span className="attendee-name">
                                  {member}
                                  {!selectedStartTime || !selectedEndTime ? (
                                    <span
                                      style={{
                                        color: "#6b7280",
                                        fontSize: 10,
                                        marginLeft: 4,
                                      }}
                                    >
                                      (Select time to check availability)
                                    </span>
                                  ) : checkingAvailability ? (
                                    <span
                                      style={{
                                        color: "#059669",
                                        fontSize: 10,
                                        marginLeft: 4,
                                      }}
                                    >
                                      🔄 Checking...
                                    </span>
                                  ) : (
                                    <span
                                      style={{
                                        color: "#6b7280",
                                        fontSize: 10,
                                        marginLeft: 4,
                                      }}
                                    >
                                      (Status:{" "}
                                      {memberBusyMap[member] ? "Busy" : "Free"})
                                    </span>
                                  )}
                                </span>
                                {memberBusyMap[member] && (
                                  <span
                                    style={{
                                      color: "#dc2626",
                                      fontSize: 12,
                                      marginLeft: 6,
                                      fontWeight: "bold",
                                      backgroundColor: "#fef2f2",
                                      padding: "2px 6px",
                                      borderRadius: "4px",
                                      border: "1px solid #fecaca",
                                    }}
                                    title="This member is busy during the selected time."
                                  >
                                    ⚠️ Busy
                                  </span>
                                )}
                              </label>
                            );
                          })}
                      </div>
                    )}
                  {!selectedTeam && (
                    <p className="select-team-first">
                      Please select a team first to see available members
                    </p>
                  )}
                </div>
              </div>

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
      {showDayMeetings && (
        <div
          className="modal-overlay animated-fade"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="modal-dialog enhanced-modal animated-slide"
            tabIndex={-1}
          >
            <button
              className="modal-close"
              aria-label="Close"
              onClick={() => setShowDayMeetings(false)}
            >
              <FaTimes />
            </button>
            <div className="modal-header">
              <FaCalendarAlt style={{ marginRight: 8 }} />
              Meetings on {selectedDate.toDateString()}
            </div>
            {dayMeetings.length === 0 ? (
              <p className="no-meetings">No meetings booked for this day.</p>
            ) : (
              <ul className="meeting-list">
                {dayMeetings.map((meeting, idx) => (
                  <li
                    key={meeting._id}
                    className="meeting-item"
                    style={{
                      borderLeft: `6px solid ${
                        avatarColors[idx % avatarColors.length]
                      }`,
                    }}
                  >
                    <div className="meeting-title-row">
                      <div className="meeting-title">{meeting.title}</div>
                    </div>
                    <div className="meeting-time">
                      <FaRegClock style={{ marginRight: 4 }} />
                      {meeting.startTime} - {meeting.endTime}
                    </div>
                    <div className="meeting-room">
                      <FaDoorOpen style={{ marginRight: 4 }} />
                      Room: {meeting.room}
                    </div>
                    <div className="meeting-attendees">
                      <FaUsers style={{ marginRight: 4 }} />
                      Attendees: {(meeting.attendees || []).join(", ")}
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <div className="modal-actions">
              <button
                className="btn-primary"
                onClick={() => {
                  setShowDayMeetings(false);
                  setShowBookingForm(true);
                }}
              >
                Book New Meeting
              </button>
              <button
                className="btn-secondary"
                onClick={() => setShowDayMeetings(false)}
              >
                Close
              </button>
            </div>
          </div>
          {/* Details Modal */}
          {detailsMeeting && (
            <div
              className="modal-overlay details-modal-overlay animated-fade"
              role="dialog"
              aria-modal="true"
            >
              <div
                className="modal-dialog details-modal animated-slide"
                tabIndex={0}
                ref={detailsModalRef}
                onKeyDown={(e) => {
                  if (e.key === "Escape") setDetailsMeeting(null);
                }}
              >
                <button
                  className="modal-close"
                  aria-label="Close"
                  onClick={() => setDetailsMeeting(null)}
                >
                  <FaTimes />
                </button>
                <div className="modal-header">
                  <FaCalendarAlt style={{ marginRight: 8 }} />
                  Meeting Details
                </div>
                <div className="details-section">
                  <div className="details-title">{detailsMeeting.title}</div>
                  <div className="details-row">
                    <FaRegClock style={{ marginRight: 4 }} />{" "}
                    {detailsMeeting.startTime} - {detailsMeeting.endTime}
                  </div>
                  <div className="details-row">
                    <FaDoorOpen style={{ marginRight: 4 }} /> Room:{" "}
                    {detailsMeeting.room}
                  </div>
                  <div className="details-row">
                    <FaUsers style={{ marginRight: 4 }} /> Attendees:
                    <div className="attendee-names-list">
                      {(detailsMeeting.attendees || []).map((att: string) => (
                        <span key={att} className="attendee-name-label">
                          {att}
                        </span>
                      ))}
                    </div>
                  </div>
                  {detailsMeeting.description && (
                    <div className="details-row">
                      <strong>Description:</strong> {detailsMeeting.description}
                    </div>
                  )}
                  {detailsMeeting.teamName && (
                    <div className="details-row">
                      <strong>Team:</strong> {detailsMeeting.teamName}
                    </div>
                  )}
                  {/* Example: If virtual, show join button */}
                  {detailsMeeting.isVirtual && (
                    <div className="details-row">
                      <button className="btn-join">
                        <FaVideo style={{ marginRight: 4 }} />
                        Join Meeting
                      </button>
                    </div>
                  )}
                </div>
                <div className="details-actions">
                  <button
                    className="btn-copy"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `Meeting: ${detailsMeeting.title}\nTime: ${
                          detailsMeeting.startTime
                        } - ${detailsMeeting.endTime}\nRoom: ${
                          detailsMeeting.room
                        }\nAttendees: ${(detailsMeeting.attendees || []).join(
                          ", "
                        )}`
                      );
                    }}
                  >
                    <FaCopy style={{ marginRight: 4 }} />
                    Copy Details
                  </button>
                  <button
                    className="btn-edit"
                    onClick={() => alert("Edit feature coming soon!")}
                  >
                    <FaEdit style={{ marginRight: 4 }} />
                    Edit
                  </button>
                  <button
                    className="btn-cancel"
                    onClick={() => {
                      if (
                        window.confirm(
                          "Are you sure you want to cancel this meeting?"
                        )
                      )
                        alert("Cancel feature coming soon!");
                    }}
                  >
                    <FaTrash style={{ marginRight: 4 }} />
                    Cancel
                  </button>
                  <button
                    className="btn-secondary"
                    onClick={() => setDetailsMeeting(null)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Calendar;
