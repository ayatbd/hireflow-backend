const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    company: {
      id: { type: mongoose.Schema.Types.ObjectId, ref: "Company" },
      name: { type: String, required: true },
      logo: { type: String },
    },
    recruiterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // ... other fields
  },
  { timestamps: true },
);

module.exports = mongoose.model("Job", jobSchema);
