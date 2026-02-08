const crypto = require("crypto");

/**
 * TemplateMarketplaceService
 * 
 * Manages the template marketplace:
 * - Template creation and publishing
 * - Template browsing and discovery
 * - Template purchasing and licensing
 * - Creator revenue tracking
 * - Template customization
 * - Template ratings and reviews
 */
class TemplateMarketplaceService {
  constructor({ Template, User, CryptoTransaction, blockchainService }) {
    this.Template = Template;
    this.User = User;
    this.CryptoTransaction = CryptoTransaction;
    this.blockchainService = blockchainService;
  }

  /**
   * Create a new template
   * 
   * @param {Object} params
   * @param {string} params.creatorId - Creator's MongoDB ID
   * @param {string} params.name - Template name
   * @param {string} params.description - Template description
   * @param {string} params.category - Template category
   * @param {number} params.price - Price in SOCIORA tokens
   * @param {Array} params.features - Array of features
   * @param {string} params.templateFile - Path to template file
   * @param {string} params.preview - Preview image/video URL
   * @returns {Object} Created template
   */
  async createTemplate({
    creatorId,
    name,
    description,
    category,
    price,
    features = [],
    templateFile,
    preview,
    customFields = []
  }) {
    if (!creatorId || !name || !category || price <= 0) {
      throw new Error("Invalid template creation parameters");
    }

    // Verify creator exists and is a creator
    const creator = await this.User.findById(creatorId);
    if (!creator || creator.role !== "creator") {
      throw new Error("Only creators can publish templates");
    }

    const templateHash = this._generateTemplateHash(name, creatorId);

    const newTemplate = new this.Template({
      name,
      description,
      category,
      price: Number(price),
      features,
      templateFile: templateFile || "",
      preview: preview || "",
      creatorId,
      customFields,
      templateHash,
      isPublic: true,
      status: "active"
    });

    await newTemplate.save();
    
    // Record on blockchain
    if (this.blockchainService) {
      await this.blockchainService.recordInvestmentOnBlockchain({
        investorId: "platform",
        creatorId,
        videoId: "template:" + newTemplate._id,
        amount: 0, // Free to create
        txIdDB: newTemplate._id
      });
    }

    return await newTemplate.populate("creatorId", "name email avatar");
  }

  /**
   * Get all public templates with filters
   * 
   * @param {Object} params
   * @param {string} params.category - Filter by category
   * @param {string} params.search - Search by name or description
   * @param {string} params.sortBy - Sort by: newest, popular, rating, price
   * @param {number} params.page - Page number (default 1)
   * @param {number} params.limit - Items per page (default 20)
   * @returns {Object} Paginated templates with metadata
   */
  async getPublicTemplates({
    category = null,
    search = "",
    sortBy = "newest",
    page = 1,
    limit = 20
  }) {
    const query = { isPublic: true, status: "active" };

    // Category filter
    if (category) {
      query.category = category;
    }

    // Search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } }
      ];
    }

    // Sorting
    let sortOption = { createdAt: -1 }; // Default: newest
    switch (sortBy) {
      case "popular":
        sortOption = { purchaseCount: -1 };
        break;
      case "rating":
        sortOption = { rating: -1 };
        break;
      case "price-low":
        sortOption = { price: 1 };
        break;
      case "price-high":
        sortOption = { price: -1 };
        break;
    }

    // Pagination
    const skip = (page - 1) * limit;

    const templates = await this.Template.find(query)
      .populate("creatorId", "name email avatar isVerified")
      .sort(sortOption)
      .skip(skip)
      .limit(limit);

    const total = await this.Template.countDocuments(query);

    return {
      templates,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      filters: {
        category,
        search,
        sortBy
      }
    };
  }

  /**
   * Get featured templates
   * 
   * @param {number} limit - Number of featured templates to return
   * @returns {Array} Featured templates
   */
  async getFeaturedTemplates(limit = 6) {
    return await this.Template.find({
      isFeatured: true,
      isPublic: true,
      status: "active"
    })
      .populate("creatorId", "name email avatar isVerified")
      .limit(limit)
      .sort({ rating: -1 });
  }

  /**
   * Purchase a template
   * 
   * @param {Object} params
   * @param {string} params.templateId - Template MongoDB ID
   * @param {string} params.buyerId - Buyer's MongoDB ID
   * @param {number} params.tokenAmount - Tokens to spend
   * @returns {Object} Purchase confirmation
   */
  async purchaseTemplate({
    templateId,
    buyerId,
    tokenAmount
  }) {
    if (!templateId || !buyerId) {
      throw new Error("Invalid purchase parameters");
    }

    // Get template
    const template = await this.Template.findById(templateId).populate("creatorId");
    if (!template) {
      throw new Error("Template not found");
    }

    if (!template.isPublic || template.status !== "active") {
      throw new Error("Template is not available for purchase");
    }

    // Verify token amount matches
    const actualPrice = template.price;
    if (Math.abs(tokenAmount - actualPrice) > 0.01) {
      throw new Error(`Token amount mismatch. Expected ${actualPrice}, got ${tokenAmount}`);
    }

    // Get buyer and creator users
    const buyer = await this.User.findById(buyerId);
    const creator = template.creatorId;

    if (!buyer || !creator) {
      throw new Error("Buyer or creator not found");
    }

    // Check buyer has sufficient balance
    if (buyer.cryptoBalance < actualPrice) {
      throw new Error("Insufficient token balance");
    }

    // Record transaction
    const transaction = new this.CryptoTransaction({
      txId: this._generateTransactionId(),
      type: "template_purchase",
      fromUser: buyerId,
      toUser: creator._id,
      templateId: templateId,
      amount: actualPrice,
      status: "completed"
    });

    await transaction.save();

    // Update balances
    buyer.cryptoBalance -= actualPrice;
    creator.cryptoBalance += actualPrice * 0.9; // Creator gets 90%
    creator.totalEarned += actualPrice * 0.9;

    // Add template to buyer's collection
    if (!buyer.creatorStats.templatesPurchased) {
      buyer.creatorStats.templatesPurchased = [];
    }
    buyer.creatorStats.templatesPurchased.push(templateId);
    buyer.totalInvested += actualPrice;

    // Add transaction to both users' histories
    if (!buyer.transactionHistory) buyer.transactionHistory = [];
    if (!creator.transactionHistory) creator.transactionHistory = [];

    buyer.transactionHistory.push(transaction._id);
    creator.transactionHistory.push(transaction._id);

    await Promise.all([
      buyer.save(),
      creator.save()
    ]);

    // Update template stats
    template.purchaseCount += 1;
    template.creatorRevenue += actualPrice * 0.9;
    await template.save();

    return {
      success: true,
      transaction: transaction,
      template: template,
      message: `Successfully purchased ${template.name}`
    };
  }

  /**
   * Add review to template
   * 
   * @param {Object} params
   * @param {string} params.templateId - Template MongoDB ID
   * @param {string} params.userId - Reviewer's MongoDB ID
   * @param {number} params.rating - Rating 1-5
   * @param {string} params.comment - Review comment
   * @returns {Object} Updated template
   */
  async addReview({
    templateId,
    userId,
    rating,
    comment = ""
  }) {
    if (!templateId || !userId || rating < 1 || rating > 5) {
      throw new Error("Invalid review parameters");
    }

    const template = await this.Template.findById(templateId);
    if (!template) {
      throw new Error("Template not found");
    }

    // Check if user has already reviewed
    const existingReview = template.reviews.find(
      r => r.userId.toString() === userId
    );

    if (existingReview) {
      // Update existing review
      existingReview.rating = rating;
      existingReview.comment = comment;
      existingReview.createdAt = new Date();
    } else {
      // Add new review
      template.reviews.push({
        userId,
        rating,
        comment,
        createdAt: new Date()
      });
    }

    // Recalculate average rating
    const avgRating = template.reviews.reduce((sum, r) => sum + r.rating, 0) / template.reviews.length;
    template.rating = Number(avgRating.toFixed(2));

    await template.save();
    
    return await template.populate("creatorId", "name email avatar");
  }

  /**
   * Get creator's templates
   * 
   * @param {string} creatorId - Creator's MongoDB ID
   * @param {Object} options
   * @param {string} options.status - Filter by status (draft, active, inactive)
   * @returns {Array} Creator's templates with stats
   */
  async getCreatorTemplates(creatorId, options = {}) {
    if (!creatorId) {
      throw new Error("Creator ID is required");
    }

    const query = { creatorId };
    if (options.status) {
      query.status = options.status;
    }

    const templates = await this.Template.find(query)
      .select("+creatorRevenue +purchaseCount")
      .sort({ createdAt: -1 });

    // Add stats for each template
    return templates.map(template => ({
      ...template.toObject(),
      stats: {
        purchases: template.purchaseCount,
        revenue: template.creatorRevenue,
        rating: template.rating,
        reviews: template.reviews.length
      }
    }));
  }

  /**
   * Update template
   * 
   * @param {string} templateId - Template MongoDB ID
   * @param {string} creatorId - Creator's MongoDB ID (for authorization)
   * @param {Object} updates - Fields to update
   * @returns {Object} Updated template
   */
  async updateTemplate(templateId, creatorId, updates) {
    if (!templateId || !creatorId) {
      throw new Error("Template ID and Creator ID required");
    }

    const template = await this.Template.findById(templateId);
    if (!template) {
      throw new Error("Template not found");
    }

    // Verify ownership
    if (template.creatorId.toString() !== creatorId) {
      throw new Error("Unauthorized: Only template creator can update");
    }

    // Prevent updates to certain fields
    const allowedFields = [
      "description",
      "features",
      "preview",
      "customFields",
      "isPublic",
      "isFeatured",
      "status"
    ];

    const sanitizedUpdates = {};
    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        sanitizedUpdates[key] = updates[key];
      }
    });

    const updated = await this.Template.findByIdAndUpdate(
      templateId,
      sanitizedUpdates,
      { new: true }
    ).populate("creatorId", "name email avatar");

    return updated;
  }

  /**
   * Delete template (soft delete)
   * 
   * @param {string} templateId - Template MongoDB ID
   * @param {string} creatorId - Creator's MongoDB ID
   * @returns {Object} Deletion confirmation
   */
  async deleteTemplate(templateId, creatorId) {
    if (!templateId || !creatorId) {
      throw new Error("Template ID and Creator ID required");
    }

    const template = await this.Template.findById(templateId);
    if (!template) {
      throw new Error("Template not found");
    }

    if (template.creatorId.toString() !== creatorId) {
      throw new Error("Unauthorized: Only template creator can delete");
    }

    // Soft delete
    template.status = "inactive";
    await template.save();

    return {
      success: true,
      message: "Template deleted successfully"
    };
  }

  /**
   * Search templates across marketplace
   * 
   * @param {string} keyword - Search keyword
   * @param {Object} options
   * @returns {Array} Search results
   */
  async searchTemplates(keyword, options = {}) {
    if (!keyword || keyword.length < 2) {
      throw new Error("Search keyword must be at least 2 characters");
    }

    const searchQuery = {
      isPublic: true,
      status: "active",
      $or: [
        { name: { $regex: keyword, $options: "i" } },
        { description: { $regex: keyword, $options: "i" } },
        { features: { $regex: keyword, $options: "i" } }
      ]
    };

    if (options.category) {
      searchQuery.category = options.category;
    }

    const results = await this.Template.find(searchQuery)
      .populate("creatorId", "name email avatar isVerified")
      .limit(options.limit || 50)
      .sort({ rating: -1, purchaseCount: -1 });

    return {
      keyword,
      results,
      count: results.length
    };
  }

  /**
   * Get template statistics
   * 
   * @returns {Object} Marketplace statistics
   */
  async getMarketplaceStats() {
    const totalTemplates = await this.Template.countDocuments({
      isPublic: true,
      status: "active"
    });

    const templates = await this.Template.find({
      isPublic: true,
      status: "active"
    });

    const totalPurchases = templates.reduce((sum, t) => sum + t.purchaseCount, 0);
    const totalRevenue = templates.reduce((sum, t) => sum + t.creatorRevenue, 0);

    const categories = await this.Template.distinct("category", {
      isPublic: true,
      status: "active"
    });

    const topCreators = await this.Template.aggregate([
      { $match: { isPublic: true, status: "active" } },
      { $group: {
        _id: "$creatorId",
        templateCount: { $sum: 1 },
        totalRevenue: { $sum: "$creatorRevenue" },
        totalPurchases: { $sum: "$purchaseCount" }
      }},
      { $sort: { totalRevenue: -1 } },
      { $limit: 10 },
      { $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "creator"
      }}
    ]);

    return {
      totalTemplates,
      totalPurchases,
      totalRevenue: Number(totalRevenue.toFixed(2)),
      categories,
      topCreators,
      timestamp: new Date().toISOString()
    };
  }

  // ============= PRIVATE HELPER METHODS =============

  _generateTemplateHash(name, creatorId) {
    return crypto
      .createHash("sha256")
      .update(`${name}-${creatorId}-${Date.now()}`)
      .digest("hex");
  }

  _generateTransactionId() {
    return `TPL-${Date.now()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
  }
}

/**
 * Factory function to create template marketplace service
 * 
 * @param {Object} models - Database models
 * @param {Object} services - Other services (blockchain)
 * @returns {TemplateMarketplaceService} Initialized service
 */
const createTemplateMarketplaceService = (models, services = {}) => {
  return new TemplateMarketplaceService({
    Template: models.Template,
    User: models.User,
    CryptoTransaction: models.CryptoTransaction,
    blockchainService: services.blockchainService || null
  });
};

module.exports = {
  TemplateMarketplaceService,
  createTemplateMarketplaceService
};
