const axios = require("axios");

const API_BASE_URL = "http://localhost:4444";

async function testUserIDSave() {
  try {
    console.log("🧪 Testing User ID Save in Meeting Booking...");

    // Step 1: Register a user to get authentication token
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
    console.log("User ID:", user._id);
    console.log("User Name:", user.name);
    console.log("Token:", token.substring(0, 20) + "...");

    // Step 2: Create a meeting with authentication
    console.log("\n2. Creating a meeting with authentication...");
    const meetingData = {
      title: "Test Meeting with User ID",
      description: "Testing that user ID is saved when booking meetings",
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

    // Step 3: Fetch the meeting to verify createdBy field
    console.log("\n3. Fetching meeting to verify createdBy field...");
    const fetchResponse = await axios.get(
      `${API_BASE_URL}/api/meetings/${createResponse.data.meeting._id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const fetchedMeeting = fetchResponse.data;
    console.log("✅ Meeting fetched successfully!");
    console.log("Meeting Title:", fetchedMeeting.title);
    console.log("Created By ID:", fetchedMeeting.createdBy);
    console.log(
      "Created By matches User ID:",
      fetchedMeeting.createdBy === user._id
    );

    if (fetchedMeeting.createdBy === user._id) {
      console.log("🎉 SUCCESS: User ID is correctly saved in meeting!");
    } else {
      console.log("❌ FAILED: User ID is not correctly saved in meeting!");
    }

    // Step 4: Test without authentication (should fail)
    console.log("\n4. Testing meeting creation without authentication...");
    try {
      await axios.post(`${API_BASE_URL}/api/meetings`, meetingData, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      console.log(
        "❌ FAILED: Meeting creation should have failed without authentication!"
      );
    } catch (error) {
      if (error.response?.status === 401) {
        console.log(
          "✅ SUCCESS: Meeting creation correctly requires authentication!"
        );
      } else {
        console.log("❌ Unexpected error:", error.response?.data);
      }
    }

    console.log("\n🎉 Test completed successfully!");
  } catch (error) {
    console.error("❌ Test failed:", error.response?.data || error.message);
    console.error("Full error:", error);
  }
}

testUserIDSave();
