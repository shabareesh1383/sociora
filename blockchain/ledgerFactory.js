const MockLedger = require("./mockLedger");
const BlockchainLedger = require("./blockchainLedger");

// Factory that returns the configured ledger instance.
const createLedger = () => {
  const type = (process.env.LEDGER_TYPE || "mock").toLowerCase();

  if (type === "blockchain") {
    return new BlockchainLedger();
  }

  return new MockLedger();
};

module.exports = createLedger;
