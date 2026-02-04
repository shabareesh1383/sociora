const fs = require("fs");
const path = require("path");
const MockLedger = require("../../blockchain/mockLedger");
const {
  RevenueDistributionService
} = require("../services/revenueDistributionService");

const ledgerFile = path.join(__dirname, "..", "..", "blockchain", "ledger.json");

const resetLedger = () => {
  fs.writeFileSync(ledgerFile, JSON.stringify([], null, 2));
};

describe("RevenueDistributionService", () => {
  let ledger;
  let service;

  beforeEach(() => {
    resetLedger();
    ledger = new MockLedger();
    service = new RevenueDistributionService({ ledger, splitConfig: [] });
  });

  test("fails fast without CONFIRMED investment", async () => {
    const transaction = {
      txId: "tx-1",
      videoId: "video-1",
      toCreator: "creator-1",
      amount: 10
    };

    await expect(
      service.handleEvent({
        eventType: "LedgerWriteConfirmed",
        investmentState: "RECORDED",
        videoState: "ACTIVE",
        transaction
      })
    ).rejects.toThrow("Investment state must be CONFIRMED");
  });

  test("fails fast without ACTIVE video", async () => {
    const transaction = {
      txId: "tx-2",
      videoId: "video-2",
      toCreator: "creator-2",
      amount: 10
    };

    await expect(
      service.handleEvent({
        eventType: "LedgerWriteConfirmed",
        investmentState: "CONFIRMED",
        videoState: "ARCHIVED",
        transaction
      })
    ).rejects.toThrow("Video state must be ACTIVE");
  });

  test("records a deterministic distribution and is idempotent", async () => {
    const transaction = {
      txId: "tx-3",
      videoId: "video-3",
      toCreator: "creator-3",
      amount: 25
    };

    const first = await service.handleEvent({
      eventType: "LedgerWriteConfirmed",
      investmentState: "CONFIRMED",
      videoState: "ACTIVE",
      transaction
    });

    const second = await service.handleEvent({
      eventType: "LedgerWriteConfirmed",
      investmentState: "CONFIRMED",
      videoState: "ACTIVE",
      transaction
    });

    expect(first.distributionId).toBe(second.distributionId);

    const entries = await ledger.getAllTransactions();
    const distributionEntries = entries.filter(
      (entry) => entry.transactionType === "DISTRIBUTION"
    );
    expect(distributionEntries).toHaveLength(1);
  });

  test("rejects missing required transaction fields", async () => {
    const transaction = {
      txId: "tx-4",
      videoId: "video-4",
      amount: 25
    };

    await expect(
      service.handleEvent({
        eventType: "LedgerWriteConfirmed",
        investmentState: "CONFIRMED",
        videoState: "ACTIVE",
        transaction
      })
    ).rejects.toThrow("transaction must include txId, videoId, and toCreator");
  });

  test("out-of-order events do not create distributions", async () => {
    const transaction = {
      txId: "tx-5",
      videoId: "video-5",
      toCreator: "creator-5",
      amount: 50
    };

    await expect(
      service.handleEvent({
        eventType: "LedgerWriteConfirmed",
        investmentState: "PROPOSED",
        videoState: "ACTIVE",
        transaction
      })
    ).rejects.toThrow("Investment state must be CONFIRMED");

    const entries = await ledger.getAllTransactions();
    expect(entries).toHaveLength(0);
  });

  test("retry after invalid state succeeds once valid", async () => {
    const transaction = {
      txId: "tx-6",
      videoId: "video-6",
      toCreator: "creator-6",
      amount: 40
    };

    await expect(
      service.handleEvent({
        eventType: "LedgerWriteConfirmed",
        investmentState: "RECORDED",
        videoState: "ACTIVE",
        transaction
      })
    ).rejects.toThrow("Investment state must be CONFIRMED");

    const record = await service.handleEvent({
      eventType: "LedgerWriteConfirmed",
      investmentState: "CONFIRMED",
      videoState: "ACTIVE",
      transaction
    });

    expect(record.transactionType).toBe("DISTRIBUTION");
    const entries = await ledger.getAllTransactions();
    expect(entries).toHaveLength(1);
  });
});
