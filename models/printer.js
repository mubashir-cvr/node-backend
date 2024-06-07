const mongoose = require("mongoose");
const printer = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  printingMaterial: {
    type: String,
    required: true,
    enum: ["Paper", "Other"],
    default: "Paper",
  },
  maxLength: {
    type: Number,
    required: true,
  },
  maxBreadth: {
    type: Number,
    required: true,
  },
  charges: [
    {
      id: { type: Number, required: false },
      colour: {
        type: String,
        enum: ["Single", "Two Colour", "Three Colour", "Multi"],
        required: true,
      },
      minimumCharge: {
        type: Number,
        required: true,
      },
      plateCharge: {
        type: Number,
        required: true,
      },
      maxCountPrintPerMinCharge: {
        type: Number,
        required: true,
      },
      extraChargePerSet: {
        type: Number,
        required: true,
      },
      minChargeCutOffCount: {
        type: Number,
        required: true,
      },
    },
  ],
  isActive: {
    type: Boolean,
    default: true,
  },
  as_on_date: {
    type: Date,
    default: Date.now,
  },
  updated_at: { type: Date, default: Date.now },
  updated_user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

const Printer = mongoose.model("Printer", printer);
module.exports = { Printer };
