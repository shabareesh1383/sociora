const express = require("express");
const createLedger = require("../../blockchain/ledgerFactory");
const auth = require("../middleware/auth");
const Video = require("../models/Video");
const Transaction = require("../models/Transaction");
const { createRevenueDistributionService } = require("../services/revenueDistributionService");

const router = express.Router();
const ledger = createLedger();
const revenueDistributionService = createRevenueDistributionService(ledger);

/* -------------------- helpers -------------------- */

const validateTransactionPayload = ({ videoId, toCreator, amount }) => {
  if (!videoId || !toCreator || amount === undefined) {
    return "Missing required fields";
  }

  const parsedAmount = Number(amount);
  if (Number.isNaN(parsedAmount)) {
    return "amount must be a valid number";
  }

  if (parsedAmount <= 0) {
    return "amount must be greater than 0";
  }

  return null;
};

/* -------------------- INVEST -------------------- */

router.post("/invest", auth, async (req, res) => {
  try {
    const { videoId, toCreator, amount } = req.body;

    if (!videoId || !toCreator || !amount) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const video = await Video.findById(videoId);
    if (!video) {
      return res.status(404).json({ message: "Video not found" });
    }

    // 1️⃣ SAVE INVESTMENT (SOURCE OF TRUTH)
    const investment = await Transaction.create({
      videoId,
      investorId: req.user.id,
      creatorId: toCreator,
      amount: Number(amount),
      type: "INVESTMENT"
    });

    // 2️⃣ TRY LEDGER (NON-BLOCKING)
    try {
      await ledger.recordTransaction({
        videoId,
        fromUser: req.user.id,
        toCreator,
        amount: Number(amount)
      });

      await revenueDistributionService.handleEvent({
        eventType: "LedgerWriteConfirmed",
        investmentState: "CONFIRMED",
        videoState: "ACTIVE",
        transaction: {
          videoId,
          fromUser: req.user.id,
          toCreator,
          amount: Number(amount)
        }
      });
    } catch (ledgerError) {
      console.warn("Ledger failed (ignored):", ledgerError.message);
    }

    return res.status(201).json({
      message: "Investment recorded",
      investment
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to record transaction" });
  }
});

/* -------------------- LEDGER (TRANSPARENCY) -------------------- */

router.get("/", async (req, res) => {
  try {
    
    return res.json(ledgerEntries);
  } catch (error) {
    return res.status(500).json({ message: "Failed to load ledger" });
  }
});

/* -------------------- VIDEO LEDGER -------------------- */

router.get("/video/:videoId", async (req, res) => {
  try {
    const { videoId } = req.params;
    const ledgerEntries = await ledger.getAllTransactions();

    const filtered = ledgerEntries.filter(tx => tx.videoId === videoId);
    return res.json(filtered);
  } catch (error) {
    return res.status(500).json({ message: "Failed to load video ledger" });
  }
});

/* -------------------- VIDEO INVESTMENTS (DB) -------------------- */

router.get("/video/:videoId/investments", async (req, res) => {
  try {
    const { videoId } = req.params;

    const investments = await Transaction.find({ videoId })
      .populate("investorId", "name email")
      .sort({ createdAt: -1 });

    return res.json(investments);
  } catch (error) {
    return res.status(500).json({ message: "Failed to load video investments" });
  }
});

/* -------------------- MY INVESTMENTS (DB ONLY) -------------------- */

router.get("/me", auth, async (req, res) => {
  try {
    const investments = await Transaction.find({
      investorId: req.user.id,
      type: "INVESTMENT"
    })
      .populate("videoId", "title")
      .sort({ createdAt: -1 });

    return res.json(investments);
  } catch (error) {
    return res.status(500).json({ message: "Failed to load investments" });
  }
});


module.exports = router;
