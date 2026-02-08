/**
 * SubscriptionTiersService
 * 
 * Manages subscription tiers and tier-based features:
 * - Multiple subscription levels (Free, Pro, Premium, Elite)
 * - Tier-specific benefits and feature access
 * - Subscription lifecycle management
 * - Billing and payment processing
 * - Usage limits and quota management
 */
class SubscriptionTiersService {
  constructor({ User, Subscription }) {
    this.User = User;
    this.Subscription = Subscription;

    // Tier definitions with features and limits
    this.TIER_DEFINITIONS = {
      free: {
        name: "Free",
        displayName: "Starter",
        description: "Perfect for getting started",
        price: 0,
        billingCycle: "monthly",
        features: {
          uploads: true,
          uploadsPerMonth: 5,
          maxVideoLength: 10, // minutes
          maxFileSize: 500, // MB
          hd: false,
          analytics: "basic",
          customBranding: false,
          prioritySupport: false,
          apiAccess: false,
          advancedDRM: false
        },
        investmentBenefits: {
          investmentLimit: 500, // USD per month
          portfolioViewing: true,
          advancedAnalytics: false,
          earlyAccessContent: false,
          dividendMultiplier: 1.0
        },
        limits: {
          maxVideosWatched: 100,
          maxInvestments: 10,
          maxTemplates: 2,
          apiCalls: 1000,
          storageGB: 5
        }
      },

      pro: {
        name: "Pro",
        displayName: "Professional",
        description: "For serious content creators",
        price: 9.99,
        billingCycle: "monthly",
        features: {
          uploads: true,
          uploadsPerMonth: 50,
          maxVideoLength: 60, // minutes
          maxFileSize: 5000, // MB
          hd: true,
          analytics: "advanced",
          customBranding: true,
          prioritySupport: true,
          apiAccess: true,
          advancedDRM: true
        },
        investmentBenefits: {
          investmentLimit: 5000,
          portfolioViewing: true,
          advancedAnalytics: true,
          earlyAccessContent: true,
          dividendMultiplier: 1.1
        },
        limits: {
          maxVideosWatched: 1000,
          maxInvestments: 100,
          maxTemplates: 50,
          apiCalls: 100000,
          storageGB: 100
        }
      },

      premium: {
        name: "Premium",
        displayName: "Premium Creator",
        description: "For professional creators and investors",
        price: 29.99,
        billingCycle: "monthly",
        features: {
          uploads: true,
          uploadsPerMonth: 500,
          maxVideoLength: 240, // 4 hours
          maxFileSize: 50000, // MB
          hd: true,
          fhd: true,
          fourK: true,
          analytics: "professional",
          customBranding: true,
          whiteLabel: true,
          prioritySupport: true,
          dedicatedAccount: true,
          apiAccess: true,
          advancedDRM: true,
          liveStreaming: true
        },
        investmentBenefits: {
          investmentLimit: 50000,
          portfolioViewing: true,
          advancedAnalytics: true,
          earlyAccessContent: true,
          exclusiveInvestments: true,
          dividendMultiplier: 1.25,
          taxDocuments: true
        },
        limits: {
          maxVideosWatched: 10000,
          maxInvestments: 500,
          maxTemplates: 500,
          apiCalls: 1000000,
          storageGB: 1000
        }
      },

      elite: {
        name: "Elite",
        displayName: "Elite Partner",
        description: "For enterprise creators and institutional investors",
        price: 99.99,
        billingCycle: "monthly",
        features: {
          uploads: true,
          uploadsPerMonth: 5000,
          maxVideoLength: 0, // Unlimited
          maxFileSize: 0, // Unlimited
          hd: true,
          fhd: true,
          fourK: true,
          eightK: true,
          analytics: "enterprise",
          customBranding: true,
          whiteLabel: true,
          prioritySupport: true,
          dedicatedAccount: true,
          dedicatedManager: true,
          apiAccess: true,
          advancedDRM: true,
          liveStreaming: true,
          multiStream: true,
          customIntegrations: true
        },
        investmentBenefits: {
          investmentLimit: 0, // Unlimited
          portfolioViewing: true,
          advancedAnalytics: true,
          earlyAccessContent: true,
          exclusiveInvestments: true,
          institutionalTools: true,
          dividendMultiplier: 1.5,
          taxDocuments: true,
          customReporting: true,
          apiAccess: true
        },
        limits: {
          maxVideosWatched: 0,
          maxInvestments: 0,
          maxTemplates: 0,
          apiCalls: 0,
          storageGB: 0
        }
      }
    };
  }

  /**
   * Get all available subscription tiers
   * 
   * @returns {Array} List of tier definitions
   */
  getTiers() {
    return Object.entries(this.TIER_DEFINITIONS).map(([key, tier]) => ({
      id: key,
      ...tier
    }));
  }

  /**
   * Get specific tier details
   * 
   * @param {string} tierId - Tier ID (free, pro, premium, elite)
   * @returns {Object} Tier details
   */
  getTierDetails(tierId) {
    const tier = this.TIER_DEFINITIONS[tierId];
    if (!tier) {
      throw new Error("Tier not found");
    }

    return {
      id: tierId,
      ...tier
    };
  }

  /**
   * Subscribe user to a tier
   * 
   * @param {Object} params
   * @param {string} params.userId - User's MongoDB ID
   * @param {string} params.tierId - Tier to subscribe to
   * @param {string} params.paymentMethodId - Payment method ID
   * @returns {Object} Subscription confirmation
   */
  async subscribe(params = {}) {
    const { userId, tierId, paymentMethodId } = params;

    if (!userId || !tierId) {
      throw new Error("User ID and Tier ID required");
    }

    const tier = this.TIER_DEFINITIONS[tierId];
    if (!tier) {
      throw new Error("Invalid tier");
    }

    // Get current user subscription
    const user = await this.User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Cancel existing subscription if upgrading/downgrading
    if (user.subscriptionTier && user.subscriptionTier !== tierId) {
      await this._cancelSubscription(userId);
    }

    // Calculate subscription details
    const startDate = new Date();
    const renewalDate = new Date();
    renewalDate.setMonth(renewalDate.getMonth() + 1);

    const subscription = {
      userId,
      tierId,
      tierName: tier.name,
      startDate,
      renewalDate,
      status: "active",
      autoRenew: true,
      billingCycle: tier.billingCycle,
      amount: tier.price,
      paymentMethodId: paymentMethodId || null,
      trialEnds: tier.price === 0 ? null : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
    };

    // Update user tier
    user.subscriptionTier = tierId;
    user.subscriptionExpiry = renewalDate;
    await user.save();

    return {
      success: true,
      subscription,
      message: `Successfully subscribed to ${tier.displayName} tier`,
      benefits: tier.features,
      nextBilling: renewalDate
    };
  }

  /**
   * Check if user has access to feature
   * 
   * @param {string} userId - User's MongoDB ID
   * @param {string} feature - Feature name
   * @returns {boolean} Whether user can access feature
   */
  async hasFeatureAccess(userId, feature) {
    const user = await this.User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const tierLevel = user.subscriptionTier || "free";
    const tier = this.TIER_DEFINITIONS[tierLevel];

    if (!tier) {
      return false;
    }

    return tier.features[feature] === true;
  }

  /**
   * Check usage against quota limits
   * 
   * @param {string} userId - User's MongoDB ID
   * @param {string} limitType - Type of limit (uploads, storage, etc)
   * @param {number} currentUsage - Current usage amount
   * @returns {Object} Usage and limit details
   */
  async checkQuota(userId, limitType, currentUsage = 0) {
    const user = await this.User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const tierLevel = user.subscriptionTier || "free";
    const tier = this.TIER_DEFINITIONS[tierLevel];

    const limit = tier.limits[limitType];
    const unlimited = limit === 0;

    return {
      tierLevel,
      limitType,
      limit: unlimited ? "Unlimited" : limit,
      currentUsage,
      remaining: unlimited ? "Unlimited" : Math.max(0, limit - currentUsage),
      percentageUsed: unlimited ? 0 : ((currentUsage / limit) * 100).toFixed(1),
      exceeded: !unlimited && currentUsage > limit
    };
  }

  /**
   * Upgrade subscription tier
   * 
   * @param {string} userId - User's MongoDB ID
   * @param {string} newTierId - Tier to upgrade to
   * @returns {Object} Upgrade confirmation
   */
  async upgradeTier(userId, newTierId) {
    const user = await this.User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const currentTier = this.TIER_DEFINITIONS[user.subscriptionTier || "free"];
    const newTier = this.TIER_DEFINITIONS[newTierId];

    if (!newTier) {
      throw new Error("Invalid tier");
    }

    // Verify upgrade is higher tier
    const tierHierarchy = ["free", "pro", "premium", "elite"];
    const currentIndex = tierHierarchy.indexOf(user.subscriptionTier || "free");
    const newIndex = tierHierarchy.indexOf(newTierId);

    if (newIndex <= currentIndex) {
      throw new Error("Can only upgrade to higher tiers");
    }

    // Process prorated billing
    const proratedCredit = this._calculateProration(user, currentTier, newTier);

    // Subscribe to new tier
    const response = await this.subscribe({
      userId,
      tierId: newTierId
    });

    return {
      ...response,
      proratedCredit,
      message: `Successfully upgraded to ${newTier.displayName}. Credit: $${proratedCredit.toFixed(2)}`
    };
  }

  /**
   * Downgrade subscription tier
   * 
   * @param {string} userId - User's MongoDB ID
   * @param {string} newTierId - Tier to downgrade to
   * @returns {Object} Downgrade confirmation
   */
  async downgradeTier(userId, newTierId) {
    const user = await this.User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const currentTier = this.TIER_DEFINITIONS[user.subscriptionTier || "free"];
    const newTier = this.TIER_DEFINITIONS[newTierId];

    if (!newTier) {
      throw new Error("Invalid tier");
    }

    // Verify downgrade is lower tier
    const tierHierarchy = ["free", "pro", "premium", "elite"];
    const currentIndex = tierHierarchy.indexOf(user.subscriptionTier || "free");
    const newIndex = tierHierarchy.indexOf(newTierId);

    if (newIndex >= currentIndex) {
      throw new Error("Can only downgrade to lower tiers");
    }

    // Schedule downgrade for next billing cycle
    user.subscriptionTier = "free"; // Revert to free immediately (can be scheduled)
    user.subscriptionExpiry = null;
    await user.save();

    return {
      success: true,
      message: `Downgraded to ${newTier.displayName} tier. Changes effective next billing cycle.`,
      effectiveDate: new Date()
    };
  }

  /**
   * Cancel subscription
   * 
   * @param {string} userId - User's MongoDB ID
   * @param {string} reason - Cancellation reason
   * @returns {Object} Cancellation confirmation
   */
  async cancelSubscription(userId, reason = "") {
    return await this._cancelSubscription(userId, reason);
  }

  /**
   * Get tier comparison
   * Useful for showing upgrade options
   * 
   * @returns {Object} Feature comparison matrix
   */
  getTierComparison() {
    const allFeatures = new Set();
    
    // Collect all features
    Object.values(this.TIER_DEFINITIONS).forEach(tier => {
      Object.keys(tier.features).forEach(feature => {
        allFeatures.add(feature);
      });
    });

    const comparison = {};
    allFeatures.forEach(feature => {
      comparison[feature] = {
        free: this.TIER_DEFINITIONS.free.features[feature] || false,
        pro: this.TIER_DEFINITIONS.pro.features[feature] || false,
        premium: this.TIER_DEFINITIONS.premium.features[feature] || false,
        elite: this.TIER_DEFINITIONS.elite.features[feature] || false
      };
    });

    return {
      features: comparison,
      tiers: ["free", "pro", "premium", "elite"],
      tierNames: ["Starter", "Professional", "Premium Creator", "Elite Partner"],
      pricing: {
        free: 0,
        pro: 9.99,
        premium: 29.99,
        elite: 99.99
      }
    };
  }

  /**
   * Get user subscription details
   * 
   * @param {string} userId - User's MongoDB ID
   * @returns {Object} Complete subscription information
   */
  async getUserSubscription(userId) {
    const user = await this.User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const tierLevel = user.subscriptionTier || "free";
    const tier = this.TIER_DEFINITIONS[tierLevel];

    return {
      userId,
      currentTier: tierLevel,
      tierDetails: {
        name: tier.displayName,
        description: tier.description,
        price: tier.price,
        billingCycle: tier.billingCycle
      },
      subscriptionStatus: user.subscriptionExpiry && new Date() < user.subscriptionExpiry ? "active" : "expired",
      startDate: user.createdAt,
      expiryDate: user.subscriptionExpiry,
      autoRenew: true,
      features: tier.features,
      investmentBenefits: tier.investmentBenefits,
      limits: tier.limits,
      usage: {
        uploadsThisMonth: 0, // Calculate from database
        investmentThisMonth: user.totalInvested || 0,
        storageUsedGB: 0 // Calculate from database
      }
    };
  }

  /**
   * Get upgrade recommendations based on usage
   * 
   * @param {string} userId - User's MongoDB ID
   * @returns {Array} Recommended tier upgrades
   */
  async getUpgradeRecommendations(userId) {
    const user = await this.User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const tierLevel = user.subscriptionTier || "free";
    const recommendations = [];

    // Recommendation logic based on usage patterns
    if (tierLevel === "free") {
      recommendations.push({
        tier: "pro",
        reason: "Unlock unlimited uploads and HD videos",
        benefits: ["50 uploads/month", "Advanced analytics", "Priority support"],
        savings: "$0 (first 2 weeks free)"
      });
    }

    if (tierLevel === "pro") {
      recommendations.push({
        tier: "premium",
        reason: "Get 4K video support and exclusive investments",
        benefits: ["500 uploads/month", "Professional analytics", "Dedicated account manager"],
        savings: "$20/month compared to paying for overages"
      });
    }

    return recommendations;
  }

  // ============= PRIVATE HELPER METHODS =============

  async _cancelSubscription(userId, reason = "") {
    const user = await this.User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    user.subscriptionTier = "free";
    user.subscriptionExpiry = null;
    await user.save();

    return {
      success: true,
      message: "Subscription cancelled. You're now on the Free tier.",
      effectiveDate: new Date()
    };
  }

  _calculateProration(user, currentTier, newTier) {
    // Calculate credit for remaining days on current plan
    if (!user.subscriptionExpiry || currentTier.price === 0) {
      return 0;
    }

    const daysRemaining = Math.ceil(
      (user.subscriptionExpiry - new Date()) / (1000 * 60 * 60 * 24)
    );

    const dailyRate = currentTier.price / 30;
    return dailyRate * daysRemaining;
  }
}

/**
 * Factory function to create subscription tiers service
 * 
 * @param {Object} models - Database models
 * @returns {SubscriptionTiersService} Initialized service
 */
const createSubscriptionTiersService = (models = {}) => {
  return new SubscriptionTiersService({
    User: models.User || null,
    Subscription: models.Subscription || null
  });
};

module.exports = {
  SubscriptionTiersService,
  createSubscriptionTiersService
};
