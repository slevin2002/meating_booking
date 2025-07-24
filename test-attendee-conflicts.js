const fetch = require("node-fetch");

async function testAttendeeConflicts() {
  const baseUrl = "http://localhost:5000/api";

  console.log("Testing attendee conflict checking...\n");

  // Test 1: Check availability for a member
  try {
    const response = await fetch(
      `${baseUrl}/meetings/check-member-availability?member=Slevin%20Vargese&date=2025-01-24&startTime=10:00&endTime=11:00`
    );

    if (response.ok) {
      const data = await response.json();
      console.log("✅ Member availability check response:", data);
    } else {
      console.log(
        "❌ Member availability check failed:",
        response.status,
        response.statusText
      );
    }
  } catch (error) {
    console.log("❌ Error testing member availability:", error.message);
  }

  // Test 2: Check all employees status
  try {
    const now = new Date();
    const date = now.toISOString().split("T")[0];
    const time = `${String(now.getHours()).padStart(2, "0")}:${String(
      now.getMinutes()
    ).padStart(2, "0")}`;

    const response = await fetch(
      `${baseUrl}/status/all-employees?date=${date}&time=${time}`
    );

    if (response.ok) {
      const data = await response.json();
      console.log("\n✅ All employees status response:", data);
    } else {
      console.log(
        "\n❌ All employees status failed:",
        response.status,
        response.statusText
      );
    }
  } catch (error) {
    console.log("\n❌ Error testing all employees status:", error.message);
  }
}

testAttendeeConflicts();
