"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const Application_1 = __importDefault(require("../models/Application"));
const Job_1 = __importDefault(require("../models/Job"));
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Create Application
router.post("/", auth_1.authenticate, async (req, res) => {
    try {
        const { jobId, recruiterId, resume, coverLetter } = req.body;
        const seekerId = req.user?.id;
        // 1. Check if already applied
        const existingApplication = await Application_1.default.findOne({ jobId, seekerId });
        if (existingApplication) {
            res
                .status(400)
                .json({ message: "You have already applied for this job." });
            return;
        }
        // 2. Create application
        const application = new Application_1.default({
            jobId,
            seekerId,
            recruiterId,
            resume,
            coverLetter,
        });
        await application.save();
        // 3. Increment applicant count in Job model
        await Job_1.default.findByIdAndUpdate(jobId, { $inc: { applicantsCount: 1 } });
        res
            .status(201)
            .json({ message: "Application submitted successfully!", application });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Get applications of current user
router.get("/seeker", auth_1.authenticate, async (req, res) => {
    try {
        const applications = await Application_1.default.find({ seekerId: req.user?.id });
        res.json(applications);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
//# sourceMappingURL=applications.js.map