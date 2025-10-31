import {
  TopicCreateTransaction,
  TopicMessageSubmitTransaction,
  TokenCreateTransaction,
  TokenMintTransaction,
  TransferTransaction,
  ContractExecuteTransaction,
  ContractFunctionParameters,
  ContractCallQuery,
  Hbar,
  AccountId,
} from "@hashgraph/sdk";
import { getHederaClient } from "../config/hedera.js";

// Smart contract ID - set this in your environment variables
const BATTLE_CONTRACT_ID = process.env.BATTLE_VOTING_ID || "0.0.XXXXXX";

export const hederaService = {
  // ==================== Smart Contract Functions ====================

  /**
   * Create a new battle on the smart contract
   */
  async createBattle({
    rapper1Name,
    rapper2Name,
    rapper1Address,
    rapper2Address,
    durationMinutes,
    videoUrl,
  }) {
    const client = getHederaClient();

    const transaction = new ContractExecuteTransaction()
      .setContractId(BATTLE_CONTRACT_ID)
      .setGas(1000000)
      .setFunction(
        "createBattle",
        new ContractFunctionParameters()
          .addString(rapper1Name)
          .addString(rapper2Name)
          .addAddress(rapper1Address)
          .addAddress(rapper2Address)
          .addUint256(durationMinutes)
          .addString(videoUrl)
      );

    const txResponse = await transaction.execute(client);
    const receipt = await txResponse.getReceipt(client);

    // Get the battle ID from contract (it's returned from the function)
    const record = await txResponse.getRecord(client);
    const battleId = record.contractFunctionResult.getUint256(0);

    return {
      battleId: Number(battleId),
      transactionId: txResponse.transactionId.toString(),
      status: receipt.status.toString(),
      endTime: Date.now() + durationMinutes * 60 * 1000,
    };
  },

  /**
   * Submit a vote on a battle
   */
  async vote({ battleId, rapperChoice, voterAddress }) {
    const client = getHederaClient();

    // Get voting fee from contract
    const votingFee = await this.getVotingFee();

    const transaction = new ContractExecuteTransaction()
      .setContractId(BATTLE_CONTRACT_ID)
      .setGas(500000)
      .setPayableAmount(new Hbar(votingFee))
      .setFunction(
        "vote",
        new ContractFunctionParameters()
          .addUint256(battleId)
          .addUint8(rapperChoice)
      );

    const txResponse = await transaction.execute(client);
    const receipt = await txResponse.getReceipt(client);

    return {
      transactionId: txResponse.transactionId.toString(),
      status: receipt.status.toString(),
    };
  },

  /**
   * End a battle and determine winner
   */
  async endBattle(battleId) {
    const client = getHederaClient();

    const transaction = new ContractExecuteTransaction()
      .setContractId(BATTLE_CONTRACT_ID)
      .setGas(500000)
      .setFunction(
        "endBattle",
        new ContractFunctionParameters().addUint256(battleId)
      );

    const txResponse = await transaction.execute(client);
    const receipt = await txResponse.getReceipt(client);

    // Get winner from the BattleEnded event or query the contract
    const battleData = await this.getBattleFromContract(battleId);

    return {
      transactionId: txResponse.transactionId.toString(),
      status: receipt.status.toString(),
      winner: battleData.winner,
    };
  },

  /**
   * Get battle details from smart contract
   */
  async getBattleFromContract(battleId) {
    const client = getHederaClient();

    const query = new ContractCallQuery()
      .setContractId(BATTLE_CONTRACT_ID)
      .setGas(100000)
      .setFunction(
        "getBattle",
        new ContractFunctionParameters().addUint256(battleId)
      );

    const result = await query.execute(client);

    // Parse the Battle struct and BattleInfo struct
    return {
      rapper1Address: result.getAddress(0),
      rapper2Address: result.getAddress(1),
      winner: result.getAddress(2),
      rapper1FanVotes: Number(result.getUint256(3)),
      rapper2FanVotes: Number(result.getUint256(4)),
      rapper1JudgeVotes: Number(result.getUint256(5)),
      rapper2JudgeVotes: Number(result.getUint256(6)),
      endTime: Number(result.getUint256(7)),
      status: Number(result.getUint8(8)), // 0=Active, 1=Ended, 2=Cancelled
      rapper1Name: result.getString(9),
      rapper2Name: result.getString(10),
      videoUrl: result.getString(11),
      startTime: Number(result.getUint256(12)),
    };
  },

  /**
   * Get battle with weighted scores
   */
  async getBattleWithScores(battleId) {
    const client = getHederaClient();

    const query = new ContractCallQuery()
      .setContractId(BATTLE_CONTRACT_ID)
      .setGas(150000)
      .setFunction(
        "getBattleWithScores",
        new ContractFunctionParameters().addUint256(battleId)
      );

    const result = await query.execute(client);

    // Parse Battle struct, BattleInfo struct, and scores
    const battle = {
      rapper1Address: result.getAddress(0),
      rapper2Address: result.getAddress(1),
      winner: result.getAddress(2),
      rapper1FanVotes: Number(result.getUint256(3)),
      rapper2FanVotes: Number(result.getUint256(4)),
      rapper1JudgeVotes: Number(result.getUint256(5)),
      rapper2JudgeVotes: Number(result.getUint256(6)),
      endTime: Number(result.getUint256(7)),
      status: Number(result.getUint8(8)),
    };

    const info = {
      rapper1Name: result.getString(9),
      rapper2Name: result.getString(10),
      videoUrl: result.getString(11),
      startTime: Number(result.getUint256(12)),
    };

    const rapper1Score = Number(result.getUint256(13));
    const rapper2Score = Number(result.getUint256(14));

    return {
      ...battle,
      ...info,
      rapper1Score,
      rapper2Score,
      rapper1Percentage: ((rapper1Score / 10000) * 100).toFixed(2),
      rapper2Percentage: ((rapper2Score / 10000) * 100).toFixed(2),
    };
  },

  /**
   * Check if user has voted
   */
  async checkHasVoted(battleId, voterAddress) {
    const client = getHederaClient();

    const query = new ContractCallQuery()
      .setContractId(BATTLE_CONTRACT_ID)
      .setGas(50000)
      .setFunction(
        "checkVoted",
        new ContractFunctionParameters()
          .addUint256(battleId)
          .addAddress(voterAddress)
      );

    const result = await query.execute(client);
    return result.getBool(0);
  },

  /**
   * Get all active battles
   */
  async getActiveBattles() {
    const client = getHederaClient();

    const query = new ContractCallQuery()
      .setContractId(BATTLE_CONTRACT_ID)
      .setGas(150000)
      .setFunction("getActiveBattles");

    const result = await query.execute(client);

    // Parse array of uint256 battle IDs
    const battleIds = [];
    const count = result.getUint256(0);
    for (let i = 0; i < count; i++) {
      battleIds.push(Number(result.getUint256(i + 1)));
    }

    return battleIds;
  },

  /**
   * Add a certified judge
   */
  async addJudge(judgeAddress) {
    const client = getHederaClient();

    const transaction = new ContractExecuteTransaction()
      .setContractId(BATTLE_CONTRACT_ID)
      .setGas(200000)
      .setFunction(
        "addJudge",
        new ContractFunctionParameters().addAddress(judgeAddress)
      );

    const txResponse = await transaction.execute(client);
    const receipt = await txResponse.getReceipt(client);

    return {
      transactionId: txResponse.transactionId.toString(),
      status: receipt.status.toString(),
    };
  },

  /**
   * Remove a judge
   */
  async removeJudge(judgeAddress) {
    const client = getHederaClient();

    const transaction = new ContractExecuteTransaction()
      .setContractId(BATTLE_CONTRACT_ID)
      .setGas(200000)
      .setFunction(
        "removeJudge",
        new ContractFunctionParameters().addAddress(judgeAddress)
      );

    const txResponse = await transaction.execute(client);
    const receipt = await txResponse.getReceipt(client);

    return {
      transactionId: txResponse.transactionId.toString(),
      status: receipt.status.toString(),
    };
  },

  /**
   * Get all certified judges
   */
  async getAllJudges() {
    const client = getHederaClient();

    const query = new ContractCallQuery()
      .setContractId(BATTLE_CONTRACT_ID)
      .setGas(100000)
      .setFunction("getAllJudges");

    const result = await query.execute(client);

    // Parse array of addresses
    const judges = [];
    const count = result.getUint256(0);
    for (let i = 0; i < count; i++) {
      judges.push(result.getAddress(i + 1));
    }

    return judges;
  },

  /**
   * Check if address is a judge
   */
  async checkIsJudge(address) {
    const client = getHederaClient();

    const query = new ContractCallQuery()
      .setContractId(BATTLE_CONTRACT_ID)
      .setGas(50000)
      .setFunction(
        "checkIsJudge",
        new ContractFunctionParameters().addAddress(address)
      );

    const result = await query.execute(client);
    return result.getBool(0);
  },

  /**
   * Get voting fee
   */
  async getVotingFee() {
    const client = getHederaClient();

    const query = new ContractCallQuery()
      .setContractId(BATTLE_CONTRACT_ID)
      .setGas(50000)
      .setFunction("votingFee");

    const result = await query.execute(client);
    const feeInTinybars = Number(result.getUint256(0));

    // Convert tinybars to HBAR
    return feeInTinybars / 100000000;
  },

  /**
   * Set voting fee (owner only)
   */
  async setVotingFee(newFeeInHbar) {
    const client = getHederaClient();

    const feeInTinybars = Math.floor(newFeeInHbar * 100000000);

    const transaction = new ContractExecuteTransaction()
      .setContractId(BATTLE_CONTRACT_ID)
      .setGas(100000)
      .setFunction(
        "setVotingFee",
        new ContractFunctionParameters().addUint256(feeInTinybars)
      );

    const txResponse = await transaction.execute(client);
    const receipt = await txResponse.getReceipt(client);

    return {
      transactionId: txResponse.transactionId.toString(),
      status: receipt.status.toString(),
    };
  },

  /**
   * Withdraw battle funds (70% rappers, 30% owner)
   */
  async withdrawBattleFunds(battleId) {
    const client = getHederaClient();

    const transaction = new ContractExecuteTransaction()
      .setContractId(BATTLE_CONTRACT_ID)
      .setGas(300000)
      .setFunction(
        "withdraw",
        new ContractFunctionParameters().addUint256(battleId)
      );

    const txResponse = await transaction.execute(client);
    const receipt = await txResponse.getReceipt(client);

    return {
      transactionId: txResponse.transactionId.toString(),
      status: receipt.status.toString(),
    };
  },

  /**
   * Get battle count
   */
  async getBattleCount() {
    const client = getHederaClient();

    const query = new ContractCallQuery()
      .setContractId(BATTLE_CONTRACT_ID)
      .setGas(50000)
      .setFunction("battleCount");

    const result = await query.execute(client);
    return Number(result.getUint256(0));
  },

  // ==================== NFT/Token Functions ====================

  /**
   * Create NFT ticket
   */
  async createTicketNFT(ticketData) {
    const client = getHederaClient();

    const transaction = new TokenCreateTransaction()
      .setTokenName(ticketData.name)
      .setTokenSymbol("HEDRAP")
      .setTokenType("NON_FUNGIBLE_UNIQUE")
      .setDecimals(0)
      .setInitialSupply(0)
      .setTreasuryAccountId(client.operatorAccountId)
      .setSupplyKey(client.operatorPublicKey)
      .setMaxSupply(ticketData.maxSupply);

    const txResponse = await transaction.execute(client);
    const receipt = await txResponse.getReceipt(client);

    return {
      tokenId: receipt.tokenId.toString(),
      transactionId: txResponse.transactionId.toString(),
    };
  },

  /**
   * Mint ticket NFT
   */
  async mintTicket(tokenId, metadata) {
    const client = getHederaClient();

    const transaction = new TokenMintTransaction()
      .setTokenId(tokenId)
      .setMetadata([Buffer.from(JSON.stringify(metadata))]);

    const txResponse = await transaction.execute(client);
    const receipt = await txResponse.getReceipt(client);

    return {
      serialNumbers: receipt.serials.map((s) => s.toString()),
      transactionId: txResponse.transactionId.toString(),
    };
  },

  /**
   * Transfer HBAR payment
   */
  async processPayment(fromAccount, toAccount, amount) {
    const client = getHederaClient();

    const transaction = new TransferTransaction()
      .addHbarTransfer(fromAccount, new Hbar(-amount))
      .addHbarTransfer(toAccount, new Hbar(amount));

    const txResponse = await transaction.execute(client);
    const receipt = await txResponse.getReceipt(client);

    return {
      status: receipt.status.toString(),
      transactionId: txResponse.transactionId.toString(),
    };
  },

  // ==================== DAO Governance Functions ====================

  /**
   * Create a governance proposal
   * @param {Object} proposalData - Proposal details
   * @param {string[]} proposalData.targets - Contract addresses to call
   * @param {number[]} proposalData.values - ETH values to send (in wei)
   * @param {string[]} proposalData.calldatas - Encoded function calls
   * @param {string} proposalData.description - Proposal description
   */
  async createProposal({ targets, values, calldatas, description }) {
    const client = getHederaClient();
    const DAO_CONTRACT_ID = process.env.DAO_CONTRACT_ID;

    // Encode the propose function call
    const functionParams = new ContractFunctionParameters()
      .addAddressArray(targets)
      .addUint256Array(values)
      .addBytesArray(calldatas.map((data) => Buffer.from(data, "hex")))
      .addString(description);

    const transaction = new ContractExecuteTransaction()
      .setContractId(DAO_CONTRACT_ID)
      .setGas(1000000)
      .setFunction("propose", functionParams);

    const txResponse = await transaction.execute(client);
    const receipt = await txResponse.getReceipt(client);

    // Get proposal ID from return value
    const record = await txResponse.getRecord(client);
    const proposalId = record.contractFunctionResult.getUint256(0);

    return {
      proposalId: proposalId.toString(),
      transactionId: txResponse.transactionId.toString(),
      status: receipt.status.toString(),
    };
  },

  /**
   * Cast a vote on a proposal
   * @param {string} proposalId - The proposal ID
   * @param {number} support - Vote type: 0=Against, 1=For, 2=Abstain
   * @param {string} reason - Optional reason for the vote
   */
  async castVote(proposalId, support, reason = "") {
    const client = getHederaClient();
    const DAO_CONTRACT_ID = process.env.DAO_CONTRACT_ID;

    const functionName = reason ? "castVoteWithReason" : "castVote";
    let functionParams = new ContractFunctionParameters()
      .addUint256(proposalId)
      .addUint8(support);

    if (reason) {
      functionParams = functionParams.addString(reason);
    }

    const transaction = new ContractExecuteTransaction()
      .setContractId(DAO_CONTRACT_ID)
      .setGas(500000)
      .setFunction(functionName, functionParams);

    const txResponse = await transaction.execute(client);
    const receipt = await txResponse.getReceipt(client);

    return {
      transactionId: txResponse.transactionId.toString(),
      status: receipt.status.toString(),
    };
  },

  /**
   * Cast vote with signature (for gasless voting)
   * @param {string} proposalId - The proposal ID
   * @param {number} support - Vote type
   * @param {string} v - Signature v
   * @param {string} r - Signature r
   * @param {string} s - Signature s
   */
  async castVoteBySig(proposalId, support, v, r, s) {
    const client = getHederaClient();
    const DAO_CONTRACT_ID = process.env.DAO_CONTRACT_ID;

    const functionParams = new ContractFunctionParameters()
      .addUint256(proposalId)
      .addUint8(support)
      .addUint8(v)
      .addBytes32(Buffer.from(r, "hex"))
      .addBytes32(Buffer.from(s, "hex"));

    const transaction = new ContractExecuteTransaction()
      .setContractId(DAO_CONTRACT_ID)
      .setGas(500000)
      .setFunction("castVoteBySig", functionParams);

    const txResponse = await transaction.execute(client);
    const receipt = await txResponse.getReceipt(client);

    return {
      transactionId: txResponse.transactionId.toString(),
      status: receipt.status.toString(),
    };
  },

  /**
   * Execute a successful proposal
   * @param {Object} proposalData - Same data used to create the proposal
   */
  async executeProposal({ targets, values, calldatas, descriptionHash }) {
    const client = getHederaClient();
    const DAO_CONTRACT_ID = process.env.DAO_CONTRACT_ID;

    const functionParams = new ContractFunctionParameters()
      .addAddressArray(targets)
      .addUint256Array(values)
      .addBytesArray(calldatas.map((data) => Buffer.from(data, "hex")))
      .addBytes32(Buffer.from(descriptionHash, "hex"));

    const transaction = new ContractExecuteTransaction()
      .setContractId(DAO_CONTRACT_ID)
      .setGas(1500000)
      .setFunction("execute", functionParams);

    const txResponse = await transaction.execute(client);
    const receipt = await txResponse.getReceipt(client);

    return {
      transactionId: txResponse.transactionId.toString(),
      status: receipt.status.toString(),
    };
  },

  /**
   * Get proposal state
   * @param {string} proposalId - The proposal ID
   * @returns {Object} State info
   */
  async getProposalState(proposalId) {
    const client = getHederaClient();
    const DAO_CONTRACT_ID = process.env.DAO_CONTRACT_ID;

    const query = new ContractCallQuery()
      .setContractId(DAO_CONTRACT_ID)
      .setGas(100000)
      .setFunction(
        "state",
        new ContractFunctionParameters().addUint256(proposalId)
      );

    const result = await query.execute(client);
    const stateValue = result.getUint8(0);

    // Map state values to names
    const states = [
      "Pending",
      "Active",
      "Canceled",
      "Defeated",
      "Succeeded",
      "Queued",
      "Expired",
      "Executed",
    ];

    return {
      state: states[stateValue] || "Unknown",
      stateValue,
    };
  },

  /**
   * Get proposal votes
   * @param {string} proposalId - The proposal ID
   */
  async getProposalVotes(proposalId) {
    const client = getHederaClient();
    const DAO_CONTRACT_ID = process.env.DAO_CONTRACT_ID;

    const query = new ContractCallQuery()
      .setContractId(DAO_CONTRACT_ID)
      .setGas(100000)
      .setFunction(
        "proposalVotes",
        new ContractFunctionParameters().addUint256(proposalId)
      );

    const result = await query.execute(client);

    return {
      againstVotes: result.getUint256(0).toString(),
      forVotes: result.getUint256(1).toString(),
      abstainVotes: result.getUint256(2).toString(),
    };
  },

  /**
   * Check if account has voted on a proposal
   * @param {string} proposalId - The proposal ID
   * @param {string} account - Voter account address
   */
  async hasVotedOnProposal(proposalId, account) {
    const client = getHederaClient();
    const DAO_CONTRACT_ID = process.env.DAO_CONTRACT_ID;

    const query = new ContractCallQuery()
      .setContractId(DAO_CONTRACT_ID)
      .setGas(100000)
      .setFunction(
        "hasVoted",
        new ContractFunctionParameters()
          .addUint256(proposalId)
          .addAddress(account)
      );

    const result = await query.execute(client);
    return result.getBool(0);
  },

  /**
   * Get proposal deadline
   * @param {string} proposalId - The proposal ID
   */
  async getProposalDeadline(proposalId) {
    const client = getHederaClient();
    const DAO_CONTRACT_ID = process.env.DAO_CONTRACT_ID;

    const query = new ContractCallQuery()
      .setContractId(DAO_CONTRACT_ID)
      .setGas(100000)
      .setFunction(
        "proposalDeadline",
        new ContractFunctionParameters().addUint256(proposalId)
      );

    const result = await query.execute(client);
    const deadline = Number(result.getUint256(0));

    return {
      deadline,
      deadlineDate: new Date(deadline * 1000).toISOString(),
    };
  },

  /**
   * Get proposal snapshot (when voting starts)
   * @param {string} proposalId - The proposal ID
   */
  async getProposalSnapshot(proposalId) {
    const client = getHederaClient();
    const DAO_CONTRACT_ID = process.env.DAO_CONTRACT_ID;

    const query = new ContractCallQuery()
      .setContractId(DAO_CONTRACT_ID)
      .setGas(100000)
      .setFunction(
        "proposalSnapshot",
        new ContractFunctionParameters().addUint256(proposalId)
      );

    const result = await query.execute(client);
    return Number(result.getUint256(0));
  },

  /**
   * Get voting power of an account at a specific block
   * @param {string} account - Account address
   * @param {number} blockNumber - Block number
   */
  async getVotingPower(account, blockNumber) {
    const client = getHederaClient();
    const DAO_CONTRACT_ID = process.env.DAO_CONTRACT_ID;

    const query = new ContractCallQuery()
      .setContractId(DAO_CONTRACT_ID)
      .setGas(100000)
      .setFunction(
        "getVotes",
        new ContractFunctionParameters()
          .addAddress(account)
          .addUint256(blockNumber)
      );

    const result = await query.execute(client);
    return result.getUint256(0).toString();
  },

  /**
   * Get current voting power of an account
   * @param {string} account - Account address
   */
  async getCurrentVotingPower(account) {
    const client = getHederaClient();
    const DAO_CONTRACT_ID = process.env.DAO_CONTRACT_ID;

    const query = new ContractCallQuery()
      .setContractId(DAO_CONTRACT_ID)
      .setGas(100000)
      .setFunction(
        "getVotes",
        new ContractFunctionParameters().addAddress(account)
      );

    const result = await query.execute(client);
    return result.getUint256(0).toString();
  },

  /**
   * Get proposal threshold (minimum votes needed to create proposal)
   */
  async getProposalThreshold() {
    const client = getHederaClient();
    const DAO_CONTRACT_ID = process.env.DAO_CONTRACT_ID;

    const query = new ContractCallQuery()
      .setContractId(DAO_CONTRACT_ID)
      .setGas(100000)
      .setFunction("proposalThreshold");

    const result = await query.execute(client);
    return result.getUint256(0).toString();
  },

  /**
   * Get quorum (minimum votes needed for proposal to pass)
   * @param {number} blockNumber - Block number
   */
  async getQuorum(blockNumber) {
    const client = getHederaClient();
    const DAO_CONTRACT_ID = process.env.DAO_CONTRACT_ID;

    const query = new ContractCallQuery()
      .setContractId(DAO_CONTRACT_ID)
      .setGas(100000)
      .setFunction(
        "quorum",
        new ContractFunctionParameters().addUint256(blockNumber)
      );

    const result = await query.execute(client);
    return result.getUint256(0).toString();
  },

  /**
   * Get voting delay (time between proposal creation and voting start)
   */
  async getVotingDelay() {
    const client = getHederaClient();
    const DAO_CONTRACT_ID = process.env.DAO_CONTRACT_ID;

    const query = new ContractCallQuery()
      .setContractId(DAO_CONTRACT_ID)
      .setGas(100000)
      .setFunction("votingDelay");

    const result = await query.execute(client);
    return Number(result.getUint256(0));
  },

  /**
   * Get voting period (how long voting lasts)
   */
  async getVotingPeriod() {
    const client = getHederaClient();
    const DAO_CONTRACT_ID = process.env.JUDGE_DAO_ID;

    const query = new ContractCallQuery()
      .setContractId(DAO_CONTRACT_ID)
      .setGas(100000)
      .setFunction("votingPeriod");

    const result = await query.execute(client);
    return Number(result.getUint256(0));
  },

  /**
   * Helper: Hash proposal description
   */
  hashProposalDescription(description) {
    const crypto = require("crypto");
    return "0x" + crypto.createHash("sha256").update(description).digest("hex");
  },

  /**
   * Helper: Calculate proposal ID
   */
  async calculateProposalId({ targets, values, calldatas, descriptionHash }) {
    const client = getHederaClient();
    const DAO_CONTRACT_ID = process.env.DAO_CONTRACT_ID;

    const query = new ContractCallQuery()
      .setContractId(DAO_CONTRACT_ID)
      .setGas(150000)
      .setFunction(
        "hashProposal",
        new ContractFunctionParameters()
          .addAddressArray(targets)
          .addUint256Array(values)
          .addBytesArray(calldatas.map((data) => Buffer.from(data, "hex")))
          .addBytes32(Buffer.from(descriptionHash.replace("0x", ""), "hex"))
      );

    const result = await query.execute(client);
    return result.getUint256(0).toString();
  },
};
