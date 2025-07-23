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

async function testCurrentMeetings() {
  try {
    console.log("=== Testing Current Meetings ===");

    // Get current date and time
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const currentDate = `${year}-${month}-${day}`;
    const currentHour = String(now.getHours()).padStart(2, "0");
    const currentMinute = String(now.getMinutes()).padStart(2, "0");
    const currentTime = `${currentHour}:${currentMinute}`;

    console.log(`Current date: ${currentDate}`);
    console.log(`Current time: ${currentTime}`);
    console.log(`Current UTC: ${now.toISOString()}`);

    // Get all meetings
    const allMeetings = await Meeting.find().populate("teamId", "name color");
    console.log(`\nTotal meetings in database: ${allMeetings.length}`);

    allMeetings.forEach((meeting, index) => {
      console.log(`\nMeeting ${index + 1}:`);
      console.log(`  Title: ${meeting.title}`);
      console.log(`  Room: ${meeting.room}`);
      console.log(`  Start: ${meeting.startTime}`);
      console.log(`  End: ${meeting.endTime}`);
      console.log(`  Status: ${meeting.status}`);
      console.log(`  Team: ${meeting.teamName}`);
    });

    // Parse the check time and convert to UTC for database comparison
    const [yearNum, monthNum, dayNum] = currentDate.split("-").map(Number);
    const [hourNum, minuteNum] = currentTime.split(":").map(Number);
    const checkDateTime = new Date(
      yearNum,
      monthNum - 1,
      dayNum,
      hourNum,
      minuteNum,
      0,
      0
    );

    // Convert to UTC for proper comparison with database times
    const checkDateTimeUTC = new Date(checkDateTime.toISOString());

    console.log(`\nCheck time UTC: ${checkDateTimeUTC.toISOString()}`);

    // Find all meetings happening at the check time
    const currentMeetings = await Meeting.find({
      status: { $ne: "cancelled" },
      startTime: { $lte: checkDateTimeUTC },
      endTime: { $gt: checkDateTimeUTC },
    }).populate("teamId", "name color");

    console.log(
      `\nCurrent meetings at ${currentTime}: ${currentMeetings.length}`
    );

    currentMeetings.forEach((meeting, index) => {
      console.log(`\nCurrent Meeting ${index + 1}:`);
      console.log(`  Title: ${meeting.title}`);
      console.log(`  Room: ${meeting.room}`);
      console.log(`  Start: ${meeting.startTime}`);
      console.log(`  End: ${meeting.endTime}`);
      console.log(`  Team: ${meeting.teamName}`);
      console.log(`  Attendees: ${meeting.attendees.join(", ")}`);
    });

    // Group meetings by room
    const meetingsByRoom = {};
    const totalAttendees = new Set();

    currentMeetings.forEach((meeting) => {
      if (!meetingsByRoom[meeting.room]) {
        meetingsByRoom[meeting.room] = [];
      }
      meetingsByRoom[meeting.room].push({
        id: meeting._id,
        title: meeting.title,
        teamName: meeting.teamName,
        startTime: meeting.startTime.toLocaleTimeString(),
        endTime: meeting.endTime.toISOString(),
        attendees: meeting.attendees,
        attendeesCount: meeting.attendees.length,
      });

      meeting.attendees.forEach((attendee) => totalAttendees.add(attendee));
    });

    console.log(`\nMeetings by room:`, meetingsByRoom);
    console.log(`Total attendees: ${totalAttendees.size}`);
  } catch (error) {
    console.error("Error testing current meetings:", error);
  } finally {
    mongoose.connection.close();
  }
}

testCurrentMeetings();
 