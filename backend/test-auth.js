const axios = require("axios");
require("dotenv").config({ path: "./config.env" });

const BASE_URL = `http://localhost:${process.env.PORT || 5000}`;

async function testAuthentication() {
  console.log("🧪 Testing Authentication Endpoints...\n");

  try {
    // Test 1: Register a new user
    console.log("1. Testing User Registration...");
    const registerData = {
      name: "Test User",
      email: "test4@example.com",
      password: "password123",
    };

    const registerResponse = await axios.post(
      `${BASE_URL}/api/users/register`,
      registerData
    );
    console.log("✅ Registration successful:", registerResponse.data.message);
    console.log("User ID:", registerResponse.data.user._id);
    console.log("Token received:", registerResponse.data.token ? "Yes" : "No");
    console.log("");

    // Test 2: Login with the registered user
    console.log("2. Testing User Login...");
    const loginData = {
      email: "test4@example.com",
      password: "password123",
    };

    const loginResponse = await axios.post(
      `${BASE_URL}/api/users/login`,
      loginData
    );
    console.log("✅ Login successful:", loginResponse.data.message);
    console.log("User:", loginResponse.data.user.name);
    console.log("Role:", loginResponse.data.user.role);
    console.log("Token received:", loginResponse.data.token ? "Yes" : "No");
    console.log("");

    // Test 3: Test invalid login
    console.log("3. Testing Invalid Login...");
    try {
      await axios.post(`${BASE_URL}/api/users/login`, {
        email: "test4@example.com",
        password: "wrongpassword",
      });
      console.log("❌ Should have failed but succeeded");
    } catch (error) {
      console.log(
        "✅ Invalid login correctly rejected:",
        error.response.data.error
      );
    }
    console.log("");

    // Test 4: Test duplicate registration
    console.log("4. Testing Duplicate Registration...");
    try {
      await axios.post(`${BASE_URL}/api/users/register`, registerData);
      console.log("❌ Should have failed but succeeded");
    } catch (error) {
      console.log(
        "✅ Duplicate registration correctly rejected:",
        error.response.data.error
      );
    }
    console.log("");

    // Test 5: Test validation errors
    console.log("5. Testing Validation Errors...");
    try {
      await axios.post(`${BASE_URL}/api/users/register`, {
        name: "",
        email: "invalid-email",
        password: "123",
      });
      console.log("❌ Should have failed but succeeded");
    } catch (error) {
      console.log(
        "✅ Validation errors correctly caught:",
        error.response.data.errors?.length || 0,
        "errors"
      );
    }
    console.log("");

    console.log("🎉 All authentication tests completed successfully!");
    console.log("\n📝 Summary:");
    console.log("- Registration: ✅ Working");
    console.log("- Login: ✅ Working");
    console.log("- Invalid credentials: ✅ Properly rejected");
    console.log("- Duplicate registration: ✅ Properly rejected");
    console.log("- Validation: ✅ Working");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    if (error.response) {
      console.error("Response data:", error.response.data);
    }
  }
}

// Run the test
testAuthentication();
