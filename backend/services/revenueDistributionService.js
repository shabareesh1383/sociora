const crypto = require("crypto");

// Off-chain revenue distribution service (MVP placeholder).
// Accepts domain events and records distribution metadata as new ledger entries.
class RevenueDistributionService {
  constructor({ ledger, splitConfig }) {
    this.ledger = ledger;
    this.splitConfig = splitConfig || [];
  }

  // Deterministic distribution ID derived from the original transaction.
  buildDistributionId(referenceTxId) {
    return crypto.createHash("sha256").update(referenceTxId).digest("hex");
  }

  // Accepts an event-like payload and enforces lifecycle rules.
  async handleEvent({ eventType, investmentState, videoState, transaction }) {
    if (!eventType) {
      throw new Error("eventType is required");
    }

    if (!transaction) {
      throw new Error("transaction is required");
    }

    if (investmentState !== "CONFIRMED") {
      throw new Error("Investment state must be CONFIRMED for distribution");
    }

    if (videoState !== "ACTIVE") {
      throw new Error("Video state must be ACTIVE for distribution");
    }

    if (!transaction.txId || !transaction.videoId || !transaction.toCreator) {
      throw new Error("transaction must include txId, videoId, and toCreator");
    }

    const distributionId = this.buildDistributionId(transaction.txId);

    const existing = await this.findExistingDistribution(distributionId);
    if (existing) {
      return existing;
    }

    // Record a new ledger entry as an append-only audit record.
    const distributionRecord = {
      videoId: transaction.videoId,
      fromUser: "platform",
      toCreator: transaction.toCreator,
      amount: Number(transaction.amount),
      transactionType: "DISTRIBUTION",
      referenceTxId: transaction.txId,
      distributionId,
      eventType,
      allocations: this.splitConfig
    };

    return this.ledger.recordTransaction(distributionRecord);
  }

  // Scan ledger for an existing distribution record.
  async findExistingDistribution(distributionId) {
    const entries = await this.ledger.getAllTransactions();
    return entries.find(
      (entry) => entry.transactionType === "DISTRIBUTION" && entry.distributionId === distributionId
    );
  }
}

// Split config is intentionally placeholder-only (no hardcoded percentages).
const parseSplitConfig = () => {
  const raw = process.env.DISTRIBUTION_SPLIT_CONFIG;
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
};

const createRevenueDistributionService = (ledger) =>
  new RevenueDistributionService({ ledger, splitConfig: parseSplitConfig() });

module.exports = {
  RevenueDistributionService,
  createRevenueDistributionService
};
