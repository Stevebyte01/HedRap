import express from "express";
import { hederaService } from "../services/hederaService.js";
import { firebaseService } from "../services/firebaseService.js";

const router = express.Router();

// ==================== Proposal Management ====================

/**
 * Create a new governance proposal
 * POST /api/dao/proposals
 */
router.post("/proposals", async (req, res, next) => {
  try {
    const { targets, values, calldatas, description } = req.body;

    // Validate required fields
    if (!targets || !values || !calldatas || !description) {
      return res.status(400).json({
        error:
          "Missing required fields: targets, values, calldatas, description",
      });
    }

    if (
      targets.length !== values.length ||
      targets.length !== calldatas.length
    ) {
      return res.status(400).json({
        error:
          "targets, values, and calldatas arrays must have the same length",
      });
    }

    // Create proposal on-chain
    const result = await hederaService.createProposal({
      targets,
      values,
      calldatas,
      description,
    });

    // Store proposal in Firebase
    const proposal = await firebaseService.createProposal({
      proposalId: result.proposalId,
      targets,
      values,
      calldatas,
      description,
      transactionId: result.transactionId,
      status: "pending",
      createdAt: new Date().toISOString(),
    });

    res.status(201).json({
      success: true,
      proposal,
      contractResult: result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get all proposals
 * GET /api/dao/proposals
 */
router.get("/proposals", async (req, res, next) => {
  try {
    const proposals = await firebaseService.getProposals();

    // Enrich with on-chain data
    const enrichedProposals = await Promise.all(
      proposals.map(async (proposal) => {
        try {
          const [state, votes, deadline] = await Promise.all([
            hederaService.getProposalState(proposal.proposalId),
            hederaService.getProposalVotes(proposal.proposalId),
            hederaService.getProposalDeadline(proposal.proposalId),
          ]);

          return {
            ...proposal,
            state: state.state,
            votes,
            deadline: deadline.deadlineDate,
          };
        } catch (error) {
          console.error(
            `Failed to enrich proposal ${proposal.proposalId}:`,
            error
          );
          return proposal;
        }
      })
    );

    res.json(enrichedProposals);
  } catch (error) {
    next(error);
  }
});

/**
 * Get single proposal
 * GET /api/dao/proposals/:id
 */
router.get("/proposals/:id", async (req, res, next) => {
  try {
    const proposalId = req.params.id;

    // Get from Firebase
    const proposal = await firebaseService.getProposal(proposalId);

    if (!proposal) {
      return res.status(404).json({ error: "Proposal not found" });
    }

    // Get on-chain data
    const [state, votes, deadline, snapshot] = await Promise.all([
      hederaService.getProposalState(proposalId),
      hederaService.getProposalVotes(proposalId),
      hederaService.getProposalDeadline(proposalId),
      hederaService.getProposalSnapshot(proposalId),
    ]);

    res.json({
      ...proposal,
      state: state.state,
      votes,
      deadline: deadline.deadlineDate,
      snapshot,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get proposal state
 * GET /api/dao/proposals/:id/state
 */
router.get("/proposals/:id/state", async (req, res, next) => {
  try {
    const state = await hederaService.getProposalState(req.params.id);
    res.json(state);
  } catch (error) {
    next(error);
  }
});

/**
 * Get proposal votes
 * GET /api/dao/proposals/:id/votes
 */
router.get("/proposals/:id/votes", async (req, res, next) => {
  try {
    const votes = await hederaService.getProposalVotes(req.params.id);

    // Calculate percentages
    const total =
      BigInt(votes.forVotes) +
      BigInt(votes.againstVotes) +
      BigInt(votes.abstainVotes);

    res.json({
      ...votes,
      total: total.toString(),
      forPercentage:
        total > 0
          ? ((BigInt(votes.forVotes) * BigInt(100)) / total).toString()
          : "0",
      againstPercentage:
        total > 0
          ? ((BigInt(votes.againstVotes) * BigInt(100)) / total).toString()
          : "0",
      abstainPercentage:
        total > 0
          ? ((BigInt(votes.abstainVotes) * BigInt(100)) / total).toString()
          : "0",
    });
  } catch (error) {
    next(error);
  }
});

// ==================== Voting ====================

/**
 * Cast a vote on a proposal
 * POST /api/dao/proposals/:id/vote
 */
router.post("/proposals/:id/vote", async (req, res, next) => {
  try {
    const { support, reason, voterAddress } = req.body;
    const proposalId = req.params.id;

    // Validate support value
    if (support !== 0 && support !== 1 && support !== 2) {
      return res.status(400).json({
        error:
          "Invalid support value. Must be 0 (Against), 1 (For), or 2 (Abstain)",
      });
    }

    // Check if already voted
    const hasVoted = await hederaService.hasVotedOnProposal(
      proposalId,
      voterAddress
    );
    if (hasVoted) {
      return res.status(400).json({
        error: "You have already voted on this proposal",
      });
    }

    // Check proposal state
    const state = await hederaService.getProposalState(proposalId);
    if (state.state !== "Active") {
      return res.status(400).json({
        error: `Proposal is not active. Current state: ${state.state}`,
      });
    }

    // Cast vote on-chain
    const result = await hederaService.castVote(proposalId, support, reason);

    // Record vote in Firebase
    await firebaseService.recordVote({
      proposalId,
      voterAddress,
      support,
      reason,
      transactionId: result.transactionId,
      timestamp: new Date().toISOString(),
    });

    // Get updated votes
    const votes = await hederaService.getProposalVotes(proposalId);

    res.json({
      success: true,
      message: "Vote cast successfully",
      transactionId: result.transactionId,
      votes,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Check if address has voted
 * GET /api/dao/proposals/:id/has-voted/:address
 */
router.get("/proposals/:id/has-voted/:address", async (req, res, next) => {
  try {
    const { id, address } = req.params;
    const hasVoted = await hederaService.hasVotedOnProposal(id, address);

    res.json({ hasVoted });
  } catch (error) {
    next(error);
  }
});

// ==================== Proposal Execution ====================

/**
 * Execute a successful proposal
 * POST /api/dao/proposals/:id/execute
 */
router.post("/proposals/:id/execute", async (req, res, next) => {
  try {
    const proposalId = req.params.id;

    // Get proposal from Firebase
    const proposal = await firebaseService.getProposal(proposalId);

    if (!proposal) {
      return res.status(404).json({ error: "Proposal not found" });
    }

    // Check proposal state
    const state = await hederaService.getProposalState(proposalId);
    if (state.state !== "Succeeded") {
      return res.status(400).json({
        error: `Proposal cannot be executed. Current state: ${state.state}`,
      });
    }

    // Hash the description
    const descriptionHash = hederaService.hashProposalDescription(
      proposal.description
    );

    // Execute proposal
    const result = await hederaService.executeProposal({
      targets: proposal.targets,
      values: proposal.values,
      calldatas: proposal.calldatas,
      descriptionHash,
    });

    // Update Firebase
    await firebaseService.updateProposal(proposalId, {
      status: "executed",
      executedAt: new Date().toISOString(),
      executeTransactionId: result.transactionId,
    });

    res.json({
      success: true,
      message: "Proposal executed successfully",
      transactionId: result.transactionId,
    });
  } catch (error) {
    next(error);
  }
});

// ==================== Voting Power ====================

/**
 * Get voting power for an address
 * GET /api/dao/voting-power/:address
 */
router.get("/voting-power/:address", async (req, res, next) => {
  try {
    const { address } = req.params;
    const { blockNumber } = req.query;

    let votingPower;
    if (blockNumber) {
      votingPower = await hederaService.getVotingPower(
        address,
        parseInt(blockNumber)
      );
    } else {
      votingPower = await hederaService.getCurrentVotingPower(address);
    }

    res.json({
      address,
      votingPower,
      blockNumber: blockNumber || "current",
    });
  } catch (error) {
    next(error);
  }
});

// ==================== DAO Settings ====================

/**
 * Get DAO configuration
 * GET /api/dao/config
 */
router.get("/config", async (req, res, next) => {
  try {
    const [proposalThreshold, votingDelay, votingPeriod] = await Promise.all([
      hederaService.getProposalThreshold(),
      hederaService.getVotingDelay(),
      hederaService.getVotingPeriod(),
    ]);

    // Convert blocks to approximate time (assuming 2 second blocks)
    const votingDelayHours = (votingDelay * 2) / 3600;
    const votingPeriodDays = (votingPeriod * 2) / 86400;

    res.json({
      proposalThreshold,
      votingDelay,
      votingDelayHours: votingDelayHours.toFixed(1),
      votingPeriod,
      votingPeriodDays: votingPeriodDays.toFixed(1),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get quorum at specific block
 * GET /api/dao/quorum/:blockNumber
 */
router.get("/quorum/:blockNumber", async (req, res, next) => {
  try {
    const quorum = await hederaService.getQuorum(
      parseInt(req.params.blockNumber)
    );

    res.json({
      quorum,
      blockNumber: req.params.blockNumber,
    });
  } catch (error) {
    next(error);
  }
});

// ==================== Helper Endpoints ====================

/**
 * Calculate proposal ID
 * POST /api/dao/calculate-proposal-id
 */
router.post("/calculate-proposal-id", async (req, res, next) => {
  try {
    const { targets, values, calldatas, description } = req.body;

    const descriptionHash = hederaService.hashProposalDescription(description);
    const proposalId = await hederaService.calculateProposalId({
      targets,
      values,
      calldatas,
      descriptionHash,
    });

    res.json({
      proposalId,
      descriptionHash,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Health check
 * GET /api/dao/health
 */
router.get("/health", async (req, res) => {
  res.json({
    status: "healthy",
    daoContract: process.env.DAO_CONTRACT_ID || "not configured",
  });
});

export default router;
