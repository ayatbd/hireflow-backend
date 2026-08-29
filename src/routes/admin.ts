import express, { Router, Response } from "express";
import User from "../models/User";
import Job from "../models/Job";
import Company from "../models/Company";
import Application from "../models/Application";
import { AuthRequest } from "../middleware/auth";

const router: Router = express.Router();

// Get all users, jobs, companies, and applications
router.get("/", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const users = await User.find();
    const jobs = await Job.find();
    const companies = await Company.find();
    const applications = await Application.find();

    res.json({ users, jobs, companies, applications });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
