const express = require("express");
const auth = require("../middleware/auth");
const Template = require("../models/Template");
const User = require("../models/User");
const CryptoTransaction = require("../models/CryptoTransaction");
const CryptoService = require("../services/cryptoService");
const { createTemplateMarketplaceService } = require("../services/templateMarketplaceService");

const router = express.Router();

// Initialize template marketplace service
let templateService = null;

// Lazy initialize service (when first route is called)
const getTemplateService = () => {
  if (!templateService) {
    templateService = createTemplateMarketplaceService(
      { Template, User, CryptoTransaction },
      { blockchainService: null } // Add blockchainService if available
    );
  }
  return templateService;
};

// ✅ CREATE TEMPLATE - Creator can publish templates
router.post("/", auth, async (req, res) => {
  try {
    if (req.user.role !== "creator") {
      return res.status(403).json({ message: "Only creators can create templates" });
    }

    const { name, description, category, price, features, customFields, licenseTerms } = req.body;

    if (!name || !category || !price) {
      return res.status(400).json({ message: "Name, category, and price are required" });
    }

    const template = await Template.create({
      name,
      description,
      category,
      price,
      features: features || [],
      customFields: customFields || [],
      licenseTerms,
      creatorId: req.user.id,
      status: "active"
    });

    return res.status(201).json({
      success: true,
      message: "Template published successfully",
      template
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to create template" });
  }
});

// ✅ GET ALL TEMPLATES - Browse marketplace
router.get("/", async (req, res) => {
  try {
    const { category, featured, sortBy = "-createdAt" } = req.query;

    const query = { status: "active", isPublic: true };
    if (category) query.category = category;
    if (featured) query.isFeatured = true;

    const templates = await Template.find(query)
      .populate("creatorId", "name email subscriptionTier")
      .sort(sortBy);

    return res.json({
      templates,
      count: templates.length
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to fetch templates" });
  }
});

// ✅ GET TEMPLATE DETAILS
router.get("/:id", async (req, res) => {
  try {
    const template = await Template.findById(req.params.id)
      .populate("creatorId", "name email walletAddress subscriptionTier");

    if (!template) {
      return res.status(404).json({ message: "Template not found" });
    }

    return res.json(template);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to fetch template" });
  }
});

// ✅ PURCHASE TEMPLATE - Crypto transaction
router.post("/:id/purchase", auth, async (req, res) => {
  try {
    const template = await Template.findById(req.params.id);

    if (!template) {
      return res.status(404).json({ message: "Template not found" });
    }

    if (template.creatorId.toString() === req.user.id) {
      return res.status(400).json({ message: "Cannot purchase your own template" });
    }

    const result = await CryptoService.purchaseTemplate(
      req.user.id,
      req.params.id,
      template.price
    );

    return res.json({
      success: true,
      message: "Template purchased successfully",
      transaction: result.transaction
    });
  } catch (error) {
    console.error(error);
    return res.status(400).json({ message: error.message });
  }
});

// ✅ RATE TEMPLATE
router.post("/:id/rate", auth, async (req, res) => {
  try {
    const { rating, comment } = req.body;

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    const template = await Template.findById(req.params.id);
    if (!template) {
      return res.status(404).json({ message: "Template not found" });
    }

    template.reviews.push({
      userId: req.user.id,
      rating,
      comment: comment || "",
      createdAt: new Date()
    });

    const avgRating = template.reviews.reduce((sum, r) => sum + r.rating, 0) / template.reviews.length;
    template.rating = avgRating;

    await template.save();

    return res.json({
      success: true,
      message: "Rating added",
      newAverageRating: avgRating
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to rate template" });
  }
});

// ✅ GET MY TEMPLATES - Creator's templates
router.get("/creator/my-templates", auth, async (req, res) => {
  try {
    if (req.user.role !== "creator") {
      return res.status(403).json({ message: "Only creators can access this" });
    }

    const templates = await Template.find({ creatorId: req.user.id });

    const stats = templates.map(t => ({
      ...t.toObject(),
      revenue: t.creatorRevenue,
      earnings: t.purchaseCount * t.price * 0.8, // 80% goes to creator
      conversionRate: t.downloads > 0 
        ? ((t.purchaseCount / t.downloads) * 100).toFixed(2) 
        : 0
    }));

    return res.json(stats);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to fetch your templates" });
  }
});

// ✅ UPDATE TEMPLATE
router.put("/:id", auth, async (req, res) => {
  try {
    const template = await Template.findById(req.params.id);

    if (!template) {
      return res.status(404).json({ message: "Template not found" });
    }

    if (template.creatorId.toString() !== req.user.id) {
      return res.status(403).json({ message: "You can only edit your own templates" });
    }

    const { name, description, price, features, licenseTerms } = req.body;

    if (name) template.name = name;
    if (description) template.description = description;
    if (price) template.price = price;
    if (features) template.features = features;
    if (licenseTerms) template.licenseTerms = licenseTerms;

    await template.save();

    return res.json({
      success: true,
      message: "Template updated",
      template
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to update template" });
  }
});

// ✅ DELETE TEMPLATE
router.delete("/:id", auth, async (req, res) => {
  try {
    const template = await Template.findById(req.params.id);

    if (!template) {
      return res.status(404).json({ message: "Template not found" });
    }

    if (template.creatorId.toString() !== req.user.id) {
      return res.status(403).json({ message: "You can only delete your own templates" });
    }

    template.status = "inactive";
    await template.save();

    return res.json({
      success: true,
      message: "Template deleted"
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to delete template" });
  }
});

// ============================================
// ENHANCED ROUTES - Using marketplace service
// ============================================

// ✅ GET FEATURED TEMPLATES
router.get("/marketplace/featured", async (req, res) => {
  try {
    const service = getTemplateService();
    const templates = await service.getFeaturedTemplates(
      parseInt(req.query.limit || "6")
    );

    res.json({ 
      templates,
      count: templates.length 
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ✅ SEARCH TEMPLATES with advanced filtering
router.get("/marketplace/search", async (req, res) => {
  try {
    if (!req.query.q) {
      return res.status(400).json({ error: "Search keyword required" });
    }

    const service = getTemplateService();
    const result = await service.searchTemplates(
      req.query.q,
      {
        category: req.query.category,
        limit: parseInt(req.query.limit || "50")
      }
    );

    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ✅ GET MARKETPLACE STATISTICS
router.get("/marketplace/stats", async (req, res) => {
  try {
    const service = getTemplateService();
    const stats = await service.getMarketplaceStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ GET PUBLIC TEMPLATES WITH ADVANCED FILTERS
router.get("/marketplace/browse", async (req, res) => {
  try {
    const service = getTemplateService();
    const result = await service.getPublicTemplates({
      category: req.query.category,
      search: req.query.search,
      sortBy: req.query.sortBy || "newest",
      page: parseInt(req.query.page || "1"),
      limit: parseInt(req.query.limit || "20")
    });

    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ✅ GET CREATOR'S TEMPLATES (Public view)
router.get("/creator/:creatorId", async (req, res) => {
  try {
    const templates = await Template.find({
      creatorId: req.params.creatorId,
      isPublic: true,
      status: "active"
    })
      .populate("creatorId", "name email avatar isVerified")
      .sort({ createdAt: -1 });

    res.json({
      creatorId: req.params.creatorId,
      templateCount: templates.length,
      templates
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ✅ GET MY TEMPLATES with enhanced stats
router.get("/creator/my-templates/detailed", auth, async (req, res) => {
  try {
    if (req.user.role !== "creator") {
      return res.status(403).json({ error: "Only creators can access this" });
    }

    const service = getTemplateService();
    const templates = await service.getCreatorTemplates(req.user.id, {
      status: req.query.status
    });

    res.json({ 
      templates,
      count: templates.length,
      totalRevenue: templates.reduce((sum, t) => sum + (t.stats.revenue || 0), 0)
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ✅ ADD REVIEW - Enhanced version
router.post("/:id/reviews", auth, async (req, res) => {
  try {
    if (!req.body.rating || req.body.rating < 1 || req.body.rating > 5) {
      return res.status(400).json({ error: "Rating must be between 1 and 5" });
    }

    const service = getTemplateService();
    const template = await service.addReview({
      templateId: req.params.id,
      userId: req.user.id,
      rating: req.body.rating,
      comment: req.body.comment || ""
    });

    res.json({
      success: true,
      template,
      message: "Review added successfully"
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ✅ GET TEMPLATE REVIEWS
router.get("/:id/reviews", async (req, res) => {
  try {
    const template = await Template.findById(req.params.id);
    if (!template) {
      return res.status(404).json({ error: "Template not found" });
    }

    let reviews = template.reviews || [];

    // Sort
    if (req.query.sort === "rating") {
      reviews.sort((a, b) => b.rating - a.rating);
    } else {
      reviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    // Limit
    if (req.query.limit) {
      reviews = reviews.slice(0, parseInt(req.query.limit));
    }

    res.json({
      templateId: req.params.id,
      reviewCount: template.reviews.length,
      averageRating: template.rating,
      reviews
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
