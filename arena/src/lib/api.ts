import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});


export const battleApi = {
  getBattles: () => api.get("/api/battles"),
  getBattleById: (id: string) => api.get(`/api/battles/${id}`),
  createBattle: (data: any) => api.post("/api/battles", data),
  updateStatus: (id: string, status: string) =>
    api.patch(`/api/battles/${id}/status`, { status }),
};

export const voteApi = {
  /**
   * Submit a vote with optional payment proof
   * @param battleId - The battle ID
   * @param votedFor - "rapper1" or "rapper2"
   * @param paymentTxId - Metamask/Hedera payment transaction ID
   */
  submitVote: (
    battleId: string,
    votedFor: string,
    paymentTxId?: string
  ) =>
    api.post("/api/votes", {
      battleId,
      votedFor,
      ...(paymentTxId && { paymentTxId }),
    }),
  getVotes: (battleId: string) => api.get(`/api/votes/${battleId}`),
  getLiveVoteCounts: (battleId: string) =>
    api.get(`/api/votes/${battleId}/counts`),
};


export default api;
