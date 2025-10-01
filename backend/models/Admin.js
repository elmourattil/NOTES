const mongoose = require("mongoose");

const AdminSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    name: { type: String, default: "Administrateur" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Admin", AdminSchema);


