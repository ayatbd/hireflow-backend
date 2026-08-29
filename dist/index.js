"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const database_1 = require("./src/config/database");
const app_1 = __importDefault(require("./src/app"));
const PORT = parseInt(process.env.PORT) || 5000;
// Connect to MongoDB and start server
(0, database_1.connectDB)().then(() => {
    app_1.default.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
    });
});
//# sourceMappingURL=index.js.map