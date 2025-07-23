const mongoose = require("mongoose");
const Meeting = require("./models/Meeting");
const Team = require("./models/Team");
require("dotenv").config({ path: "./config.env" });

// Connect to MongoDB
mongoose
  .connect(
    process.env.MONGODB_URI || "mongodb://localhost:27017/meeting_booking",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => console.log("Connected to MongoDB for testing"))
  .catch((err) => console.error("MongoDB connection error:", err));

async function testAvailability() {
  try {
    // Get a team to use for testing
    const team = await Team.findOne();
    if (!team) {
      console.log(
        "No teams found. Please run the populate-teams.js script first."
      );
      return;
    }

    console.log("Testing with team:", team.name);

    // Create a test meeting for today
    const today = new Date();
    const startTime = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      10,
      0,
      0
    );
    const endTime = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      11,
      0,
      0
    );

    // Create a meeting with a team member as attendee
    const testMeeting = new Meeting({
      title: "Test Meeting for Availability",
      description: "Testing member availability",
      startTime: startTime,
      endTime: endTime,
      duration: 60,
      teamId: team._id,
      teamName: team.name,
      attendees: [team.members[0]], // Add first team member as attendee
      room: "Test Room",
      status: "scheduled",
      createdBy: "test-user",
    });

    await testMeeting.save();
    console.log("Created test meeting for:", team.members[0]);

    // Test availability check
    const testMember = team.members[0];
    const testDate = today.toISOString().split("T")[0];
    const testStartTime = "10:00";
    const testEndTime = "11:00";

    console.log(
      `\nTesting availability for ${testMember} on ${testDate} from ${testStartTime} to ${testEndTime}`
    );

    // Simulate the availability check logic
    const start = new Date(`${testDate}T${testStartTime}:00.000Z`);
    const end = new Date(`${testDate}T${testEndTime}:00.000Z`);

    const conflicts = await Meeting.find({
      attendees: testMember,
      status: { $ne: "cancelled" },
      $or: [{ startTime: { $lt: end }, endTime: { $gt: start } }],
    }).populate("teamId", "name color");

    console.log("Found conflicts:", conflicts.length);
    if (conflicts.length > 0) {
      console.log("Status: BUSY");
      console.log("Conflicting meetings:");
      conflicts.forEach((meeting) => {
        console.log(
          `- ${meeting.title} (${meeting.startTime} - ${meeting.endTime})`
        );
      });
    } else {
      console.log("Status: FREE");
    }

    // Test with a different time (should be free)
    console.log(
      `\nTesting availability for ${testMember} on ${testDate} from 14:00 to 15:00`
    );
    const start2 = new Date(`${testDate}T14:00:00.000Z`);
    const end2 = new Date(`${testDate}T15:00:00.000Z`);

    const conflicts2 = await Meeting.find({
      attendees: testMember,
      status: { $ne: "cancelled" },
      $or: [{ startTime: { $lt: end2 }, endTime: { $gt: start2 } }],
    }).populate("teamId", "name color");

    console.log("Found conflicts:", conflicts2.length);
    if (conflicts2.length > 0) {
      console.log("Status: BUSY");
    } else {
      console.log("Status: FREE");
    }

    // Clean up test meeting
    await Meeting.findByIdAndDelete(testMeeting._id);
    console.log("\nCleaned up test meeting");

    process.exit(0);
  } catch (error) {
    console.error("Test failed:", error);
    process.exit(1);
  }
}

testAvailability();
