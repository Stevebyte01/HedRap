import { Client, PrivateKey } from "@hashgraph/sdk";

let client = null;

export const initializeHedera = async () => {
  try {
    const operatorId = process.env.HEDERA_OPERATOR_ID;
    const operatorKey = PrivateKey.fromStringECDSA(process.env.HEDERA_OPERATOR_KEY);

    if (process.env.HEDERA_NETWORK === "testnet") {
      client = Client.forTestnet();
    } else if (process.env.HEDERA_NETWORK === "mainnet") {
      client = Client.forMainnet();
    } else {
      throw new Error("Invalid HEDERA_NETWORK value");
    }

    client.setOperator(operatorId, operatorKey);

    console.log("Hedera client initialized");
    return client;
  } catch (error) {
    console.error("Failed to initialize Hedera:", error);
    throw error;
  }
};

export const getHederaClient = () => {
  if (!client) {
    throw new Error("Hedera client not initialized");
  }
  return client;
};
