import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { initializeHedera } from "./config/hedera.js";
import { initializeFirebase } from "./config/firebase.js";
import { errorHandler } from "./middleware/errorHandler.js";

// Routes
import battlesRouter from "./routes/battles.js";
import rappersRouter from "./routes/rappers.js";
import governanceRouter from "./routes/governance.js";
import ticketsRouter from "./routes/tickets.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());

// Initialize services
try {
  await initializeHedera();
  await initializeFirebase();
  console.log("Services initialized successfully");
} catch (error) {
  console.error("Failed to initialize services:", error);
  process.exit(1);
}

// Routes
app.use("/api/battles", battlesRouter);
app.use("/api/rappers", rappersRouter);
app.use("/api/governance", governanceRouter);
app.use("/api/tickets", ticketsRouter);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "HedRap API is running" });
});

// Error handling
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`HedRap Backend running on http://localhost:${PORT}`);
});
