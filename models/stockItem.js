const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Define the stock schema
const stockSchema = new Schema({
  item: {
    type: String,
    required: true,
  },
  item_type: {
    type: String,
    enum: ["Paper", "Plate", "Other"],
    required: true,
  },
  gsm: {
    type: Number,
    required: false,
  },
  dimention_length: {
    type: Number,
    required: false,
  },
  dimention_breadth: {
    type: Number,
    required: false,
  },
  unit_of_measurement: {
    type: String,
    enum: ["KG", "LENGTH", "COUNT"],
    required: true,
  },
  unitPrice: {
    type: Number,
    required: true,
  },
  as_on_date: {
    type: Date,
    default: Date.now,
  },
});

// Create the Stock model
const StockItem = mongoose.model("StockItem", stockSchema);

module.exports = StockItem;
