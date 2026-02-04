const crypto = require("crypto");

// Minimal settlement helper (design-only, no payouts).
// Creates deterministic settlement records for audit purposes.
class SettlementService {
  buildSettlementId(distributionId, beneficiaryId) {
    return crypto
      .createHash("sha256")
      .update(`${distributionId}:${beneficiaryId}`)
      .digest("hex");
  }

  createSettlementRecord({ distributionId, sourceTxIds, beneficiaryType, beneficiaryId, amount }) {
    if (!distributionId || !beneficiaryId || !beneficiaryType) {
      throw new Error("distributionId, beneficiaryType, and beneficiaryId are required");
    }

    return {
      settlementId: this.buildSettlementId(distributionId, beneficiaryId),
      distributionId,
      sourceTxIds: sourceTxIds || [],
      beneficiaryType,
      beneficiaryId,
      amount: Number(amount),
      state: "UNSETTLED",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }
}

module.exports = SettlementService;
