const express = require("express");
const Meeting = require("../models/Meeting");
const Team = require("../models/Team");
const User = require("../models/User");
const router = express.Router();

// Helper function to format time in HH:MM format
const formatTime = (date) => {
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
};

const normalizeName = (name) => name.trim().toLowerCase();

// Get real-time status for all employees
router.get("/all-employees", async (req, res) => {
  console.log(
    "All employees real-time status route hit with params:",
    req.query
  );
  try {
    const { date, time } = req.query;

    // Use current date/time if not provided
    let checkDate, checkTime;
    if (date && time) {
      checkDate = date;
      checkTime = time;
    } else {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      checkDate = `${year}-${month}-${day}`;
      checkTime = `${String(now.getHours()).padStart(2, "0")}:${String(
        now.getMinutes()
      ).padStart(2, "0")}`;
    }

    // Parse the check time and convert to UTC for database comparison
    const [year, month, day] = checkDate.split("-").map(Number);
    const [hour, minute] = checkTime.split(":").map(Number);
    const checkDateTime = new Date(year, month - 1, day, hour, minute, 0, 0);

    // Convert local time to UTC for proper comparison with database times
    const checkDateTimeUTC = new Date(
      checkDateTime.getTime() - checkDateTime.getTimezoneOffset() * 60000
    );

    console.log(
      `Checking real-time status for date: ${checkDate}, time: ${checkTime} (UTC: ${checkDateTimeUTC.toISOString()})`
    );

    // Get all teams to find all employees
    const teams = await Team.find({ status: "active" });
    const allEmployees = new Set();

    teams.forEach((team) => {
      allEmployees.add(team.lead);
      team.members.forEach((member) => allEmployees.add(member));
    });

    const employeeStatuses = [];

    // Check each employee's status
    for (const employee of allEmployees) {
      try {
        const normalizedEmployee = normalizeName(employee);
        const possibleMeetings = await Meeting.find({
          status: { $ne: "cancelled" },
          startTime: { $lte: checkDateTimeUTC },
          endTime: { $gt: checkDateTimeUTC },
        });
        // DEBUG: Print all normalized attendees for each meeting
        possibleMeetings.forEach((mtg) => {
          console.log(
            `[DEBUG] Meeting: ${mtg.title}, Attendees:`,
            (mtg.attendees || []).map(normalizeName)
          );
        });
        console.log(
          `[DEBUG] Checking employee:`,
          employee,
          "Normalized:",
          normalizedEmployee
        );

        const currentMeetings = possibleMeetings.filter((mtg) =>
          (mtg.attendees || []).map(normalizeName).includes(normalizedEmployee)
        );
        console.log(
          `[DEBUG] Employee: ${employee}, Busy:`,
          currentMeetings.length > 0
        );

        const status = currentMeetings.length > 0 ? "busy" : "free";

        employeeStatuses.push({
          name: employee,
          status,
          meetings: currentMeetings.map((meeting) => ({
            title: meeting.title,
            startTime: formatTime(meeting.startTime),
            endTime: meeting.endTime.toISOString(),
            teamName: meeting.teamName,
            room: meeting.room,
          })),
        });
      } catch (error) {
        console.error(`Error checking status for ${employee}:`, error);
        employeeStatuses.push({
          name: employee,
          status: "free",
          meetings: [],
        });
      }
    }

    // Calculate statistics
    const totalEmployees = employeeStatuses.length;
    const busyEmployees = employeeStatuses.filter(
      (emp) => emp.status === "busy"
    ).length;
    const freeEmployees = totalEmployees - busyEmployees;

    res.json({
      checkDate,
      checkTime,
      totalEmployees,
      busyEmployees,
      freeEmployees,
      employeeStatuses,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Error fetching real-time status",
      message: error.message,
    });
  }
});

// Get real-time status for a specific employee
router.get("/employee/:employeeName", async (req, res) => {
  console.log(
    "Employee real-time status route hit with params:",
    req.params,
    req.query
  );
  try {
    const { employeeName } = req.params;
    const { date, time } = req.query;

    if (!employeeName) {
      return res.status(400).json({
        error: "Missing required parameter: employeeName",
      });
    }

    // Use current date/time if not provided
    let checkDate, checkTime;
    if (date && time) {
      checkDate = date;
      checkTime = time;
    } else {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      checkDate = `${year}-${month}-${day}`;
      checkTime = `${String(now.getHours()).padStart(2, "0")}:${String(
        now.getMinutes()
      ).padStart(2, "0")}`;
    }

    // Parse the check time and convert to UTC for database comparison
    const [year, month, day] = checkDate.split("-").map(Number);
    const [hour, minute] = checkTime.split(":").map(Number);
    const checkDateTime = new Date(year, month - 1, day, hour, minute, 0, 0);

    // Convert local time to UTC for proper comparison with database times
    const checkDateTimeUTC = new Date(
      checkDateTime.getTime() - checkDateTime.getTimezoneOffset() * 60000
    );

    console.log(
      `Checking real-time status for ${employeeName} at ${checkDate} ${checkTime} (UTC: ${checkDateTimeUTC.toISOString()})`
    );

    // Find meetings where this employee is an attendee and the check time falls within the meeting
    const currentMeetings = await Meeting.find({
      attendees: employeeName,
      status: { $ne: "cancelled" },
      startTime: { $lte: checkDateTimeUTC },
      endTime: { $gt: checkDateTimeUTC },
    }).populate("teamId", "name color");

    const status = currentMeetings.length > 0 ? "busy" : "free";

    res.json({
      employee: employeeName,
      checkDate,
      checkTime,
      status,
      currentMeetings: currentMeetings.map((meeting) => ({
        id: meeting._id,
        title: meeting.title,
        description: meeting.description,
        startTime: formatTime(meeting.startTime),
        endTime: meeting.endTime.toISOString(),
        teamName: meeting.teamName,
        room: meeting.room,
        duration: meeting.duration,
      })),
      totalMeetings: currentMeetings.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Error fetching employee real-time status",
      message: error.message,
    });
  }
});

// Get team real-time status
router.get("/team/:teamId", async (req, res) => {
  console.log(
    "Team real-time status route hit with params:",
    req.params,
    req.query
  );
  try {
    const { teamId } = req.params;
    const { date, time } = req.query;

    if (!teamId) {
      return res.status(400).json({
        error: "Missing required parameter: teamId",
      });
    }

    // Get team details
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({
        error: "Team not found",
      });
    }

    // Use current date/time if not provided
    let checkDate, checkTime;
    if (date && time) {
      checkDate = date;
      checkTime = time;
    } else {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      checkDate = `${year}-${month}-${day}`;
      checkTime = `${String(now.getHours()).padStart(2, "0")}:${String(
        now.getMinutes()
      ).padStart(2, "0")}`;
    }

    // Parse the check time and convert to UTC for database comparison
    const [year, month, day] = checkDate.split("-").map(Number);
    const [hour, minute] = checkTime.split(":").map(Number);
    const checkDateTime = new Date(year, month - 1, day, hour, minute, 0, 0);

    // Convert to UTC for proper comparison with database times
    const checkDateTimeUTC = new Date(checkDateTime.toISOString());

    console.log(
      `Checking real-time status for team ${
        team.name
      } at ${checkDate} ${checkTime} (UTC: ${checkDateTimeUTC.toISOString()})`
    );

    // Get all team members
    const teamMembers = [
      team.lead,
      ...team.members.filter((member) => member !== team.lead),
    ];
    const memberStatuses = [];

    // Check each team member's status
    for (const member of teamMembers) {
      try {
        const currentMeetings = await Meeting.find({
          attendees: member,
          status: { $ne: "cancelled" },
          startTime: { $lte: checkDateTimeUTC },
          endTime: { $gt: checkDateTimeUTC },
        }).populate("teamId", "name color");

        const status = currentMeetings.length > 0 ? "busy" : "free";

        memberStatuses.push({
          name: member,
          status,
          meetings: currentMeetings.map((meeting) => ({
            title: meeting.title,
            startTime: formatTime(meeting.startTime),
            endTime: meeting.endTime.toISOString(),
            teamName: meeting.teamName,
            room: meeting.room,
          })),
        });
      } catch (error) {
        console.error(
          `Error checking status for team member ${member}:`,
          error
        );
        memberStatuses.push({
          name: member,
          status: "free",
          meetings: [],
        });
      }
    }

    // Calculate team statistics
    const totalMembers = memberStatuses.length;
    const busyMembers = memberStatuses.filter(
      (member) => member.status === "busy"
    ).length;
    const freeMembers = totalMembers - busyMembers;

    res.json({
      team: {
        id: team._id,
        name: team.name,
        color: team.color,
        project: team.project,
        lead: team.lead,
      },
      checkDate,
      checkTime,
      totalMembers,
      busyMembers,
      freeMembers,
      memberStatuses,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Error fetching team real-time status",
      message: error.message,
    });
  }
});

// Get real-time status for all rooms
router.get("/all-rooms", async (req, res) => {
  console.log("All rooms real-time status route hit with params:", req.query);
  try {
    const { date, time } = req.query;

    // Use current date/time if not provided
    let checkDate, checkTime;
    if (date && time) {
      checkDate = date;
      checkTime = time;
    } else {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      checkDate = `${year}-${month}-${day}`;
      checkTime = `${String(now.getHours()).padStart(2, "0")}:${String(
        now.getMinutes()
      ).padStart(2, "0")}`;
    }

    // Parse the check time and convert to UTC for database comparison
    const [year, month, day] = checkDate.split("-").map(Number);
    const [hour, minute] = checkTime.split(":").map(Number);
    const checkDateTime = new Date(year, month - 1, day, hour, minute, 0, 0);

    // Convert local time to UTC for proper comparison with database times
    const checkDateTimeUTC = new Date(
      checkDateTime.getTime() - checkDateTime.getTimezoneOffset() * 60000
    );

    console.log(
      `Checking real-time status for rooms at date: ${checkDate}, time: ${checkTime} (UTC: ${checkDateTimeUTC.toISOString()})`
    );

    // Get all unique rooms from meetings
    const allRooms = [
      "meeting room (Capacity: 10)",
      "Balcony (Capacity: 8)",
      "sit out (Capacity: 6)",
      "lunch hall (Capacity: 15)",
      "main hall (General Meetings only) (Capacity: 40)",
    ];

    const roomStatuses = [];

    // Check each room's status
    for (const room of allRooms) {
      try {
        // Find meetings where this room is being used and the check time falls within the meeting
        const currentMeetings = await Meeting.find({
          room: room,
          status: { $ne: "cancelled" },
          startTime: { $lte: checkDateTimeUTC },
          endTime: { $gt: checkDateTimeUTC },
        }).populate("teamId", "name color");

        const status = currentMeetings.length > 0 ? "busy" : "free";

        roomStatuses.push({
          room,
          status,
          meetings: currentMeetings.map((meeting) => ({
            title: meeting.title,
            startTime: formatTime(meeting.startTime),
            endTime: meeting.endTime.toISOString(),
            teamName: meeting.teamName,
            attendees: meeting.attendees,
            attendeesCount: meeting.attendees.length,
          })),
        });
      } catch (error) {
        console.error(`Error checking status for room ${room}:`, error);
        roomStatuses.push({
          room,
          status: "free",
          meetings: [],
        });
      }
    }

    // Calculate statistics
    const totalRooms = roomStatuses.length;
    const busyRooms = roomStatuses.filter(
      (room) => room.status === "busy"
    ).length;
    const freeRooms = totalRooms - busyRooms;

    res.json({
      checkDate,
      checkTime,
      totalRooms,
      busyRooms,
      freeRooms,
      roomStatuses,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Error fetching real-time room status",
      message: error.message,
    });
  }
});

// Get current meetings summary
router.get("/current-meetings", async (req, res) => {
  console.log("Current meetings summary route hit with params:", req.query);
  try {
    const { date, time } = req.query;

    // Use current date/time if not provided
    let checkDate, checkTime;
    if (date && time) {
      checkDate = date;
      checkTime = time;
    } else {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      checkDate = `${year}-${month}-${day}`;
      checkTime = `${String(now.getHours()).padStart(2, "0")}:${String(
        now.getMinutes()
      ).padStart(2, "0")}`;
    }

    // Parse the check time and convert to UTC for database comparison
    const [year, month, day] = checkDate.split("-").map(Number);
    const [hour, minute] = checkTime.split(":").map(Number);
    const checkDateTime = new Date(year, month - 1, day, hour, minute, 0, 0);

    // Convert to UTC for proper comparison with database times
    const checkDateTimeUTC = new Date(checkDateTime.toISOString());

    console.log(
      `Getting current meetings summary for ${checkDate} ${checkTime} (UTC: ${checkDateTimeUTC.toISOString()})`
    );

    // Find all meetings happening at the check time
    const currentMeetings = await Meeting.find({
      status: { $ne: "cancelled" },
      startTime: { $lte: checkDateTimeUTC },
      endTime: { $gt: checkDateTimeUTC },
    }).populate("teamId", "name color");

    // Group meetings by room
    const meetingsByRoom = {};
    const totalAttendees = new Set();

    currentMeetings.forEach((meeting) => {
      if (!meetingsByRoom[meeting.room]) {
        meetingsByRoom[meeting.room] = [];
      }
      meetingsByRoom[meeting.room].push({
        id: meeting._id,
        title: meeting.title,
        teamName: meeting.teamName,
        startTime: formatTime(meeting.startTime),
        endTime: meeting.endTime.toISOString(),
        attendees: meeting.attendees,
        attendeesCount: meeting.attendees.length,
      });

      meeting.attendees.forEach((attendee) => totalAttendees.add(attendee));
    });

    res.json({
      checkDate,
      checkTime,
      totalMeetings: currentMeetings.length,
      totalAttendees: totalAttendees.size,
      meetingsByRoom,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Error fetching current meetings summary",
      message: error.message,
    });
  }
});

module.exports = router;
