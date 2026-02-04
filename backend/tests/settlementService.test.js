const SettlementService = require("../services/settlementService");

describe("SettlementService", () => {
  test("creates deterministic settlement IDs", () => {
    const service = new SettlementService();
    const record = service.createSettlementRecord({
      distributionId: "dist-1",
      sourceTxIds: ["tx-1"],
      beneficiaryType: "creator",
      beneficiaryId: "creator-1",
      amount: 100
    });

    const record2 = service.createSettlementRecord({
      distributionId: "dist-1",
      sourceTxIds: ["tx-1"],
      beneficiaryType: "creator",
      beneficiaryId: "creator-1",
      amount: 100
    });

    expect(record.settlementId).toBe(record2.settlementId);
    expect(record.state).toBe("UNSETTLED");
  });

  test("rejects missing required fields", () => {
    const service = new SettlementService();
    expect(() =>
      service.createSettlementRecord({
        distributionId: "dist-2",
        sourceTxIds: ["tx-2"],
        beneficiaryType: "creator",
        amount: 100
      })
    ).toThrow("distributionId, beneficiaryType, and beneficiaryId are required");
  });
});
