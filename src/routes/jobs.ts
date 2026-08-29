import express, { Response, Router } from "express";
import { authenticate, AuthRequest } from "../middleware/auth";
import Job from "../models/Job";

const router: Router = express.Router();

// POST - Create a New Job
router.post("/", authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Only recruiters can post
    if (req.user?.role !== "recruiter") {
      res.status(403).json({ message: "Only recruiters can post jobs" });
      return;
    }

    const newJob = new Job({
      ...req.body,
      recruiterId: req.user!.id,
    });

    const savedJob = await newJob.save();
    res.status(201).json(savedJob);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// GET - Get All Job Listings
router.get("/", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const keyword = req.query.keyword as string | undefined;
    const category = req.query.category as string | undefined;
    const type = req.query.type as string | undefined;
    const experienceLevel = req.query.experienceLevel as string | undefined;
    const minSalary = req.query.minSalary as string | undefined;
    const maxSalary = req.query.maxSalary as string | undefined;
    const page = (req.query.page as string) || "1";
    const limit = (req.query.limit as string) || "10";

    let query: any = {};

    // 1. Keyword Search (Title or Description)
    if (keyword) {
      query.$or = [
        { title: { $regex: keyword, $options: "i" } },
        { description: { $regex: keyword, $options: "i" } },
      ];
    }

    // 3. Category Filter (Matches your homepage clicks)
    if (category) {
      // We use regex so "Development" matches "Web Development" or "Software Development"
      query.category = { $regex: category, $options: "i" };
    }

    // 2. Filter by Job Type
    if (type) {
      query.type = { $in: type.split(",") };
    }

    // 3. Filter by Experience Level (Matched to DB key)
    if (experienceLevel) {
      query.experienceLevel = { $in: experienceLevel.split(",") };
    }

    // 4. Filter by Salary Range
    if (minSalary || maxSalary) {
      if (minSalary) query["salary.min"] = { $gte: Number(minSalary) };
      if (maxSalary) query["salary.max"] = { $lte: Number(maxSalary) };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const totalJobs = await Job.countDocuments(query);
    const jobs = await Job.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      jobs,
      pagination: {
        totalJobs,
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalJobs / parseInt(limit)),
        hasNextPage: skip + jobs.length < totalJobs,
      },
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// GET - Search Jobs
router.get("/search", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const keyword = req.query.keyword as string | undefined;
    const location = req.query.location as string | undefined;
    const type = req.query.type as string | undefined;

    const query: any = {};

    // Job title / keyword
    if (keyword?.trim()) {
      query.$or = [
        {
          title: {
            $regex: keyword.trim(),
            $options: "i",
          },
        },
        {
          description: {
            $regex: keyword.trim(),
            $options: "i",
          },
        },
      ];
    }

    // Location
    if (location?.trim()) {
      query.location = {
        $regex: location.trim(),
        $options: "i",
      };
    }

    // Job type
    if (type?.trim()) {
      query.type = {
        $regex: type.trim(),
        $options: "i",
      };
    }

    const jobs = await Job.find(query).sort({ createdAt: -1 }).limit(50);

    res.status(200).json({
      success: true,
      count: jobs.length,
      jobs,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to search jobs",
    });
  }
});

// GET - Single Job Listing
router.get("/:id", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      res.status(404).json({ message: "Job not found" });
      return;
    }
    res.json(job);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// PATCH - Toggle Featured Status
router.patch("/:id/feature", authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      res.status(404).json({ message: "Job not found" });
      return;
    }

    // Security check: Is this the recruiter's own job?
    if (job.recruiterId.toString() !== req.user?.id) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    job.featured = !job.featured;
    const updatedJob = await job.save();
    res.json(updatedJob);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// PUT - Update Job Listing
router.put("/:id", authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    let job = await Job.findById(req.params.id);
    if (!job) {
      res.status(404).json({ message: "Job not found" });
      return;
    }

    // Security check: Is this the recruiter's own job?
    if (job.recruiterId.toString() !== req.user?.id) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    job = await Job.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(job);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
