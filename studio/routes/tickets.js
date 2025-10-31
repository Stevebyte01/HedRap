import express from "express";
import { hederaService } from "../services/hederaService.js";

const router = express.Router();

// Create ticket NFT collection
router.post("/create", async (req, res, next) => {
  try {
    const { name, maxSupply } = req.body;
    const result = await hederaService.createTicketNFT({ name, maxSupply });
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

// Mint ticket
router.post("/mint", async (req, res, next) => {
  try {
    const { tokenId, metadata } = req.body;
    const result = await hederaService.mintTicket(tokenId, metadata);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
