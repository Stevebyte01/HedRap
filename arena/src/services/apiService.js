const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

class ApiService {
  // ==================== Wallet/Balance Endpoints ====================

  async getBalances(address) {
    const response = await fetch(`${API_URL}/wallet/balance/${address}`);
    if (!response.ok) throw new Error("Failed to fetch balances");
    return response.json();
  }

  // ==================== Battle Endpoints ====================

  async getBattles() {
    const response = await fetch(`${API_URL}/battles`);
    if (!response.ok) throw new Error("Failed to fetch battles");
    return response.json();
  }

  async getActiveBattles() {
    const response = await fetch(`${API_URL}/battles/active`);
    if (!response.ok) throw new Error("Failed to fetch active battles");
    return response.json();
  }

  async getBattle(id) {
    const response = await fetch(`${API_URL}/battles/${id}`);
    if (!response.ok) throw new Error("Failed to fetch battle");
    return response.json();
  }

  async getBattleScores(id) {
    const response = await fetch(`${API_URL}/battles/${id}/scores`);
    if (!response.ok) throw new Error("Failed to fetch battle scores");
    return response.json();
  }

  async createBattle(battleData) {
    const response = await fetch(`${API_URL}/battles`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(battleData),
    });
    if (!response.ok) throw new Error("Failed to create battle");
    return response.json();
  }

  async voteBattle(battleId, rapperChoice, voterAddress) {
    const response = await fetch(`${API_URL}/battles/${battleId}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rapperChoice, voterAddress }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to vote");
    }
    return response.json();
  }

  async checkHasVoted(battleId, address) {
    const response = await fetch(
      `${API_URL}/battles/${battleId}/check-vote/${address}`
    );
    if (!response.ok) throw new Error("Failed to check vote status");
    const data = await response.json();
    return data.hasVoted;
  }

  async endBattle(battleId) {
    const response = await fetch(`${API_URL}/battles/${battleId}/end`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    if (!response.ok) throw new Error("Failed to end battle");
    return response.json();
  }

  // ==================== Rapper Endpoints ====================

  async getRappers() {
    const response = await fetch(`${API_URL}/rappers`);
    if (!response.ok) throw new Error("Failed to fetch rappers");
    return response.json();
  }

  async createRapper(rapperData) {
    const response = await fetch(`${API_URL}/rappers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(rapperData),
    });
    if (!response.ok) throw new Error("Failed to create rapper");
    return response.json();
  }

  // ==================== DAO Governance Endpoints ====================

  async getProposals() {
    const response = await fetch(`${API_URL}/dao/proposals`);
    if (!response.ok) throw new Error("Failed to fetch proposals");
    return response.json();
  }

  async getProposal(proposalId) {
    const response = await fetch(`${API_URL}/dao/proposals/${proposalId}`);
    if (!response.ok) throw new Error("Failed to fetch proposal");
    return response.json();
  }

  async createProposal(proposalData) {
    const response = await fetch(`${API_URL}/dao/proposals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(proposalData),
    });
    if (!response.ok) throw new Error("Failed to create proposal");
    return response.json();
  }

  async voteProposal(proposalId, support, reason, voterAddress) {
    const response = await fetch(
      `${API_URL}/dao/proposals/${proposalId}/vote`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ support, reason, voterAddress }),
      }
    );
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to vote on proposal");
    }
    return response.json();
  }

  async checkHasVotedOnProposal(proposalId, address) {
    const response = await fetch(
      `${API_URL}/dao/proposals/${proposalId}/has-voted/${address}`
    );
    if (!response.ok) throw new Error("Failed to check proposal vote status");
    const data = await response.json();
    return data.hasVoted;
  }

  async executeProposal(proposalId) {
    const response = await fetch(
      `${API_URL}/dao/proposals/${proposalId}/execute`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }
    );
    if (!response.ok) throw new Error("Failed to execute proposal");
    return response.json();
  }

  async getVotingPower(address) {
    const response = await fetch(`${API_URL}/dao/voting-power/${address}`);
    if (!response.ok) throw new Error("Failed to fetch voting power");
    const data = await response.json();
    return data.votingPower;
  }

  async getDAOConfig() {
    const response = await fetch(`${API_URL}/dao/config`);
    if (!response.ok) throw new Error("Failed to fetch DAO config");
    return response.json();
  }

  // ==================== Judge Endpoints ====================

  async getJudges() {
    try {
      const response = await fetch(`${API_URL}/battles/judges`);
      if (!response.ok) return [];
      const data = await response.json();
      return data.judges || [];
    } catch (error) {
      console.error("Failed to fetch judges:", error);
      return [];
    }
  }

  async checkIsJudge(address) {
    try {
      const response = await fetch(
        `${API_URL}/battles/judges/check/${address}`
      );
      if (!response.ok) return false;
      const data = await response.json();
      return data.isJudge || false;
    } catch (error) {
      console.error("Failed to check judge status:", error);
      return false;
    }
  }

  async proposeJudge(judgeData) {
    // This creates a DAO proposal to add a judge
    const { address, name, bio } = judgeData;

    // Encode the addJudge function call for the proposal
    const targets = [process.env.VITE_BATTLE_CONTRACT_ID];
    const values = [0];
    const calldatas = [
      // You'll need to properly encode this function call
      // This is a placeholder - use ethers.js or similar to encode
      `addJudge(${address})`,
    ];
    const description = `Add ${name} as certified judge. Bio: ${bio}`;

    return this.createProposal({
      targets,
      values,
      calldatas,
      description,
    });
  }

  async addJudge(judgeAddress) {
    const response = await fetch(`${API_URL}/battles/judges/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ judgeAddress }),
    });
    if (!response.ok) throw new Error("Failed to add judge");
    return response.json();
  }

  async removeJudge(judgeAddress) {
    const response = await fetch(`${API_URL}/battles/judges/remove`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ judgeAddress }),
    });
    if (!response.ok) throw new Error("Failed to remove judge");
    return response.json();
  }

  // ==================== Contract Settings ====================

  async getVotingFee() {
    const response = await fetch(`${API_URL}/battles/voting-fee`);
    if (!response.ok) return 0.1; // Default fallback
    const data = await response.json();
    return data.votingFee || 0.1;
  }

  async setVotingFee(newFee) {
    const response = await fetch(`${API_URL}/battles/voting-fee`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ votingFee: newFee }),
    });
    if (!response.ok) throw new Error("Failed to set voting fee");
    return response.json();
  }

  // ==================== Tickets (NFT) ====================

  async createTicketCollection(name, maxSupply) {
    const response = await fetch(`${API_URL}/tickets/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, maxSupply }),
    });
    if (!response.ok) throw new Error("Failed to create ticket collection");
    return response.json();
  }

  async mintTicket(tokenId, metadata) {
    const response = await fetch(`${API_URL}/tickets/mint`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tokenId, metadata }),
    });
    if (!response.ok) throw new Error("Failed to mint ticket");
    return response.json();
  }

  async getTickets() {
    const response = await fetch(`${API_URL}/tickets`);
    if (!response.ok) throw new Error("Failed to fetch tickets");
    return response.json();
  }

  async purchaseTicket(ticketData) {
    const response = await fetch(`${API_URL}/tickets/purchase`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ticketData),
    });
    if (!response.ok) throw new Error("Failed to purchase ticket");
    return response.json();
  }
}

export const apiService = new ApiService();
