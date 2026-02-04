const express = require("express");
const createLedger = require("../../blockchain/ledgerFactory");
const auth = require("../middleware/auth");

const router = express.Router();
const ledger = createLedger();

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

// Create an investment transaction
router.post("/invest", auth, async (req, res) => {
  try {
    const { videoId, toCreator, amount } = req.body;

    const validationError = validateTransactionPayload({ videoId, toCreator, amount });
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const transaction = await ledger.recordTransaction({
      videoId,
      fromUser: req.user.id,
      toCreator,
      amount: Number(amount)
    });

    const ledgerEntries = await ledger.getAllTransactions();
    return res
      .status(201)
      .json({ message: "Investment recorded", transaction, ledger: ledgerEntries });
  } catch (error) {
    return res.status(500).json({ message: "Failed to record transaction" });
  }
});

// Transparency dashboard: list all transactions
router.get("/", async (req, res) => {
  try {
    const ledgerEntries = await ledger.getAllTransactions();
    return res.json(ledgerEntries);
  } catch (error) {
    return res.status(500).json({ message: "Failed to load ledger" });
  }
});

module.exports = router;
