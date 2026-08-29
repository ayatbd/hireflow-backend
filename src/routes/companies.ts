import express, { Response, Router } from "express";
import { authenticate, AuthRequest } from "../middleware/auth";
import Company from "../models/Company";
import User from "../models/User";

const router: Router = express.Router();

// Get all companies
router.get("/", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const industry = req.query.industry as string | undefined;
    const location = req.query.location as string | undefined;
    const keyword = req.query.keyword as string | undefined;
    const page = (req.query.page as string) || "1";
    const limit = (req.query.limit as string) || "10";

    // 1. Build the Dynamic Query
    let query: any = {};

    // Filter by Multiple Industries
    // Expects: ?industry=Healthcare,SaaS
    if (industry) {
      query.industry = { $in: industry.split(",") };
    }

    // Filter by Location (Case-insensitive search)
    if (location) {
      query.location = { $regex: location, $options: "i" };
    }

    // Search by Keyword (Name or Description)
    if (keyword) {
      query.$or = [
        { name: { $regex: keyword, $options: "i" } },
        { description: { $regex: keyword, $options: "i" } },
      ];
    }

    // 2. Pagination Logic
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // 3. Execute Query
    const totalCompanies = await Company.countDocuments(query);
    const companies = await Company.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // 4. Send Response
    res.json({
      companies,
      pagination: {
        totalCompanies,
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCompanies / parseInt(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Get company by id
router.get("/:id", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const company = await Company.findById(req.params.id);
    res.json(company);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
});

// Get companies by user id
router.get("/user/:userId", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const companies = await Company.find({ ownerId: req.params.userId });
    res.json(companies);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
});

// Create company
router.post("/", authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, location, industry, website, description, logo } = req.body;

    // 1. Check if company name already exists
    const existingCompany = await Company.findOne({ name });
    if (existingCompany) {
      res.status(400).json({ message: "Company already exists" });
      return;
    }

    // 2. Create the company
    const newCompany = new Company({
      name,
      location,
      industry,
      website,
      description,
      logo,
      ownerId: req.user!.id, // From Auth Middleware
      admins: [req.user!.id],
    });

    const savedCompany = await newCompany.save();

    // 3. Link this company to the Recruiter's User Profile
    await User.findByIdAndUpdate(req.user!.id, {
      companyId: savedCompany._id,
      role: "recruiter",
    });

    res.status(201).json(savedCompany);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
});

export default router;
