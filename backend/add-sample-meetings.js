const mongoose = require("mongoose");
const Meeting = require("./models/Meeting");
const Team = require("./models/Team");
require("dotenv").config({ path: "./config.env" });

// Connect to MongoDB
mongoose
  .connect(
    process.env.MONGO_URI || "mongodb://localhost:27017/meeting_booking",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => console.log("Connected to MongoDB for adding sample meetings"))
  .catch((err) => console.error("MongoDB connection error:", err));

async function addSampleMeetings() {
  try {
    // Get teams
    const teams = await Team.find();
    if (teams.length === 0) {
      console.log(
        "No teams found. Please run the populate-teams.js script first."
      );
      return;
    }

    console.log(`Found ${teams.length} teams`);

    // Create sample meetings for today
    const today = new Date();
    const sampleMeetings = [];

    // Meeting 1: Morning meeting for first team
    const team1 = teams[0];
    const meeting1 = new Meeting({
      title: "Morning Standup",
      description: "Daily team standup meeting",
      startTime: new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        9,
        0,
        0
      ),
      endTime: new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        9,
        30,
        0
      ),
      duration: 30,
      teamId: team1._id,
      teamName: team1.name,
      attendees: [team1.members[0], team1.members[1]], // First two members
      room: "meeting room (Capacity: 10)",
      status: "scheduled",
      createdBy: "system",
    });

    // Meeting 2: Afternoon meeting for second team
    const team2 = teams[1];
    const meeting2 = new Meeting({
      title: "Project Review",
      description: "Weekly project review meeting",
      startTime: new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        14,
        0,
        0
      ),
      endTime: new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        15,
        0,
        0
      ),
      duration: 60,
      teamId: team2._id,
      teamName: team2.name,
      attendees: [team2.members[0], team2.members[1], team2.members[2]], // First three members
      room: "Balcony (Capacity: 8)",
      status: "scheduled",
      createdBy: "system",
    });

    // Meeting 3: Overlapping meeting for same member
    const meeting3 = new Meeting({
      title: "Client Call",
      description: "Important client discussion",
      startTime: new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        14,
        30,
        0
      ),
      endTime: new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        15,
        30,
        0
      ),
      duration: 60,
      teamId: team1._id,
      teamName: team1.name,
      attendees: [team1.members[0]], // Same member as meeting 1
      room: "lunch hall (Capacity: 15)",
      status: "scheduled",
      createdBy: "system",
    });

    // Save all meetings
    await Meeting.insertMany([meeting1, meeting2, meeting3]);

    console.log("✅ Added 3 sample meetings:");
    console.log(`1. Morning Standup (${team1.name}) - 9:00-9:30 AM`);
    console.log(`   Attendees: ${meeting1.attendees.join(", ")}`);
    console.log(`2. Project Review (${team2.name}) - 2:00-3:00 PM`);
    console.log(`   Attendees: ${meeting2.attendees.join(", ")}`);
    console.log(`3. Client Call (${team1.name}) - 2:30-3:30 PM`);
    console.log(`   Attendees: ${meeting3.attendees.join(", ")}`);

    console.log("\n📋 Test Scenarios:");
    console.log(
      `- Check availability for "${team1.members[0]}" at 9:00-9:30 AM → Should be BUSY`
    );
    console.log(
      `- Check availability for "${team1.members[0]}" at 2:30-3:30 PM → Should be BUSY`
    );
    console.log(
      `- Check availability for "${team1.members[0]}" at 10:00-11:00 AM → Should be FREE`
    );
    console.log(
      `- Check availability for "${team2.members[0]}" at 2:00-3:00 PM → Should be BUSY`
    );
    console.log(
      `- Check availability for "${team2.members[0]}" at 10:00-11:00 AM → Should be FREE`
    );

    process.exit(0);
  } catch (error) {
    console.error("Failed to add sample meetings:", error);
    process.exit(1);
  }
}

addSampleMeetings();
