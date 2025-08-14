const mongoose = require("mongoose");

const meetingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Meeting title is required"],
      trim: true,
      maxlength: [200, "Meeting title cannot exceed 200 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
    startTime: {
      type: Date,
      required: [true, "Start time is required"],
    },
    endTime: {
      type: Date,
      required: [true, "End time is required"],
    },
    duration: {
      type: Number,
      required: [true, "Duration is required"],
      min: [15, "Meeting duration must be at least 15 minutes"],
      max: [480, "Meeting duration cannot exceed 8 hours"],
    },
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      required: [true, "Team ID is required"],
    },
    teamName: {
      type: String,
      required: [true, "Team name is required"],
    },
    attendees: [
      {
        type: String,
        trim: true,
      },
    ],
    room: {
      type: String,
      required: [true, "Meeting room is required"],
      trim: true,
    },
    status: {
      type: String,
      enum: ["scheduled", "completed", "cancelled"],
      default: "scheduled",
    },
    cancelReason: {
      type: String,
      trim: true,
      maxlength: [500, "Cancel reason cannot exceed 500 characters"],
      required: function () {
        return this.status === "cancelled";
      },
    },
    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurringPattern: {
      type: String,
      enum: ["daily", "weekly", "monthly"],
      required: function () {
        return this.isRecurring;
      },
    },
    // Zoom meeting fields
    meetingType: {
      type: String,
      enum: ["in-person", "zoom", "hybrid"],
      default: "in-person",
    },
    zoomMeetingId: {
      type: String,
      required: function () {
        return this.meetingType === "zoom" || this.meetingType === "hybrid";
      },
    },
    zoomJoinUrl: {
      type: String,
      required: function () {
        return this.meetingType === "zoom" || this.meetingType === "hybrid";
      },
    },
    zoomStartUrl: {
      type: String,
      required: function () {
        return this.meetingType === "zoom" || this.meetingType === "hybrid";
      },
    },
    zoomPassword: {
      type: String,
      required: function () {
        return this.meetingType === "zoom" || this.meetingType === "hybrid";
      },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Creator is required"],
    },
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: function () {
        return this.status === "cancelled";
      },
    },
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
meetingSchema.index({ startTime: 1 });
meetingSchema.index({ teamId: 1 });
meetingSchema.index({ status: 1 });
meetingSchema.index({ createdBy: 1 });
meetingSchema.index({ attendees: 1 }); // Index for attendee queries
meetingSchema.index({ meetingType: 1 }); // Index for meeting type queries
meetingSchema.index({ zoomMeetingId: 1 }); // Index for Zoom meeting ID queries

// Virtual for meeting duration in minutes
meetingSchema.virtual("durationMinutes").get(function () {
  return Math.round((this.endTime - this.startTime) / (1000 * 60));
});

// Ensure virtual fields are serialized
meetingSchema.set("toJSON", { virtuals: true });
meetingSchema.set("toObject", { virtuals: true });

// Pre-save middleware to validate end time is after start time
meetingSchema.pre("save", function (next) {
  if (this.endTime <= this.startTime) {
    return next(new Error("End time must be after start time"));
  }
  next();
});

module.exports = mongoose.model("Meeting", meetingSchema);
