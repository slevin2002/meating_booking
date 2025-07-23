// fix_attendee_names.js
const mongoose = require("mongoose");
const Meeting = require("./models/Meeting");
const Team = require("./models/Team");

// Levenshtein distance function
function levenshtein(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1).toLowerCase() === a.charAt(j - 1).toLowerCase()) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1 // deletion
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

function normalize(name) {
  return name.trim().toLowerCase();
}

async function main() {
  await mongoose.connect("mongodb://localhost:27017/your-db-name"); // Change to your DB name
  const teams = await Team.find({});
  const allEmployees = new Set();
  teams.forEach((team) => {
    allEmployees.add(team.lead);
    team.members.forEach((m) => allEmployees.add(m));
  });
  const employeeList = Array.from(allEmployees);
  const normalizedEmployeeList = employeeList.map(normalize);

  const meetings = await Meeting.find({});
  let totalChanged = 0;
  for (const meeting of meetings) {
    let changed = false;
    const newAttendees = meeting.attendees.map((att) => {
      const nAtt = normalize(att);
      // Try exact match first
      let idx = normalizedEmployeeList.indexOf(nAtt);
      if (idx !== -1) return employeeList[idx];
      // Fuzzy match (distance <= 2)
      let minDist = 3,
        bestIdx = -1;
      for (let i = 0; i < normalizedEmployeeList.length; i++) {
        const dist = levenshtein(nAtt, normalizedEmployeeList[i]);
        if (dist < minDist) {
          minDist = dist;
          bestIdx = i;
        }
      }
      if (bestIdx !== -1) {
        changed = true;
        console.log(
          `Fixing attendee "${att}" to "${employeeList[bestIdx]}" in meeting "${meeting.title}"`
        );
        return employeeList[bestIdx];
      }
      // No match found, keep as is
      return att;
    });
    if (changed) {
      meeting.attendees = newAttendees;
      await meeting.save();
      totalChanged++;
    }
  }
  console.log(`Done. Updated ${totalChanged} meetings.`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
