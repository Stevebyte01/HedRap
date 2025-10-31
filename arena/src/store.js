import { create } from "zustand";
import { walletService } from "./services/walletService";
import { apiService } from "./services/apiService";

export const useStore = create((set, get) => ({
  // Wallet state
  wallet: null,
  isConnected: false,
  address: null,
  accountId: null,
  isJudge: false, // Track if connected user is a certified judge
  hbarBalance: 0,
  hedrapBalance: 0,

  // App state
  isLoading: false,
  error: null,

  // Data state
  battles: [],
  activeBattles: [],
  rappers: [],
  proposals: [],
  judges: [],
  votingFee: 0.1, // Default, will be fetched from contract

  // Actions
  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  clearError: () => set({ error: null }),

  // ==================== Wallet Actions ====================

  connectWallet: async () => {
    try {
      set({ isLoading: true, error: null });
      const wallet = await walletService.connectWallet();

      // Check if user is a certified judge
      const isJudge = await apiService.checkIsJudge(wallet.address);

      set({
        wallet,
        isConnected: true,
        address: wallet.address,
        accountId: wallet.address,
        isJudge,
        isLoading: false,
      });

      // Fetch balances
      await get().fetchBalances();

      return wallet;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  disconnectWallet: () => {
    walletService.disconnectWallet();
    set({
      wallet: null,
      isConnected: false,
      address: null,
      accountId: null,
      isJudge: false,
      hbarBalance: 0,
      hedrapBalance: 0,
    });
  },

  restoreWalletSession: async () => {
    try {
      const wallet = await walletService.restoreSession();
      if (wallet) {
        const isJudge = await apiService.checkIsJudge(wallet.address);
        set({
          wallet,
          isConnected: true,
          address: wallet.address,
          accountId: wallet.address,
          isJudge,
        });

        // Fetch balances
        await get().fetchBalances();
      }
    } catch (error) {
      console.error("Failed to restore wallet session:", error);
    }
  },

  /**
   * Fetch HBAR and HedRap token balances
   */
  fetchBalances: async () => {
    try {
      const { address } = get();
      if (!address) return;

      // Get HBAR balance from wallet service (MetaMask)
      const hbar = await walletService.getBalance();

      // Get HedRap token balance if token address is configured
      const hedrapTokenAddress = import.meta.env.VITE_HEDRAP_TOKEN_ADDRESS;
      let hedrap = 0;

      if (hedrapTokenAddress) {
        hedrap = await walletService.getTokenBalance(hedrapTokenAddress);
      }

      set({
        hbarBalance: parseFloat(hbar) || 0,
        hedrapBalance: parseFloat(hedrap) || 0,
      });
    } catch (error) {
      console.error("Failed to fetch balances:", error);
    }
  },

  // ==================== Battle Actions ====================

  /**
   * Fetch all battles (from Firebase cache + Hedera enrichment)
   */
  fetchBattles: async () => {
    try {
      set({ isLoading: true, error: null });
      const battles = await apiService.getBattles();
      set({ battles, isLoading: false });
      return battles;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  /**
   * Fetch active battles (directly from Hedera smart contract)
   */
  fetchActiveBattles: async () => {
    try {
      set({ isLoading: true, error: null });
      const activeBattles = await apiService.getActiveBattles();
      set({ activeBattles, isLoading: false });
      return activeBattles;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  /**
   * Fetch single battle with live scores from Hedera
   */
  fetchBattle: async (id) => {
    try {
      set({ isLoading: true, error: null });
      const battle = await apiService.getBattle(id);
      set({ isLoading: false });
      return battle;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  /**
   * Fetch battle scores (real-time from smart contract)
   */
  fetchBattleScores: async (id) => {
    try {
      const scores = await apiService.getBattleScores(id);

      // Update the battle in state with new scores
      set((state) => ({
        battles: state.battles.map((b) =>
          b.id === id ? { ...b, ...scores } : b
        ),
      }));

      return scores;
    } catch (error) {
      console.error("Failed to fetch battle scores:", error);
      throw error;
    }
  },

  /**
   * Create battle (writes to Hedera, then caches in Firebase)
   */
  createBattle: async (battleData) => {
    try {
      set({ isLoading: true, error: null });

      // This calls the backend which:
      // 1. Creates battle on Hedera smart contract
      // 2. Stores metadata in Firebase with battleId
      const battle = await apiService.createBattle(battleData);

      set((state) => ({
        battles: [battle, ...state.battles],
        isLoading: false,
      }));

      return battle;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  /**
   * Vote on battle (writes to Hedera smart contract)
   */
  voteBattle: async (battleId, rapperChoice) => {
    try {
      const { address } = get();
      if (!address) throw new Error("Wallet not connected");

      set({ isLoading: true, error: null });

      // This calls backend which:
      // 1. Submits vote to smart contract (source of truth)
      // 2. Records vote in Firebase for quick lookup
      const result = await apiService.voteBattle(
        battleId,
        rapperChoice,
        address
      );

      set({ isLoading: false });

      // Refresh battle data from contract
      await get().fetchBattleScores(battleId);

      return result;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  /**
   * Check if user has voted (queries Hedera)
   */
  checkHasVoted: async (battleId) => {
    try {
      const { address } = get();
      if (!address) return false;

      const hasVoted = await apiService.checkHasVoted(battleId, address);
      return hasVoted;
    } catch (error) {
      console.error("Failed to check vote status:", error);
      return false;
    }
  },

  /**
   * End battle (admin only - calls smart contract)
   */
  endBattle: async (battleId) => {
    try {
      set({ isLoading: true, error: null });
      const result = await apiService.endBattle(battleId);
      set({ isLoading: false });

      // Refresh battles
      await get().fetchBattles();

      return result;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  // ==================== Rapper Actions ====================

  fetchRappers: async () => {
    try {
      set({ isLoading: true, error: null });
      const rappers = await apiService.getRappers();
      set({ rappers, isLoading: false });
      return rappers;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  getRapper: async (id) => {
    try {
      const { rappers } = get();
      const rapper = rappers.find((r) => r.id === id);
      if (rapper) return rapper;

      // If not in state, fetch all rappers
      await get().fetchRappers();
      return get().rappers.find((r) => r.id === id);
    } catch (error) {
      console.error("Failed to get rapper:", error);
      throw error;
    }
  },

  createRapper: async (rapperData) => {
    try {
      set({ isLoading: true, error: null });
      const rapper = await apiService.createRapper(rapperData);
      set((state) => ({
        rappers: [...state.rappers, rapper],
        isLoading: false,
      }));
      return rapper;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  // ==================== Ticket (NFT) Actions ====================

  /**
   * Create a new ticket NFT collection
   */
  createTicketCollection: async (name, maxSupply) => {
    try {
      set({ isLoading: true, error: null });
      const result = await apiService.createTicketCollection(name, maxSupply);
      set({ isLoading: false });
      return result;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  /**
   * Mint a ticket NFT
   */
  mintTicket: async (tokenId, metadata) => {
    try {
      set({ isLoading: true, error: null });
      const result = await apiService.mintTicket(tokenId, metadata);
      set({ isLoading: false });
      return result;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  /**
   * Get all tickets
   */
  fetchTickets: async () => {
    try {
      set({ isLoading: true, error: null });
      const tickets = await apiService.getTickets();
      set({ isLoading: false });
      return tickets;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  /**
   * Purchase a ticket
   */
  purchaseTicket: async (ticketData) => {
    try {
      const { address } = get();
      if (!address) throw new Error("Wallet not connected");

      set({ isLoading: true, error: null });
      const result = await apiService.purchaseTicket({
        ...ticketData,
        buyerAddress: address,
      });
      set({ isLoading: false });
      return result;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  // ==================== DAO Governance Actions ====================

  /**
   * Fetch all proposals (from Firebase + enriched with Hedera state)
   */
  fetchProposals: async () => {
    try {
      set({ isLoading: true, error: null });
      const proposals = await apiService.getProposals();
      set({ proposals, isLoading: false });
      return proposals;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  /**
   * Fetch single proposal with live vote counts from Hedera
   */
  fetchProposal: async (proposalId) => {
    try {
      set({ isLoading: true, error: null });
      const proposal = await apiService.getProposal(proposalId);
      set({ isLoading: false });
      return proposal;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  /**
   * Create proposal (writes to DAO contract on Hedera)
   */
  createProposal: async (proposalData) => {
    try {
      set({ isLoading: true, error: null });

      // Backend creates proposal on DAO contract, then stores in Firebase
      const proposal = await apiService.createProposal(proposalData);

      set((state) => ({
        proposals: [proposal, ...state.proposals],
        isLoading: false,
      }));

      return proposal;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  /**
   * Vote on proposal (writes to DAO contract)
   * @param {string} proposalId - Proposal ID
   * @param {number} support - 0=Against, 1=For, 2=Abstain
   * @param {string} reason - Optional reason
   */
  voteProposal: async (proposalId, support, reason = "") => {
    try {
      const { address } = get();
      if (!address) throw new Error("Wallet not connected");

      set({ isLoading: true, error: null });

      await apiService.voteProposal(proposalId, support, reason, address);

      set({ isLoading: false });

      // Refresh proposal with new vote counts from contract
      await get().fetchProposal(proposalId);
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  /**
   * Check if user has voted on proposal (queries Hedera)
   */
  checkHasVotedOnProposal: async (proposalId) => {
    try {
      const { address } = get();
      if (!address) return false;

      const hasVoted = await apiService.checkHasVotedOnProposal(
        proposalId,
        address
      );
      return hasVoted;
    } catch (error) {
      console.error("Failed to check proposal vote status:", error);
      return false;
    }
  },

  /**
   * Execute proposal (admin only - calls DAO contract)
   */
  executeProposal: async (proposalId) => {
    try {
      set({ isLoading: true, error: null });
      const result = await apiService.executeProposal(proposalId);
      set({ isLoading: false });

      // Refresh proposals
      await get().fetchProposals();

      return result;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  /**
   * Get user's voting power (from DAO contract)
   */
  getVotingPower: async () => {
    try {
      const { address } = get();
      if (!address) return "0";

      const power = await apiService.getVotingPower(address);
      return power;
    } catch (error) {
      console.error("Failed to fetch voting power:", error);
      return "0";
    }
  },

  // ==================== Judge Actions ====================

  /**
   * Fetch all certified judges (from smart contract)
   */
  fetchJudges: async () => {
    try {
      set({ isLoading: true, error: null });
      const judges = await apiService.getJudges();
      set({ judges, isLoading: false });
      return judges;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  /**
   * Propose new judge (creates DAO proposal)
   */
  proposeJudge: async (judgeData) => {
    try {
      set({ isLoading: true, error: null });

      // This creates a DAO proposal to add the judge
      const proposal = await apiService.proposeJudge(judgeData);

      set((state) => ({
        proposals: [proposal, ...state.proposals],
        isLoading: false,
      }));

      return proposal;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  /**
   * Check if address is a judge (queries smart contract)
   */
  checkIsJudge: async (address) => {
    try {
      const isJudge = await apiService.checkIsJudge(address || get().address);

      // Update current user's judge status if checking their own address
      if (address === get().address || !address) {
        set({ isJudge });
      }

      return isJudge;
    } catch (error) {
      console.error("Failed to check judge status:", error);
      return false;
    }
  },

  // ==================== Contract Settings ====================

  /**
   * Fetch voting fee from smart contract
   */
  fetchVotingFee: async () => {
    try {
      const fee = await apiService.getVotingFee();
      set({ votingFee: fee });
      return fee;
    } catch (error) {
      console.error("Failed to fetch voting fee:", error);
      return 0.1;
    }
  },

  /**
   * Get DAO configuration (voting periods, thresholds, etc.)
   */
  fetchDAOConfig: async () => {
    try {
      const config = await apiService.getDAOConfig();
      return config;
    } catch (error) {
      console.error("Failed to fetch DAO config:", error);
      throw error;
    }
  },
}));
