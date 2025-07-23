const express = require("express");
const { body, validationResult } = require("express-validator");
const Team = require("../models/Team");
const router = express.Router();

// Validation middleware
const validateTeam = [
  body("name")
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Team name is required and must be less than 100 characters"),
  body("color").isHexColor().withMessage("Color must be a valid hex color"),
  body("members")
    .isArray({ min: 1 })
    .withMessage("Team must have at least one member"),
  body("lead").trim().isLength({ min: 1 }).withMessage("Team lead is required"),
  body("project")
    .trim()
    .isLength({ min: 1 })
    .withMessage("Project name is required"),
  body("status")
    .isIn(["active", "completed", "on-hold"])
    .withMessage("Status must be active, completed, or on-hold"),
];

// Get all teams
router.get("/", async (req, res) => {
  try {
    const { search, status, lead } = req.query;
    let query = {};

    // Search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { project: { $regex: search, $options: "i" } },
        { lead: { $regex: search, $options: "i" } },
      ];
    }

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by lead
    if (lead) {
      query.lead = { $regex: lead, $options: "i" };
    }

    const teams = await Team.find(query).sort({ createdAt: -1 });
    res.json(teams);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error fetching teams", message: error.message });
  }
});

// Get team by ID
router.get("/:id", async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }
    res.json(team);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error fetching team", message: error.message });
  }
});

// Create new team
router.post("/", validateTeam, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const team = new Team(req.body);
    await team.save();
    res.status(201).json(team);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: "Team name already exists" });
    }
    res
      .status(500)
      .json({ error: "Error creating team", message: error.message });
  }
});

// Update team
router.put("/:id", validateTeam, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const team = await Team.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }

    res.json(team);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error updating team", message: error.message });
  }
});

// Delete team
router.delete("/:id", async (req, res) => {
  try {
    const team = await Team.findByIdAndDelete(req.params.id);
    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }
    res.json({ message: "Team deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error deleting team", message: error.message });
  }
});

// Get team statistics
router.get("/stats/overview", async (req, res) => {
  try {
    const stats = await Team.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalMembers: { $sum: { $size: "$members" } },
        },
      },
    ]);

    const totalTeams = await Team.countDocuments();
    const activeTeams = await Team.countDocuments({ status: "active" });
    const completedTeams = await Team.countDocuments({ status: "completed" });
    const onHoldTeams = await Team.countDocuments({ status: "on-hold" });

    res.json({
      totalTeams,
      activeTeams,
      completedTeams,
      onHoldTeams,
      detailedStats: stats,
    });
  } catch (error) {
    res
      .status(500)
      .json({
        error: "Error fetching team statistics",
        message: error.message,
      });
  }
});

module.exports = router;
