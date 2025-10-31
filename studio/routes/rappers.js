import express from "express";
import { firebaseService } from "../services/firebaseService.js";

const router = express.Router();

// Get all rappers
router.get("/", async (req, res, next) => {
  try {
    const rappers = await firebaseService.getRappers();
    res.json(rappers);
  } catch (error) {
    next(error);
  }
});

// Create rapper
router.post("/", async (req, res, next) => {
  try {
    const rapper = await firebaseService.createRapper(req.body);
    res.status(201).json(rapper);
  } catch (error) {
    next(error);
  }
});

export default router;
