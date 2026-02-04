const LedgerInterface = require("./ledgerInterface");

// Placeholder for a future real blockchain ledger (e.g., Hyperledger Fabric).
class BlockchainLedger extends LedgerInterface {
  recordTransaction() {
    throw new Error("Not implemented");
  }

  getAllTransactions() {
    throw new Error("Not implemented");
  }
}

module.exports = BlockchainLedger;
