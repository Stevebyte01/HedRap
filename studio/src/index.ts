import type { Express, Request, Response, NextFunction } from "express";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// Import configs
import "./config/hedera.js";
import "./config/firebase.js";


dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);
app.use(express.json());

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Routes
app.get("/health", (req: Request, res: Response) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// API Routes
app.get("/api/battles", (req: Request, res: Response) => {
  res.json({ battles: [] });
});

// Root endpoint
app.get("/", (req: Request, res: Response) => {
  res.json({
    message: "HedRap API",
    version: "1.0.0",
    endpoints: {
      health: "GET /health",
      battles: "GET /api/battles",
      createBattle: "POST /api/battles",
      submitVote: "POST /api/votes",
      getResults: "GET /api/results/:battleId",
      finalizeResults: "POST /api/results/:battleId/finalize",
    },
  });
});

app.post("/api/votes", (req: Request, res: Response) => {
  res.json({ message: "Vote received (not implemented yet)" });
});

// Error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("Error:", err);
  res.status(500).json({
    success: false,
    error: "Internal server error",
    timestamp: Date.now(),
  });
});

app.listen(PORT, () => {
  console.log(`\nHedRap Backend running at http://localhost:${PORT}`);
  console.log(`API Docs: http://localhost:${PORT}\n`);
});
