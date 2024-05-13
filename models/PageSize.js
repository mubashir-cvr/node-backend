const mongoose = require("mongoose");
const pageSize = new mongoose.Schema({
  name: {
    type: String,
    required:true,
    unique: true,
  },
  dimention_length: {
    type: Number,
    required: true,
  },
  dimention_breadth: {
    type: Number,
    required: true,
  },
  as_on_date: {
    type: Date,
    default: Date.now,
  },
  updated_at: { type: Date, default: Date.now },
  updated_user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

const PageSize = mongoose.model("PageSize", pageSize);
module.exports = { PageSize };