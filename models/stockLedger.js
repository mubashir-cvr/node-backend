const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const postSchema = new Schema(
  {
    item: {
      type: Schema.Types.ObjectId,
      ref: "StockItem",
    },
    transactionType: {
      type: String,
      required: true,
    },
    quantity: { type: Number, required: true },
    inOrOut: {
      type: String,
      required: true,
    },
    amount: { type: Number, required: true },
    invoice: {
      type: Schema.Types.ObjectId,
      ref: "Invoice",
    },
    as_on_date: {
      type: Date,
      default: Date.now,
    },
    updated_at: { type: Date, default: Date.now },
    updated_user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);
const StockLedger = mongoose.model("StockLedger", postSchema);

module.exports = { StockLedger };
