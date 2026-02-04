"use strict";

const { Contract } = require("fabric-contract-api");

// Minimal append-only transaction ledger contract.
class TransactionContract extends Contract {
  async InitLedger() {
    // No default data needed for MVP.
    return "Ledger initialized";
  }

  validateTransaction(transaction) {
    if (!transaction) {
      throw new Error("Transaction payload is required");
    }

    const requiredFields = ["txId", "videoId", "fromUser", "toCreator", "amount"];
    for (const field of requiredFields) {
      if (!transaction[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    if (typeof transaction.amount !== "number" || Number.isNaN(transaction.amount)) {
      throw new Error("amount must be a valid number");
    }

    if (transaction.amount <= 0) {
      throw new Error("amount must be greater than 0");
    }
  }

  // Store a transaction keyed by txId (append-only).
  async RecordTransaction(ctx, txJson) {
    const transaction = JSON.parse(txJson);
    this.validateTransaction(transaction);

    const existing = await ctx.stub.getState(transaction.txId);
    if (existing && existing.length > 0) {
      // Idempotent behavior: return the existing transaction instead of erroring.
      return existing.toString("utf8");
    }

    const payload = {
      ...transaction,
      timestamp: new Date(ctx.stub.getTxTimestamp().seconds * 1000).toISOString()
    };

    await ctx.stub.putState(transaction.txId, Buffer.from(JSON.stringify(payload)));
    return JSON.stringify(payload);
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

  // Query by videoId without mutating state.
  async GetTransactionsByVideo(ctx, videoId) {
    if (!videoId) {
      throw new Error("videoId is required");
    }

    const results = [];
    const iterator = await ctx.stub.getStateByRange("", "");

    for await (const item of iterator) {
      const value = JSON.parse(item.value.toString("utf8"));
      if (value.videoId === videoId) {
        results.push(value);
      }
    }

    return JSON.stringify(results);
  }

  // Query by creatorId without mutating state.
  async GetTransactionsByCreator(ctx, creatorId) {
    if (!creatorId) {
      throw new Error("creatorId is required");
    }

    const results = [];
    const iterator = await ctx.stub.getStateByRange("", "");

    for await (const item of iterator) {
      const value = JSON.parse(item.value.toString("utf8"));
      if (value.toCreator === creatorId) {
        results.push(value);
      }
    }

    return JSON.stringify(results);
  }
}

module.exports = TransactionContract;
