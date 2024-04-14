const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the stock schema
const stockSchema = new Schema({
  item: {
    type: String,
    required: true
  },
  item_type: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  unit_of_measurement: {
    type: String,
    enum: ["KG", "meter", "number"],
    required: true
  },
  as_on_date: {
    type: Date,
    default: Date.now
  }
});

// Create the Stock model
const Stock = mongoose.model('Stock', stockSchema);

module.exports = Stock;