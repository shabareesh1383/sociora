const express = require("express");
const createLedger = require("../../blockchain/ledgerFactory");
const auth = require("../middleware/auth");

const router = express.Router();
const ledger = createLedger();

// Create an investment transaction
router.post("/invest", auth, async (req, res) => {
  try {
    const { videoId, toCreator, amount } = req.body;

    if (!videoId || !toCreator || !amount) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const transaction = ledger.recordTransaction({
      videoId,
      fromUser: req.user.id,
      toCreator,
      amount: Number(amount)
    });

    const ledgerEntries = ledger.getAllTransactions();
    return res
      .status(201)
      .json({ message: "Investment recorded", transaction, ledger: ledgerEntries });
  } catch (error) {
    return res.status(500).json({ message: "Failed to record transaction" });
  }
});

// Transparency dashboard: list all transactions
router.get("/", (req, res) => {
  try {
    const ledgerEntries = ledger.getAllTransactions();
    return res.json(ledgerEntries);
  } catch (error) {
    return res.status(500).json({ message: "Failed to load ledger" });
  }
});

module.exports = router;
