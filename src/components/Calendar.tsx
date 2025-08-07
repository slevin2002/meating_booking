import React, { useState, useRef, useEffect } from "react";
import { Booking } from "../types";
import { meetingRooms } from "../data/teams";
import "./Calendar.css";
import { API_CONFIG } from "../config/api";
import { useAuth } from "../contexts/AuthContext";
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
  FaInfoCircle,
  FaExclamationTriangle,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { userAPI } from "../services/api";
import Select, { MultiValue, OptionsOrGroups, GroupBase } from "react-select";
import { useCallback } from "react";

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
  const [roomBusyMap, setRoomBusyMap] = useState<{
    [room: string]: boolean;
  }>({});
  const [roomConflictDetails, setRoomConflictDetails] = useState<{
    [room: string]: Array<{
      title: string;
      startTime: string;
      endTime: string;
      teamName: string;
      attendees: string[];
    }>;
  }>({});
  const [checkingAvailability, setCheckingAvailability] =
    useState<boolean>(false);
  const [dayMeetings, setDayMeetings] = useState<any[]>([]);
  const [showDayMeetings, setShowDayMeetings] = useState(false);
  const [checkingRoomAvailability, setCheckingRoomAvailability] =
    useState<boolean>(false);
  const navigate = useNavigate();
  const [allEmployees, setAllEmployees] = useState<any[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  // Track employees added via dropdown
  const [dropdownAddedEmployees, setDropdownAddedEmployees] = useState<
    string[]
  >([]);
  // --- TEAM MEMBERS AVAILABILITY STATE ---
  const [memberBusyMap, setMemberBusyMap] = useState<{
    [member: string]: boolean;
  }>({});
  const [memberConflictDetails, setMemberConflictDetails] = useState<{
    [member: string]: { endTime: string }[];
  }>({});

  // --- DROPDOWN EMPLOYEE AVAILABILITY STATE ---
  const [employeeAvailability, setEmployeeAvailability] = useState<{
    [name: string]: { status: "busy" | "free"; endTime?: string };
  }>({});
  const [checkingDropdownAvailability, setCheckingDropdownAvailability] =
    useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  // OTP verification states for General Meeting
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [teamLeadInfo, setTeamLeadInfo] = useState<{
    name: string;
    email: string;
  } | null>(null);

  // Fetch all employees when booking form is opened
  useEffect(() => {
    if (showBookingForm) {
      setLoadingEmployees(true);
      userAPI
        .getAll({ limit: 1000 })
        .then((data) => {
          // Accepts both { users: [...] } and [...]
          const users = data.users || data;
          setAllEmployees(users);
        })
        .catch((err) => {
          setAllEmployees([]);
        })
        .finally(() => setLoadingEmployees(false));
    }
  }, [showBookingForm]);

  // Build unique list of all employees (team members + all employees)
  const uniqueEmployeeNames = React.useMemo(() => {
    // If "General meeting" is selected, include all employees
    if (selectedTeam === "general") {
      return allEmployees.map((emp) => emp.name);
    }

    const teamMemberNames =
      selectedTeam && teams.find((t) => t._id === selectedTeam)
        ? teams.find((t) => t._id === selectedTeam)!.members
        : [];
    const allNames = [
      ...teamMemberNames,
      ...allEmployees.map((emp) => emp.name),
    ];
    // Remove duplicates
    return Array.from(new Set(allNames));
  }, [selectedTeam, teams, allEmployees]);

  // On date/time/team change, check availability for all unique employees
  useEffect(() => {
    if (!selectedDate || !selectedStartTime || !selectedEndTime) {
      setEmployeeAvailability({});
      return;
    }
    setCheckingDropdownAvailability(true);
    const checkYear = selectedDate.getFullYear();
    const checkMonth = String(selectedDate.getMonth() + 1).padStart(2, "0");
    const checkDay = String(selectedDate.getDate()).padStart(2, "0");
    const checkFormattedDate = `${checkYear}-${checkMonth}-${checkDay}`;
    (async () => {
      const availabilityMap: {
        [name: string]: { status: "busy" | "free"; endTime?: string };
      } = {};
      await Promise.all(
        uniqueEmployeeNames.map(async (name) => {
          try {
            const url = `${
              API_CONFIG.BASE_URL
            }/api/meetings/check-member-availability?member=${encodeURIComponent(
              name
            )}&date=${checkFormattedDate}&startTime=${selectedStartTime}&endTime=${selectedEndTime}`;
            const response = await fetch(url);
            if (response.ok) {
              const data = await response.json();
              if (
                data.status === "busy" &&
                data.conflicts &&
                data.conflicts.length > 0
              ) {
                availabilityMap[name] = {
                  status: "busy",
                  endTime: data.conflicts[0].endTime,
                };
              } else {
                availabilityMap[name] = { status: data.status };
              }
            } else {
              availabilityMap[name] = { status: "free" };
            }
          } catch {
            availabilityMap[name] = { status: "free" };
          }
        })
      );
      setEmployeeAvailability(availabilityMap);
      setCheckingDropdownAvailability(false);
    })();
  }, [uniqueEmployeeNames, selectedDate, selectedStartTime, selectedEndTime]);

  // --- TEAM MEMBERS AVAILABILITY CHECK ---
  useEffect(() => {
    if (
      !selectedTeam ||
      !selectedDate ||
      !selectedStartTime ||
      !selectedEndTime
    ) {
      setMemberBusyMap({});
      setMemberConflictDetails({});
      return;
    }

    // For General meeting, check all employees
    const membersToCheck =
      selectedTeam === "general"
        ? allEmployees.map((emp) => emp.name)
        : teams.find((t) => t._id === selectedTeam)?.members || [];

    if (membersToCheck.length === 0) return;

    const checkYear = selectedDate.getFullYear();
    const checkMonth = String(selectedDate.getMonth() + 1).padStart(2, "0");
    const checkDay = String(selectedDate.getDate()).padStart(2, "0");
    const checkFormattedDate = `${checkYear}-${checkMonth}-${checkDay}`;
    (async () => {
      const busyMap: { [member: string]: boolean } = {};
      const conflictDetailsMap: { [member: string]: { endTime: string }[] } =
        {};
      await Promise.all(
        membersToCheck.map(async (member) => {
          try {
            const url = `${
              API_CONFIG.BASE_URL
            }/api/meetings/check-member-availability?member=${encodeURIComponent(
              member
            )}&date=${checkFormattedDate}&startTime=${selectedStartTime}&endTime=${selectedEndTime}`;
            const response = await fetch(url);
            if (response.ok) {
              const data = await response.json();
              busyMap[member] = data.status === "busy";
              if (
                data.status === "busy" &&
                data.conflicts &&
                data.conflicts.length > 0
              ) {
                conflictDetailsMap[member] = [
                  { endTime: data.conflicts[0].endTime },
                ];
              }
            } else {
              busyMap[member] = false;
            }
          } catch {
            busyMap[member] = false;
          }
        })
      );
      setMemberBusyMap(busyMap);
      setMemberConflictDetails(conflictDetailsMap);
    })();
  }, [
    selectedTeam,
    selectedDate,
    selectedStartTime,
    selectedEndTime,
    teams,
    allEmployees,
  ]);

  // --- ROOM AVAILABILITY CHECK ---
  useEffect(() => {
    if (!selectedDate || !selectedStartTime || !selectedEndTime) {
      setRoomBusyMap({});
      setRoomConflictDetails({});
      return;
    }

    setCheckingRoomAvailability(true);
    const checkYear = selectedDate.getFullYear();
    const checkMonth = String(selectedDate.getMonth() + 1).padStart(2, "0");
    const checkDay = String(selectedDate.getDate()).padStart(2, "0");
    const checkFormattedDate = `${checkYear}-${checkMonth}-${checkDay}`;

    (async () => {
      const busyMap: { [room: string]: boolean } = {};
      const conflictDetailsMap: {
        [room: string]: Array<{
          title: string;
          startTime: string;
          endTime: string;
          teamName: string;
          attendees: string[];
        }>;
      } = {};

      await Promise.all(
        meetingRooms.map(async (room) => {
          try {
            const url = `${
              API_CONFIG.BASE_URL
            }/api/meetings/check-room-availability?room=${encodeURIComponent(
              room
            )}&date=${checkFormattedDate}&startTime=${selectedStartTime}&endTime=${selectedEndTime}`;
            const response = await fetch(url);
            if (response.ok) {
              const data = await response.json();
              busyMap[room] = data.status === "busy";
              if (
                data.status === "busy" &&
                data.conflicts &&
                data.conflicts.length > 0
              ) {
                conflictDetailsMap[room] = data.conflicts.map(
                  (conflict: any) => ({
                    title: conflict.title,
                    startTime: conflict.startTime,
                    endTime: conflict.endTime,
                    teamName:
                      conflict.teamId?.name ||
                      conflict.teamName ||
                      "Unknown Team",
                    attendees: conflict.attendees || [],
                  })
                );
              }
            } else {
              busyMap[room] = false;
            }
          } catch {
            busyMap[room] = false;
          }
        })
      );

      setRoomBusyMap(busyMap);
      setRoomConflictDetails(conflictDetailsMap);
      setCheckingRoomAvailability(false);
    })();
  }, [selectedDate, selectedStartTime, selectedEndTime]);

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

  // Generate 15-minute time slots from 9:00 AM to 7:00 PM (end time inclusive for end slot)
  const generateTimeSlots = () => {
    const slots: TimeSlot[] = [];
    const startHour = 9; // 9 AM
    const endHour = 19; // 7 PM (inclusive for end time)

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
    // Add the final 7:00 PM slot for end time only
    slots.push({
      id: `19-0`,
      time: "19:00",
      displayTime: new Date(`2000-01-01T19:00:00`).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }),
      available: true,
    });
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
        `${API_CONFIG.BASE_URL}/api/meetings?startDate=${localDateString}&endDate=${localDateString}`
      );
      const data = await response.json();
      // Ensure each meeting has a teamName field
      const meetingsWithTeam = (data.meetings || []).map((m: any) => ({
        ...m,
        teamName:
          m.teamName ||
          (teams.find((t) => t._id === m.teamId || t.name === m.team)?.name ??
            ""),
      }));
      setDayMeetings(meetingsWithTeam);
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
      setErrorMessage("Meetings must be booked at least 2 hours in advance.");
      setShowErrorModal(true);
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
          `${
            API_CONFIG.BASE_URL
          }/api/meetings/check-member-availability?member=${encodeURIComponent(
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

  const { isAuthenticated } = useAuth();

  // Check if selected team is General Meeting
  const isGeneralMeeting =
    selectedTeam === "general" ||
    teams.find((t) => t._id === selectedTeam)?.name === "General Meeting";

  // Send OTP for General Meeting verification
  const sendGeneralMeetingOTP = async () => {
    if (!selectedTeam) return;

    setOtpLoading(true);
    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/api/meetings/send-general-meeting-otp`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ teamId: selectedTeam }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setOtpSent(true);
        setTeamLeadInfo(data.teamLead);
        setErrorMessage("");
      } else {
        setErrorMessage(data.error || "Failed to send OTP");
        setShowErrorModal(true);
      }
    } catch (error) {
      setErrorMessage("Failed to send OTP. Please try again.");
      setShowErrorModal(true);
    } finally {
      setOtpLoading(false);
    }
  };

  // Verify OTP for General Meeting
  const verifyGeneralMeetingOTP = async () => {
    if (!selectedTeam || !otpValue) return;

    setOtpLoading(true);
    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/api/meetings/verify-general-meeting-otp`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            teamId: selectedTeam,
            otp: otpValue,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setOtpVerified(true);
        setShowOTPModal(false);
        setErrorMessage("");
        // Proceed with booking after OTP verification
        await proceedWithBooking();
      } else {
        setErrorMessage(data.error || "Invalid OTP. Please try again.");
        setShowErrorModal(true);
      }
    } catch (error) {
      setErrorMessage("Failed to verify OTP. Please try again.");
      setShowErrorModal(true);
    } finally {
      setOtpLoading(false);
    }
  };

  // Proceed with booking after OTP verification
  const proceedWithBooking = async () => {
    // Check if user is authenticated
    if (!isAuthenticated) {
      setErrorMessage(
        "You must be logged in to book a meeting. Please login first."
      );
      setShowErrorModal(true);
      return;
    }

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
        setErrorMessage("Meetings must be booked at least 2 hours in advance.");
        setShowErrorModal(true);
        return;
      }

      // Validate end time is after start time
      const start = selectedStartTime;
      const end = selectedEndTime;
      if (end <= start) {
        setErrorMessage("End time must be after start time.");
        setShowErrorModal(true);
        return;
      }

      // Calculate duration in minutes
      const [startHour, startMinute] = start.split(":").map(Number);
      const [endHour, endMinute] = end.split(":").map(Number);
      const startTotalMinutes = startHour * 60 + startMinute;
      const endTotalMinutes = endHour * 60 + endMinute;
      const durationMinutes = endTotalMinutes - startTotalMinutes;

      if (durationMinutes < 15) {
        setErrorMessage("Meeting duration must be at least 15 minutes.");
        setShowErrorModal(true);
        return;
      }

      if (durationMinutes > 480) {
        setErrorMessage(
          "Meeting duration cannot exceed 8 hours (480 minutes)."
        );
        setShowErrorModal(true);
        return;
      }

      // Check room-team restrictions
      const isMainHall = selectedRoom.toLowerCase().includes("main hall");
      const isGeneralMeeting =
        selectedTeam === "general" ||
        teams.find((t) => t._id === selectedTeam)?.name === "General Meeting";

      if (isMainHall && !isGeneralMeeting) {
        setErrorMessage(
          "Main Hall is reserved for General Meetings only. Please select a different room or team."
        );
        setShowErrorModal(true);
        return;
      }

      if (!isMainHall && isGeneralMeeting) {
        setErrorMessage(
          "General Meetings can only be held in the Main Hall. Please select the Main Hall."
        );
        setShowErrorModal(true);
        return;
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

        const roomUrl = `${
          API_CONFIG.BASE_URL
        }/api/meetings/check-room-availability?room=${encodeURIComponent(
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
            setErrorMessage(
              `Cannot book meeting. The selected room "${selectedRoom}" is busy during the selected time.`
            );
            setShowErrorModal(true);
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

        const url = `${
          API_CONFIG.BASE_URL
        }/api/meetings/check-member-availability?member=${encodeURIComponent(
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

      // Note: We no longer block or ask for confirmation for busy attendees
      // The backend will handle this gracefully and show warnings
      if (busyAttendees.length > 0) {
        console.log("Busy attendees detected:", busyAttendees);
        console.log("Proceeding with booking - backend will handle warnings");
      }

      // Note: We no longer block booking for member conflicts
      // The backend will handle busy attendees gracefully
      // await checkMemberConflicts();

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
        teamId: selectedTeam,
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
      setDropdownAddedEmployees([]);
      setOtpVerified(false);
      setOtpSent(false);
      setOtpValue("");
      setTeamLeadInfo(null);
    }
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if user is authenticated
    if (!isAuthenticated) {
      setErrorMessage(
        "You must be logged in to book a meeting. Please login first."
      );
      setShowErrorModal(true);
      return;
    }

    // Check if this is a General Meeting and OTP verification is needed
    if (isGeneralMeeting && !otpVerified) {
      setShowOTPModal(true);
      return;
    }

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
        setErrorMessage("Meetings must be booked at least 2 hours in advance.");
        setShowErrorModal(true);
        return;
      }

      // Validate end time is after start time
      const start = selectedStartTime;
      const end = selectedEndTime;
      if (end <= start) {
        setErrorMessage("End time must be after start time.");
        setShowErrorModal(true);
        return;
      }

      // Calculate duration in minutes
      const [startHour, startMinute] = start.split(":").map(Number);
      const [endHour, endMinute] = end.split(":").map(Number);
      const startTotalMinutes = startHour * 60 + startMinute;
      const endTotalMinutes = endHour * 60 + endMinute;
      const durationMinutes = endTotalMinutes - startTotalMinutes;

      if (durationMinutes < 15) {
        setErrorMessage("Meeting duration must be at least 15 minutes.");
        setShowErrorModal(true);
        return;
      }

      if (durationMinutes > 480) {
        setErrorMessage(
          "Meeting duration cannot exceed 8 hours (480 minutes)."
        );
        setShowErrorModal(true);
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

        const url = `${
          API_CONFIG.BASE_URL
        }/api/meetings/check-member-availability?member=${encodeURIComponent(
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

      // Check room-team restrictions
      const isMainHall = selectedRoom.toLowerCase().includes("main hall");
      const isGeneralMeeting =
        selectedTeam === "general" ||
        teams.find((t) => t._id === selectedTeam)?.name === "General Meeting";

      if (isMainHall && !isGeneralMeeting) {
        setErrorMessage(
          "Main Hall is reserved for General Meetings only. Please select a different room or team."
        );
        setShowErrorModal(true);
        return;
      }

      if (!isMainHall && isGeneralMeeting) {
        setErrorMessage(
          "General Meetings can only be held in the Main Hall. Please select the Main Hall."
        );
        setShowErrorModal(true);
        return;
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

        const roomUrl = `${
          API_CONFIG.BASE_URL
        }/api/meetings/check-room-availability?room=${encodeURIComponent(
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
            setErrorMessage(
              `Cannot book meeting. The selected room "${selectedRoom}" is busy during the selected time.`
            );
            setShowErrorModal(true);
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

      // Note: We no longer block or ask for confirmation for busy attendees
      // The backend will handle this gracefully and show warnings
      if (busyAttendees.length > 0) {
        console.log("Busy attendees detected:", busyAttendees);
        console.log("Proceeding with booking - backend will handle warnings");
      }

      // Note: We no longer block booking for member conflicts
      // The backend will handle busy attendees gracefully
      // await checkMemberConflicts();

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
        teamId: selectedTeam,
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
      setDropdownAddedEmployees([]);
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

  // --- DROPDOWN EMPLOYEE AVAILABILITY CHECK ---
  const checkAllEmployeesAvailability = useCallback(async () => {
    if (!selectedDate || !selectedStartTime || !selectedEndTime) {
      setEmployeeAvailability({});
      return;
    }
    setCheckingDropdownAvailability(true);
    const checkYear = selectedDate.getFullYear();
    const checkMonth = String(selectedDate.getMonth() + 1).padStart(2, "0");
    const checkDay = String(selectedDate.getDate()).padStart(2, "0");
    const checkFormattedDate = `${checkYear}-${checkMonth}-${checkDay}`;
    (async () => {
      const availabilityMap: {
        [name: string]: { status: "busy" | "free"; endTime?: string };
      } = {};
      await Promise.all(
        allEmployees.map(async (emp) => {
          try {
            const url = `${
              API_CONFIG.BASE_URL
            }/api/meetings/check-member-availability?member=${encodeURIComponent(
              emp.name
            )}&date=${checkFormattedDate}&startTime=${selectedStartTime}&endTime=${selectedEndTime}`;
            const response = await fetch(url);
            if (response.ok) {
              const data = await response.json();
              if (
                data.status === "busy" &&
                data.conflicts &&
                data.conflicts.length > 0
              ) {
                availabilityMap[emp.name] = {
                  status: "busy",
                  endTime: data.conflicts[0].endTime,
                };
              } else {
                availabilityMap[emp.name] = { status: data.status };
              }
            } else {
              availabilityMap[emp.name] = { status: "free" };
            }
          } catch {
            availabilityMap[emp.name] = { status: "free" };
          }
        })
      );
      setEmployeeAvailability(availabilityMap);
      setCheckingDropdownAvailability(false);
    })();
  }, [allEmployees, selectedDate, selectedStartTime, selectedEndTime]);

  // Run check on dropdown open or time change
  useEffect(() => {
    checkAllEmployeesAvailability();
  }, [checkAllEmployeesAvailability]);

  // When team, time, or availability changes, auto-select only free team members
  useEffect(() => {
    if (!selectedTeam || !selectedStartTime || !selectedEndTime) return;

    // For General meeting, select only free employees
    if (selectedTeam === "general") {
      const freeEmployeeNames = allEmployees
        .map((emp) => emp.name)
        .filter((name) => !memberBusyMap[name]);

      // Only auto-select if user hasn't manually changed selection
      if (selectedAttendees.length === 0) {
        setSelectedAttendees(freeEmployeeNames);
      }
      return;
    }

    const teamObj = teams.find((t) => t._id === selectedTeam);
    if (!teamObj) return;

    // Select only free team members (not busy ones)
    const freeTeamMembers = teamObj.members.filter(
      (member) => !memberBusyMap[member]
    );

    // Only auto-select if user hasn't manually changed selection
    if (selectedAttendees.length === 0) {
      setSelectedAttendees(freeTeamMembers);
    }
  }, [
    selectedTeam,
    selectedStartTime,
    selectedEndTime,
    memberBusyMap,
    teams,
    allEmployees,
  ]);

  return (
    <div className="calendar-center-bg">
      <div className="calendar-center-container">
        <div className="calendar-header">
          <h2>Calendar</h2>
          <p>Select a date and time slot to book a meeting</p>
        </div>
        <div className="calendar-center-content">
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
                {monthNames[selectedDate.getMonth()]}{" "}
                {selectedDate.getFullYear()}
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
              <div
                className={`day-header ${
                  new Date().getDay() === 0 ? "today" : ""
                }`}
              >
                Sun
              </div>
              <div
                className={`day-header ${
                  new Date().getDay() === 1 ? "today" : ""
                }`}
              >
                Mon
              </div>
              <div
                className={`day-header ${
                  new Date().getDay() === 2 ? "today" : ""
                }`}
              >
                Tue
              </div>
              <div
                className={`day-header ${
                  new Date().getDay() === 3 ? "today" : ""
                }`}
              >
                Wed
              </div>
              <div
                className={`day-header ${
                  new Date().getDay() === 4 ? "today" : ""
                }`}
              >
                Thu
              </div>
              <div
                className={`day-header ${
                  new Date().getDay() === 5 ? "today" : ""
                }`}
              >
                Fri
              </div>
              <div
                className={`day-header ${
                  new Date().getDay() === 6 ? "today" : ""
                }`}
              >
                Sat
              </div>

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
                    onClick={() => handleDateClick(day)}
                    style={isPast ? { opacity: 0.4 } : {}}
                  >
                    {day.getDate()}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <div style={{ textAlign: "center", marginTop: 24 }}>
          <button
            className="btn-primary"
            onClick={() => setShowBookingForm(true)}
          >
            Book New Meeting
          </button>
        </div>
        {/* Booking Form Modal Overlay */}
        {showBookingForm && (
          <div className="modal-overlay calendar-booking-modal">
            <div className="modal-dialog calendar-booking-dialog">
              <button
                className="modal-close"
                aria-label="Close"
                onClick={() => setShowBookingForm(false)}
              >
                ×
              </button>
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
                      <option key={team._id} value={team._id}>
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
                    ⏰ <strong>Booking Policy:</strong> Meetings must be booked
                    at least 2 hours in advance
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
                              onClick={() =>
                                handleTimeSlotSelect(slot.id, true)
                              }
                              disabled={!isAvailable}
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
                  {selectedTeam && (
                    <div
                      style={{
                        background: "#f0f9ff",
                        border: "1px solid #bae6fd",
                        borderRadius: "6px",
                        padding: "8px 12px",
                        marginBottom: "15px",
                        fontSize: "12px",
                        color: "#0369a1",
                      }}
                    >
                      ℹ️ <strong>Room Restrictions:</strong>{" "}
                      {selectedTeam === "general" ||
                      teams.find((t) => t._id === selectedTeam)?.name ===
                        "General Meeting"
                        ? "General Meetings can only be held in the Main Hall"
                        : "Other teams cannot book the Main Hall (General Meetings only)"}
                    </div>
                  )}
                  {checkingRoomAvailability && (
                    <div
                      style={{
                        color: "#059669",
                        fontSize: 12,
                        marginBottom: 8,
                        padding: "4px 8px",
                        backgroundColor: "#f0fdf4",
                        border: "1px solid #bbf7d0",
                        borderRadius: "4px",
                      }}
                    >
                      🔄 Checking room availability...
                    </div>
                  )}
                  <select
                    value={selectedRoom}
                    onChange={(e) => setSelectedRoom(e.target.value)}
                    required
                    disabled={checkingRoomAvailability}
                  >
                    <option value="">
                      {checkingRoomAvailability
                        ? "Checking availability..."
                        : "Choose a room"}
                    </option>
                    {meetingRooms.map((room) => {
                      const isBusy = roomBusyMap[room];
                      const roomConflicts = roomConflictDetails[room] || [];
                      const firstConflict =
                        roomConflicts.length > 0 ? roomConflicts[0] : null;

                      // Check if this is the main hall
                      const isMainHall = room
                        .toLowerCase()
                        .includes("main hall");

                      // Check if General Meeting team is selected
                      const isGeneralMeeting =
                        selectedTeam === "general" ||
                        teams.find((t) => t._id === selectedTeam)?.name ===
                          "General Meeting";

                      // Determine if room should be disabled
                      const isRoomDisabled =
                        isBusy ||
                        (isMainHall && !isGeneralMeeting) ||
                        (!isMainHall && isGeneralMeeting);

                      return (
                        <option
                          key={room}
                          value={room}
                          disabled={isRoomDisabled}
                          style={{
                            color: isRoomDisabled ? "#dc2626" : "inherit",
                            fontStyle: isRoomDisabled ? "italic" : "normal",
                          }}
                        >
                          {room}{" "}
                          {isBusy
                            ? `(Busy - until ${
                                firstConflict
                                  ? formatDateTime(firstConflict.endTime)
                                  : "unknown"
                              })`
                            : isMainHall && !isGeneralMeeting
                            ? "(General Meetings only)"
                            : !isMainHall && isGeneralMeeting
                            ? "(Not available for General Meetings)"
                            : ""}
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
                      {roomConflictDetails[selectedRoom] &&
                        roomConflictDetails[selectedRoom].length > 0 && (
                          <div style={{ marginTop: "4px" }}>
                            <strong>Conflicts:</strong>
                            {roomConflictDetails[selectedRoom].map(
                              (conflict, idx) => (
                                <div
                                  key={idx}
                                  style={{
                                    marginLeft: "8px",
                                    fontSize: "11px",
                                  }}
                                >
                                  • {conflict.title} (
                                  {formatDateTime(conflict.startTime)} -{" "}
                                  {formatDateTime(conflict.endTime)})
                                </div>
                              )
                            )}
                          </div>
                        )}
                    </div>
                  )}
                  {selectedRoom &&
                    !roomBusyMap[selectedRoom] &&
                    !checkingRoomAvailability && (
                      <div
                        style={{
                          color: "#059669",
                          fontSize: "12px",
                          marginTop: "4px",
                          padding: "4px 8px",
                          backgroundColor: "#f0fdf4",
                          border: "1px solid #bbf7d0",
                          borderRadius: "4px",
                        }}
                      >
                        ✅ This room is available for the selected time
                      </div>
                    )}
                </div>

                <div className="form-group">
                  <label>Select Attendees:</label>
                  <div
                    style={{
                      background: "#f0f9ff",
                      border: "1px solid #bae6fd",
                      borderRadius: "6px",
                      padding: "8px 12px",
                      marginBottom: "15px",
                      fontSize: "12px",
                      color: "#0369a1",
                    }}
                  >
                    ℹ️ <strong>Note:</strong> Only free team members are
                    selected by default. Busy members are disabled and cannot be
                    selected.
                  </div>
                  <div className="attendees-selection">
                    {selectedTeam && (
                      <div className="team-members">
                        <p className="team-members-label">
                          {selectedTeam === "general"
                            ? "All Employees:"
                            : "Team Members:"}
                        </p>
                        {(selectedTeam === "general"
                          ? allEmployees.map((emp) => emp.name)
                          : teams.find((t) => t._id === selectedTeam)
                              ?.members || []
                        ).map((member) => {
                          console.log(
                            `Rendering member ${member}, busy status:`,
                            memberBusyMap[member]
                          );
                          const memberConflicts =
                            memberBusyMap[member] &&
                            memberConflictDetails[member]?.length > 0
                              ? [
                                  {
                                    title: "Busy",
                                    startTime: "Now",
                                    endTime:
                                      memberConflictDetails[member]?.[0]
                                        ?.endTime,
                                    teamName: "Unknown Team",
                                    room: "Unknown Room",
                                  },
                                ]
                              : [];
                          return (
                            <label
                              key={member}
                              className="attendee-checkbox"
                              style={{
                                opacity: memberBusyMap[member] ? 0.6 : 1,
                                backgroundColor: memberBusyMap[member]
                                  ? "#f5f5f5"
                                  : "transparent",
                                borderRadius: memberBusyMap[member]
                                  ? "6px"
                                  : "0",
                                padding: memberBusyMap[member]
                                  ? "4px 8px"
                                  : "0",
                                border: memberBusyMap[member]
                                  ? "1px solid #d1d5db"
                                  : "none",
                                cursor: memberBusyMap[member]
                                  ? "not-allowed"
                                  : "pointer",
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
                                disabled={memberBusyMap[member]}
                                style={{
                                  opacity: memberBusyMap[member] ? 0.5 : 1,
                                  cursor: memberBusyMap[member]
                                    ? "not-allowed"
                                    : "pointer",
                                }}
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
                                      color: memberBusyMap[member]
                                        ? "#dc2626"
                                        : "#6b7280",
                                      fontSize: 10,
                                      marginLeft: 4,
                                      fontWeight: memberBusyMap[member]
                                        ? "600"
                                        : "400",
                                    }}
                                  >
                                    (Status:{" "}
                                    {memberBusyMap[member]
                                      ? "Busy - Disabled"
                                      : "Free"}
                                    )
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
                                  title="This member is busy during the selected time and cannot be selected."
                                >
                                  ⚠️ Busy - until{" "}
                                  {memberConflictDetails[member]?.[0]?.endTime
                                    ? formatDateTime(
                                        memberConflictDetails[member]?.[0]
                                          ?.endTime
                                      )
                                    : "unknown"}
                                </span>
                              )}
                              {memberBusyMap[member] &&
                                memberConflicts.length > 0 && (
                                  <div
                                    style={{
                                      marginTop: "4px",
                                      marginLeft: "20px",
                                    }}
                                  >
                                    <div
                                      style={{
                                        fontSize: "11px",
                                        color: "#dc2626",
                                      }}
                                    >
                                      <strong>Conflicts:</strong>
                                      {memberConflicts.map((conflict, idx) => (
                                        <div
                                          key={idx}
                                          style={{
                                            marginLeft: "8px",
                                            fontSize: "10px",
                                          }}
                                        >
                                          • {conflict.title} (
                                          {formatDateTime(conflict.startTime)} -{" "}
                                          {formatDateTime(conflict.endTime)})
                                        </div>
                                      ))}
                                    </div>
                                  </div>
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

                {/* All Employees Dropdown - moved below Select Attendees */}
                <div
                  className="form-group"
                  style={{
                    background: "#f8fafd",
                    borderRadius: 12,
                    padding: 20,
                    marginTop: 24,
                    boxShadow: "0 2px 8px rgba(102,126,234,0.06)",
                  }}
                >
                  <label
                    style={{
                      fontWeight: 700,
                      fontSize: 16,
                      color: "#222",
                      marginBottom: 2,
                      display: "block",
                    }}
                  >
                    Add Additional Attendees{" "}
                    <span
                      style={{ color: "#888", fontWeight: 400, fontSize: 13 }}
                    >
                      (Optional)
                    </span>
                  </label>
                  <div
                    style={{ color: "#6b7280", fontSize: 13, marginBottom: 10 }}
                  >
                    Search and add any employee to this meeting.
                  </div>
                  <div
                    style={{ display: "flex", gap: 8, alignItems: "center" }}
                  >
                    <div style={{ flex: 3, minWidth: 220 }}>
                      <Select
                        isMulti
                        closeMenuOnSelect={false}
                        options={allEmployees
                          .map((emp) => {
                            const avail = employeeAvailability[emp.name];
                            const isBusy = avail && avail.status === "busy";
                            return {
                              value: emp.name,
                              label: emp.name,
                              isDisabled: isBusy,
                              endTime: avail && avail.endTime,
                              isBusy: isBusy,
                            };
                          })
                          .sort((a, b) => {
                            // Sort busy employees first, then available employees
                            if (a.isBusy && !b.isBusy) return -1;
                            if (!a.isBusy && b.isBusy) return 1;
                            // If both have same availability status, sort alphabetically
                            return a.label.localeCompare(b.label);
                          })}
                        formatOptionLabel={(option: any) => {
                          const avail = employeeAvailability[option.value];
                          if (avail && avail.status === "busy") {
                            let endTimeStr = "";
                            if (avail.endTime) {
                              const endDate = new Date(avail.endTime);
                              endTimeStr = endDate.toLocaleString(undefined, {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                                hour: "numeric",
                                minute: "2-digit",
                                hour12: true,
                              });
                            }
                            return (
                              <span
                                style={{
                                  color: "#dc2626",
                                  display: "flex",
                                  alignItems: "center",
                                  fontWeight: 500,
                                }}
                              >
                                <span style={{ marginRight: 6, fontSize: 15 }}>
                                  ⚠️
                                </span>
                                {option.value}{" "}
                                <span
                                  style={{
                                    marginLeft: 8,
                                    fontSize: 13,
                                    color: "#dc2626",
                                    background: "#fdecea",
                                    borderRadius: 6,
                                    padding: "2px 8px",
                                    fontWeight: 600,
                                  }}
                                >
                                  Busy
                                </span>
                              </span>
                            );
                          }
                          return <span>{option.value}</span>;
                        }}
                        value={
                          dropdownAddedEmployees.map((name) => ({
                            value: name,
                            label: name,
                          })) as MultiValue<{ value: string; label: string }>
                        }
                        onChange={(
                          selected: MultiValue<{ value: string; label: string }>
                        ) => {
                          const selectedNames = (selected || []).map(
                            (opt) => opt.value
                          );
                          setDropdownAddedEmployees(selectedNames);
                          const newAttendees = [
                            ...selectedAttendees.filter(
                              (a) => !dropdownAddedEmployees.includes(a)
                            ),
                            ...selectedNames.filter(
                              (n) => !selectedAttendees.includes(n)
                            ),
                          ];
                          setSelectedAttendees(newAttendees);
                        }}
                        isClearable={false}
                        isSearchable
                        placeholder={
                          checkingDropdownAvailability
                            ? "Checking availability..."
                            : "Type to search employees..."
                        }
                        isDisabled={
                          loadingEmployees ||
                          allEmployees.length === 0 ||
                          checkingDropdownAvailability
                        }
                        styles={{
                          control: (base: any, state: any) => ({
                            ...base,
                            borderRadius: 8,
                            borderColor: state.isFocused
                              ? "#667eea"
                              : "#e5e7eb",
                            boxShadow: state.isFocused
                              ? "0 0 0 2px #a5b4fc"
                              : "none",
                            minHeight: 44,
                            fontSize: 15,
                          }),
                          option: (base: any, state: any) => ({
                            ...base,
                            background: state.isFocused ? "#e0e7ff" : "#fff",
                            color: state.isDisabled ? "#aaa" : "#222",
                            fontSize: 15,
                            paddingLeft: 16,
                            opacity: state.isDisabled ? 0.6 : 1,
                          }),
                          menu: (base: any) => ({
                            ...base,
                            zIndex: 9999,
                            borderRadius: 8,
                          }),
                        }}
                        menuPlacement="auto"
                        tabSelectsValue={false}
                      />
                    </div>
                  </div>
                  {loadingEmployees && (
                    <div style={{ color: "#888", fontSize: 12, marginTop: 4 }}>
                      Loading employees...
                    </div>
                  )}
                  {/* List of employees added via dropdown as pill chips */}
                  <div style={{ marginTop: 18, minHeight: 32 }}>
                    {dropdownAddedEmployees.length > 0 ? (
                      <div
                        style={{ display: "flex", flexWrap: "wrap", gap: 8 }}
                      >
                        {dropdownAddedEmployees.map((emp) => (
                          <span
                            key={emp}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              background: "#e0e7ff",
                              color: "#374151",
                              borderRadius: 16,
                              padding: "6px 14px 6px 12px",
                              fontSize: 14,
                              fontWeight: 500,
                              boxShadow: "0 1px 4px rgba(102,126,234,0.08)",
                            }}
                          >
                            {emp}
                            <button
                              type="button"
                              style={{
                                marginLeft: 8,
                                color: "#667eea",
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                fontSize: 16,
                                lineHeight: 1,
                                padding: 0,
                              }}
                              title="Remove"
                              onClick={() => {
                                setDropdownAddedEmployees(
                                  dropdownAddedEmployees.filter(
                                    (e) => e !== emp
                                  )
                                );
                                setSelectedAttendees(
                                  selectedAttendees.filter((a) => a !== emp)
                                );
                              }}
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div
                        style={{
                          color: "#aaa",
                          fontSize: 13,
                          fontStyle: "italic",
                          padding: "4px 0 0 2px",
                        }}
                      >
                        No additional attendees added
                      </div>
                    )}
                  </div>
                </div>

                {/* Note: Member conflicts are now handled gracefully by the backend */}
                {/* Conflicts will be shown as warnings after booking, not blocking the booking */}

                <div className="form-actions">
                  <button type="submit" className="btn-primary">
                    Book Meeting
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => {
                      setShowBookingForm(false);
                      setMemberConflicts([]);
                      setDropdownAddedEmployees([]);
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
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
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div>
                      {/* Remove the meeting title */}
                      <div className="meeting-details-single-line">
                        {meeting.teamName && (
                          <span style={{ fontWeight: 700, color: "#333" }}>
                            Team:
                          </span>
                        )}
                        <span
                          style={{
                            marginLeft: 6,
                            color: "#666",
                            fontWeight: 500,
                          }}
                        >
                          {meeting.teamName}
                        </span>
                        <span
                          style={{
                            marginLeft: 16,
                            fontWeight: 700,
                            color: "#333",
                          }}
                        >
                          Start:
                        </span>
                        <span
                          style={{
                            marginLeft: 4,
                            color: "#666",
                            fontWeight: 500,
                          }}
                        >
                          {meeting.startTime?.slice(11, 16)}
                        </span>
                        <span
                          style={{
                            marginLeft: 12,
                            fontWeight: 700,
                            color: "#333",
                          }}
                        >
                          End:
                        </span>
                        <span
                          style={{
                            marginLeft: 4,
                            color: "#666",
                            fontWeight: 500,
                          }}
                        >
                          {meeting.endTime?.slice(11, 16)}
                        </span>
                      </div>
                    </div>
                    <span
                      style={{
                        marginLeft: 16,
                        cursor: "pointer",
                        color: "#2563eb", // blue-600, or pick your theme color
                        fontSize: 20,
                        display: "flex",
                        alignItems: "center",
                      }}
                      title="View Details"
                      onClick={() => navigate(`/meeting/${meeting._id}`)}
                    >
                      <FaInfoCircle />
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <div className="modal-actions">
              {selectedDate >= todayDate && (
                <button
                  className="btn-primary"
                  onClick={() => {
                    setShowDayMeetings(false);
                    setShowBookingForm(true);
                  }}
                >
                  Book New Meeting
                </button>
              )}
              <button
                className="btn-secondary"
                onClick={() => setShowDayMeetings(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OTP Verification Modal for General Meeting */}
      {showOTPModal && (
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
              onClick={() => setShowOTPModal(false)}
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
                  color: "#667eea",
                }}
              >
                🔐
              </div>
              <h3
                style={{
                  margin: "0 0 12px 0",
                  color: "#333",
                  fontSize: "20px",
                  fontWeight: "600",
                }}
              >
                General Meeting Verification Required
              </h3>
              <p
                style={{
                  margin: "0",
                  color: "#666",
                  fontSize: "14px",
                  lineHeight: "1.5",
                }}
              >
                An OTP will be sent to the team lead for verification.
              </p>
            </div>

            {!otpSent ? (
              <div style={{ textAlign: "center" }}>
                <button
                  onClick={sendGeneralMeetingOTP}
                  disabled={otpLoading}
                  style={{
                    background: "#667eea",
                    color: "white",
                    border: "none",
                    padding: "12px 24px",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: "600",
                    cursor: "pointer",
                    transition: "opacity 0.3s ease",
                    opacity: otpLoading ? 0.6 : 1,
                  }}
                >
                  {otpLoading ? "Sending..." : "Send OTP to Team Lead"}
                </button>
              </div>
            ) : (
              <div>
                <div
                  style={{
                    background: "#e3f2fd",
                    border: "1px solid #bbdefb",
                    borderRadius: "8px",
                    padding: "12px",
                    marginBottom: "20px",
                    fontSize: "14px",
                    color: "#1976d2",
                  }}
                >
                  ✅ OTP sent to {teamLeadInfo?.name} ({teamLeadInfo?.email})
                </div>

                <div style={{ marginBottom: "20px" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      fontWeight: "600",
                      color: "#333",
                    }}
                  >
                    Enter OTP:
                  </label>
                  <input
                    type="text"
                    value={otpValue}
                    onChange={(e) => setOtpValue(e.target.value)}
                    placeholder="Enter 6-digit OTP"
                    maxLength={6}
                    style={{
                      width: "100%",
                      padding: "12px",
                      border: "2px solid #e0e0e0",
                      borderRadius: "8px",
                      fontSize: "16px",
                      textAlign: "center",
                      letterSpacing: "4px",
                    }}
                  />
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    gap: "12px",
                  }}
                >
                  <button
                    onClick={verifyGeneralMeetingOTP}
                    disabled={otpLoading || !otpValue}
                    style={{
                      background: "#667eea",
                      color: "white",
                      border: "none",
                      padding: "12px 24px",
                      borderRadius: "8px",
                      fontSize: "14px",
                      fontWeight: "600",
                      cursor: "pointer",
                      transition: "opacity 0.3s ease",
                      opacity: otpLoading || !otpValue ? 0.6 : 1,
                    }}
                  >
                    {otpLoading ? "Verifying..." : "Verify OTP"}
                  </button>
                  <button
                    onClick={() => {
                      setOtpSent(false);
                      setOtpValue("");
                    }}
                    style={{
                      background: "#f5f5f5",
                      color: "#666",
                      border: "none",
                      padding: "12px 24px",
                      borderRadius: "8px",
                      fontSize: "14px",
                      fontWeight: "600",
                      cursor: "pointer",
                      transition: "opacity 0.3s ease",
                    }}
                  >
                    Resend OTP
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Custom Error Modal */}
      {showErrorModal && errorMessage && (
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
              onClick={() => setShowErrorModal(false)}
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
                  color: "#ef4444",
                }}
              >
                ❌
              </div>
              <h3
                style={{
                  margin: "0 0 12px 0",
                  color: "#333",
                  fontSize: "20px",
                  fontWeight: "600",
                }}
              >
                Error
              </h3>
              <p
                style={{
                  margin: "0",
                  color: "#666",
                  fontSize: "14px",
                  lineHeight: "1.5",
                }}
              >
                {errorMessage}
              </p>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "12px",
              }}
            >
              <button
                onClick={() => setShowErrorModal(false)}
                style={{
                  background: "#ef4444",
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
    </div>
  );
};

export default Calendar;
