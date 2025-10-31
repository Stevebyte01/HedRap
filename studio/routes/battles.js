import express from "express";
import { hederaService } from "../services/hederaService.js";
import { firebaseService } from "../services/firebaseService.js";

const router = express.Router();

// Get all battles
router.get("/", async (req, res, next) => {
  try {
    // Get battles from Firebase
    const battles = await firebaseService.getBattles();

    // Optionally enrich with on-chain data
    const enrichedBattles = await Promise.all(
      battles.map(async (battle) => {
        if (battle.battleId !== undefined) {
          try {
            const onChainData = await hederaService.getBattleFromContract(
              battle.battleId
            );
            return { ...battle, onChainData };
          } catch (error) {
            console.error(
              `Failed to fetch on-chain data for battle ${battle.battleId}:`,
              error
            );
            return battle;
          }
        }
        return battle;
      })
    );

    res.json(enrichedBattles);
  } catch (error) {
    next(error);
  }
});

// Get active battles from smart contract
router.get("/active", async (req, res, next) => {
  try {
    const activeBattleIds = await hederaService.getActiveBattles();

    // Fetch full details for each active battle
    const battles = await Promise.all(
      activeBattleIds.map(async (id) => {
        const [onChainData, firebaseData] = await Promise.all([
          hederaService.getBattleWithScores(id),
          firebaseService.getBattleByContractId(id),
        ]);

        return {
          ...firebaseData,
          ...onChainData,
          battleId: id,
        };
      })
    );

    res.json(battles);
  } catch (error) {
    next(error);
  }
});

// Get single battle
router.get("/:id", async (req, res, next) => {
  try {
    const battle = await firebaseService.getBattle(req.params.id);

    // If battle has on-chain ID, fetch on-chain data
    if (battle.battleId !== undefined) {
      const onChainData = await hederaService.getBattleWithScores(
        battle.battleId
      );
      battle.onChainData = onChainData;
    }

    res.json(battle);
  } catch (error) {
    next(error);
  }
});

// Create new battle (deploys to smart contract)
router.post("/", async (req, res, next) => {
  try {
    const {
      rapper1Name,
      rapper2Name,
      rapper1Address,
      rapper2Address,
      durationMinutes,
      videoUrl,
      description,
    } = req.body;

    // Validate required fields
    if (!rapper1Name || !rapper2Name || !rapper1Address || !rapper2Address) {
      return res.status(400).json({
        error: "Missing required fields: rapper names and addresses required",
      });
    }

    // Create battle on Hedera smart contract
    const contractResult = await hederaService.createBattle({
      rapper1Name,
      rapper2Name,
      rapper1Address,
      rapper2Address,
      durationMinutes: durationMinutes || 10080, // Default 7 days
      videoUrl: videoUrl || "",
    });

    // Store in Firebase with contract battle ID
    const battle = await firebaseService.createBattle({
      battleId: contractResult.battleId, // On-chain battle ID
      rapper1Name,
      rapper2Name,
      rapper1Address,
      rapper2Address,
      videoUrl,
      description,
      durationMinutes,
      transactionId: contractResult.transactionId,
      endTime: contractResult.endTime,
      status: "active",
      createdAt: new Date().toISOString(),
    });

    res.status(201).json({
      ...battle,
      contractResult,
    });
  } catch (error) {
    next(error);
  }
});

// Vote on battle (calls smart contract)
router.post("/:id/vote", async (req, res, next) => {
  try {
    const { rapperChoice, voterAddress } = req.body;
    const firebaseId = req.params.id;

    // Validate input
    if (!rapperChoice || (rapperChoice !== 1 && rapperChoice !== 2)) {
      return res.status(400).json({
        error: "Invalid rapperChoice. Must be 1 or 2",
      });
    }

    if (!voterAddress) {
      return res.status(400).json({
        error: "voterAddress is required",
      });
    }

    // Get battle from Firebase
    const battle = await firebaseService.getBattle(firebaseId);

    if (!battle || battle.battleId === undefined) {
      return res.status(404).json({
        error: "Battle not found or not on-chain",
      });
    }

    // Check if user already voted on-chain
    const hasVoted = await hederaService.checkHasVoted(
      battle.battleId,
      voterAddress
    );
    if (hasVoted) {
      return res.status(400).json({
        error: "You have already voted on this battle",
      });
    }

    // Submit vote to smart contract
    const voteResult = await hederaService.vote({
      battleId: battle.battleId,
      rapperChoice,
      voterAddress,
    });

    // Update Firebase with vote record
    await firebaseService.addVote(firebaseId, {
      rapperChoice,
      voterAddress,
      transactionId: voteResult.transactionId,
      timestamp: new Date().toISOString(),
    });

    // Get updated battle data
    const updatedBattle = await hederaService.getBattleWithScores(
      battle.battleId
    );

    res.json({
      success: true,
      message: "Vote recorded on blockchain",
      transactionId: voteResult.transactionId,
      battle: updatedBattle,
    });
  } catch (error) {
    next(error);
  }
});

// End a battle (only owner/admin)
router.post("/:id/end", async (req, res, next) => {
  try {
    const firebaseId = req.params.id;

    // Get battle from Firebase
    const battle = await firebaseService.getBattle(firebaseId);

    if (!battle || battle.battleId === undefined) {
      return res.status(404).json({
        error: "Battle not found or not on-chain",
      });
    }

    // End battle on smart contract
    const endResult = await hederaService.endBattle(battle.battleId);

    // Update Firebase
    await firebaseService.updateBattle(firebaseId, {
      status: "ended",
      endedAt: new Date().toISOString(),
      endTransactionId: endResult.transactionId,
      winner: endResult.winner,
    });

    // Get final battle data
    const finalBattle = await hederaService.getBattleWithScores(
      battle.battleId
    );

    res.json({
      success: true,
      message: "Battle ended",
      transactionId: endResult.transactionId,
      winner: endResult.winner,
      battle: finalBattle,
    });
  } catch (error) {
    next(error);
  }
});

// Get battle results/scores
router.get("/:id/scores", async (req, res, next) => {
  try {
    const battle = await firebaseService.getBattle(req.params.id);

    if (!battle || battle.battleId === undefined) {
      return res.status(404).json({
        error: "Battle not found or not on-chain",
      });
    }

    const scores = await hederaService.getBattleWithScores(battle.battleId);

    res.json(scores);
  } catch (error) {
    next(error);
  }
});

// Check if user has voted
router.get("/:id/check-vote/:address", async (req, res, next) => {
  try {
    const { id, address } = req.params;
    const battle = await firebaseService.getBattle(id);

    if (!battle || battle.battleId === undefined) {
      return res.status(404).json({
        error: "Battle not found or not on-chain",
      });
    }

    const hasVoted = await hederaService.checkHasVoted(
      battle.battleId,
      address
    );

    res.json({ hasVoted });
  } catch (error) {
    next(error);
  }
});

// Judge management routes

// Add judge (admin only)
router.post("/judges/add", async (req, res, next) => {
  try {
    const { judgeAddress } = req.body;

    if (!judgeAddress) {
      return res.status(400).json({
        error: "judgeAddress is required",
      });
    }

    const result = await hederaService.addJudge(judgeAddress);

    res.json({
      success: true,
      message: "Judge added successfully",
      transactionId: result.transactionId,
      judgeAddress,
    });
  } catch (error) {
    next(error);
  }
});

// Remove judge (admin only)
router.post("/judges/remove", async (req, res, next) => {
  try {
    const { judgeAddress } = req.body;

    if (!judgeAddress) {
      return res.status(400).json({
        error: "judgeAddress is required",
      });
    }

    const result = await hederaService.removeJudge(judgeAddress);

    res.json({
      success: true,
      message: "Judge removed successfully",
      transactionId: result.transactionId,
      judgeAddress,
    });
  } catch (error) {
    next(error);
  }
});

// Get all judges
router.get("/judges", async (req, res, next) => {
  try {
    const judges = await hederaService.getAllJudges();
    res.json({ judges });
  } catch (error) {
    next(error);
  }
});

// Check if address is a judge
router.get("/judges/check/:address", async (req, res, next) => {
  try {
    const isJudge = await hederaService.checkIsJudge(req.params.address);
    res.json({ isJudge });
  } catch (error) {
    next(error);
  }
});

// Withdraw funds (admin only)
router.post("/:id/withdraw", async (req, res, next) => {
  try {
    const battle = await firebaseService.getBattle(req.params.id);

    if (!battle || battle.battleId === undefined) {
      return res.status(404).json({
        error: "Battle not found or not on-chain",
      });
    }

    const result = await hederaService.withdrawBattleFunds(battle.battleId);

    res.json({
      success: true,
      message: "Funds withdrawn successfully",
      transactionId: result.transactionId,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
