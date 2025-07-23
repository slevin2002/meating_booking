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
  .then(() => console.log("Connected to MongoDB for creating test meeting"))
  .catch((err) => console.error("MongoDB connection error:", err));

async function createTestMeeting() {
  try {
    // Get a team
    const team = await Team.findOne();
    if (!team) {
      console.log(
        "No teams found. Please run the populate-teams.js script first."
      );
      return;
    }

    console.log(`Using team: ${team.name}`);

    // Create a meeting that's currently active (starts 1 hour ago, ends 1 hour from now)
    const now = new Date();
    const startTime = new Date(now.getTime() - 60 * 60 * 1000); // 1 hour ago
    const endTime = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now

    const testMeeting = new Meeting({
      title: "Test Current Meeting",
      description: "This is a test meeting that's currently active",
      startTime: startTime,
      endTime: endTime,
      duration: 120, // 2 hours
      teamId: team._id,
      teamName: team.name,
      attendees: team.members.slice(0, 3), // First 3 members
      room: "lunch hall (Capacity: 15)",
      status: "scheduled",
      createdBy: team._id, // Use team ID as creator for now
    });

    await testMeeting.save();
    console.log("Test meeting created successfully!");
    console.log(`Title: ${testMeeting.title}`);
    console.log(`Room: ${testMeeting.room}`);
    console.log(`Start: ${testMeeting.startTime}`);
    console.log(`End: ${testMeeting.endTime}`);
    console.log(`Team: ${testMeeting.teamName}`);
    console.log(`Attendees: ${testMeeting.attendees.join(", ")}`);
  } catch (error) {
    console.error("Error creating test meeting:", error);
  } finally {
    mongoose.connection.close();
  }
}

createTestMeeting();
