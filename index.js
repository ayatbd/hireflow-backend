const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

dotenv.config();
const app = express();

// --- MIDDLEWARES ---
app.use(express.json());
app.use(cors());
app.use(helmet()); // Security headers
app.use(morgan("dev")); // Logging

// --- MONGODB CONNECTION ---
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ Connection Error:", err));

// --- 1. MODELS ---

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

// Job Schema
const jobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },

    // Embedded company info for fast performance, plus a ref to the full profile
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

    category: { type: String, required: true }, // e.g. "Design", "Engineering"

    type: {
      type: String,
      enum: ["Full-time", "Part-time", "Contract", "Internship", "Freelance"],
      default: "Full-time",
    },

    workMode: {
      type: String,
      enum: ["On-site", "Remote", "Hybrid"],
      required: true,
    },

    location: { type: String, required: true },

    salary: {
      min: { type: Number },
      max: { type: Number },
      currency: { type: String, default: "USD" },
      isNegotiable: { type: Boolean, default: false },
    },

    experienceLevel: {
      type: String,
      enum: ["Entry Level", "Mid Level", "Senior", "Lead", "Executive"],
      required: true,
    },

    skills: [{ type: String }], // Array of strings for tags
    requirements: [{ type: String }], // Bullet points
    benefits: [{ type: String }], // Bullet points

    applicantsCount: { type: Number, default: 0 },

    status: {
      type: String,
      enum: ["active", "expired", "draft"],
      default: "active",
    },
  },
  { timestamps: true },
);

// Company Schema
const companySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    logo: { type: String }, // URL to Cloudinary/S3
    website: { type: String },
    location: { type: String, required: true },
    industry: { type: String, required: true },
    description: { type: String },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    admins: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Multiple recruiters can manage one company
  },
  { timestamps: true },
);

// Application Schema
const applicationSchema = new mongoose.Schema(
  {
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
    seekerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    recruiterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    resume: { type: String, required: true }, // URL to resume
    coverLetter: { type: String },
    status: {
      type: String,
      enum: ["pending", "reviewing", "interviewing", "offered", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true },
);

// Prevent applying to the same job twice
applicationSchema.index({ jobId: 1, seekerId: 1 }, { unique: true });

const User = mongoose.model("User", userSchema);
const Job = mongoose.model("Job", jobSchema);
const Company = mongoose.model("Company", companySchema);
const Application = mongoose.model("Application", applicationSchema);

// --- 2. AUTHENTICATION MIDDLEWARE ---
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Contains { id, role }
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

// --- 3. AUTH ROUTES ---

// Registration
app.post("/api/users", async (req, res) => {
  try {
    const { fullName, email, password, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "Email already registered" });

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = new User({ fullName, email, password: hashedPassword, role });
    await user.save();

    // Optionally generate token so they are logged in immediately after signup
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" },
    );

    res.status(201).json({
      success: true,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Login
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.json({
      success: true,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get("/api/user-info", authenticate, async (req, res) => {
  try {
    // req.user was populated by the 'authenticate' middleware
    const user = await User.findById(req.user.id).select("-password"); // Exclude password
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// edit profile
app.put("/api/users/:id", authenticate, async (req, res) => {
  try {
    // Security check: Users can only edit their own profile
    if (req.user.id !== req.params.id) {
      return res.status(403).json({ message: "Unauthorized" });
    } else {
      const updatedUser = await User.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true },
      );
      res.json(updatedUser);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
//-------------------------------------------------
// --- company routes ---
//-------------------------------------------------

// get all companies
app.get("/api/companies", async (req, res) => {
  try {
    const { type, experience, minSalary, maxSalary } = req.query;

    // Build the query object
    const query = {};

    // Filter by Job Type (expects comma separated string: "Full-time,Part-time")
    if (type) {
      query.jobType = { $in: type.split(",") };
    }

    // Filter by Experience Level
    if (experience) {
      query.experienceLevel = { $in: experience.split(",") };
    }

    // Filter by Salary Range
    // Note: Frontend uses 'k' (thousands), assuming DB stores actual numbers
    if (minSalary || maxSalary) {
      query.salary = {};
      if (minSalary) query.salary.$gte = Number(minSalary) * 1000;
      if (maxSalary) query.salary.$lte = Number(maxSalary) * 1000;
    }

    const companies = await Company.find(query);
    res.json(companies);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// get company by id
app.get("/api/companies/:id", async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    res.json(company);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// get companies by user id
app.get("/api/companies/user/:userId", async (req, res) => {
  try {
    const companies = await Company.find({ ownerId: req.params.userId });
    res.json(companies);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post("/api/companies", authenticate, async (req, res) => {
  try {
    const { name, location, industry, website, description, logo } = req.body;

    // 1. Check if company name already exists
    const existingCompany = await Company.findOne({ name });
    if (existingCompany)
      return res.status(400).json({ message: "Company already exists" });

    // 2. Create the company
    const newCompany = new Company({
      name,
      location,
      industry,
      website,
      description,
      logo,
      ownerId: req.user.id, // From Auth Middleware
      admins: [req.user.id],
    });

    const savedCompany = await newCompany.save();

    // 3. Link this company to the Recruiter's User Profile
    await User.findByIdAndUpdate(req.user.id, {
      companyId: savedCompany._id,
      role: "recruiter",
    });

    res.status(201).json(savedCompany);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

//-------------------------------------------------
// --- 4. JOB ROUTES ---
//-------------------------------------------------

// POST /api/jobs - Create a New Job
app.post("/api/jobs", authenticate, async (req, res) => {
  try {
    // Only recruiters can post
    if (req.user.role !== "recruiter") {
      return res.status(403).json({ message: "Only recruiters can post jobs" });
    }

    const newJob = new Job({
      ...req.body,
      recruiterId: req.user.id,
    });

    const savedJob = await newJob.save();
    res.status(201).json(savedJob);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/jobs - Get All Job Listings
app.get("/api/jobs", async (req, res) => {
  try {
    const {
      keyword, // Added keyword
      type,
      experienceLevel, // Changed from experience to match DB
      minSalary,
      maxSalary,
      page = 1,
      limit = 10,
    } = req.query;

    let query = {};

    // 1. Keyword Search (Title or Description)
    if (keyword) {
      query.$or = [
        { title: { $regex: keyword, $options: "i" } },
        { description: { $regex: keyword, $options: "i" } },
      ];
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
        totalPages: Math.ceil(totalJobs / limit),
        hasNextPage: skip + jobs.length < totalJobs,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// job search by title and location together
app.get("/api/jobs/search", async (req, res) => {
  try {
    const { keyword, location, type } = req.query;

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

// GET /api/jobs/:id - Get Single Job Listing
app.get("/api/jobs/:id", async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: "Job not found" });
    res.json(job);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// toggle featured status of a job
app.patch("/api/jobs/:id/feature", authenticate, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: "Job not found" });

    // Security check: Is this the recruiter's own job?
    if (job.recruiterId.toString() !== req.user.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    job.featured = !job.featured;
    const updatedJob = await job.save();
    res.json(updatedJob);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/jobs/:id - Update Job Listing
app.put("/api/jobs/:id", authenticate, async (req, res) => {
  try {
    let job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: "Job not found" });

    // Security check: Is this the recruiter's own job?
    if (job.recruiterId.toString() !== req.user.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    job = await Job.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(job);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//----------------------------------
// --- application routes ---
//----------------------------------
app.post("/api/applications", authenticate, async (req, res) => {
  try {
    const { jobId, recruiterId, resume, coverLetter } = req.body;
    const seekerId = req.user.id;

    // 1. Check if already applied
    const existingApplication = await Application.findOne({ jobId, seekerId });
    if (existingApplication) {
      return res
        .status(400)
        .json({ message: "You have already applied for this job." });
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
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "HireFlow backend is running!",
  });
});
