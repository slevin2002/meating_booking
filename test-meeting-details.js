const axios = require("axios");

const API_BASE_URL = "http://localhost:4444";

async function testMeetingDetails() {
  try {
    console.log("🧪 Testing Meeting Details with User Name...");

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

    // Step 2: Create a meeting with authentication
    console.log("\n2. Creating a meeting with authentication...");
    const meetingData = {
      title: "Test Meeting for Details",
      description: "Testing that user name is displayed in meeting details",
      startTime: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), // 48 hours from now
      endTime: new Date(Date.now() + 49 * 60 * 60 * 1000).toISOString(), // 49 hours from now
      duration: 60,
      teamId: "687b3fe2dbc88b6f7493b80d", // Use a valid team ID from your database
      room: "Test Room 2",
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

    // Check if createdBy is populated in the response
    const createdMeeting = createResponse.data.meeting;
    console.log("Created By in response:", createdMeeting.createdBy);

    if (createdMeeting.createdBy && createdMeeting.createdBy.name) {
      console.log("✅ SUCCESS: User name is populated in creation response!");
      console.log("User Name:", createdMeeting.createdBy.name);
      console.log("User Email:", createdMeeting.createdBy.email);
    } else {
      console.log(
        "❌ FAILED: User name is not populated in creation response!"
      );
    }

    // Step 3: Fetch the meeting details to verify createdBy field
    console.log("\n3. Fetching meeting details to verify createdBy field...");
    const fetchResponse = await axios.get(
      `${API_BASE_URL}/api/meetings/${createResponse.data.meeting._id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const fetchedMeeting = fetchResponse.data;
    console.log("✅ Meeting details fetched successfully!");
    console.log("Meeting Title:", fetchedMeeting.title);
    console.log("Created By in details:", fetchedMeeting.createdBy);

    if (fetchedMeeting.createdBy && fetchedMeeting.createdBy.name) {
      console.log("✅ SUCCESS: User name is populated in meeting details!");
      console.log("User Name:", fetchedMeeting.createdBy.name);
      console.log("User Email:", fetchedMeeting.createdBy.email);
    } else {
      console.log("❌ FAILED: User name is not populated in meeting details!");
    }

    // Step 4: Test getAll meetings to verify createdBy is populated
    console.log(
      "\n4. Testing getAll meetings to verify createdBy is populated..."
    );
    const getAllResponse = await axios.get(`${API_BASE_URL}/api/meetings`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const allMeetings = getAllResponse.data.meetings;
    console.log("✅ All meetings fetched successfully!");
    console.log("Total meetings:", allMeetings.length);

    // Check if any meeting has createdBy populated
    const meetingsWithCreator = allMeetings.filter(
      (m) => m.createdBy && m.createdBy.name
    );
    console.log("Meetings with creator name:", meetingsWithCreator.length);

    if (meetingsWithCreator.length > 0) {
      console.log("✅ SUCCESS: User names are populated in getAll meetings!");
      meetingsWithCreator.forEach((meeting, index) => {
        console.log(
          `Meeting ${index + 1}: "${meeting.title}" - Created by: ${
            meeting.createdBy.name
          }`
        );
      });
    } else {
      console.log(
        "❌ FAILED: User names are not populated in getAll meetings!"
      );
    }

    console.log("\n🎉 Test completed successfully!");
  } catch (error) {
    console.error("❌ Test failed:", error.response?.data || error.message);
    console.error("Full error:", error);
  }
}

testMeetingDetails();
