# HedRap - Setup Guide

## Prerequisites
- Node.js 18+ (download from nodejs.org)
- npm (comes with Node.js)
- Git
- GitHub account
- Hedera testnet activated on Metamask

## Getting Started

### 1. Clone the Repository
```bash
git clone []
cd HedRap
```

### 2. Backend Setup
```bash
cd studio
npm install
npm run dev
```

Backend should be running at http://localhost:3000

### 3. Frontend Setup
In a new terminal:
```bash
cd arena
npm install
npm run dev
```

Frontend should be running at http://localhost:5173

### 4. Verify Everything Works
- Visit http://localhost:5173 (should load `HedRap` homepage)

## Environment Variables

### Backend - `studio` (.env)
- HEDERA_ACCOUNT_ID: Your Hedera testnet account
- HEDERA_PRIVATE_KEY: Your Hedera private key
- FIREBASE_PROJECT_ID: Firebase project ID
- FIREBASE_PRIVATE_KEY: Firebase private key
- FIREBASE_CLIENT_EMAIL: Firebase service account email

### Frontend - `arena` (.env)
- VITE_API_URL: Backend URL (http://localhost:3000)


