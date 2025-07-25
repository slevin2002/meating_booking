const express = require("express");
const { body, validationResult } = require("express-validator");
const Meeting = require("../models/Meeting");
const Team = require("../models/Team");
const router = express.Router();

// Add normalization helper at the top
const normalizeName = (name) => name.trim().toLowerCase();

// Helper function to format time in HH:MM format
const formatTime = (date) => {
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
};

// Validation middleware
const validateMeeting = [
  body("title")
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage(
      "Meeting title is required and must be less than 200 characters"
    ),
  body("startTime").isISO8601().withMessage("Start time must be a valid date"),
  body("endTime").isISO8601().withMessage("End time must be a valid date"),
  body("teamId").isMongoId().withMessage("Valid team ID is required"),
  body("room")
    .trim()
    .isLength({ min: 1 })
    .withMessage("Meeting room is required"),
  body("duration")
    .isInt({ min: 15, max: 480 })
    .withMessage("Duration must be between 15 and 480 minutes"),
  body("attendees")
    .optional()
    .isArray()
    .withMessage("Attendees must be an array"),
];

// Get all meetings
router.get("/", async (req, res) => {
  try {
    const {
      teamId,
      status,
      startDate,
      endDate,
      search,
      page = 1,
      limit = 10,
    } = req.query;

    let query = {};

    // Filter by team
    if (teamId) {
      query.teamId = teamId;
    }

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by date range
    if (startDate && endDate) {
      const start = new Date(startDate + "T00:00:00.000Z");
      const end = new Date(endDate + "T23:59:59.999Z");
      query.startTime = { $gte: start, $lte: end };
    }

    // Search functionality
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { teamName: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const meetings = await Meeting.find(query)
      .populate("teamId", "name color")
      .sort({ startTime: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Meeting.countDocuments(query);

    res.json({
      meetings,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalMeetings: total,
        hasNext: skip + meetings.length < total,
        hasPrev: parseInt(page) > 1,
      },
    });
  } catch (error) {
    console.error(error); // Log the error for debugging
    res
      .status(500)
      .json({ error: "Error fetching meetings", message: error.message });
  }
});

// Check room availability
router.get("/check-room-availability", async (req, res) => {
  console.log("Room availability check route hit with params:", req.query);
  try {
    const { room, date, startTime, endTime } = req.query;
    if (!room || !date || !startTime || !endTime) {
      return res.status(400).json({
        error:
          "Missing required query parameters: room, date, startTime, endTime",
      });
    }

    // Construct start and end Date objects with proper timezone handling
    // Parse the date components and create date in local timezone
    const [year, month, day] = date.split("-").map(Number);
    const [startHour, startMinute] = startTime.split(":").map(Number);
    const [endHour, endMinute] = endTime.split(":").map(Number);

    console.log(`DEBUG: Parsing date/time for room ${room}:`);
    console.log(`  Date: ${date}, Start: ${startTime}, End: ${endTime}`);
    console.log(`  Parsed: Year=${year}, Month=${month}, Day=${day}`);
    console.log(`  Parsed: StartHour=${startHour}, StartMinute=${startMinute}`);
    console.log(`  Parsed: EndHour=${endHour}, EndMinute=${endMinute}`);

    // Create dates in local timezone without timezone conversion
    const start = new Date(year, month - 1, day, startHour, startMinute, 0, 0);
    const end = new Date(year, month - 1, day, endHour, endMinute, 0, 0);

    // Convert to UTC while preserving the local time
    const startUTC = new Date(
      start.getTime() - start.getTimezoneOffset() * 60000
    );
    const endUTC = new Date(end.getTime() - end.getTimezoneOffset() * 60000);

    if (isNaN(startUTC.getTime()) || isNaN(endUTC.getTime())) {
      return res.status(400).json({ error: "Invalid date or time format" });
    }
    if (endUTC <= startUTC) {
      return res
        .status(400)
        .json({ error: "End time must be after start time" });
    }

    console.log(`Checking availability for room: ${room}`);
    console.log(
      `Time range: ${startUTC.toISOString()} to ${endUTC.toISOString()}`
    );
    console.log(`Local time range: ${start.toString()} to ${end.toString()}`);

    // Find meetings where this room is booked and times overlap
    console.log(`DEBUG: Querying for room conflicts for ${room}:`);
    console.log(
      `  Query: startTime < ${endUTC.toISOString()} AND endTime > ${startUTC.toISOString()}`
    );

    const conflicts = await Meeting.find({
      room: room,
      status: { $ne: "cancelled" },
      startTime: { $lt: endUTC },
      endTime: { $gt: startUTC },
    }).populate("teamId", "name color");

    // Also get all meetings for this room to debug
    const allMeetings = await Meeting.find({
      room: room,
      status: { $ne: "cancelled" },
    });
    console.log(
      `DEBUG: All meetings for room ${room}:`,
      allMeetings.map((m) => ({
        title: m.title,
        startTime: m.startTime,
        endTime: m.endTime,
        room: m.room,
      }))
    );

    console.log(
      `Found conflicts:`,
      conflicts.map((c) => ({
        title: c.title,
        startTime: c.startTime,
        endTime: c.endTime,
        room: c.room,
      }))
    );

    console.log(
      `Found ${conflicts.length} conflicting meetings for room ${room}`
    );

    if (conflicts.length > 0) {
      console.log("Room is BUSY during this time");
      return res.json({
        status: "busy",
        conflicts,
        message: `${room} is busy during the selected time`,
      });
    } else {
      console.log("Room is FREE during this time");
      return res.json({
        status: "free",
        conflicts: [],
        message: `${room} is available during the selected time`,
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Error checking room availability",
      message: error.message,
    });
  }
});

// Check member availability - must be before /:id route
router.get("/check-member-availability", async (req, res) => {
  console.log("Availability check route hit with params:", req.query);
  try {
    const { member, date, startTime, endTime } = req.query;
    if (!member || !date || !startTime || !endTime) {
      return res.status(400).json({
        error:
          "Missing required query parameters: member, date, startTime, endTime",
      });
    }

    // Construct start and end Date objects with proper timezone handling
    // Parse the date components and create date in local timezone
    const [year, month, day] = date.split("-").map(Number);
    const [startHour, startMinute] = startTime.split(":").map(Number);
    const [endHour, endMinute] = endTime.split(":").map(Number);

    console.log(`DEBUG: Parsing date/time for ${member}:`);
    console.log(`  Date: ${date}, Start: ${startTime}, End: ${endTime}`);
    console.log(`  Parsed: Year=${year}, Month=${month}, Day=${day}`);
    console.log(`  Parsed: StartHour=${startHour}, StartMinute=${startMinute}`);
    console.log(`  Parsed: EndHour=${endHour}, EndMinute=${endMinute}`);

    // Create dates in local timezone without timezone conversion
    const start = new Date(year, month - 1, day, startHour, startMinute, 0, 0);
    const end = new Date(year, month - 1, day, endHour, endMinute, 0, 0);

    // Convert to UTC while preserving the local time
    const startUTC = new Date(
      start.getTime() - start.getTimezoneOffset() * 60000
    );
    const endUTC = new Date(end.getTime() - end.getTimezoneOffset() * 60000);
    if (isNaN(startUTC.getTime()) || isNaN(endUTC.getTime())) {
      return res.status(400).json({ error: "Invalid date or time format" });
    }
    if (endUTC <= startUTC) {
      return res
        .status(400)
        .json({ error: "End time must be after start time" });
    }

    console.log(`Checking availability for member: ${member}`);
    console.log(
      `Time range: ${startUTC.toISOString()} to ${endUTC.toISOString()}`
    );
    console.log(`Local time range: ${start.toString()} to ${end.toString()}`);

    // Find meetings where this member is an attendee and times overlap
    console.log(`DEBUG: Querying for conflicts for ${member}:`);
    console.log(
      `  Query: startTime < ${endUTC.toISOString()} AND endTime > ${startUTC.toISOString()}`
    );

    const conflicts = await Meeting.find({
      attendees: member,
      status: { $ne: "cancelled" },
      startTime: { $lt: endUTC },
      endTime: { $gt: startUTC },
    }).populate("teamId", "name color");

    // Also get all meetings for this member to debug
    const allMeetings = await Meeting.find({
      attendees: member,
      status: { $ne: "cancelled" },
    });
    console.log(
      `DEBUG: All meetings for ${member}:`,
      allMeetings.map((m) => ({
        title: m.title,
        startTime: m.startTime,
        endTime: m.endTime,
        attendees: m.attendees,
      }))
    );

    console.log(
      `Found conflicts:`,
      conflicts.map((c) => ({
        title: c.title,
        startTime: c.startTime,
        endTime: c.endTime,
        attendees: c.attendees,
      }))
    );

    console.log(`Found ${conflicts.length} conflicting meetings for ${member}`);

    if (conflicts.length > 0) {
      console.log("Member is BUSY during this time");
      return res.json({
        status: "busy",
        conflicts,
        message: `${member} is busy during the selected time`,
      });
    } else {
      console.log("Member is FREE during this time");
      return res.json({
        status: "free",
        conflicts: [],
        message: `${member} is available during the selected time`,
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Error checking member availability",
      message: error.message,
    });
  }
});

// Get real-time status for all employees
router.get("/real-time-status", async (req, res) => {
  console.log("Real-time status route hit with params:", req.query);
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

    // Parse the check time and treat as UTC for database comparison
    const [year, month, day] = checkDate.split("-").map(Number);
    const [hour, minute] = checkTime.split(":").map(Number);
    // JS months are 0-based
    const checkDateTimeUTC = new Date(
      Date.UTC(year, month - 1, day, hour, minute, 0, 0)
    );
    console.log("DEBUG: Input treated as UTC:", checkDateTimeUTC.toISOString());

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
        // Find all meetings at this time
        const possibleMeetings = await Meeting.find({
          status: { $ne: "cancelled" },
          startTime: { $lte: checkDateTimeUTC },
          endTime: { $gt: checkDateTimeUTC },
        });
        // Manually check for normalized attendee match
        const currentMeetings = possibleMeetings.filter((mtg) =>
          (mtg.attendees || []).map(normalizeName).includes(normalizedEmployee)
        );
        const status = currentMeetings.length > 0 ? "busy" : "free";
        employeeStatuses.push({
          name: employee,
          status,
          meetings: currentMeetings.map((meeting) => ({
            title: meeting.title,
            startTime: formatTime(meeting.startTime),
            endTime: formatTime(meeting.endTime),
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

// Get current meetings for a specific employee
router.get("/employee-current-meetings", async (req, res) => {
  console.log("Employee current meetings route hit with params:", req.query);
  try {
    const { employee, date, time } = req.query;

    if (!employee) {
      return res.status(400).json({
        error: "Missing required query parameter: employee",
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
    const checkDateTimeUTC = new Date(
      Date.UTC(year, month - 1, day, hour, minute, 0, 0)
    );

    console.log(
      `Checking current meetings for ${employee} at ${checkDate} ${checkTime} (UTC: ${checkDateTimeUTC.toISOString()})`
    );

    // Find meetings where this employee is an attendee and the check time falls within the meeting
    const currentMeetings = await Meeting.find({
      attendees: employee,
      status: { $ne: "cancelled" },
      startTime: { $lte: checkDateTimeUTC },
      endTime: { $gt: checkDateTimeUTC },
    }).populate("teamId", "name color");

    const status = currentMeetings.length > 0 ? "busy" : "free";

    res.json({
      employee,
      checkDate,
      checkTime,
      status,
      currentMeetings: currentMeetings.map((meeting) => ({
        id: meeting._id,
        title: meeting.title,
        description: meeting.description,
        startTime: formatTime(meeting.startTime),
        endTime: formatTime(meeting.endTime),
        teamName: meeting.teamName,
        room: meeting.room,
        duration: meeting.duration,
      })),
      totalMeetings: currentMeetings.length,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Error fetching employee current meetings",
      message: error.message,
    });
  }
});

// Get all meetings for a specific member
router.get("/member-meetings", async (req, res) => {
  console.log("Member meetings route hit with params:", req.query);
  try {
    const { member, date } = req.query;
    if (!member) {
      return res.status(400).json({
        error: "Missing required query parameter: member",
      });
    }

    console.log(
      `Fetching meetings for member: ${member}${
        date ? ` on date: ${date}` : ""
      }`
    );

    // Build query
    let query = { attendees: member };

    // Filter by date if provided
    if (date) {
      const [year, month, day] = date.split("-").map(Number);
      const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0);
      const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999);

      query.startTime = { $gte: startOfDay, $lte: endOfDay };
    }

    // Find all meetings where this member is an attendee
    const meetings = await Meeting.find(query)
      .populate("teamId", "name color")
      .sort({ startTime: 1 });

    console.log(
      `Found ${meetings.length} meetings for ${member}${
        date ? ` on ${date}` : ""
      }`
    );

    res.json({
      meetings,
      member,
      date,
      totalMeetings: meetings.length,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Error fetching member meetings",
      message: error.message,
    });
  }
});

// Get meeting by ID
router.get("/:id", async (req, res) => {
  console.log("Meeting by ID route hit with id:", req.params.id);
  try {
    const meeting = await Meeting.findById(req.params.id).populate(
      "teamId",
      "name color"
    );
    if (!meeting) {
      return res.status(404).json({ error: "Meeting not found" });
    }
    res.json(meeting);
  } catch (error) {
    console.error(error); // Log the error for debugging
    res
      .status(500)
      .json({ error: "Error fetching meeting", message: error.message });
  }
});

// Create new meeting
router.post("/", validateMeeting, async (req, res) => {
  try {
    console.log("Creating meeting with data:", req.body);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // FIX: Destructure teamId and room from req.body
    const { teamId, room, attendees = [] } = req.body;
    // Normalize attendee names
    const normalizedAttendees = (attendees || []).map((a) => a.trim());

    // Use ISO string input for startTime and endTime
    const startTime = new Date(req.body.startTime);
    const endTime = new Date(req.body.endTime);

    // Logging for debugging
    console.log("Checking attendee conflicts for:", normalizedAttendees);
    console.log("Start:", startTime, "End:", endTime);

    // Check for time conflicts (team)
    const conflictingMeeting = await Meeting.findOne({
      teamId,
      status: { $ne: "cancelled" },
      $or: [
        {
          startTime: { $lt: endTime },
          endTime: { $gt: startTime },
        },
      ],
    });

    if (conflictingMeeting) {
      return res.status(409).json({
        error: "Time conflict detected",
        message: "There is already a meeting scheduled for this time slot",
      });
    }

    // Check for room conflicts
    const conflictingRoomMeeting = await Meeting.findOne({
      room,
      status: { $ne: "cancelled" },
      $or: [
        {
          startTime: { $lt: endTime },
          endTime: { $gt: startTime },
        },
      ],
    });
    if (conflictingRoomMeeting) {
      return res.status(409).json({
        error: "Room conflict detected",
        message: "This room is already booked for the selected time slot.",
      });
    }

    // --- Attendee conflict check ---
    const busyAttendees = [];
    for (const member of normalizedAttendees) {
      console.log(`Checking conflicts for member: "${member}"`);
      const conflicts = await Meeting.find({
        attendees: member,
        status: { $ne: "cancelled" },
        startTime: { $lt: endTime },
        endTime: { $gt: startTime },
      });
      if (conflicts.length > 0) {
        busyAttendees.push(member);
      }
    }
    console.log("Busy attendees found:", busyAttendees);
    if (busyAttendees.length > 0) {
      return res.status(400).json({
        error: "Attendee conflict detected",
        message: `The following attendees are already booked for another meeting during this time: ${busyAttendees.join(
          ", "
        )}`,
        busyAttendees,
      });
    }
    // --- End attendee conflict check ---

    // Get team name
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }

    // Get or create system user for meetings without authentication
    let createdBy = req.user?.id;
    if (!createdBy) {
      const User = require("../models/User");
      let systemUser = await User.findOne({ email: "system@company.com" });
      if (!systemUser) {
        systemUser = new User({
          name: "System User",
          email: "system@company.com",
          password: "system123",
          role: "admin",
          isActive: true,
        });
        await systemUser.save();
      }
      createdBy = systemUser._id;
    }

    const meetingData = {
      ...req.body,
      attendees: normalizedAttendees,
      teamName: team.name,
      createdBy: createdBy,
      startTime: startTime,
      endTime: endTime,
    };

    console.log("Final meeting data to save:", meetingData);
    const meeting = new Meeting(meetingData);
    await meeting.save();
    console.log("Meeting saved successfully:", meeting);

    const populatedMeeting = await Meeting.findById(meeting._id).populate(
      "teamId",
      "name color"
    );
    res.status(201).json(populatedMeeting);
  } catch (error) {
    console.error(error); // Log the error for debugging
    res
      .status(500)
      .json({ error: "Error creating meeting", message: error.message });
  }
});

// Update meeting
router.put("/:id", validateMeeting, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const meeting = await Meeting.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate("teamId", "name color");

    if (!meeting) {
      return res.status(404).json({ error: "Meeting not found" });
    }

    res.json(meeting);
  } catch (error) {
    console.error(error); // Log the error for debugging
    res
      .status(500)
      .json({ error: "Error updating meeting", message: error.message });
  }
});

// Delete meeting
router.delete("/:id", async (req, res) => {
  try {
    const meeting = await Meeting.findByIdAndDelete(req.params.id);
    if (!meeting) {
      return res.status(404).json({ error: "Meeting not found" });
    }
    res.json({ message: "Meeting deleted successfully" });
  } catch (error) {
    console.error(error); // Log the error for debugging
    res
      .status(500)
      .json({ error: "Error deleting meeting", message: error.message });
  }
});

// Get meeting statistics
router.get("/stats/overview", async (req, res) => {
  try {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const stats = await Meeting.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalDuration: { $sum: "$duration" },
        },
      },
    ]);

    const totalMeetings = await Meeting.countDocuments();
    const scheduledMeetings = await Meeting.countDocuments({
      status: "scheduled",
    });
    const completedMeetings = await Meeting.countDocuments({
      status: "completed",
    });
    const cancelledMeetings = await Meeting.countDocuments({
      status: "cancelled",
    });
    const monthlyMeetings = await Meeting.countDocuments({
      startTime: { $gte: startOfMonth, $lte: endOfMonth },
    });

    res.json({
      totalMeetings,
      scheduledMeetings,
      completedMeetings,
      cancelledMeetings,
      monthlyMeetings,
      detailedStats: stats,
    });
  } catch (error) {
    res.status(500).json({
      error: "Error fetching meeting statistics",
      message: error.message,
    });
  }
});

module.exports = router;