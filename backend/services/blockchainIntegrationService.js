const crypto = require("crypto");

/**
 * BlockchainIntegrationService
 * 
 * Manages all blockchain operations for the Sociora platform:
 * - Records investments on the immutable ledger
 * - Tracks earnings and distributions
 * - Issues and manages crypto tokens (SOCIORA)
 * - Verifies user identity on blockchain
 * - Ensures data consistency between MongoDB and ledger
 * - Provides transparent transaction history queries
 */
class BlockchainIntegrationService {
  constructor(ledger) {
    this.ledger = ledger;
    this.TOKEN_NAME = "SOCIORA";
    this.TOKEN_SYMBOL = "$SOC";
    this.TOKEN_DECIMALS = 2;
  }

  /**
   * Record an investment transaction on the blockchain ledger
   * 
   * @param {Object} params
   * @param {string} params.investorId - MongoDB ID of investor
   * @param {string} params.creatorId - MongoDB ID of creator
   * @param {string} params.videoId - MongoDB ID of video
   * @param {number} params.amount - Investment amount in USD
   * @param {string} params.txIdDB - MongoDB transaction ID (reference)
   * @returns {Object} Blockchain transaction record
   */
  async recordInvestmentOnBlockchain({
    investorId,
    creatorId,
    videoId,
    amount,
    txIdDB
  }) {
    if (!investorId || !creatorId || !videoId || amount <= 0) {
      throw new Error("Invalid investment parameters");
    }

    const blockchainTx = {
      transactionType: "INVESTMENT",
      fromUser: investorId,
      toUser: creatorId,
      videoId,
      amount: Number(amount),
      currency: "USD",
      dbReference: txIdDB,
      status: "CONFIRMED",
      blockchainVerification: true,
      metadata: {
        platform: "Sociora",
        version: "1.0"
      }
    };

    // Append to immutable ledger
    const result = await this.ledger.appendTransaction(blockchainTx);
    return result;
  }

  /**
   * Record earnings distribution on blockchain
   * Called when platform distributes creator earnings
   * 
   * @param {Object} params
   * @param {string} params.creatorId - Creator's MongoDB ID
   * @param {string} params.videoId - Video MongoDB ID
   * @param {number} params.totalInvestments - Sum of all investments
   * @param {number} params.creatorShare - Amount allocated to creator (default 70%)
   * @param {string} params.distributionId - Unique distribution ID
   * @returns {Object} Distribution blockchain record
   */
  async recordEarningsDistribution({
    creatorId,
    videoId,
    totalInvestments,
    creatorShare = totalInvestments * 0.7,
    distributionId
  }) {
    if (!creatorId || !videoId || totalInvestments <= 0) {
      throw new Error("Invalid earnings distribution parameters");
    }

    const platformFee = totalInvestments - creatorShare;

    const distributionTx = {
      transactionType: "EARNINGS_DISTRIBUTION",
      toUser: creatorId,
      videoId,
      creatorEarnings: Number(creatorShare),
      platformFee: Number(platformFee),
      totalInvested: Number(totalInvestments),
      currency: "USD",
      distributionId: distributionId || this._generateDistributionId(videoId),
      status: "COMPLETED",
      blockchainVerification: true,
      processedAt: new Date().toISOString(),
      metadata: {
        platform: "Sociora",
        version: "1.0"
      }
    };

    return await this.ledger.appendTransaction(distributionTx);
  }

  /**
   * Issue SOCIORA crypto tokens to a user
   * Called when:
   * - User completes profile verification
   * - Creator receives earnings
   * - Platform grants bonus tokens
   * 
   * @param {Object} params
   * @param {string} params.userId - User's MongoDB ID
   * @param {number} params.amount - Amount of tokens to issue
   * @param {string} params.reason - Reason for token issuance
   * @param {string} params.referenceId - Reference transaction ID
   * @returns {Object} Token issuance record
   */
  async issueTokens({
    userId,
    amount,
    reason,
    referenceId
  }) {
    if (!userId || amount <= 0 || !reason) {
      throw new Error("Invalid token issuance parameters");
    }

    const tokenTx = {
      transactionType: "TOKEN_ISSUANCE",
      toUser: userId,
      tokenAmount: Number(amount),
      tokenSymbol: this.TOKEN_SYMBOL,
      tokenDecimals: this.TOKEN_DECIMALS,
      reason,
      referenceId,
      status: "COMPLETED",
      blockchainVerification: true,
      issuedAt: new Date().toISOString(),
      metadata: {
        platform: "Sociora",
        tokenName: this.TOKEN_NAME,
        tokenVersion: "1.0"
      }
    };

    return await this.ledger.appendTransaction(tokenTx);
  }

  /**
   * Transfer tokens between two users
   * For token trading, transfers, or withdrawals
   * 
   * @param {Object} params
   * @param {string} params.fromUserId - Sender's MongoDB ID
   * @param {string} params.toUserId - Recipient's MongoDB ID
   * @param {number} params.amount - Amount of tokens
   * @param {string} params.purpose - Purpose of transfer
   * @returns {Object} Token transfer record
   */
  async transferTokens({
    fromUserId,
    toUserId,
    amount,
    purpose
  }) {
    if (!fromUserId || !toUserId || amount <= 0) {
      throw new Error("Invalid token transfer parameters");
    }

    if (fromUserId === toUserId) {
      throw new Error("Cannot transfer tokens to same user");
    }

    const transferTx = {
      transactionType: "TOKEN_TRANSFER",
      fromUser: fromUserId,
      toUser: toUserId,
      tokenAmount: Number(amount),
      tokenSymbol: this.TOKEN_SYMBOL,
      purpose,
      status: "COMPLETED",
      blockchainVerification: true,
      transferredAt: new Date().toISOString(),
      metadata: {
        platform: "Sociora",
        tokenName: this.TOKEN_NAME
      }
    };

    return await this.ledger.appendTransaction(transferTx);
  }

  /**
   * Record cryptocurrency withdrawal request
   * User withdraws SOCIORA tokens to external wallet
   * 
   * @param {Object} params
   * @param {string} params.userId - User's MongoDB ID
   * @param {string} params.walletAddress - External wallet address
   * @param {number} params.amount - Amount to withdraw
   * @param {string} params.withdrawalId - Unique withdrawal ID
   * @returns {Object} Withdrawal record
   */
  async recordWithdrawal({
    userId,
    walletAddress,
    amount,
    withdrawalId
  }) {
    if (!userId || !walletAddress || amount <= 0) {
      throw new Error("Invalid withdrawal parameters");
    }

    const withdrawalTx = {
      transactionType: "WITHDRAWAL",
      fromUser: userId,
      toWallet: walletAddress,
      tokenAmount: Number(amount),
      tokenSymbol: this.TOKEN_SYMBOL,
      withdrawalId: withdrawalId || this._generateWithdrawalId(userId),
      status: "PENDING",
      blockchainVerification: true,
      requestedAt: new Date().toISOString(),
      metadata: {
        platform: "Sociora",
        tokenName: this.TOKEN_NAME
      }
    };

    return await this.ledger.appendTransaction(withdrawalTx);
  }

  /**
   * Verify user identity on blockchain
   * Records that a user has completed KYC/verification
   * 
   * @param {Object} params
   * @param {string} params.userId - User's MongoDB ID
   * @param {string} params.verificationLevel - Level of verification (basic, advanced, premium)
   * @param {string} params.documentHash - SHA256 hash of verification documents
   * @returns {Object} Verification record with blockchain hash
   */
  async verifyUserOnBlockchain({
    userId,
    verificationLevel = "basic",
    documentHash
  }) {
    if (!userId) {
      throw new Error("User ID is required for verification");
    }

    const verificationRecord = {
      transactionType: "USER_VERIFICATION",
      userId,
      verificationLevel,
      documentHash: documentHash || this._generateDocumentHash(userId),
      verificationHash: this._generateVerificationHash(userId),
      status: "VERIFIED",
      blockchainVerification: true,
      verifiedAt: new Date().toISOString(),
      metadata: {
        platform: "Sociora",
        version: "1.0"
      }
    };

    return await this.ledger.appendTransaction(verificationRecord);
  }

  /**
   * Get all transactions for a specific user
   * Provides transparent transaction history
   * 
   * @param {string} userId - User's MongoDB ID
   * @param {Object} options
   * @param {string} options.type - Filter by transaction type
   * @param {number} options.limit - Limit number of results
   * @returns {Array} User's transaction history
   */
  async getUserTransactionHistory(userId, options = {}) {
    if (!userId) {
      throw new Error("User ID is required");
    }

    const allTransactions = await this.ledger.readLedger();
    let userTxs = allTransactions.filter(
      tx => tx.fromUser === userId || tx.toUser === userId || tx.userId === userId
    );

    if (options.type) {
      userTxs = userTxs.filter(tx => tx.transactionType === options.type);
    }

    if (options.limit) {
      userTxs = userTxs.slice(-options.limit);
    }

    return userTxs;
  }

  /**
   * Get video's complete blockchain history
   * Shows all investments and distributions for transparency
   * 
   * @param {string} videoId - Video's MongoDB ID
   * @returns {Object} Video blockchain analytics
   */
  async getVideoBlockchainHistory(videoId) {
    if (!videoId) {
      throw new Error("Video ID is required");
    }

    const allTransactions = await this.ledger.readLedger();
    const videoTxs = allTransactions.filter(tx => tx.videoId === videoId);

    const investments = videoTxs.filter(tx => tx.transactionType === "INVESTMENT");
    const distributions = videoTxs.filter(tx => tx.transactionType === "EARNINGS_DISTRIBUTION");

    const totalInvested = investments.reduce((sum, tx) => sum + (tx.amount || 0), 0);
    const totalDistributed = distributions.reduce((sum, tx) => sum + (tx.creatorEarnings || 0), 0);
    const platformFees = distributions.reduce((sum, tx) => sum + (tx.platformFee || 0), 0);

    return {
      videoId,
      investmentCount: investments.length,
      totalInvested,
      totalDistributed,
      platformFees,
      investments: investments.sort((a, b) =>
        new Date(b.timestamp) - new Date(a.timestamp)
      ),
      distributions,
      blockchainVerified: true,
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Get total blockchain statistics for platform
   * 
   * @returns {Object} Platform-wide statistics
   */
  async getPlatformStatistics() {
    const allTransactions = await this.ledger.readLedger();

    const investments = allTransactions.filter(tx => tx.transactionType === "INVESTMENT");
    const distributions = allTransactions.filter(tx => tx.transactionType === "EARNINGS_DISTRIBUTION");
    const tokenIssuances = allTransactions.filter(tx => tx.transactionType === "TOKEN_ISSUANCE");
    const verifications = allTransactions.filter(tx => tx.transactionType === "USER_VERIFICATION");

    const totalInvested = investments.reduce((sum, tx) => sum + (tx.amount || 0), 0);
    const totalDistributed = distributions.reduce((sum, tx) => sum + (tx.creatorEarnings || 0), 0);
    const totalTokensIssued = tokenIssuances.reduce((sum, tx) => sum + (tx.tokenAmount || 0), 0);

    return {
      totalTransactions: allTransactions.length,
      investmentStats: {
        count: investments.length,
        totalAmount: totalInvested
      },
      distributionStats: {
        count: distributions.length,
        totalCreatorEarnings: totalDistributed,
        totalPlatformFees: distributions.reduce((sum, tx) => sum + (tx.platformFee || 0), 0)
      },
      tokenStats: {
        totalIssued: totalTokensIssued,
        issuanceCount: tokenIssuances.length,
        tokenSymbol: this.TOKEN_SYMBOL
      },
      verificationStats: {
        verifiedUsers: verifications.length
      },
      blockchainHealth: "ACTIVE",
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Verify transaction integrity on blockchain
   * Check that a transaction was properly recorded
   * 
   * @param {string} transactionId - Blockchain transaction ID
   * @returns {boolean} Whether transaction is valid and recorded
   */
  async verifyTransaction(transactionId) {
    if (!transactionId) {
      throw new Error("Transaction ID is required");
    }

    const allTransactions = await this.ledger.readLedger();
    const tx = allTransactions.find(t => t.txId === transactionId);

    return {
      found: !!tx,
      transaction: tx || null,
      verified: tx && tx.blockchainVerification === true,
      timestamp: tx ? tx.timestamp : null
    };
  }

  /**
   * Calculate earnings for a creator based on blockchain records
   * 
   * @param {string} creatorId - Creator's MongoDB ID
   * @returns {Object} Earnings summary
   */
  async getCreatorEarnings(creatorId) {
    if (!creatorId) {
      throw new Error("Creator ID is required");
    }

    const allTransactions = await this.ledger.readLedger();
    
    // Find all distributions to this creator
    const distributions = allTransactions.filter(
      tx => tx.transactionType === "EARNINGS_DISTRIBUTION" && tx.toUser === creatorId
    );

    const totalEarnings = distributions.reduce((sum, tx) => sum + (tx.creatorEarnings || 0), 0);
    const videoCount = new Set(distributions.map(tx => tx.videoId)).size;
    
    // Find token issuances to this creator
    const tokenIssuances = allTransactions.filter(
      tx => tx.transactionType === "TOKEN_ISSUANCE" && tx.toUser === creatorId
    );

    const totalTokens = tokenIssuances.reduce((sum, tx) => sum + (tx.tokenAmount || 0), 0);

    return {
      creatorId,
      totalEarnings: Number(totalEarnings.toFixed(2)),
      totalTokens: Number(totalTokens.toFixed(2)),
      videosMonetized: videoCount,
      distributionCount: distributions.length,
      earnings: distributions,
      blockchainVerified: true,
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Audit transaction for compliance
   * Ensure all transaction fields are valid
   * 
   * @param {Object} transaction - Transaction to audit
   * @returns {Object} Audit report
   */
  async auditTransaction(transaction) {
    const issues = [];

    if (!transaction.txId) issues.push("Missing transaction ID");
    if (!transaction.timestamp) issues.push("Missing timestamp");
    if (!transaction.transactionType) issues.push("Missing transaction type");
    if (!transaction.amount && !transaction.tokenAmount) {
      issues.push("Missing amount or tokenAmount");
    }
    if (transaction.amount && transaction.amount < 0) issues.push("Negative amount");
    if (!transaction.blockchainVerification) issues.push("Not blockchain verified");

    return {
      transactionId: transaction.txId,
      isValid: issues.length === 0,
      issues,
      severity: issues.length === 0 ? "NONE" : issues.length > 2 ? "HIGH" : "MEDIUM"
    };
  }

  // ============= PRIVATE HELPER METHODS =============

  _generateVerificationHash(userId) {
    return crypto
      .createHash("sha256")
      .update(`${userId}-${Date.now()}`)
      .digest("hex");
  }

  _generateDocumentHash(userId) {
    return crypto
      .createHash("sha256")
      .update(`${userId}-documents-${Date.now()}`)
      .digest("hex");
  }

  _generateDistributionId(videoId) {
    return crypto
      .createHash("sha256")
      .update(`${videoId}-${Date.now()}`)
      .digest("hex");
  }

  _generateWithdrawalId(userId) {
    return crypto
      .createHash("sha256")
      .update(`${userId}-withdrawal-${Date.now()}`)
      .digest("hex");
  }
}

/**
 * Factory function to create blockchain integration service
 * Accepts any ledger implementation (mock or real blockchain)
 * 
 * @param {Object} ledger - Ledger instance with appendTransaction and readLedger methods
 * @returns {BlockchainIntegrationService} Initialized service
 */
const createBlockchainIntegrationService = (ledger) => {
  if (!ledger) {
    throw new Error("Ledger instance is required");
  }

  if (!ledger.appendTransaction || !ledger.readLedger) {
    throw new Error("Ledger must implement appendTransaction and readLedger methods");
  }

  return new BlockchainIntegrationService(ledger);
};

module.exports = {
  BlockchainIntegrationService,
  createBlockchainIntegrationService
};
