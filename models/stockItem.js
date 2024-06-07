const mongoose = require("mongoose");
const Schema = mongoose.Schema;

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
  suitablePrinters: [
    {
      id: { type: Number, required: false },
      printer: {
        type: Schema.Types.ObjectId,
        ref: "Printer",
        required: true,
      },
      sheetCapacity: {
        type: Number,
        required: true,
      },
    },
  ],
  as_on_date: {
    type: Date,
    default: Date.now,
  },
  updated_at: { type: Date, default: Date.now },
  updated_user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

const StockItem = mongoose.model("StockItem", stockSchema);

module.exports = StockItem;
