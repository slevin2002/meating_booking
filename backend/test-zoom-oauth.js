require("dotenv").config({ path: "./config.env" });
const zoomService = require("./utils/zoomService");

async function testZoomOAuth() {
  console.log("Testing Zoom OAuth Integration...");
  console.log("=====================================");

  try {
    // Test 1: Generate OAuth token
    console.log("1. Testing OAuth token generation...");
    const token = await zoomService.generateToken();
    console.log("✅ OAuth token generated successfully");
    console.log("Token preview:", token.substring(0, 20) + "...");

    // Test 2: List meetings (this will use the token)
    console.log("\n2. Testing meeting list...");
    const meetings = await zoomService.listMeetings();
    console.log("✅ Meetings listed successfully");
    console.log("Found", meetings.length, "meetings");

    // Test 3: Create a test meeting
    console.log("\n3. Testing meeting creation...");
    const testMeetingData = {
      title: "Test Meeting - OAuth Integration",
      startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
      duration: 30,
      description: "Test meeting to verify OAuth integration",
    };

    const createdMeeting = await zoomService.createMeeting(testMeetingData);
    console.log("✅ Test meeting created successfully");
    console.log("Meeting ID:", createdMeeting.meeting_id);
    console.log("Join URL:", createdMeeting.join_url);

    // Test 4: Clean up - delete the test meeting
    console.log("\n4. Cleaning up test meeting...");
    await zoomService.deleteMeeting(createdMeeting.meeting_id);
    console.log("✅ Test meeting deleted successfully");

    console.log(
      "\n🎉 All OAuth tests passed! Zoom integration is working correctly."
    );
  } catch (error) {
    console.error("❌ OAuth test failed:", error.message);
    if (error.response?.data) {
      console.error("Zoom API Error Details:", error.response.data);
    }
  }
}

testZoomOAuth();


