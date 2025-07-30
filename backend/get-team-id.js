const mongoose = require("mongoose");
require("dotenv").config({ path: "./config.env" });

async function getTeamId() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const Team = require("./models/Team");

    const team = await Team.findOne({});
    if (team) {
      console.log("Team ID:", team._id);
      console.log("Team Name:", team.name);
    } else {
      console.log("No teams found");
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error("Error:", error);
  }
}

getTeamId();
