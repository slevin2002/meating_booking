require("dotenv").config({ path: "./config.env" });
const axios = require("axios");

async function testZoomOAuthDetailed() {
  console.log("🔍 Detailed Zoom OAuth Test...");
  console.log("=====================================");

  const clientId = process.env.ZOOM_API_KEY;
  const clientSecret = process.env.ZOOM_API_SECRET;

  console.log("📋 Configuration Check:");
  console.log("Client ID:", clientId);
  console.log("Client Secret:", clientSecret ? `${clientSecret.substring(0, 10)}...` : "Not set");
  console.log("Client ID length:", clientId ? clientId.length : 0);
  console.log("Client Secret length:", clientSecret ? clientSecret.length : 0);

  if (!clientId || !clientSecret) {
    console.error("❌ Missing credentials");
    return;
  }

  try {
    console.log("\n🔑 Testing OAuth Token Request...");
    console.log("URL: https://zoom.us/oauth/token");
    console.log("Grant Type: client_credentials");

    const response = await axios.post(
      "https://zoom.us/oauth/token",
      null,
      {
        params: {
          grant_type: "client_credentials",
        },
        auth: {
          username: clientId,
          password: clientSecret,
        },
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    console.log("✅ OAuth token request successful!");
    console.log("Response status:", response.status);
    console.log("Access token:", response.data.access_token ? `${response.data.access_token.substring(0, 20)}...` : "Not found");
    console.log("Token type:", response.data.token_type);
    console.log("Expires in:", response.data.expires_in, "seconds");

    // Test the token with a simple API call
    console.log("\n🌐 Testing API call with token...");
    const apiResponse = await axios.get("https://api.zoom.us/v2/users/me", {
      headers: {
        Authorization: `Bearer ${response.data.access_token}`,
        "Content-Type": "application/json",
      },
    });

    console.log("✅ API call successful!");
    console.log("User info:", {
      id: apiResponse.data.id,
      first_name: apiResponse.data.first_name,
      last_name: apiResponse.data.last_name,
      email: apiResponse.data.email,
      account_id: apiResponse.data.account_id,
    });

  } catch (error) {
    console.error("\n❌ OAuth test failed:");
    console.error("Status:", error.response?.status);
    console.error("Error:", error.response?.data || error.message);

    if (error.response?.data?.error === "invalid_client") {
      console.log("\n🔍 'invalid_client' error detected. This usually means:");
      console.log("1. Client ID or Secret is incorrect");
      console.log("2. App is not configured as Server-to-Server OAuth");
      console.log("3. Account ID is not properly set in the app");
      console.log("4. App is not activated or approved");
      
      console.log("\n📝 Please check your Zoom Developer Console:");
      console.log("- Go to https://developers.zoom.us/");
      console.log("- Select your app");
      console.log("- Verify it's a 'Server-to-Server OAuth' app");
      console.log("- Check that Account ID is set correctly");
      console.log("- Ensure the app is activated");
    }
  }
}

testZoomOAuthDetailed();


