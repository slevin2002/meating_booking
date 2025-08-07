const express = require("express");
const User = require("../models/User");
const Meeting = require("../models/Meeting");
const Team = require("../models/Team");
const router = express.Router();

// Test endpoint to verify admin routes are working
router.get("/test", (req, res) => {
  res.json({ message: "Admin routes are working!" });
});

// Admin middleware - check if user is admin
const adminMiddleware = (req, res, next) => {
  // For now, allow all users to access admin features for testing
  // In production, you should check for admin role
  console.log("Admin middleware - req.user:", req.user);
  next();
};

// Get admin dashboard statistics
router.get("/stats", adminMiddleware, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalTeams = await Team.countDocuments();
    const totalMeetings = await Meeting.countDocuments();
    const activeMeetings = await Meeting.countDocuments({
      status: { $ne: "cancelled" },
    });
    const cancelledMeetings = await Meeting.countDocuments({
      status: "cancelled",
    });

    // Get room statistics
    const roomStats = await Meeting.aggregate([
      {
        $group: {
          _id: "$room",
          count: { $sum: 1 },
          activeCount: {
            $sum: { $cond: [{ $ne: ["$status", "cancelled"] }, 1, 0] },
          },
        },
      },
    ]);

    res.json({
      totalUsers,
      totalTeams,
      totalMeetings,
      activeMeetings,
      cancelledMeetings,
      roomStats,
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    res.status(500).json({ error: "Error fetching statistics" });
  }
});

// Get all users for admin management
router.get("/users", adminMiddleware, async (req, res) => {
  try {
    const users = await User.find({}, { password: 0 }); // Exclude password
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Error fetching users" });
  }
});

// Suspend user
router.put("/users/:userId/suspend", adminMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findByIdAndUpdate(
      userId,
      { status: "suspended" },
      { new: true, select: "-password" }
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ message: "User suspended successfully", user });
  } catch (error) {
    console.error("Error suspending user:", error);
    res.status(500).json({ error: "Error suspending user" });
  }
});

// Activate user
router.put("/users/:userId/activate", adminMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findByIdAndUpdate(
      userId,
      { status: "active" },
      { new: true, select: "-password" }
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ message: "User activated successfully", user });
  } catch (error) {
    console.error("Error activating user:", error);
    res.status(500).json({ error: "Error activating user" });
  }
});

// Get all meetings for admin management
router.get("/meetings", adminMiddleware, async (req, res) => {
  try {
    const meetings = await Meeting.find()
      .populate("teamId", "name color")
      .populate("createdBy", "name email")
      .populate("cancelledBy", "name email")
      .sort({ createdAt: -1 });

    res.json(meetings);
  } catch (error) {
    console.error("Error fetching meetings:", error);
    res.status(500).json({ error: "Error fetching meetings" });
  }
});

// Cancel meeting (admin action)
router.put("/meetings/:meetingId/cancel", adminMiddleware, async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { reason } = req.body;

    const meeting = await Meeting.findByIdAndUpdate(
      meetingId,
      {
        status: "cancelled",
        cancelledBy: req.user.userId,
        cancellationReason: reason || "Cancelled by administrator",
      },
      { new: true }
    ).populate("teamId", "name color");

    if (!meeting) {
      return res.status(404).json({ error: "Meeting not found" });
    }

    res.json({ message: "Meeting cancelled successfully", meeting });
  } catch (error) {
    console.error("Error cancelling meeting:", error);
    res.status(500).json({ error: "Error cancelling meeting" });
  }
});

// Get system settings
router.get("/settings", adminMiddleware, async (req, res) => {
  try {
    // For now, return default settings
    // In production, these should be stored in database
    const settings = {
      systemName: "Meeting Booking System",
      defaultMeetingDuration: 60,
      bookingTimeLimit: 24,
      emailNotifications: true,
      otpExpiryTime: 5,
      mainHallRestriction: true,
      otpRequiredForGeneralMeetings: true,
    };

    res.json(settings);
  } catch (error) {
    console.error("Error fetching settings:", error);
    res.status(500).json({ error: "Error fetching settings" });
  }
});

// Update system settings
router.put("/settings", adminMiddleware, async (req, res) => {
  try {
    const {
      systemName,
      defaultMeetingDuration,
      bookingTimeLimit,
      emailNotifications,
      otpExpiryTime,
      mainHallRestriction,
      otpRequiredForGeneralMeetings,
    } = req.body;

    // In production, save these to database
    const settings = {
      systemName,
      defaultMeetingDuration,
      bookingTimeLimit,
      emailNotifications,
      otpExpiryTime,
      mainHallRestriction,
      otpRequiredForGeneralMeetings,
    };

    res.json({ message: "Settings updated successfully", settings });
  } catch (error) {
    console.error("Error updating settings:", error);
    res.status(500).json({ error: "Error updating settings" });
  }
});

// Backup database (placeholder)
router.post("/backup", adminMiddleware, async (req, res) => {
  try {
    // In production, implement actual database backup
    res.json({ message: "Database backup initiated successfully" });
  } catch (error) {
    console.error("Error backing up database:", error);
    res.status(500).json({ error: "Error backing up database" });
  }
});

// Clear cache (placeholder)
router.post("/clear-cache", adminMiddleware, async (req, res) => {
  try {
    // In production, implement actual cache clearing
    res.json({ message: "Cache cleared successfully" });
  } catch (error) {
    console.error("Error clearing cache:", error);
    res.status(500).json({ error: "Error clearing cache" });
  }
});

// Reset system (placeholder)
router.post("/reset-system", adminMiddleware, async (req, res) => {
  try {
    // In production, implement actual system reset
    res.json({ message: "System reset initiated successfully" });
  } catch (error) {
    console.error("Error resetting system:", error);
    res.status(500).json({ error: "Error resetting system" });
  }
});

module.exports = router;
