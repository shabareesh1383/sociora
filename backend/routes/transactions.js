const express = require("express");
const { appendTransaction, readLedger } = require("../../blockchain/ledger");
const auth = require("../middleware/auth");

const router = express.Router();

// Create an investment transaction
router.post("/invest", auth, async (req, res) => {
  try {
    const { videoId, toCreator, amount } = req.body;

    if (!videoId || !toCreator || !amount) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const transaction = appendTransaction({
      videoId,
      fromUser: req.user.id,
      toCreator,
      amount: Number(amount)
    });

    const ledger = readLedger();
    return res.status(201).json({ message: "Investment recorded", transaction, ledger });
  } catch (error) {
    return res.status(500).json({ message: "Failed to record transaction" });
  }
});

// Transparency dashboard: list all transactions
router.get("/", (req, res) => {
  try {
    const ledger = readLedger();
    return res.json(ledger);
  } catch (error) {
    return res.status(500).json({ message: "Failed to load ledger" });
  }
});

module.exports = router;
