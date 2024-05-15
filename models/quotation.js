const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const quotation = new mongoose.Schema({
  qoutationNumber: {
    type: String,
    required: true,
    unique: true,
  },
  customer: {
    type: Schema.Types.ObjectId,
    ref: "Customer",
  },
  items: [
    {
      type: Schema.Types.ObjectId,
      ref: "QuotationItem",
      required:false,
    },
  ],
  amount: {
    type: Number,
    default: 0,
  },
  discount: {
    type: Number,
    default: 0,
  },
  as_on_date: {
    type: Date,
    default: Date.now,
  },
  updated_at: { type: Date, default: Date.now },
  updated_user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

const Quotation = mongoose.model("Quotation", quotation);
module.exports = { Quotation };
