const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

const ledgerFile = path.join(__dirname, "ledger.json");

const ensureLedger = () => {
  if (!fs.existsSync(ledgerFile)) {
    fs.writeFileSync(ledgerFile, JSON.stringify([], null, 2));
  }
};

const readLedger = () => {
  ensureLedger();
  const raw = fs.readFileSync(ledgerFile, "utf-8");
  return JSON.parse(raw);
};

const appendTransaction = (transaction) => {
  ensureLedger();
  const ledger = readLedger();
  const newTransaction = {
    txId: uuidv4(),
    timestamp: new Date().toISOString(),
    ...transaction
  };
  ledger.push(newTransaction);
  fs.writeFileSync(ledgerFile, JSON.stringify(ledger, null, 2));
  return newTransaction;
};

module.exports = {
  readLedger,
  appendTransaction
};
