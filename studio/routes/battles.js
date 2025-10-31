import express from "express";
import { hederaService } from "../services/hederaService.js";
import { firebaseService } from "../services/firebaseService.js";

const router = express.Router();

// ==================== Battle Routes ====================

/**
 * GET /api/battles
 * Get all battles (Firebase + enriched with Hedera data)
 */
router.get("/", async (req, res) => {
  try {
    const battles = await firebaseService.getBattles();

    // Optionally enrich with live Hedera data
    const enrichedBattles = await Promise.all(
      battles.map(async (battle) => {
        try {
          const hederaData = await hederaService.getBattleWithScores(
            battle.battleId
          );
          return { ...battle, ...hederaData, videoUrl: battle.videoUrl };
        } catch (error) {
          // If Hedera call fails, return Firebase data only
          return battle;
        }
      })
    );

    res.json(enrichedBattles);
  } catch (error) {
    console.error("Error fetching battles:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/battles/active
 * Get active battles from Hedera smart contract
 */
router.get("/active", async (req, res) => {
  try {
    const activeBattleIds = await hederaService.getActiveBattles();

    // Get full battle data for each active battle
    const activeBattles = await Promise.all(
      activeBattleIds.map(async (battleId) => {
        // Get from Firebase first (has metadata)
        const battleDoc = await firebaseService.getBattleByContractId(battleId);
        // Enrich with Hedera data
        const hederaData = await hederaService.getBattleWithScores(battleId);
        return { ...battleDoc, ...hederaData };
      })
    );

    res.json(activeBattles);
  } catch (error) {
    console.error("Error fetching active battles:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/battles/:id
 * Get single battle by Firebase document ID
 */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Get battle metadata from Firebase
    const battleDoc = await firebaseService.getBattle(id);

    // 2. Get live data from Hedera using the contract battleId
    const hederaData = await hederaService.getBattleWithScores(
      battleDoc.battleId
    );

    // 3. Merge and return
    res.json({
      ...battleDoc,
      ...hederaData,
      id: id, // Keep Firebase doc ID for frontend routing
      battleId: battleDoc.battleId, // Keep contract ID for smart contract calls
    });
  } catch (error) {
    console.error("Error fetching battle:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/battles/:id/scores
 * Get live battle scores from Hedera
 */
router.get("/:id/scores", async (req, res) => {
  try {
    const { id } = req.params;

    // Get battleId from Firebase doc
    const battleDoc = await firebaseService.getBattle(id);

    // Fetch live scores from Hedera
    const scores = await hederaService.getBattleWithScores(battleDoc.battleId);

    res.json(scores);
  } catch (error) {
    console.error("Error fetching battle scores:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/battles
 * Create new battle
 */
router.post("/", async (req, res) => {
  try {
    const battleData = req.body;

    // 1. Create on Hedera smart contract first (source of truth)
    const hederaResult = await hederaService.createBattle({
      rapper1Name: battleData.rapper1Name,
      rapper2Name: battleData.rapper2Name,
      rapper1Address: battleData.rapper1Address,
      rapper2Address: battleData.rapper2Address,
      durationMinutes: battleData.durationMinutes,
      videoUrl: battleData.videoUrl || "",
    });

    // 2. Store in Firebase with the contract battleId
    const battleDoc = {
      battleId: hederaResult.battleId, // ← CRITICAL: Store contract ID
      rapper1Name: battleData.rapper1Name,
      rapper2Name: battleData.rapper2Name,
      rapper1Address: battleData.rapper1Address,
      rapper2Address: battleData.rapper2Address,
      description: battleData.description || "",
      videoUrl: battleData.videoUrl || "",
      durationMinutes: battleData.durationMinutes,
      endTime: hederaResult.endTime,
      status: "active",
      transactionId: hederaResult.transactionId,
    };

    const firebaseResult = await firebaseService.createBattle(battleDoc);

    res.status(201).json({
      ...firebaseResult,
      battleId: hederaResult.battleId,
      transactionId: hederaResult.transactionId,
    });
  } catch (error) {
    console.error("Error creating battle:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/battles/:id/vote
 * Vote on a battle (id = Firebase doc ID)
 */
router.post("/:id/vote", async (req, res) => {
  try {
    const { id } = req.params;
    const { rapperChoice, voterAddress } = req.body;

    if (!voterAddress) {
      return res.status(400).json({ error: "Voter address is required" });
    }

    if (![1, 2].includes(rapperChoice)) {
      return res.status(400).json({ error: "Invalid rapper choice (1 or 2)" });
    }

    // 1. Get the battle to find its contract battleId
    const battleDoc = await firebaseService.getBattle(id);

    // 2. Check if already voted (from Hedera)
    const hasVoted = await hederaService.checkHasVoted(
      battleDoc.battleId,
      voterAddress
    );

    if (hasVoted) {
      return res.status(400).json({ error: "Already voted on this battle" });
    }

    // 3. Submit vote to Hedera smart contract
    const voteResult = await hederaService.vote({
      battleId: battleDoc.battleId, 
      rapperChoice,
    });

    // 4. Record vote in Firebase for quick lookup
    await firebaseService.addVote(id, {
      voterId: voterAddress,
      rapperId: rapperChoice,
    });

    res.json({
      success: true,
      transactionId: voteResult.transactionId,
      battleId: battleDoc.battleId,
    });
  } catch (error) {
    console.error("Error voting on battle:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/battles/:id/check-vote/:address
 * Check if address has voted (id = Firebase doc ID)
 */
router.get("/:id/check-vote/:address", async (req, res) => {
  try {
    const { id, address } = req.params;

    // Get battleId from Firebase
    const battleDoc = await firebaseService.getBattle(id);

    // Check on Hedera
    const hasVoted = await hederaService.checkHasVoted(
      battleDoc.battleId,
      address
    );

    res.json({ hasVoted });
  } catch (error) {
    console.error("Error checking vote status:", error);
    res.status(500).json({ error: error.message, hasVoted: false });
  }
});

/**
 * POST /api/battles/:id/end
 * End a battle (id = Firebase doc ID)
 */
router.post("/:id/end", async (req, res) => {
  try {
    const { id } = req.params;

    // Get battleId from Firebase
    const battleDoc = await firebaseService.getBattle(id);

    // End battle on Hedera
    const result = await hederaService.endBattle(battleDoc.battleId);

    // Update Firebase
    await firebaseService.updateBattle(id, {
      status: "ended",
      winner: result.winner,
      endedAt: new Date(),
    });

    res.json({
      success: true,
      winner: result.winner,
      transactionId: result.transactionId,
    });
  } catch (error) {
    console.error("Error ending battle:", error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== Judge Routes ====================

/**
 * GET /api/battles/judges
 * Get all certified judges
 */
router.get("/judges", async (req, res) => {
  try {
    const judges = await hederaService.getAllJudges();
    res.json({ judges });
  } catch (error) {
    console.error("Error fetching judges:", error);
    res.status(500).json({ error: error.message, judges: [] });
  }
});

/**
 * GET /api/battles/judges/check/:address
 * Check if address is a judge
 */
router.get("/judges/check/:address", async (req, res) => {
  try {
    const { address } = req.params;
    const isJudge = await hederaService.checkIsJudge(address);
    res.json({ isJudge });
  } catch (error) {
    console.error("Error checking judge status:", error);
    res.status(500).json({ error: error.message, isJudge: false });
  }
});

/**
 * POST /api/battles/judges/add
 * Add a certified judge (admin only)
 */
router.post("/judges/add", async (req, res) => {
  try {
    const { judgeAddress } = req.body;

    if (!judgeAddress) {
      return res.status(400).json({ error: "Judge address is required" });
    }

    const result = await hederaService.addJudge(judgeAddress);

    res.json({
      success: true,
      transactionId: result.transactionId,
    });
  } catch (error) {
    console.error("Error adding judge:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/battles/judges/remove
 * Remove a judge (admin only)
 */
router.post("/judges/remove", async (req, res) => {
  try {
    const { judgeAddress } = req.body;

    if (!judgeAddress) {
      return res.status(400).json({ error: "Judge address is required" });
    }

    const result = await hederaService.removeJudge(judgeAddress);

    res.json({
      success: true,
      transactionId: result.transactionId,
    });
  } catch (error) {
    console.error("Error removing judge:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/battles/voting-fee
 * Get current voting fee
 */
router.get("/voting-fee", async (req, res) => {
  try {
    const votingFee = await hederaService.getVotingFee();
    res.json({ votingFee });
  } catch (error) {
    console.error("Error fetching voting fee:", error);
    res.status(500).json({ error: error.message, votingFee: 0.1 });
  }
});

/**
 * POST /api/battles/voting-fee
 * Set voting fee (admin only)
 */
router.post("/voting-fee", async (req, res) => {
  try {
    const { votingFee } = req.body;

    if (typeof votingFee !== "number" || votingFee < 0) {
      return res.status(400).json({ error: "Invalid voting fee" });
    }

    const result = await hederaService.setVotingFee(votingFee);

    res.json({
      success: true,
      votingFee,
      transactionId: result.transactionId,
    });
  } catch (error) {
    console.error("Error setting voting fee:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
