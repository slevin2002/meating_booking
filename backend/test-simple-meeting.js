const mongoose = require("mongoose");
require("dotenv").config({ path: "./config.env" });

async function testMeetingCreation() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const Meeting = require("./models/Meeting");
    const User = require("./models/User");
    const Team = require("./models/Team");

    // Get a user and team
    const user = await User.findOne({});
    const team = await Team.findOne({});

    if (!user || !team) {
      console.log("❌ No users or teams found");
      return;
    }

    console.log("✅ Found user:", user.name);
    console.log("✅ Found team:", team.name);

    // Create a test meeting
    const meetingData = {
      title: "Test Meeting with Creator",
      description: "Testing meeting creation with user authentication",
      startTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
      endTime: new Date(Date.now() + 3 * 60 * 60 * 1000), // 3 hours from now
      duration: 60,
      teamId: team._id,
      teamName: team.name,
      room: "Test Room",
      attendees: ["John Doe", "Jane Smith"],
      createdBy: user._id,
      status: "scheduled",
    };

    const meeting = new Meeting(meetingData);
    await meeting.save();

    console.log("✅ Meeting created successfully!");
    console.log("Meeting ID:", meeting._id);
    console.log("Created By:", meeting.createdBy);

    // Test population
    const populatedMeeting = await Meeting.findById(meeting._id)
      .populate("teamId", "name color")
      .populate("createdBy", "name email");

    console.log("✅ Meeting retrieved with population!");
    console.log("Creator Name:", populatedMeeting.createdBy?.name);
    console.log("Creator Email:", populatedMeeting.createdBy?.email);
    console.log("Team Name:", populatedMeeting.teamId?.name);

    // Clean up
    await Meeting.findByIdAndDelete(meeting._id);
    console.log("✅ Test meeting cleaned up");

    await mongoose.disconnect();
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

testMeetingCreation();
