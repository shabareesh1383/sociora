"use strict";

const { Contract } = require("fabric-contract-api");

// Minimal append-only transaction ledger contract.
class TransactionContract extends Contract {
  async InitLedger() {
    // No default data needed for MVP.
    return "Ledger initialized";
  }

  // Store a transaction keyed by txId (append-only).
  async RecordTransaction(ctx, txJson) {
    const transaction = JSON.parse(txJson);

    if (!transaction.txId) {
      throw new Error("txId is required");
    }

    const existing = await ctx.stub.getState(transaction.txId);
    if (existing && existing.length > 0) {
      throw new Error("Transaction already exists (append-only)");
    }

    await ctx.stub.putState(transaction.txId, Buffer.from(JSON.stringify(transaction)));
    return JSON.stringify(transaction);
  }

  // Return all transactions stored in the ledger.
  async GetAllTransactions(ctx) {
    const results = [];
    const iterator = await ctx.stub.getStateByRange("", "");

    for await (const item of iterator) {
      const value = item.value.toString("utf8");
      results.push(JSON.parse(value));
    }

    return JSON.stringify(results);
  }
}

module.exports = TransactionContract;
