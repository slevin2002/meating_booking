const jwt = require("jsonwebtoken");
require("dotenv").config({ path: "./config.env" });

function testZoomCredentials() {
  console.log("🔍 Testing Zoom API Credentials...\n");

  const apiKey = process.env.ZOOM_API_KEY;
  const apiSecret = process.env.ZOOM_API_SECRET;

  console.log("API Key:", apiKey);
  console.log(
    "API Secret:",
    apiSecret ? `${apiSecret.substring(0, 10)}...` : "Not set"
  );
  console.log("API Key length:", apiKey ? apiKey.length : 0);
  console.log("API Secret length:", apiSecret ? apiSecret.length : 0);

  if (!apiKey || !apiSecret) {
    console.error("❌ Missing Zoom API credentials");
    return;
  }

  // Generate JWT token
  const payload = {
    iss: apiKey,
    exp: Math.floor(Date.now() / 1000) + 60 * 60, // 1 hour expiration
  };

  try {
    const token = jwt.sign(payload, apiSecret, { algorithm: "HS256" });
    console.log("\n✅ JWT Token generated successfully");
    console.log("Token length:", token.length);
    console.log("Token preview:", token.substring(0, 50) + "...");

    // Decode token to verify payload
    const decoded = jwt.decode(token);
    console.log("\nDecoded token payload:");
    console.log("iss (API Key):", decoded.iss);
    console.log(
      "exp (Expiration):",
      new Date(decoded.exp * 1000).toISOString()
    );
  } catch (error) {
    console.error("❌ Failed to generate JWT token:", error.message);
  }
}

testZoomCredentials();


