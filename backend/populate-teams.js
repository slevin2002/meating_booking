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
  .then(() => console.log("Connected to MongoDB for team population"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Your team data
const teamsData = [
  {
    name: "ShopZone",
    project: "E-commerce Platform",
    lead: "Bhavishya",
    members: ["Bhavishya", "Akhila", "Abhilash", "Suhana"],
    status: "active",
    color: "#667eea",
  },
  {
    name: "Delivery App",
    project: "Food Delivery Application",
    lead: "Slevin Vargese",
    members: [
      "Slevin Vargese",
      "Thafseeda",
      "Yamini",
      "Afna",
      "Reena Tiju",
      "Ifla",
    ],
    status: "active",
    color: "#764ba2",
  },
  {
    name: "MySkilzo",
    project: "Skill Development Platform",
    lead: "Reena Tiju",
    members: ["Reena Tiju", "Ifla", "Slevin Vargese", "Safida", "Shaima"],
    status: "active",
    color: "#f093fb",
  },
  {
    name: "GLawHub",
    project: "Legal Services Platform",
    lead: "Tiju Thomas",
    members: [
      "Tiju Thomas",
      "Samsheena M",
      "Yashaswini",
      "Thafseeda",
      "Lavanya",
    ],
    status: "active",
    color: "#4facfe",
  },
  {
    name: "Sympsearch",
    project: "Symposium Search Engine",
    lead: "Chaithra P",
    members: ["Chaithra P", "Shabna", "Sharan", "Thafseeda", "Lavanya"],
    status: "active",
    color: "#43e97b",
  },
  {
    name: "VideoServe",
    project: "Video Streaming Service",
    lead: "Navya",
    members: ["Navya", "Nusaiba", "Namo Swasthik", "Nishana", "Nazera"],
    status: "active",
    color: "#fa709a",
  },
  {
    name: "AtoZNews",
    project: "News Aggregation Platform",
    lead: "Sharan",
    members: ["Sharan", "Sinchan", "Navya", "Mubeena", "Sahil"],
    status: "active",
    color: "#ffecd2",
  },
  {
    name: "VehiQuick",
    project: "Vehicle Management System",
    lead: "Geetha",
    members: [
      "Geetha",
      "Sudeep K C",
      "Sowjanya",
      "Chaithra P",
      "Yamini",
      "Nishana",
    ],
    status: "active",
    color: "#fc466b",
  },
  {
    name: "ZBook -SM",
    project: "Social Media Book Platform",
    lead: "Shabna",
    members: ["Shabna", "Safeeda", "Ashwin", "Yashaswini"],
    status: "active",
    color: "#3f5efb",
  },
  {
    name: "Matrimonial",
    project: "Matrimonial Services",
    lead: "Ashwin",
    members: ["Ashwin", "Abhilash", "Geetha", "Sowjanya", "Nazera", "Afna"],
    status: "active",
    color: "#667eea",
  },
  {
    name: "Employee",
    project: "Employee Management System",
    lead: "Akhila",
    members: ["Akhila", "Chaithra", "Bhavishya", "Sudeep", "Sahil"],
    status: "active",
    color: "#764ba2",
  },
  {
    name: "ChatApp",
    project: "Real-time Chat Application",
    lead: "Samsheena M",
    members: [
      "Samsheena M",
      "Tiju Thomas",
      "Namo Swasthik",
      "Shaima",
      "Mubeena",
    ],
    status: "active",
    color: "#f093fb",
  },
];

async function populateTeams() {
  try {
    // Clear existing teams
    await Team.deleteMany({});
    console.log("Cleared existing teams");

    // Create system user if it doesn't exist
    let systemUser = await User.findOne({ email: "system@company.com" });
    if (!systemUser) {
      systemUser = new User({
        name: "System User",
        email: "system@company.com",
        password: "system123",
        role: "admin",
        isActive: true,
      });
      await systemUser.save();
      console.log("Created system user");
    }

    // Insert all teams
    const teams = await Team.insertMany(teamsData);
    console.log(`Successfully created ${teams.length} teams`);

    console.log("\nYour teams are now ready!");
    console.log("You can now create meetings for any of these teams.");
    console.log("\nTeam IDs for reference:");
    teams.forEach((team, index) => {
      console.log(`${index + 1}. ${team.name}: ${team._id}`);
    });

    process.exit(0);
  } catch (error) {
    console.error("Error populating teams:", error);
    process.exit(1);
  }
}

// Run the population
populateTeams();
