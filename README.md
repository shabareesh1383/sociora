# Sociora MVP (Blockchain Video Platform)

Beginner-friendly MVP prototype where creators upload videos and users can invest in them.
This project uses a **mock blockchain ledger** by default, but can switch to **Hyperledger Fabric**
for local development.

## Project Structure
```
frontend/   # React (Vite)
backend/    # Node.js + Express + MongoDB
blockchain/ # Ledger abstraction + implementations
chaincode/  # Hyperledger Fabric smart contract
fabric/     # Local Fabric network scripts
```

## Features
- **Creator Authentication** (JWT-based signup/login)
- **Video Upload** (local file storage in `/backend/uploads`)
- **Ledger Abstraction** (mock or Fabric)
- **Investment Flow** (recorded on ledger)
- **Transparency Dashboard** (view all transactions)

## Ledger Abstraction (Why This Matters)
The backend depends on a **ledger interface**, not a concrete implementation.
That means controller/route logic never changes when we swap ledgers.

- `LedgerInterface` defines:
  - `recordTransaction(tx)`
  - `getAllTransactions()`
- `MockLedger` stores transactions in `blockchain/ledger.json` (append-only).
- `BlockchainLedger` connects to Hyperledger Fabric.
- `LEDGER_TYPE` picks which ledger is used:
  - `mock` (default)
  - `blockchain` (Fabric adapter)

When you are ready to go deeper with Fabric (multiple orgs, ordering, endorsement
policies), you only update the Fabric adapter—not your routes.

## Security & Audit Model (Beginner-Friendly)
- **Source of truth**: When `LEDGER_TYPE=blockchain`, Hyperledger Fabric is the
  canonical ledger. The backend only submits transactions and reads results; it
  does not decide outcomes or mutate historical records.
- **Trust boundaries**:
  - The **backend** validates payload shape and forwards requests to the ledger.
  - The **chaincode** enforces append-only storage, schema validation, and
    deterministic timestamps based on the Fabric transaction time.
  - **Clients** cannot directly write to the ledger; all writes go through the
    backend + chaincode validation.
- **Assumptions**: This is local dev only (single org, single peer). Security
  hardening like multi-org policies, TLS pinning, or production access control
  is out of scope for the MVP.

## Requirements
- Node.js 18+
- MongoDB running locally (or a remote MongoDB URI)
- For Fabric mode: Docker + Docker Compose

## Backend Setup
```bash
cd backend
npm install
cp .env.example .env
```

Update `.env` with your settings:
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/sociora
JWT_SECRET=supersecret
LEDGER_TYPE=mock

# Fabric (used when LEDGER_TYPE=blockchain)
FABRIC_WALLET_PATH=./fabric/wallet
FABRIC_CONNECTION_PROFILE=./fabric/connection.json
FABRIC_CHANNEL=sociochannel
FABRIC_CHAINCODE=sociora
FABRIC_IDENTITY=appUser
```

Run the backend:
```bash
npm run dev
```

## Frontend Setup
```bash
cd frontend
npm install
```

Optional: Set API URL if your backend is on a different host/port.
Create `frontend/.env`:
```
VITE_API_URL=http://localhost:5000
```

Run the frontend:
```bash
npm run dev
```

## Hyperledger Fabric (Local Development)
This repo includes a **minimal Fabric setup** for local development only.
It uses a single organization, single peer, and one channel (`sociochannel`).

### 1) Start the Network + Deploy Chaincode
```bash
./fabric/network.sh
```
This script downloads `fabric-samples` (if missing), starts the test network,
creates the channel, and deploys the chaincode from `chaincode/`.

### 2) Enroll Admin + Register App User
```bash
./fabric/enroll-user.sh
```
This script uses the Fabric test application to create a local wallet and copies
its identity to `fabric/wallet` plus the connection profile to `fabric/connection.json`.

### 3) Switch the Backend to Fabric
Set in `backend/.env`:
```
LEDGER_TYPE=blockchain
FABRIC_WALLET_PATH=./fabric/wallet
FABRIC_CONNECTION_PROFILE=./fabric/connection.json
FABRIC_CHANNEL=sociochannel
FABRIC_CHAINCODE=sociora
FABRIC_IDENTITY=appUser
```
Restart the backend server.

## Common Errors & Fixes (Fabric)
- **"Identity not found in wallet"**
  - Run `./fabric/enroll-user.sh` to create `fabric/wallet`.
- **"Failed to connect" / discovery errors**
  - Ensure Docker is running and the test network is up (`./fabric/network.sh`).
- **Chaincode not found**
  - Re-run `./fabric/network.sh` to deploy the chaincode.

## Usage
1. Signup as a **creator** or **user**.
2. Login to get a JWT (stored in localStorage).
3. Upload a video (creator).
4. Click **Invest** on a video (user).
5. View the **Transparency Dashboard** for all transactions.

## Notes
- This is a **mock blockchain** for MVP learning purposes.
- Files are stored locally in `backend/uploads`.
- The mock ledger is saved to `blockchain/ledger.json` and is append-only.
