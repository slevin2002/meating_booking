const Meeting = require("./models/Meeting");
const Team = require("./models/Team");
const mongoose = require("mongoose");
require("dotenv").config({ path: "./config.env" });

// Helper function to format time in HH:MM format
const formatTime = (date) => {
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
};

// Connect to MongoDB
mongoose
  .connect(
    process.env.MONGODB_URI || "mongodb://localhost:27017/meeting_booking",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

async function testRealTimeStatus() {
  try {
    console.log("Testing real-time status functionality...\n");

    // Test 1: Check current meetings
    console.log("1. Checking current meetings...");
    const now = new Date();
    const currentMeetings = await Meeting.find({
      status: { $ne: "cancelled" },
      startTime: { $lte: now },
      endTime: { $gt: now },
    }).populate("teamId", "name color");

    console.log(
      `Found ${currentMeetings.length} meetings happening right now:`
    );
    currentMeetings.forEach((meeting) => {
      console.log(
        `  - ${meeting.title} (${meeting.teamName}) - ${formatTime(
          meeting.startTime
        )} to ${formatTime(meeting.endTime)}`
      );
      console.log(`    Attendees: ${meeting.attendees.join(", ")}`);
    });

    // Test 2: Check specific meeting time (July 19, 2025 at 15:27)
    console.log(
      "\n2. Checking specific meeting time (July 19, 2025 at 15:27)..."
    );
    const testDate = new Date(2025, 6, 19, 15, 27, 0, 0); // July 19, 2025 at 15:27
    const testMeetings = await Meeting.find({
      status: { $ne: "cancelled" },
      startTime: { $lte: testDate },
      endTime: { $gt: testDate },
    }).populate("teamId", "name color");

    console.log(`Found ${testMeetings.length} meetings at test time:`);
    testMeetings.forEach((meeting) => {
      console.log(
        `  - ${meeting.title} (${meeting.teamName}) - ${formatTime(
          meeting.startTime
        )} to ${formatTime(meeting.endTime)}`
      );
      console.log(`    Attendees: ${meeting.attendees.join(", ")}`);
    });

    // Test 3: Get all employees
    console.log("\n3. Getting all employees from teams...");
    const teams = await Team.find({ status: "active" });
    const allEmployees = new Set();

    teams.forEach((team) => {
      allEmployees.add(team.lead);
      team.members.forEach((member) => allEmployees.add(member));
    });

    console.log(`Found ${allEmployees.size} unique employees:`);
    Array.from(allEmployees).forEach((employee) => {
      console.log(`  - ${employee}`);
    });

    // Test 4: Check employee status at test time
    console.log("\n4. Checking employee status at test time...");
    for (const employee of allEmployees) {
      const employeeMeetings = await Meeting.find({
        attendees: employee,
        status: { $ne: "cancelled" },
        startTime: { $lte: testDate },
        endTime: { $gt: testDate },
      });

      const status = employeeMeetings.length > 0 ? "BUSY" : "FREE";
      console.log(`  ${employee}: ${status}`);
      if (employeeMeetings.length > 0) {
        employeeMeetings.forEach((meeting) => {
          console.log(
            `    - In meeting: ${meeting.title} (${meeting.teamName})`
          );
        });
      }
    }

    // Test 5: Check current employee status
    console.log("\n5. Checking current employee status...");
    for (const employee of allEmployees) {
      const employeeMeetings = await Meeting.find({
        attendees: employee,
        status: { $ne: "cancelled" },
        startTime: { $lte: now },
        endTime: { $gt: now },
      });

      const status = employeeMeetings.length > 0 ? "BUSY" : "FREE";
      console.log(`  ${employee}: ${status}`);
      if (employeeMeetings.length > 0) {
        employeeMeetings.forEach((meeting) => {
          console.log(
            `    - In meeting: ${meeting.title} (${meeting.teamName})`
          );
        });
      }
    }

    console.log("\n✅ Real-time status testing completed successfully!");
  } catch (error) {
    console.error("❌ Error during testing:", error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the test
testRealTimeStatus();
