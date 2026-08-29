"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
const auth_1 = __importDefault(require("./routes/auth"));
const users_1 = __importDefault(require("./routes/users"));
const companies_1 = __importDefault(require("./routes/companies"));
const jobs_1 = __importDefault(require("./routes/jobs"));
const applications_1 = __importDefault(require("./routes/applications"));
const admin_1 = __importDefault(require("./routes/admin"));
// Load environment variables
dotenv_1.default.config();
// Initialize Express App
const app = (0, express_1.default)();
// --- MIDDLEWARES ---
app.use(express_1.default.json());
app.use((0, cors_1.default)());
app.use((0, helmet_1.default)()); // Security headers
app.use((0, morgan_1.default)("dev")); // Logging
// --- ROUTES ---
app.use("/api", auth_1.default);
app.use("/api/users", users_1.default);
app.use("/api/companies", companies_1.default);
app.use("/api/jobs", jobs_1.default);
app.use("/api/applications", applications_1.default);
app.use("/api/admin", admin_1.default);
// Health Check
app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "HireFlow backend is running!",
    });
});
exports.default = app;
//# sourceMappingURL=app.js.map