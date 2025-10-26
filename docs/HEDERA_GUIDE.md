# HedRap - Hedera Integration Guide

## Why Hedera?

- **Speed**: 3-5 seconds to consensus finality
- **Consistent Low Cost**: `$0.001` (Average cost per transaction)
- The main objective is to build a system that is **transparent, secure, and
  efficient.**

## HedRap Services & Features
### Tournament Voting
**Transaction Flow:**
1. User votes for a rapper with a certain fee
2. Backend creates Hedera transaction with vote data
3. Transaction signed with Hedera private key
4. Submitted to Hedera testnet
5. Within 3-5 seconds, transaction is confirmed
6. Vote immutably recorded on blockchain

### Judges Selection
**Transaction Flow:**
1. DAO proposal created for judge selection (via smart contract).
2. RAP token holders notified and vote using token-weighted system.
3. Votes recorded as Hedera transactions on-chain.
4. DAO contract tallies results and finalizes judges.
5. Selected judges immutably stored and emitted on Hedera ledger.

### DAO Token Buy-In
**Transaction Flow:**
1. User connects wallet and selects RAP token buy amount.
2. Backend creates Hedera transaction for token purchase.
3. User signs and submits transaction.
4. RAP tokens transferred to user’s wallet from DAO treasury.
5. Transaction confirmed and recorded on Hedera ledger.

### Immersive Experience
#### Merchandising
**Transaction Flow:**
1. Rapper lists merch (shirts, caps, etc.).
2. User buys item using HBAR.
3. Transaction recorded on Hedera ledger.
4. Revenue split: 90% to rapper, 10% to DAO treasury.
5. Order confirmed and fulfillment initiated.

#### NFT Marketplace
**Transaction Flow:**
1. Rapper mints NFTs via Hedera smart contract.
2. NFTs listed on HedRap marketplace.
3. User purchases with RAP tokens or HBAR.
4. Revenue split: 85% to rapper, 10% to HedRap treasury.

#### Match Staking
**Transaction Flow:**
1. Users stake Hbar on rap battles.
2. Tokens locked in smart contract until results confirmed.
3. Smart contract distributes winnings.
4. Revenue split: 95% to winners, 5% to HedRap treasury.
5. Results and rewards logged on Hedera blockchain.
-----------------------------------------------------------
### HedRap Contracts on Hedera
- DAO Contract


### HedRap Credentials for Test
```Bash
```
