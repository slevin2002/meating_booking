const axios = require("axios");

const API_BASE_URL = "http://localhost:4444";

async function testMeetingCreation() {
  try {
    console.log("🧪 Testing Meeting Creation with User Authentication...");

    // Step 1: Register the user first
    console.log("\n1. Registering user to get authentication token...");
    const registerResponse = await axios.post(
      `${API_BASE_URL}/api/users/register`,
      {
        name: "Slevin Vargese",
        email: "slevinvarghees@gmail.com",
        password: "password123",
      }
    );

    const token = registerResponse.data.token;
    const user = registerResponse.data.user;
    console.log("✅ Registration successful");
    console.log("User:", user.name);
    console.log("Token:", token.substring(0, 20) + "...");

    // Step 2: Create a meeting with authentication
    console.log("\n2. Creating a meeting with authentication...");
    const meetingData = {
      title: "Test Meeting with Creator",
      description: "Testing meeting creation with user authentication",
      startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
      endTime: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(), // 25 hours from now
      duration: 60,
      teamId: "687b3fe2dbc88b6f7493b80d", // Use a valid team ID from your database
      room: "Test Room",
      attendees: ["John Doe", "Jane Smith"],
    };

    const createResponse = await axios.post(
      `${API_BASE_URL}/api/meetings`,
      meetingData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ Meeting created successfully!");
    console.log("Meeting ID:", createResponse.data.meeting._id);
    console.log("Created By:", createResponse.data.meeting.createdBy);
    console.log("Creator Name:", createResponse.data.meeting.createdBy?.name);
    console.log("Creator Email:", createResponse.data.meeting.createdBy?.email);

    // Step 3: Verify the meeting was created with the correct creator
    console.log("\n3. Verifying meeting creator information...");
    const meetingId = createResponse.data.meeting._id;
    const getResponse = await axios.get(
      `${API_BASE_URL}/api/meetings/${meetingId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log("✅ Meeting retrieved successfully!");
    console.log("Meeting Title:", getResponse.data.title);
    console.log("Creator ID:", getResponse.data.createdBy._id);
    console.log("Creator Name:", getResponse.data.createdBy.name);
    console.log("Creator Email:", getResponse.data.createdBy.email);

    // Verify the creator matches the logged-in user
    if (getResponse.data.createdBy._id === user._id) {
      console.log("✅ SUCCESS: Meeting creator matches logged-in user!");
    } else {
      console.log("❌ ERROR: Meeting creator does not match logged-in user!");
    }

    console.log("\n🎉 Test completed successfully!");
  } catch (error) {
    console.error("❌ Test failed:", error.response?.data || error.message);
  }
}

testMeetingCreation();
