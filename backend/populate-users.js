const mongoose = require("mongoose");
const User = require("./models/User");
require("dotenv").config({ path: "./config.env" });

const users = [
  { name: "Bhavishya", email: "bhavishya.kerpada@gmail.com" },
  { name: "Akhila", email: "nikkimaipaje@gmail.com" },
  { name: "Abhilash", email: "abhilashantony04@gmail.com" },
  { name: "Suhanas", email: "mails.suhana@gmail.com" },
  { name: "Slevin Vargese", email: "slevinvarghees@gmail.com" },
  { name: "Chaithra", email: "chaithradhanduguri@gmail.com" },
  { name: "Yamini", email: "yaminikarmay123456@gmail.com" },
  { name: "Afna", email: "afna.emails@gmail.com" },
  { name: "Reena Tiju", email: "reenapa2010@gmail.com" },
  { name: "Ifla", email: "fathimaifla2003@gmail.com" },
  { name: "Safida", email: "mariyam.safeeda.mardala@gmail.com" },
  { name: "Shaima", email: "shaimakunthoor2007@gmail.com" },
  { name: "Tiju Thomas", email: "tijukariyil@gmail.com" },
  { name: "Samsheena M", email: "samsheenam2003@gmail.com" },
  { name: "Yashaswini", email: "yashaswinihdhandnjaya@gmail.com" },
  { name: "Thafseeda", email: "thafseeda2003@gmail.com" },
  { name: "Lavanya", email: "lavanyaraiks@gmail.com" },
  { name: "Chaithra P", email: "chaithra.ajana@gmail.com" },
  { name: "Shabna", email: "fathimathshabna2000@gmail.com" },
  { name: "Sharan", email: "sharangowda448@gmail.com" },
  { name: "Navya", email: "navyanavyan54@gmail.com" },
  { name: "Nusaiba", email: "fathimathnusaiba2004@gmail.com" },
  { name: "Namo Swasthik", email: "namoswasthik.padejaru@gmail.com" },
  { name: "Nishana", email: "nishananishanzz.gm@gmail.com" },
  { name: "Nazera", email: "nejjunezira@gmail.com" },
  { name: "Sinchan", email: "sinchankadaba@gmail.com" },
  { name: "Mubeena", email: "kmubeena895@gmail.com" },
  { name: "Sahil", email: "shahilahammedshahilahammed@gmail.com" },
  { name: "Geetha", email: "geethajyothi2000@gmail.com" },
  { name: "Sudeep K C", email: "sudeepkalpure@gmail.com" },
  { name: "Sowjanya", email: "sowjanyapr5@gmail.com" },
  { name: "Ashwin", email: "ashwin.mk.2019@gmail.com" },
  { name: "Mumthaz", email: "mumthazashiq91@gmail.com" },
];

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  await User.deleteMany({}); // Optional: clear existing users
  await User.insertMany(
    users.map((u) => ({ ...u, role: "user", password: "password123" }))
  );
  console.log("Users inserted!");
  mongoose.disconnect();
}

main();
