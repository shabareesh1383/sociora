// Defines the common ledger interface.
// Any future ledger (like Hyperledger Fabric) must implement these methods.
class LedgerInterface {
  recordTransaction() {
    throw new Error("recordTransaction() not implemented");
  }

  getAllTransactions() {
    throw new Error("getAllTransactions() not implemented");
  }
}

module.exports = LedgerInterface;
