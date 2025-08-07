const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Team = require("./models/Team.js");
const User = require("./models/User.js");

dotenv.config({ path: "./config.env" });

// Connect to MongoDB
mongoose
  .connect(
    process.env.MONGO_URI || "mongodb://localhost:27017/meeting_booking",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    }
  )
  .then(() =>
    console.log("Connected to MongoDB for adding General Meeting team")
  )
  .catch((err) => console.error("MongoDB connection error:", err));

async function addGeneralMeetingTeam() {
  try {
    // Get all users from the database
    const allUsers = await User.find({ isActive: true }).select("name");
    console.log(`Found ${allUsers.length} active users in the database`);

    if (allUsers.length === 0) {
      console.log(
        "No users found in the database. Please run populate-users.js first."
      );
      process.exit(1);
    }

    // Extract all user names
    const allEmployeeNames = allUsers.map((user) => user.name);
    console.log("All employees:", allEmployeeNames);

    // Check if General Meeting team already exists
    const existingTeam = await Team.findOne({ name: "General Meeting" });

    if (existingTeam) {
      console.log("General Meeting team already exists. Updating members...");

      // Update the existing team with all employees
      existingTeam.members = allEmployeeNames;
      existingTeam.lead = "Thomas Abraham"; // Set Thomas Abraham as lead
      await existingTeam.save();

      console.log(
        `Updated General Meeting team with ${allEmployeeNames.length} members`
      );
      console.log("Team ID:", existingTeam._id);
    } else {
      // Create new General Meeting team
      const generalMeetingTeam = new Team({
        name: "General Meeting",
        project: "Company-wide Meetings",
        lead: "Thomas Abraham", // Set Thomas Abraham as lead
        members: allEmployeeNames,
        status: "active",
        color: "#667eea", // Purple color
        description: "Team for company-wide meetings and announcements",
      });

      await generalMeetingTeam.save();

      console.log(
        `Successfully created General Meeting team with ${allEmployeeNames.length} members`
      );
      console.log("Team ID:", generalMeetingTeam._id);
    }

    // Display team details
    const team = await Team.findOne({ name: "General Meeting" });
    console.log("\n=== General Meeting Team Details ===");
    console.log("Name:", team.name);
    console.log("Project:", team.project);
    console.log("Lead:", team.lead);
    console.log("Status:", team.status);
    console.log("Color:", team.color);
    console.log("Total Members:", team.members.length);
    console.log("Members:", team.members.join(", "));

    console.log("\n✅ General Meeting team is ready!");
    console.log(
      "You can now book meetings for the entire company using this team."
    );

    process.exit(0);
  } catch (error) {
    console.error("Error adding General Meeting team:", error);
    process.exit(1);
  }
}

// Run the function
addGeneralMeetingTeam();
