const express = require("express");
const { body, validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");
const Meeting = require("../models/Meeting");
const Team = require("../models/Team");
const User = require("../models/User");
const zoomService = require("../utils/zoomService");
const {
  sendMeetingInvitations,
  sendMeetingCancellationEmail,
} = require("../utils/emailService");
const router = express.Router();

// Authentication middleware
const authMiddleware = (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ error: "Access denied. No token provided." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid token." });
  }
};

// Validation middleware for Zoom meetings
const validateZoomMeeting = [
  body("title")
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage(
      "Meeting title is required and must be less than 200 characters"
    ),
  body("startTime").isISO8601().withMessage("Start time must be a valid date"),
  body("endTime").isISO8601().withMessage("End time must be a valid date"),
  body("teamId").isMongoId().withMessage("Valid team ID is required"),
  body("duration")
    .isInt({ min: 15, max: 480 })
    .withMessage("Duration must be between 15 and 480 minutes"),
  body("attendees")
    .optional()
    .isArray()
    .withMessage("Attendees must be an array"),
];

// Create Zoom meeting
router.post(
  "/create",
  authMiddleware,
  validateZoomMeeting,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        title,
        description,
        startTime,
        endTime,
        duration,
        teamId,
        attendees,
      } = req.body;

      // Check if team exists
      const team = await Team.findById(teamId);
      if (!team) {
        return res.status(404).json({ error: "Team not found" });
      }

      // Create Zoom meeting
      const zoomMeetingData = {
        title: `${title} - ${team.name}`,
        startTime: new Date(startTime).toISOString(),
        duration: Math.round(duration / 60), // Convert to hours for Zoom
      };

      const zoomResult = await zoomService.createMeeting(zoomMeetingData);

      // Create meeting in database
      const meeting = new Meeting({
        title,
        description: description || `Zoom meeting for ${team.name}`,
        startTime,
        endTime,
        duration,
        teamId,
        room: "Zoom Meeting",
        attendees: attendees || team.members,
        status: "scheduled",
        meetingType: "zoom",
        zoomMeetingId: zoomResult.meeting_id,
        zoomJoinUrl: zoomResult.join_url,
        zoomStartUrl: zoomResult.start_url,
        zoomPassword: zoomResult.password,
        createdBy: req.user._id,
      });

      await meeting.save();

      // Send email invitations if attendees are provided
      let emailNotifications = { total: 0, successful: 0, failed: 0 };
      if (attendees && attendees.length > 0) {
        try {
          const creator = await User.findById(req.user._id);
          emailNotifications = await sendMeetingInvitations(
            meeting,
            creator,
            attendees
          );
        } catch (emailError) {
          console.error("Failed to send email notifications:", emailError);
          emailNotifications = {
            total: attendees.length,
            successful: 0,
            failed: attendees.length,
          };
        }
      }

      // Populate team information
      await meeting.populate("teamId");

      res.status(201).json({
        success: true,
        meeting,
        zoomDetails: {
          joinUrl: zoomResult.join_url,
          startUrl: zoomResult.start_url,
          meetingId: zoomResult.meeting_id,
          password: zoomResult.password,
        },
        emailNotifications,
      });
    } catch (error) {
      console.error("Error creating Zoom meeting:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

// Get all Zoom meetings
router.get("/", authMiddleware, async (req, res) => {
  try {
    const {
      teamId,
      status,
      startDate,
      endDate,
      page = 1,
      limit = 10,
    } = req.query;

    let query = { meetingType: "zoom" };

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

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const meetings = await Meeting.find(query)
      .populate("teamId")
      .populate("createdBy", "name email")
      .sort({ startTime: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Meeting.countDocuments(query);

    res.json({
      success: true,
      meetings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching Zoom meetings:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get Zoom meeting by ID
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const meeting = await Meeting.findOne({
      _id: req.params.id,
      meetingType: "zoom",
    })
      .populate("teamId")
      .populate("createdBy", "name email");

    if (!meeting) {
      return res.status(404).json({ error: "Zoom meeting not found" });
    }

    // Get updated Zoom meeting details
    let zoomDetails = null;
    if (meeting.zoomMeetingId) {
      try {
        const zoomMeeting = await zoomService.getMeeting(meeting.zoomMeetingId);
        zoomDetails = {
          joinUrl: zoomMeeting.join_url,
          startUrl: zoomMeeting.start_url,
          meetingId: zoomMeeting.id,
          password: zoomMeeting.password,
          status: zoomMeeting.status,
        };
      } catch (zoomError) {
        console.error("Error fetching Zoom details:", zoomError);
        zoomDetails = {
          joinUrl: meeting.zoomJoinUrl,
          startUrl: meeting.zoomStartUrl,
          meetingId: meeting.zoomMeetingId,
          password: meeting.zoomPassword,
          status: "unknown",
        };
      }
    }

    res.json({
      success: true,
      meeting,
      zoomDetails,
    });
  } catch (error) {
    console.error("Error fetching Zoom meeting:", error);
    res.status(500).json({ error: error.message });
  }
});

// Update Zoom meeting
router.put("/:id", authMiddleware, validateZoomMeeting, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const meeting = await Meeting.findOne({
      _id: req.params.id,
      meetingType: "zoom",
    });

    if (!meeting) {
      return res.status(404).json({ error: "Zoom meeting not found" });
    }

    const { title, description, startTime, endTime, duration, attendees } =
      req.body;

    // Update Zoom meeting if meeting ID exists
    if (meeting.zoomMeetingId) {
      try {
        const zoomMeetingData = {
          title: `${title} - ${meeting.teamId.name}`,
          startTime: new Date(startTime).toISOString(),
          duration: Math.round(duration / 60),
        };

        await zoomService.updateMeeting(meeting.zoomMeetingId, zoomMeetingData);
      } catch (zoomError) {
        console.error("Error updating Zoom meeting:", zoomError);
        // Continue with database update even if Zoom update fails
      }
    }

    // Update database
    meeting.title = title;
    meeting.description = description || meeting.description;
    meeting.startTime = startTime;
    meeting.endTime = endTime;
    meeting.duration = duration;
    meeting.attendees = attendees || meeting.attendees;
    meeting.updatedAt = new Date();

    await meeting.save();
    await meeting.populate("teamId");

    res.json({
      success: true,
      meeting,
    });
  } catch (error) {
    console.error("Error updating Zoom meeting:", error);
    res.status(500).json({ error: error.message });
  }
});

// Delete Zoom meeting
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const meeting = await Meeting.findOne({
      _id: req.params.id,
      meetingType: "zoom",
    });

    if (!meeting) {
      return res.status(404).json({ error: "Zoom meeting not found" });
    }

    // Delete from Zoom if meeting ID exists
    if (meeting.zoomMeetingId) {
      try {
        await zoomService.deleteMeeting(meeting.zoomMeetingId);
      } catch (zoomError) {
        console.error("Error deleting Zoom meeting:", zoomError);
        // Continue with database deletion even if Zoom deletion fails
      }
    }

    // Send cancellation emails
    if (meeting.attendees && meeting.attendees.length > 0) {
      try {
        const creator = await User.findById(meeting.createdBy);
        await sendMeetingCancellationEmail(meeting, creator, meeting.attendees);
      } catch (emailError) {
        console.error("Error sending cancellation emails:", emailError);
      }
    }

    await Meeting.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Zoom meeting deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting Zoom meeting:", error);
    res.status(500).json({ error: error.message });
  }
});

// Join Zoom meeting
router.post("/:id/join", authMiddleware, async (req, res) => {
  try {
    const meeting = await Meeting.findOne({
      _id: req.params.id,
      meetingType: "zoom",
    }).populate("teamId");

    if (!meeting) {
      return res.status(404).json({ error: "Zoom meeting not found" });
    }

    if (!meeting.zoomJoinUrl) {
      return res
        .status(400)
        .json({ error: "No join URL available for this meeting" });
    }

    res.json({
      success: true,
      joinUrl: meeting.zoomJoinUrl,
      meetingId: meeting.zoomMeetingId,
      password: meeting.zoomPassword,
      title: meeting.title,
      startTime: meeting.startTime,
    });
  } catch (error) {
    console.error("Error joining Zoom meeting:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get Zoom meeting statistics
router.get("/stats/overview", authMiddleware, async (req, res) => {
  try {
    const totalMeetings = await Meeting.countDocuments({ meetingType: "zoom" });
    const scheduledMeetings = await Meeting.countDocuments({
      meetingType: "zoom",
      status: "scheduled",
    });
    const completedMeetings = await Meeting.countDocuments({
      meetingType: "zoom",
      status: "completed",
    });
    const cancelledMeetings = await Meeting.countDocuments({
      meetingType: "zoom",
      status: "cancelled",
    });

    // Get upcoming meetings
    const upcomingMeetings = await Meeting.find({
      meetingType: "zoom",
      startTime: { $gte: new Date() },
      status: "scheduled",
    })
      .populate("teamId")
      .sort({ startTime: 1 })
      .limit(5);

    res.json({
      success: true,
      stats: {
        total: totalMeetings,
        scheduled: scheduledMeetings,
        completed: completedMeetings,
        cancelled: cancelledMeetings,
      },
      upcomingMeetings,
    });
  } catch (error) {
    console.error("Error fetching Zoom meeting stats:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;


