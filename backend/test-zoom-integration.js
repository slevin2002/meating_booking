const zoomService = require("./utils/zoomService");
require("dotenv").config({ path: "./config.env" });

async function testZoomIntegration() {
  console.log("🧪 Testing Zoom API Integration...\n");

  try {
    // Test 1: Check if environment variables are set
    console.log("1. Checking environment variables...");
    console.log("ZOOM_API_KEY:", process.env.ZOOM_API_KEY ? "Set" : "Not set");
    console.log(
      "ZOOM_API_SECRET:",
      process.env.ZOOM_API_SECRET ? "Set" : "Not set"
    );
    console.log("JWT_SECRET:", process.env.JWT_SECRET ? "Set" : "Not set");

    if (!process.env.ZOOM_API_KEY || !process.env.ZOOM_API_SECRET) {
      throw new Error(
        "ZOOM_API_KEY and ZOOM_API_SECRET must be set in config.env"
      );
    }
    console.log("✅ Environment variables are configured\n");

    // Test 2: Test token generation
    console.log("2. Testing JWT token generation...");
    console.log("zoomService.apiKey:", zoomService.apiKey ? "Set" : "Not set");
    console.log(
      "zoomService.apiSecret:",
      zoomService.apiSecret ? "Set" : "Not set"
    );

    const token = zoomService.generateToken();
    if (!token) {
      throw new Error("Failed to generate JWT token");
    }
    console.log("✅ JWT token generated successfully\n");

    // Test 3: Test listing meetings
    console.log("3. Testing Zoom API connection (listing meetings)...");
    const meetings = await zoomService.listMeetings();
    console.log(
      `✅ Successfully connected to Zoom API. Found ${meetings.length} meetings\n`
    );

    // Test 4: Test creating a meeting
    console.log("4. Testing meeting creation...");
    const testMeetingData = {
      title: "Test Meeting - Integration Test",
      startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
      duration: 30, // 30 minutes
    };

    const result = await zoomService.createMeeting(testMeetingData);
    console.log("✅ Test meeting created successfully!");
    console.log(`   Meeting ID: ${result.meeting_id}`);
    console.log(`   Join URL: ${result.join_url}`);
    console.log(`   Start URL: ${result.start_url}\n`);

    // Test 5: Clean up - delete the test meeting
    console.log("5. Cleaning up test meeting...");
    await zoomService.deleteMeeting(result.meeting_id);
    console.log("✅ Test meeting deleted successfully\n");

    console.log("🎉 All Zoom integration tests passed!");
    console.log("\nYour Zoom integration is working correctly.");
    console.log("You can now create Zoom meetings through your application.");
  } catch (error) {
    console.error("❌ Zoom integration test failed:", error.message);
    console.log("\nTroubleshooting tips:");
    console.log(
      "1. Make sure your Zoom API credentials are correct in config.env"
    );
    console.log(
      "2. Verify your Zoom app is properly configured in the Zoom Developer Console"
    );
    console.log(
      "3. Check that your Zoom app has the required scopes (meeting:write, meeting:read)"
    );
    console.log(
      "4. Ensure your Zoom account is active and has meeting privileges"
    );
  }
}

testZoomIntegration();
