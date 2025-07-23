const mongoose = require("mongoose");

const teamSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Team name is required"],
      trim: true,
      maxlength: [100, "Team name cannot exceed 100 characters"],
    },
    color: {
      type: String,
      required: [true, "Team color is required"],
      default: "#667eea",
    },
    members: [
      {
        type: String,
        required: [true, "Team must have at least one member"],
      },
    ],
    lead: {
      type: String,
      required: [true, "Team lead is required"],
      trim: true,
    },
    project: {
      type: String,
      required: [true, "Project name is required"],
      trim: true,
    },
    status: {
      type: String,
      enum: ["active", "completed", "on-hold"],
      default: "active",
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
teamSchema.index({ name: 1 });
teamSchema.index({ status: 1 });
teamSchema.index({ lead: 1 });

// Virtual for member count
teamSchema.virtual("memberCount").get(function () {
  return Array.isArray(this.members) ? this.members.length : 0;
});

// Ensure virtual fields are serialized
teamSchema.set("toJSON", { virtuals: true });
teamSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Team", teamSchema);
