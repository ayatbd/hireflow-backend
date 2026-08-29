import express, { Router, Response } from "express";
import Application from "../models/Application";
import Job from "../models/Job";
import { authenticate, AuthRequest } from "../middleware/auth";

const router: Router = express.Router();

// Create Application
router.post("/", authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { jobId, recruiterId, resume, coverLetter } = req.body;
    const seekerId = req.user?.id;

    // 1. Check if already applied
    const existingApplication = await Application.findOne({ jobId, seekerId });
    if (existingApplication) {
      res
        .status(400)
        .json({ message: "You have already applied for this job." });
      return;
    }

    // 2. Create application
    const application = new Application({
      jobId,
      seekerId,
      recruiterId,
      resume,
      coverLetter,
    });

    await application.save();

    // 3. Increment applicant count in Job model
    await Job.findByIdAndUpdate(jobId, { $inc: { applicantsCount: 1 } });

    res
      .status(201)
      .json({ message: "Application submitted successfully!", application });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Get applications of current user
router.get("/seeker", authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const applications = await Application.find({ seekerId: req.user?.id });
    res.json(applications);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
