import { Client, PrivateKey } from "@hashgraph/sdk";
import dotenv from "dotenv";


dotenv.config();

const accountId = process.env.HEDERA_ACCOUNT_ID;
const privateKey = process.env.HEDERA_PRIVATE_KEY;


if (!accountId || !privateKey) {
  throw new Error("Missing Hedera credentials in .env");
}

export const hederaClient = Client.forTestnet();
hederaClient.setOperator(accountId, PrivateKey.fromStringED25519(privateKey));

console.log(`Hedera connected to testnet with account: ${accountId}`);

export default hederaClient;
