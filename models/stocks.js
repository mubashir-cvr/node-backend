const mongoose = require("mongoose");

const stockSchema = new mongoose.Schema({
  materialType: { type: String, required: true },
  quantity: { type: Number, required: true },
  unit: { type: String, required: true },
  as_on_date: { type: Date, required: true },
  updated_at: { type: Date, default: Date.now },
  updated_user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

const Stock = mongoose.model("Stock", stockSchema);
module.exports = { Stock };