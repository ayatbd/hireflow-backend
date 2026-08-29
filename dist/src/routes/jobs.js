"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const Job_1 = __importDefault(require("../models/Job"));
const router = express_1.default.Router();
// POST - Create a New Job
router.post("/", auth_1.authenticate, async (req, res) => {
    try {
        // Only recruiters can post
        if (req.user?.role !== "recruiter") {
            res.status(403).json({ message: "Only recruiters can post jobs" });
            return;
        }
        const newJob = new Job_1.default({
            ...req.body,
            recruiterId: req.user.id,
        });
        const savedJob = await newJob.save();
        res.status(201).json(savedJob);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// GET - Get All Job Listings
router.get("/", async (req, res) => {
    try {
        const keyword = req.query.keyword;
        const category = req.query.category;
        const type = req.query.type;
        const experienceLevel = req.query.experienceLevel;
        const minSalary = req.query.minSalary;
        const maxSalary = req.query.maxSalary;
        const page = req.query.page || "1";
        const limit = req.query.limit || "10";
        let query = {};
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
            if (minSalary)
                query["salary.min"] = { $gte: Number(minSalary) };
            if (maxSalary)
                query["salary.max"] = { $lte: Number(maxSalary) };
        }
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const totalJobs = await Job_1.default.countDocuments(query);
        const jobs = await Job_1.default.find(query)
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
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// GET - Search Jobs
router.get("/search", async (req, res) => {
    try {
        const keyword = req.query.keyword;
        const location = req.query.location;
        const type = req.query.type;
        const query = {};
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
        const jobs = await Job_1.default.find(query).sort({ createdAt: -1 }).limit(50);
        res.status(200).json({
            success: true,
            count: jobs.length,
            jobs,
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Failed to search jobs",
        });
    }
});
// GET - Single Job Listing
router.get("/:id", async (req, res) => {
    try {
        const job = await Job_1.default.findById(req.params.id);
        if (!job) {
            res.status(404).json({ message: "Job not found" });
            return;
        }
        res.json(job);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// PATCH - Toggle Featured Status
router.patch("/:id/feature", auth_1.authenticate, async (req, res) => {
    try {
        const job = await Job_1.default.findById(req.params.id);
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
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// PUT - Update Job Listing
router.put("/:id", auth_1.authenticate, async (req, res) => {
    try {
        let job = await Job_1.default.findById(req.params.id);
        if (!job) {
            res.status(404).json({ message: "Job not found" });
            return;
        }
        // Security check: Is this the recruiter's own job?
        if (job.recruiterId.toString() !== req.user?.id) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        job = await Job_1.default.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(job);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
//# sourceMappingURL=jobs.js.map