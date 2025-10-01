const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const Admin = require("../models/Admin");

async function main() {
  const [,, emailArg, passwordArg, nameArg] = process.argv;
  if (!emailArg || !passwordArg) {
    console.error("Usage: node scripts/createAdmin.js <email> <password> [name]");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  try {
    const exists = await Admin.findOne({ email: emailArg.toLowerCase().trim() });
    if (exists) {
      console.log("Admin already exists:", exists.email);
      process.exit(0);
    }
    const passwordHash = await bcrypt.hash(passwordArg, 10);
    const admin = await Admin.create({ email: emailArg, passwordHash, name: nameArg || "Administrateur" });
    console.log("Admin created:", admin.email);
  } catch (e) {
    console.error("Error:", e.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

main();


