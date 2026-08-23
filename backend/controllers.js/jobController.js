const Job = require("../models/Job");

exports.createJob = async (req, res) => {
  try {
    if (req.user.role !== "recruiter") {
      return res.status(403).json({ message: "Only recruiters can post jobs" });
    }
    const newJob = new Job({ ...req.body, recruiterId: req.user.id });
    await newJob.save();
    res.status(201).json(savedJob);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAllJobs = async (req, res) => {
  // ... your existing get jobs logic
};
