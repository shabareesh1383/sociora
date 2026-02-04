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

connectDB();

app.get("/", (req, res) => {
  res.json({ message: "Sociora API is running" });
});

app.use("/api/auth", require("./routes/auth"));
app.use("/api/videos", require("./routes/videos"));
app.use("/api/transactions", require("./routes/transactions"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
