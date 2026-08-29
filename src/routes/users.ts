import express, { Router, Response } from "express";
import User from "../models/User";
import { authenticate, AuthRequest } from "../middleware/auth";

const router: Router = express.Router();

// Edit Profile
router.put("/:id", authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Security check: Users can only edit their own profile
    if (req.user?.id !== req.params.id) {
      res.status(403).json({ message: "Unauthorized" });
      return;
    }

    const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
});

// Update Seeker Professional Details
router.patch("/user-info", authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { resume, skills, bio, location } = req.body;
    const userId = req.user?.id; // From JWT middleware

    // 1. Find user and update specific fields
    // We use $set to ensure we only change the provided fields
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          resume, // The Cloudinary URL
          skills, // The Array of strings
          bio,
          location,
          // We can also ensure the role is set correctly here
          role: "seeker",
        },
      },
      { new: true, runValidators: true }, // Returns the updated document
    ).select("-password"); // Security: Hide password

    if (!updatedUser) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    // 2. Return the updated user object
    res.json(updatedUser);
  } catch (error) {
    console.error("Update Profile Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
