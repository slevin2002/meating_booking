require("dotenv").config();
const { sendMeetingInvitations } = require("./utils/emailService");

async function testEmailFunctionality() {
  try {
    console.log("Testing email functionality...");

    // Mock meeting data
    const mockMeeting = {
      _id: "test-meeting-id",
      title: "Test Meeting",
      description: "This is a test meeting to verify email functionality",
      startTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      endTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000), // Tomorrow + 1 hour
      duration: 60,
      room: "Conference Room A",
      teamName: "Test Team",
      attendees: ["slevinvarghees@gmail.com", "bhavishya.kerpada@gmail.com"],
    };

    const mockCreator = {
      name: "Test User",
      email: "test@example.com",
    };

    console.log("Sending test email notifications...");
    const results = await sendMeetingInvitations(mockMeeting, mockCreator);

    console.log("Email test results:", results);
    console.log(
      `✅ Email test completed: ${results.successful} successful, ${results.failed} failed`
    );
  } catch (error) {
    console.error("❌ Email test failed:", error);
  }
}

testEmailFunctionality();
