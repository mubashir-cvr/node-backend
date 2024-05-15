const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const quotationItem = new mongoose.Schema({
  quotation: {
    type: Schema.Types.ObjectId,
    ref: "Quotation",
  },
  itemType:{
    type:String,
    required:true
  },
  item: {type:Schema.Types.Mixed},
  as_on_date: {
    type: Date,
    default: Date.now,
  },
  printSize: {
    type: Schema.Types.ObjectId,
    ref: "PageSize",
  },
  amount: {
    type: Number,
    default:0,
    required:false
  },
  updated_at: { type: Date, default: Date.now },
  updated_user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

const QuotationItem = mongoose.model("QuotationItem", quotationItem);
module.exports = { QuotationItem };
