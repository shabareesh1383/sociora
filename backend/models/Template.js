const mongoose = require("mongoose");

// Template model for monetized video templates
const templateSchema = new mongoose.Schema(
  {
    // Basic Info
    name: { type: String, required: true },
    description: String,
    category: { type: String, required: true },
    
    // Creator
    creatorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    
    // Template Details
    templateFile: String, // Path to template file
    preview: String, // Preview image/video
    features: [String], // Features included
    
    // Monetization
    price: { type: Number, required: true }, // Cost in SOCIORA tokens
    creatorRevenue: { type: Number, default: 0 }, // Revenue from sales
    purchaseCount: { type: Number, default: 0 },
    
    // Availability
    isPublic: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    
    // Customization Options
    customizable: { type: Boolean, default: true },
    customFields: [
      {
        fieldName: String,
        fieldType: String, // text, color, image, etc.
        required: Boolean
      }
    ],
    
    // Sales & Usage
    downloads: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
    reviews: [
      {
        userId: mongoose.Schema.Types.ObjectId,
        rating: Number,
        comment: String,
        createdAt: Date
      }
    ],
    
    // Blockchain
    templateHash: String,
    licenseTerms: String, // Usage rights description
    
    // Stats
    status: { type: String, enum: ["draft", "active", "inactive"], default: "active" }
  },
  { timestamps: true }
);

templateSchema.index({ creatorId: 1 });
templateSchema.index({ category: 1 });
templateSchema.index({ isFeatured: 1 });

module.exports = mongoose.model("Template", templateSchema);
