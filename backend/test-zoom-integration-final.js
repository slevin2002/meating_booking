require("dotenv").config({ path: "./config.env" });
const zoomService = require("./utils/zoomService");

async function testZoomIntegrationFinal() {
  console.log("🎯 Final Zoom Integration Test...");
  console.log("=====================================");

  try {
    // Test 1: Generate JWT token
    console.log("1. Testing JWT token generation...");
    const token = zoomService.generateToken();
    console.log("✅ OAuth token generated successfully");
    console.log("Token preview:", token.substring(0, 20) + "...");

    // Test 2: Get account users
    console.log("\n2. Testing account users retrieval...");
    const users = await zoomService.getAccountUsers();
    console.log("✅ Account users retrieved successfully");
    console.log("Found", users.length, "users in account");

    const userId = await zoomService.getFirstUserId();
    console.log("First user ID:", userId);

    // Test 3: List meetings
    console.log("\n3. Testing meeting list...");
    const meetings = await zoomService.listMeetings();
    console.log("✅ Meetings listed successfully");
    console.log("Found", meetings.length, "meetings");

    // Test 4: Create a test meeting
    console.log("\n4. Testing meeting creation...");
    const testMeetingData = {
      title: "Test Meeting - Final Integration",
      startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
      duration: 30,
      description: "Test meeting to verify final integration",
    };

    const createdMeeting = await zoomService.createMeeting(testMeetingData);
    console.log("✅ Test meeting created successfully");
    console.log("Meeting ID:", createdMeeting.meeting_id);
    console.log("Join URL:", createdMeeting.join_url);
    console.log("Start URL:", createdMeeting.start_url);

    // Test 5: Get meeting details
    console.log("\n5. Testing meeting retrieval...");
    const meetingDetails = await zoomService.getMeeting(
      createdMeeting.meeting_id
    );
    console.log("✅ Meeting details retrieved successfully");
    console.log("Meeting Topic:", meetingDetails.topic);
    console.log("Meeting Status:", meetingDetails.status);

    // Test 6: Clean up - delete the test meeting
    console.log("\n6. Cleaning up test meeting...");
    await zoomService.deleteMeeting(createdMeeting.meeting_id);
    console.log("✅ Test meeting deleted successfully");

    console.log(
      "\n🎉 All tests passed! Zoom integration is working perfectly!"
    );
    console.log("\n📋 Summary:");
    console.log("- OAuth token generation: ✅");
    console.log("- User ID retrieval: ✅");
    console.log("- Meeting listing: ✅");
    console.log("- Meeting creation: ✅");
    console.log("- Meeting retrieval: ✅");
    console.log("- Meeting deletion: ✅");
  } catch (error) {
    console.error("❌ Integration test failed:", error.message);
    if (error.response?.data) {
      console.error("Zoom API Error Details:", error.response.data);
    }
  }
}

testZoomIntegrationFinal();
