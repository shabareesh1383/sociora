const mongoose = require("mongoose");

const TransactionSchema = new mongoose.Schema(
  {
    txId: { type: String, required: true },

    videoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Video",
      required: true
    },

    investorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    creatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    amount: {
      type: Number,
      required: true
    },

    type: {
      type: String,
      enum: ["INVESTMENT", "DISTRIBUTION"],
      default: "INVESTMENT"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Transaction", TransactionSchema);
