"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const User_1 = __importDefault(require("../models/User"));
const Job_1 = __importDefault(require("../models/Job"));
const Company_1 = __importDefault(require("../models/Company"));
const Application_1 = __importDefault(require("../models/Application"));
const router = express_1.default.Router();
// Get all users, jobs, companies, and applications
router.get("/", async (req, res) => {
    try {
        const users = await User_1.default.find();
        const jobs = await Job_1.default.find();
        const companies = await Company_1.default.find();
        const applications = await Application_1.default.find();
        res.json({ users, jobs, companies, applications });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
//# sourceMappingURL=admin.js.map