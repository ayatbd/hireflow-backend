import express, { Express, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import { AuthRequest } from "./middleware/auth";

import authRoutes from "./routes/auth";
import usersRoutes from "./routes/users";
import companiesRoutes from "./routes/companies";
import jobsRoutes from "./routes/jobs";
import applicationsRoutes from "./routes/applications";
import adminRoutes from "./routes/admin";

// Load environment variables
dotenv.config();

// Initialize Express App
const app: Express = express();

// --- MIDDLEWARES ---
app.use(express.json());
app.use(cors());
app.use(helmet()); // Security headers
app.use(morgan("dev")); // Logging

// --- ROUTES ---
app.use("/api", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/companies", companiesRoutes);
app.use("/api/jobs", jobsRoutes);
app.use("/api/applications", applicationsRoutes);
app.use("/api/admin", adminRoutes);

// Health Check
app.get("/", (req: AuthRequest, res: Response): void => {
  res.status(200).json({
    success: true,
    message: "HireFlow backend is running!",
  });
});

export default app;
