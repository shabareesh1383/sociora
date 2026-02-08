const crypto = require("crypto");

/**
 * CryptoTokenSystem
 * 
 * Manages SOCIORA cryptocurrency tokens:
 * - Token creation and distribution
 * - Token transfers between users
 * - Token burning and redemption
 * - Token rewards for creators and investors
 * - Token balance tracking
 * - Token economics and inflation control
 */
class CryptoTokenSystem {
  constructor() {
    this.TOKEN_NAME = "SOCIORA";
    this.TOKEN_SYMBOL = "$SOC";
    this.TOKEN_DECIMALS = 2;
    this.TOTAL_SUPPLY = 1000000; // Maximum 1 million tokens
    this.INITIAL_TOKEN_VALUE = 1.0; // $1 USD per token initially
    
    // Token distribution percentages
    this.DISTRIBUTION = {
      CREATOR_REWARDS: 0.35,        // 35% for creator rewards
      INVESTOR_REWARDS: 0.25,       // 25% for investor rewards
      PLATFORM_RESERVE: 0.20,       // 20% reserved for platform operations
      STAKING_REWARDS: 0.15,        // 15% for staking rewards
      TEAM_VESTING: 0.05            // 5% for team (vested)
    };
    
    // Token emission rates
    this.EMISSION = {
      CREATOR_PER_VIDEO: 50,        // 50 tokens per uploaded video
      INVESTOR_PER_DOLLAR: 0.1,     // 0.1 tokens per $1 invested
      REFERRAL_BONUS: 25,           // 25 tokens for referral
      SIGN_UP_BONUS: 10             // 10 tokens for signing up
    };

    // Token pricing (USD per token)
    this.TOKEN_PRICES = {
      TIER_1: { min: 0, max: 100000, pricePerToken: 0.10 },
      TIER_2: { min: 100001, max: 500000, pricePerToken: 0.50 },
      TIER_3: { min: 500001, max: 1000000, pricePerToken: 1.00 }
    };
  }

  /**
   * Get current token information
   * 
   * @returns {Object} Token metadata
   */
  getTokenInfo() {
    return {
      name: this.TOKEN_NAME,
      symbol: this.TOKEN_SYMBOL,
      decimals: this.TOKEN_DECIMALS,
      totalSupply: this.TOTAL_SUPPLY,
      currentValue: this.INITIAL_TOKEN_VALUE,
      distribution: this.DISTRIBUTION,
      emission: this.EMISSION,
      metadata: {
        contractVersion: "1.0.0",
        deployedDate: "2026-02-06",
        blockchain: "Hybrid (MongoDB + Ledger)"
      }
    };
  }

  /**
   * Calculate tokens earned for creator uploading video
   * 
   * @param {number} videoQualityScore - 0-100 quality score
   * @param {boolean} isVerified - Whether creator is verified
   * @returns {number} Tokens earned
   */
  calculateCreatorTokens(videoQualityScore = 50, isVerified = false) {
    let baseTokens = this.EMISSION.CREATOR_PER_VIDEO;
    
    // Quality multiplier
    const qualityMultiplier = videoQualityScore / 100;
    baseTokens *= (1 + qualityMultiplier * 0.5); // Up to 50% bonus for high quality
    
    // Verified creator bonus
    if (isVerified) {
      baseTokens *= 1.25; // 25% bonus for verified creators
    }

    return Math.floor(baseTokens * 100) / 100; // 2 decimal places
  }

  /**
   * Calculate tokens earned for investor
   * 
   * @param {number} investmentAmount - Investment amount in USD
   * @param {boolean} isEarlyInvestor - Whether investor is early (first 48h)
   * @returns {number} Tokens earned
   */
  calculateInvestorTokens(investmentAmount, isEarlyInvestor = false) {
    let baseTokens = investmentAmount * this.EMISSION.INVESTOR_PER_DOLLAR;
    
    // Early investor bonus (within first 48 hours)
    if (isEarlyInvestor) {
      baseTokens *= 1.5; // 50% bonus for early investors
    }

    return Math.floor(baseTokens * 100) / 100; // 2 decimal places
  }

  /**
   * Get current token price based on total supply
   * Uses tiered pricing model
   * 
   * @param {number} totalMinted - Total tokens minted so far
   * @returns {Object} Current price information
   */
  getTokenPrice(totalMinted = 0) {
    let tier = this.TOKEN_PRICES.TIER_1;

    if (totalMinted > this.TOKEN_PRICES.TIER_3.min) {
      tier = this.TOKEN_PRICES.TIER_3;
    } else if (totalMinted > this.TOKEN_PRICES.TIER_2.min) {
      tier = this.TOKEN_PRICES.TIER_2;
    }

    return {
      currentTier: tier,
      pricePerToken: tier.pricePerToken,
      currency: "USD",
      supply: totalMinted,
      maxSupply: this.TOTAL_SUPPLY,
      utilizationRate: (totalMinted / this.TOTAL_SUPPLY * 100).toFixed(2) + "%"
    };
  }

  /**
   * Generate token mint transaction
   * 
   * @param {Object} params
   * @param {string} params.userId - Recipient user ID
   * @param {number} params.amount - Tokens to mint
   * @param {string} params.reason - Reason for minting
   * @param {string} params.referenceId - Reference to original transaction
   * @returns {Object} Mint transaction record
   */
  generateMintTransaction({
    userId,
    amount,
    reason,
    referenceId
  }) {
    if (!userId || amount <= 0) {
      throw new Error("Invalid mint parameters");
    }

    return {
      id: this._generateTokenTxId(),
      type: "MINT",
      toAddress: userId,
      tokenAmount: Number((amount * Math.pow(10, this.TOKEN_DECIMALS)).toFixed(0)),
      displayAmount: Number(amount.toFixed(this.TOKEN_DECIMALS)),
      symbol: this.TOKEN_SYMBOL,
      reason,
      referenceId,
      status: "PENDING",
      timestamp: new Date().toISOString(),
      metadata: {
        tokenName: this.TOKEN_NAME,
        chainId: "sociora-hybrid"
      }
    };
  }

  /**
   * Generate token transfer transaction
   * 
   * @param {Object} params
   * @param {string} params.fromAddress - Sender user ID
   * @param {string} params.toAddress - Recipient user ID
   * @param {number} params.amount - Amount to transfer
   * @param {string} params.purpose - Transfer purpose
   * @returns {Object} Transfer transaction record
   */
  generateTransferTransaction({
    fromAddress,
    toAddress,
    amount,
    purpose = "peer-to-peer"
  }) {
    if (!fromAddress || !toAddress || amount <= 0) {
      throw new Error("Invalid transfer parameters");
    }

    if (fromAddress === toAddress) {
      throw new Error("Cannot transfer to same address");
    }

    return {
      id: this._generateTokenTxId(),
      type: "TRANSFER",
      from: fromAddress,
      to: toAddress,
      tokenAmount: Number((amount * Math.pow(10, this.TOKEN_DECIMALS)).toFixed(0)),
      displayAmount: Number(amount.toFixed(this.TOKEN_DECIMALS)),
      symbol: this.TOKEN_SYMBOL,
      purpose,
      feePercentage: 0.1, // 0.1% fee
      fee: Number((amount * 0.001).toFixed(this.TOKEN_DECIMALS)),
      net: Number((amount - amount * 0.001).toFixed(this.TOKEN_DECIMALS)),
      status: "PENDING",
      timestamp: new Date().toISOString(),
      metadata: {
        tokenName: this.TOKEN_NAME,
        chainId: "sociora-hybrid"
      }
    };
  }

  /**
   * Generate token burn transaction
   * Used for token redemption or destruction
   * 
   * @param {Object} params
   * @param {string} params.fromAddress - User burning tokens
   * @param {number} params.amount - Amount to burn
   * @param {string} params.reason - Burn reason
   * @returns {Object} Burn transaction record
   */
  generateBurnTransaction({
    fromAddress,
    amount,
    reason = "redemption"
  }) {
    if (!fromAddress || amount <= 0) {
      throw new Error("Invalid burn parameters");
    }

    return {
      id: this._generateTokenTxId(),
      type: "BURN",
      fromAddress,
      tokenAmount: Number((amount * Math.pow(10, this.TOKEN_DECIMALS)).toFixed(0)),
      displayAmount: Number(amount.toFixed(this.TOKEN_DECIMALS)),
      symbol: this.TOKEN_SYMBOL,
      reason,
      status: "PENDING",
      timestamp: new Date().toISOString(),
      metadata: {
        tokenName: this.TOKEN_NAME,
        deflationary: true
      }
    };
  }

  /**
   * Generate staking transaction
   * User locks tokens to earn staking rewards
   * 
   * @param {Object} params
   * @param {string} params.userId - User staking tokens
   * @param {number} params.amount - Amount to stake
   * @param {number} params.durationDays - Staking duration in days
   * @returns {Object} Staking transaction record
   */
  generateStakingTransaction({
    userId,
    amount,
    durationDays = 30
  }) {
    if (!userId || amount <= 0 || durationDays < 1) {
      throw new Error("Invalid staking parameters");
    }

    const apy = this._calculateAPY(durationDays);
    const dailyReward = amount * (apy / 365 / 100);
    const projectedRewards = dailyReward * durationDays;

    const releaseDate = new Date();
    releaseDate.setDate(releaseDate.getDate() + durationDays);

    return {
      id: this._generateTokenTxId(),
      type: "STAKE",
      userId,
      tokenAmount: Number((amount * Math.pow(10, this.TOKEN_DECIMALS)).toFixed(0)),
      displayAmount: Number(amount.toFixed(this.TOKEN_DECIMALS)),
      symbol: this.TOKEN_SYMBOL,
      duration: durationDays,
      apy: apy,
      projectedDailyReward: Number(dailyReward.toFixed(this.TOKEN_DECIMALS)),
      projectedTotalReward: Number(projectedRewards.toFixed(this.TOKEN_DECIMALS)),
      releaseDate: releaseDate.toISOString(),
      status: "ACTIVE",
      startDate: new Date().toISOString(),
      metadata: {
        tokenName: this.TOKEN_NAME,
        rewardType: "STAKING"
      }
    };
  }

  /**
   * Calculate staking rewards earned so far
   * 
   * @param {Object} stake - Stake object with startDate and displayAmount
   * @returns {Object} Rewards calculated
   */
  calculateStakingRewards(stake) {
    if (!stake || !stake.startDate) {
      throw new Error("Invalid stake object");
    }

    const startDate = new Date(stake.startDate);
    const now = new Date();
    const daysElapsed = (now - startDate) / (1000 * 60 * 60 * 24);

    const apy = stake.apy || this._calculateAPY(stake.duration || 30);
    const dailyReward = stake.displayAmount * (apy / 365 / 100);
    const rewardsEarned = dailyReward * daysElapsed;

    return {
      stakeAmount: stake.displayAmount,
      apy: apy,
      daysElapsed: Math.floor(daysElapsed),
      dailyReward: Number(dailyReward.toFixed(this.TOKEN_DECIMALS)),
      rewardsEarned: Number(rewardsEarned.toFixed(this.TOKEN_DECIMALS)),
      projectedTotalReward: stake.projectedTotalReward,
      completionDate: stake.releaseDate
    };
  }

  /**
   * Generate liquidity provisioning transaction
   * User provides tokens to liquidity pool
   * 
   * @param {Object} params
   * @param {string} params.userId - User providing liquidity
   * @param {number} params.tokenAmount - SOCIORA tokens to provide
   * @param {number} params.usdAmount - USD equivalent
   * @returns {Object} LP transaction record
   */
  generateLiquidityTransaction({
    userId,
    tokenAmount,
    usdAmount
  }) {
    if (!userId || tokenAmount <= 0 || usdAmount <= 0) {
      throw new Error("Invalid liquidity parameters");
    }

    const lpTokensGenerated = Math.sqrt(tokenAmount * (usdAmount / this.INITIAL_TOKEN_VALUE));

    return {
      id: this._generateTokenTxId(),
      type: "LIQUIDITY_PROVIDE",
      userId,
      tokenAmount: Number(tokenAmount.toFixed(this.TOKEN_DECIMALS)),
      usdAmount: Number(usdAmount.toFixed(2)),
      lpTokensGenerated: Number(lpTokensGenerated.toFixed(this.TOKEN_DECIMALS)),
      feePercentage: 0.25, // 0.25% fee for LP
      estimatedAPR: 45.5, // Estimated annual return
      status: "ACTIVE",
      timestamp: new Date().toISOString(),
      metadata: {
        tokenName: this.TOKEN_NAME,
        poolType: "SOCIORA-USDC"
      }
    };
  }

  /**
   * Calculate token swap value
   * Exchange SOC tokens for USD
   * 
   * @param {number} amount - Amount of tokens to swap
   * @param {number} totalMinted - Total tokens minted (for pricing)
   * @returns {Object} Swap details
   */
  calculateSwapValue(amount, totalMinted = 0) {
    if (amount <= 0) {
      throw new Error("Invalid amount");
    }

    const priceInfo = this.getTokenPrice(totalMinted);
    const usdValue = amount * priceInfo.pricePerToken;
    const fee = usdValue * 0.005; // 0.5% swap fee
    const netValue = usdValue - fee;

    return {
      tokenAmount: amount,
      tokenPrice: priceInfo.pricePerToken,
      grossUsdValue: Number(usdValue.toFixed(2)),
      swapFeePercentage: 0.5,
      swapFee: Number(fee.toFixed(2)),
      netUsdValue: Number(netValue.toFixed(2)),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Generate token vesting schedule
   * Used for team tokens with staggered release
   * 
   * @param {Object} params
   * @param {string} params.userId - Recipient
   * @param {number} params.totalTokens - Total tokens to vest
   * @param {number} params.durationMonths - Vesting duration in months
   * @param {number} params.cliffMonths - Cliff period in months
   * @returns {Object} Vesting schedule
   */
  generateVestingSchedule({
    userId,
    totalTokens,
    durationMonths = 24,
    cliffMonths = 6
  }) {
    if (!userId || totalTokens <= 0) {
      throw new Error("Invalid vesting parameters");
    }

    const monthlyRelease = totalTokens / durationMonths;
    const cliffEndDate = new Date();
    cliffEndDate.setMonth(cliffEndDate.getMonth() + cliffMonths);

    const vestingSchedule = [];
    for (let i = 0; i < durationMonths; i++) {
      const releaseDate = new Date();
      releaseDate.setMonth(releaseDate.getMonth() + cliffMonths + i);
      
      vestingSchedule.push({
        month: cliffMonths + i + 1,
        releaseDate: releaseDate.toISOString(),
        tokensReleased: Number(monthlyRelease.toFixed(this.TOKEN_DECIMALS))
      });
    }

    return {
      userId,
      totalTokens: Number(totalTokens.toFixed(this.TOKEN_DECIMALS)),
      startDate: new Date().toISOString(),
      cliffEndDate: cliffEndDate.toISOString(),
      vestingEndDate: vestingSchedule[vestingSchedule.length - 1].releaseDate,
      monthlyRelease: Number(monthlyRelease.toFixed(this.TOKEN_DECIMALS)),
      schedule: vestingSchedule
    };
  }

  /**
   * Get token holder statistics
   * 
   * @returns {Object} Token statistics template
   */
  getTokenStatistics() {
    return {
      tokenName: this.TOKEN_NAME,
      tokenSymbol: this.TOKEN_SYMBOL,
      totalSupply: this.TOTAL_SUPPLY,
      circulatingSupply: 0, // To be calculated from user balances
      burntTokens: 0, // To be calculated from burn transactions
      holders: 0, // To be calculated from user count
      transfers: 0, // To be calculated from transaction count
      marketCap: 0, // To be calculated from price * circulating supply
      averageHoldingTime: 0, // To be calculated from transfer history
      uniqueDailyTransactions: [],
      topHolders: [],
      timestamp: new Date().toISOString()
    };
  }

  // ============= PRIVATE HELPER METHODS =============

  _generateTokenTxId() {
    return `SOC-${Date.now()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
  }

  _calculateAPY(durationDays) {
    // Variable APY based on staking duration
    // Longer duration = higher reward
    if (durationDays <= 30) return 15; // 15% APY for 30 days
    if (durationDays <= 90) return 25; // 25% APY for 90 days
    if (durationDays <= 180) return 35; // 35% APY for 180 days
    return 50; // 50% APY for 365+ days
  }
}

/**
 * Factory function to create crypto token system
 * 
 * @returns {CryptoTokenSystem} Initialized system
 */
const createCryptoTokenSystem = () => {
  return new CryptoTokenSystem();
};

module.exports = {
  CryptoTokenSystem,
  createCryptoTokenSystem
};
