const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const stockSchema = new mongoose.Schema({
  item: {
    type: Schema.Types.ObjectId,
    ref: "StockItem",
    unique: true,
  },
  quantity: { type: Number, required: true },
  as_on_date: {
    type: Date,
    default: Date.now,
  },
  updated_at: { type: Date, default: Date.now },
  updated_user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

const Stock = mongoose.model("Stock", stockSchema);
module.exports = { Stock };
