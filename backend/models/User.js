const mongoose = require("mongoose");

// User Schema (Handles both Seekers & Recruiters)
const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["seeker", "recruiter"], default: "seeker" },
    location: String,
    bio: String,
    avatar: String,
    // Seeker specific
    resume: String,
    skills: [String],
    // Recruiter specific
    companyName: String,
    companyWebsite: String,
  },
  { timestamps: true },
);

module.exports = mongoose.model("User", userSchema);
