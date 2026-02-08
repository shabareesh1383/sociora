const MockLedger = require("./mockLedger");

// Factory that returns the configured ledger instance.
const createLedger = () => {
  const type = (process.env.LEDGER_TYPE || "mock").toLowerCase();

  if (type === "blockchain") {
    // Lazy require to avoid loading Fabric in mock mode
    const BlockchainLedger = require("./blockchainLedger");
    return new BlockchainLedger();
  }

  return new MockLedger();
};

module.exports = createLedger;
