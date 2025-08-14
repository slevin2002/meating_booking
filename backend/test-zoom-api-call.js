const axios = require("axios");
const jwt = require("jsonwebtoken");
require("dotenv").config({ path: "./config.env" });

async function testZoomAPICall() {
  console.log("🌐 Testing Zoom API Call...\n");

  const apiKey = process.env.ZOOM_API_KEY;
  const apiSecret = process.env.ZOOM_API_SECRET;

  if (!apiKey || !apiSecret) {
    console.error("❌ Missing Zoom API credentials");
    return;
  }

  // Generate JWT token
  const payload = {
    iss: apiKey,
    exp: Math.floor(Date.now() / 1000) + 60 * 60, // 1 hour expiration
  };

  const token = jwt.sign(payload, apiSecret, { algorithm: "HS256" });

  try {
    console.log("Making API call to Zoom...");
    console.log("URL: https://api.zoom.us/v2/users/me");
    console.log("Token preview:", token.substring(0, 50) + "...");

    const response = await axios.get("https://api.zoom.us/v2/users/me", {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    console.log("\n✅ Zoom API call successful!");
    console.log("Response status:", response.status);
    console.log("User info:", {
      id: response.data.id,
      first_name: response.data.first_name,
      last_name: response.data.last_name,
      email: response.data.email,
      account_id: response.data.account_id,
    });
  } catch (error) {
    console.error("\n❌ Zoom API call failed:");
    console.error("Status:", error.response?.status);
    console.error("Error:", error.response?.data || error.message);

    if (error.response?.status === 401) {
      console.log("\n🔍 This suggests the API credentials are invalid.");
      console.log("Please check:");
      console.log("1. Your Zoom API Key and Secret are correct");
      console.log("2. Your Zoom app is properly configured");
      console.log("3. Your Zoom account has the necessary permissions");
    }
  }
}

testZoomAPICall();


