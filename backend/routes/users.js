const express = require("express");
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Team = require("../models/Team");
const {
  generateOTP,
  storeOTP,
  verifyOTP,
  sendOTPEmail,
} = require("../utils/otpService");
const router = express.Router();

// Validation middleware
const validateUser = [
  body("email").isEmail().withMessage("Valid email is required"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
  body("otp")
    .optional()
    .isLength({ min: 6, max: 6 })
    .withMessage("OTP must be 6 digits"),
];

const validateOTPRequest = [
  body("email").isEmail().withMessage("Valid email is required"),
];

const validateOTPVerification = [
  body("email").isEmail().withMessage("Valid email is required"),
  body("otp").isLength({ min: 6, max: 6 }).withMessage("OTP must be 6 digits"),
];

const validateLogin = [
  body("email").isEmail().withMessage("Valid email is required"),
  body("password").notEmpty().withMessage("Password is required"),
];

// Authentication middleware (placeholder - implement proper JWT verification)
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

// Register new user
router.post("/register", validateUser, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Validate team if provided
    if (req.body.teamId) {
      const team = await Team.findById(req.body.teamId);
      if (!team) {
        return res.status(404).json({ error: "Team not found" });
      }
    }

    // Check if user already exists in User model
    const existingUser = await User.findOne({
      email: req.body.email,
    });
    if (!existingUser) {
      return res.status(400).json({
        error:
          "Email not found in system. Please contact administrator to add your email.",
      });
    }

    // Allow registration for all users since OTP is optional

    // Update existing user with password and other registration data
    existingUser.password = req.body.password;
    if (req.body.teamId) {
      existingUser.teamId = req.body.teamId;
    }

    // If OTP is provided, verify it
    if (req.body.otp) {
      const verificationResult = verifyOTP(req.body.email, req.body.otp);
      if (!verificationResult.valid) {
        return res.status(400).json({
          error: verificationResult.message,
        });
      }
    }

    await existingUser.save();
    const user = existingUser;

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        role: user.role || "user",
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.status(201).json({
      message: "Registration successful",
      user: user.toJSON(),
      token,
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error registering user", message: error.message });
  }
});

// Login user
router.post("/login", validateLogin, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email }).populate("teamId", "name color");
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Check if user has a password set (has registered)
    if (!user.password || user.password.length === 0) {
      return res.status(401).json({
        error: "Account not activated. Please register first.",
      });
    }

    // Verify password
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        role: user.role || "user",
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({
      message: "Login successful",
      user: user.toJSON(),
      token,
    });
  } catch (error) {
    res.status(500).json({ error: "Error logging in", message: error.message });
  }
});

// OTP Login
router.post("/login-otp", validateOTPVerification, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, otp } = req.body;

    // Find user by email
    const user = await User.findOne({ email }).populate("teamId", "name color");
    if (!user) {
      return res.status(401).json({ error: "Invalid email or OTP" });
    }

    // Verify OTP
    const verificationResult = verifyOTP(email, otp);
    if (!verificationResult.valid) {
      return res.status(401).json({
        error: verificationResult.message,
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        role: user.role || "user",
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({
      message: "Login successful",
      user: user.toJSON(),
      token,
    });
  } catch (error) {
    res.status(500).json({ error: "Error logging in", message: error.message });
  }
});

// Get current user profile
router.get("/profile", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).populate(
      "teamId",
      "name color"
    );
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user.toJSON());
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error fetching user profile", message: error.message });
  }
});

// Update user profile
router.put(
  "/profile",
  authMiddleware,
  [
    body("name").optional().trim().isLength({ min: 1, max: 100 }),
    body("email").optional().isEmail(),
    body("teamId").optional().isMongoId(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const updateData = { ...req.body };
      delete updateData.password; // Don't allow password update through this route
      delete updateData.role; // Don't allow role update through this route

      // Validate team if provided
      if (updateData.teamId) {
        const team = await Team.findById(updateData.teamId);
        if (!team) {
          return res.status(404).json({ error: "Team not found" });
        }
      }

      const user = await User.findByIdAndUpdate(req.user.userId, updateData, {
        new: true,
        runValidators: true,
      }).populate("teamId", "name color");

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json(user.toJSON());
    } catch (error) {
      res
        .status(500)
        .json({ error: "Error updating user profile", message: error.message });
    }
  }
);

// Get all users (public, like teams)
router.get("/", async (req, res) => {
  try {
    const { search, role, teamId, page = 1, limit = 10 } = req.query;
    let query = {};

    // Search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    // Filter by role
    if (role) {
      query.role = role;
    }

    // Filter by team
    if (teamId) {
      query.teamId = teamId;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const users = await User.find(query)
      .populate("teamId", "name color")
      .select("-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.json({
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalUsers: total,
        hasNext: skip + users.length < total,
        hasPrev: parseInt(page) > 1,
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error fetching users", message: error.message });
  }
});

// Get user by ID (admin only)
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "admin" && req.user.userId !== req.params.id) {
      return res.status(403).json({ error: "Access denied." });
    }

    const user = await User.findById(req.params.id)
      .populate("teamId", "name color")
      .select("-password");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error fetching user", message: error.message });
  }
});

// Update user (admin only)
router.put("/:id", authMiddleware, validateUser, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ error: "Access denied. Admin role required." });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate("teamId", "name color")
      .select("-password");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error updating user", message: error.message });
  }
});

// Delete user (admin only)
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ error: "Access denied. Admin role required." });
    }

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error deleting user", message: error.message });
  }
});

// OTP Routes

// Request OTP for registration
router.post("/request-otp", validateOTPRequest, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;

    // Check if user exists in User model
    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      return res.status(400).json({
        error:
          "Email not found in system. Please contact administrator to add your email.",
      });
    }

    // Allow OTP requests for all users since OTP is optional

    // Generate and store OTP
    const otp = generateOTP();
    storeOTP(email, otp);

    // Send OTP email
    const emailResult = await sendOTPEmail(email, otp);
    if (!emailResult.success) {
      return res.status(500).json({
        error: "Failed to send OTP email",
        message: emailResult.error,
      });
    }

    res.json({
      message: "OTP sent successfully",
      email: email,
    });
  } catch (error) {
    res.status(500).json({
      error: "Error requesting OTP",
      message: error.message,
    });
  }
});

// Verify OTP and complete registration
router.post("/verify-otp", validateOTPVerification, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, otp, teamId } = req.body;

    // Verify OTP
    const verificationResult = verifyOTP(email, otp);
    if (!verificationResult.valid) {
      return res.status(400).json({
        error: verificationResult.message,
      });
    }

    // Find user and complete registration
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Update user with teamId if provided
    if (teamId) {
      const team = await Team.findById(teamId);
      if (!team) {
        return res.status(404).json({ error: "Team not found" });
      }
      user.teamId = teamId;
    }

    // Mark user as registered (no password needed for OTP registration)
    user.isActive = true;
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        role: user.role || "user",
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({
      message: "Registration completed successfully",
      user: user.toJSON(),
      token,
    });
  } catch (error) {
    res.status(500).json({
      error: "Error verifying OTP",
      message: error.message,
    });
  }
});

module.exports = router;
