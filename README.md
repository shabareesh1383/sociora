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

## Domain Model (Conceptual, No Code Changes Yet)
These are the **core business concepts** and their boundaries. This is only a
design layer—no new APIs or controllers are added.

- **Creator**: An authenticated user who uploads videos. Owns content metadata,
  receives investments, and is referenced by `creatorId`/`toCreator`.
- **Investor**: An authenticated user who invests in creators or specific videos.
  Initiates investment requests and is referenced by `fromUser`.
- **Video**: Metadata describing uploaded content (`title`, `description`,
  `creatorId`, `filePath`). The video itself is stored locally for MVP.
- **Investment**: A domain intent that represents “someone invested amount X in
  a video/creator.” This is **not** a ledger entry yet; it is a business-level
  action that becomes a transaction after validation.
- **Transaction (ledger-level)**: The immutable, append-only record written to
  the ledger (`txId`, `videoId`, `fromUser`, `toCreator`, `amount`, `timestamp`).
  This is the source of truth for audits.

## Domain Events (Conceptual, No New Features)
Events describe **what happened** in the system without adding new APIs. Each
event is a structured message that could be emitted later by services.

- **VideoUploaded**
  - When: a creator uploads a video successfully.
  - Carries: `videoId`, `creatorId`, `title`, `timestamp`.
- **InvestmentMade**
  - When: a user submits a valid investment request.
  - Carries: `videoId`, `fromUser`, `toCreator`, `amount`, `timestamp`.
- **TransactionRecorded**
  - When: a transaction is accepted by the ledger adapter.
  - Carries: `txId`, `videoId`, `fromUser`, `toCreator`, `amount`, `timestamp`.
- **LedgerWriteConfirmed**
  - When: the ledger confirms the write (Fabric commit or mock success).
  - Carries: `txId`, `ledgerType`, `timestamp`.

## Event Flow Design (Textual Diagram)
This is the **conceptual request flow**, showing separation of domain vs.
infrastructure logic.

```
API Request
  → Validation (controller + basic payload checks)
  → Domain Event (e.g., InvestmentMade)
  → Ledger Adapter (mock or Fabric)
  → Ledger (append-only, source of truth)
```

- **Domain logic**: validates inputs and expresses “what happened” via events.
- **Infrastructure logic**: writes to the ledger and reads back results.

## Proposed Code Structure (No File Moves Yet)
This is a **suggested future layout** to keep domain logic clean and testable:

```
domain/
  entities/        # Creator, Investor, Video, Investment, Transaction
  valueObjects/    # IDs, Money, Timestamp
events/
  types/           # Event schemas (VideoUploaded, InvestmentMade, etc.)
  handlers/        # Side-effects: write to ledger, notify, etc.
services/
  investmentService.js  # Orchestrates validation + event emission
  videoService.js       # Handles video upload flow
```

## Why Event-Driven Design
- **Auditability**: events provide an explicit trail of intent and outcomes.
- **Scalability**: services can react to events without tight coupling.
- **Future-proofing**: adding features later becomes “subscribe to events.”

## Future Feature Readiness (No Implementation Yet)
- **Revenue split**: subscribe to `TransactionRecorded` and calculate splits in
  a dedicated service without changing controllers.
- **Investor ROI**: aggregate `InvestmentMade` or ledger transactions to compute
  ROI over time.
- **IPFS storage**: extend `VideoUploaded` handler to pin content and store CID.
- **Notifications**: publish notifications when `LedgerWriteConfirmed` fires.

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
