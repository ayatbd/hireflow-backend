import "dotenv/config";
import { connectDB } from "./src/config/database";
import app from "./src/app";

const PORT: number = parseInt(process.env.PORT as string) || 5000;

// Connect to MongoDB and start server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
});
