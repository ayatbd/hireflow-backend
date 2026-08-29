"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const User_1 = __importDefault(require("../models/User"));
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Edit Profile
router.put("/:id", auth_1.authenticate, async (req, res) => {
    try {
        // Security check: Users can only edit their own profile
        if (req.user?.id !== req.params.id) {
            res.status(403).json({ message: "Unauthorized" });
            return;
        }
        const updatedUser = await User_1.default.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
        });
        res.json(updatedUser);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
// Update Seeker Professional Details
router.patch("/user-info", auth_1.authenticate, async (req, res) => {
    try {
        const { resume, skills, bio, location } = req.body;
        const userId = req.user?.id; // From JWT middleware
        // 1. Find user and update specific fields
        // We use $set to ensure we only change the provided fields
        const updatedUser = await User_1.default.findByIdAndUpdate(userId, {
            $set: {
                resume, // The Cloudinary URL
                skills, // The Array of strings
                bio,
                location,
                // We can also ensure the role is set correctly here
                role: "seeker",
            },
        }, { new: true, runValidators: true }).select("-password"); // Security: Hide password
        if (!updatedUser) {
            res.status(404).json({ message: "User not found" });
            return;
        }
        // 2. Return the updated user object
        res.json(updatedUser);
    }
    catch (error) {
        console.error("Update Profile Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.default = router;
//# sourceMappingURL=users.js.map