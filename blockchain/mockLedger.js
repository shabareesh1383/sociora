const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const LedgerInterface = require("./ledgerInterface");

// Mock ledger that stores transactions in a local JSON file (append-only).
class MockLedger extends LedgerInterface {
  constructor() {
    super();
    this.ledgerFile = path.join(__dirname, "ledger.json");
  }

  ensureLedger() {
    if (!fs.existsSync(this.ledgerFile)) {
      fs.writeFileSync(this.ledgerFile, JSON.stringify([], null, 2));
    }
  }

  readLedger() {
    this.ensureLedger();
    const raw = fs.readFileSync(this.ledgerFile, "utf-8");
    return JSON.parse(raw);
  }

  // Append-only transaction record
  recordTransaction(transaction) {
    this.ensureLedger();
    const ledger = this.readLedger();
    const newTransaction = {
      txId: uuidv4(),
      timestamp: new Date().toISOString(),
      ...transaction
    };
    ledger.push(newTransaction);
    fs.writeFileSync(this.ledgerFile, JSON.stringify(ledger, null, 2));
    return newTransaction;
  }

  getAllTransactions() {
    return this.readLedger();
  }
}

module.exports = MockLedger;
