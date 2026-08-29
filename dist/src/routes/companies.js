"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const Company_1 = __importDefault(require("../models/Company"));
const User_1 = __importDefault(require("../models/User"));
const router = express_1.default.Router();
// Get all companies
router.get("/", async (req, res) => {
    try {
        const industry = req.query.industry;
        const location = req.query.location;
        const keyword = req.query.keyword;
        const page = req.query.page || "1";
        const limit = req.query.limit || "10";
        // 1. Build the Dynamic Query
        let query = {};
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
        const totalCompanies = await Company_1.default.countDocuments(query);
        const companies = await Company_1.default.find(query)
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
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Get company by id
router.get("/:id", async (req, res) => {
    try {
        const company = await Company_1.default.findById(req.params.id);
        res.json(company);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
// Get companies by user id
router.get("/user/:userId", async (req, res) => {
    try {
        const companies = await Company_1.default.find({ ownerId: req.params.userId });
        res.json(companies);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
// Create company
router.post("/", auth_1.authenticate, async (req, res) => {
    try {
        const { name, location, industry, website, description, logo } = req.body;
        // 1. Check if company name already exists
        const existingCompany = await Company_1.default.findOne({ name });
        if (existingCompany) {
            res.status(400).json({ message: "Company already exists" });
            return;
        }
        // 2. Create the company
        const newCompany = new Company_1.default({
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
        await User_1.default.findByIdAndUpdate(req.user.id, {
            companyId: savedCompany._id,
            role: "recruiter",
        });
        res.status(201).json(savedCompany);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.default = router;
//# sourceMappingURL=companies.js.map