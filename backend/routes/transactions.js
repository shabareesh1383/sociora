const express = require("express");
const createLedger = require("../../blockchain/ledgerFactory");
const auth = require("../middleware/auth");
const Video = require("../models/Video");
const Transaction = require("../models/Transaction");
const User = require("../models/User");
const { createRevenueDistributionService } = require("../services/revenueDistributionService");
const enhancedBlockchainService = require("../services/enhancedBlockchainService");

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

    const validationError = validateTransactionPayload({ videoId, toCreator, amount });
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const video = await Video.findById(videoId);
    if (!video) {
      return res.status(404).json({ message: "Video not found" });
    }

    // 🚫 PREVENT SELF-INVESTMENT - CREATOR CANNOT INVEST IN OWN VIDEO
    if (req.user.id === video.creatorId.toString()) {
      return res.status(403).json({ message: "❌ You cannot invest in your own video" });
    }

    // ✅ VERIFY toCreator MATCHES VIDEO CREATOR
    if (toCreator !== String(video.creatorId)) {
      return res.status(400).json({ message: "Invalid creator ID. toCreator must match video creator" });
    }

    // Get investor user
    const User = require("../models/User");
    const investor = await User.findById(req.user.id);
    if (!investor) {
      return res.status(404).json({ message: "Investor not found" });
    }

    // 💰 CHECK WALLET BALANCE
    const parsedAmount = Number(amount);
    if ((investor.cryptoBalance || 0) < parsedAmount) {
      return res.status(400).json({
        message: `❌ Insufficient balance. You have ${investor.cryptoBalance || 0} SOCIORA but need ${parsedAmount}`,
        balance: investor.cryptoBalance || 0,
        required: parsedAmount
      });
    }

    // 1️⃣ WRITE TO LEDGER
    const ledgerTx = await ledger.recordTransaction({
      videoId,
      fromUser: req.user.id,
      toCreator,
      amount: parsedAmount
    });

    // 2️⃣ PERSIST TO MONGODB
    const investment = await Transaction.create({
      txId: ledgerTx.txId,
      videoId,
      investorId: req.user.id,
      creatorId: toCreator,
      amount: parsedAmount,
      type: "INVESTMENT"
    });

    // 2.5️⃣ UPDATE VIDEO WITH UNIQUE INVESTORS
    const existingInvestor = video.investors.find(inv => inv.userId.toString() === req.user.id);
    
    if (existingInvestor) {
      // User already invested - just add to their total
      existingInvestor.totalInvested += parsedAmount;
      existingInvestor.investmentCount += 1;
      existingInvestor.lastInvestment = new Date();
    } else {
      // New investor - add to list
      video.investors.push({
        userId: req.user.id,
        totalInvested: parsedAmount,
        investmentCount: 1,
        lastInvestment: new Date(),
        returns: 0,
        status: "active"
      });
      video.uniqueInvestorCount = (video.uniqueInvestorCount || 0) + 1;
    }
    
    video.totalInvested = (video.totalInvested || 0) + parsedAmount;
    // Keep totalSubscribers for backward compatibility but don't increment it
    await video.save();

    // 3️⃣ UPDATE WALLET BALANCE (DEDUCT FROM INVESTOR, ADD TO CREATOR)
    // Deduct from investor
    investor.cryptoBalance = (investor.cryptoBalance || 0) - parsedAmount;
    investor.totalInvested = (investor.totalInvested || 0) + parsedAmount;
    await investor.save();

    // Add to creator
    const creator = await User.findById(toCreator);
    if (creator) {
      creator.cryptoBalance = (creator.cryptoBalance || 0) + parsedAmount;
      creator.totalEarned = (creator.totalEarned || 0) + parsedAmount;
      await creator.save();
    }

    // 4️⃣ TRIGGER REVENUE DISTRIBUTION
    await revenueDistributionService.handleEvent({
      eventType: "LedgerWriteConfirmed",
      investmentState: "CONFIRMED",
      videoState: "ACTIVE",
      transaction: ledgerTx
    });

    // 4.5️⃣ RECORD ON ENHANCED BLOCKCHAIN FOR IMMUTABILITY
    try {
      const blockchainRecord = enhancedBlockchainService.recordInvestment({
        from: req.user.id,
        fromName: investor.name,
        to: toCreator,
        toName: creator?.name || "Unknown Creator",
        videoId,
        videoTitle: video.title,
        amount: parsedAmount,
        investmentType: "standard",
        platformFee: 0
      });

      console.log('✅ Investment recorded on blockchain:', blockchainRecord);
    } catch (blockchainError) {
      console.warn('⚠️ Blockchain recording failed (non-fatal):', blockchainError.message);
      // Don't fail the transaction if blockchain fails
    }

    // 5️⃣ RETURN UPDATED VIDEO AND LEDGER
    const updatedVideo = await Video.findById(videoId)
      .populate("creatorId", "name email walletAddress");
    const updatedLedger = await ledger.getAllTransactions();
    
    return res.status(201).json({
      message: "✅ Investment successful! You invested in this video.",
      investment,
      video: updatedVideo,
      ledger: updatedLedger,
      stats: {
        uniqueInvestors: video.uniqueInvestorCount,
        totalInvested: video.totalInvested
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to record transaction", error: error.message });
  }
});

/* -------------------- LEDGER (TRANSPARENCY) -------------------- */

router.get("/", async (req, res) => {
  try {
    const ledgerEntries = await ledger.getAllTransactions();
    
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
      .populate("creatorId", "name email")
      .sort({ createdAt: -1 });

    return res.json(investments);
  } catch (error) {
    return res.status(500).json({ message: "Failed to load investments" });
  }
});


module.exports = router;
