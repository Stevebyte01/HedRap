import { getFirestore } from "../config/firebase.js";

export const firebaseService = {
  // Battles
  async createBattle(battleData) {
    const db = getFirestore();
    const docRef = await db.collection("battles").add({
      ...battleData,
      createdAt: new Date(),
      votes: {},
    });
    return { id: docRef.id, ...battleData };
  },

  async getBattles() {
    const db = getFirestore();
    const snapshot = await db
      .collection("battles")
      .orderBy("createdAt", "desc")
      .get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  },

  async getBattle(id) {
    const db = getFirestore();
    const doc = await db.collection("battles").doc(id).get();
    if (!doc.exists) throw new Error("Battle not found");
    return { id: doc.id, ...doc.data() };
  },

  async updateBattle(id, data) {
    const db = getFirestore();
    await db.collection("battles").doc(id).update(data);
    return { id, ...data };
  },

  async addVote(battleId, voteData) {
    const db = getFirestore();
    const battleRef = db.collection("battles").doc(battleId);

    await battleRef.update({
      [`votes.${voteData.voterId}`]: {
        rapperId: voteData.rapperId,
        timestamp: new Date(),
      },
    });

    return { success: true };
  },

  // Rappers
  async createRapper(rapperData) {
    const db = getFirestore();
    const docRef = await db.collection("rappers").add({
      ...rapperData,
      createdAt: new Date(),
    });
    return { id: docRef.id, ...rapperData };
  },

  async getRappers() {
    const db = getFirestore();
    const snapshot = await db.collection("rappers").get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  },

  // Governance
  async createProposal(proposalData) {
    const db = getFirestore();
    const docRef = await db.collection("proposals").add({
      ...proposalData,
      createdAt: new Date(),
      votes: { for: 0, against: 0 },
    });
    return { id: docRef.id, ...proposalData };
  },

  async getProposals() {
    const db = getFirestore();
    const snapshot = await db
      .collection("proposals")
      .orderBy("createdAt", "desc")
      .get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  },

  async voteOnProposal(proposalId, vote) {
    const db = getFirestore();
    const proposalRef = db.collection("proposals").doc(proposalId);

    await proposalRef.update({
      [`votes.${vote}`]: admin.firestore.FieldValue.increment(1),
    });

    return { success: true };
  },
};
