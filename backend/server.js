const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const connectDB = require("./config/db");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

connectDB().catch(err => {
  console.error("Failed to connect to database:", err.message);
  process.exit(1);
});

app.get("/", (req, res) => {
  res.json({ 
    message: "Sociora API - Blockchain Creator Economy Platform",
    version: "1.0.0",
    features: [
      "Video Sharing & Monetization",
      "Crypto Token Generation",
      "Transparent Revenue Distribution",
      "Investor Returns System",
      "Template Marketplace",
      "DRM Content Protection"
    ]
  });
});

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/videos", require("./routes/videos"));
app.use("/api/transactions", require("./routes/transactions"));
app.use("/api/crypto", require("./routes/crypto"));
app.use("/api/templates", require("./routes/templates"));
app.use("/api/engagement", require("./routes/engagement"));
app.use("/api/blockchain", require("./routes/blockchain"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Sociora API Server listening on port ${PORT}`);
  console.log(`📊 Blockchain-powered Creator Economy Platform`);
});
