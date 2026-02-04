# Sociora MVP (Blockchain Video Platform)

Beginner-friendly MVP prototype where creators upload videos and users can invest in them.
This project uses a **mock blockchain ledger** (no real crypto yet).

## Project Structure
```
frontend/   # React (Vite)
backend/    # Node.js + Express + MongoDB
blockchain/ # Ledger abstraction + implementations
```

## Features
- **Creator Authentication** (JWT-based signup/login)
- **Video Upload** (local file storage in `/backend/uploads`)
- **Mock Blockchain Ledger** (append-only transactions)
- **Investment Flow** (recorded on mock ledger)
- **Transparency Dashboard** (view all transactions)

## Ledger Abstraction (Future Hyperledger Fabric Ready)
The backend depends on a **ledger interface**, not a concrete implementation.
That means controller/route logic never changes when we swap ledgers.

- `LedgerInterface` defines:
  - `recordTransaction(tx)`
  - `getAllTransactions()`
- `MockLedger` stores transactions in `blockchain/ledger.json` (append-only).
- `BlockchainLedger` is a placeholder for a future Hyperledger Fabric adapter.
- `LEDGER_TYPE` picks which ledger is used:
  - `mock` (default)
  - `blockchain` (throws "Not implemented" today)

When you are ready to integrate Hyperledger Fabric, you only need to implement
`BlockchainLedger` with the same interface methods—no route/controller changes.

## Requirements
- Node.js 18+
- MongoDB running locally (or a remote MongoDB URI)

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

## Usage
1. Signup as a **creator** or **user**.
2. Login to get a JWT (stored in localStorage).
3. Upload a video (creator).
4. Click **Invest** on a video (user).
5. View the **Transparency Dashboard** for all transactions.

## Notes
- This is a **mock blockchain** for MVP learning purposes.
- Files are stored locally in `backend/uploads`.
- The ledger is saved to `blockchain/ledger.json` and is append-only.
