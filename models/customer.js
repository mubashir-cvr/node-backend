const mongoose = require("mongoose");
const customer = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    default: "",
  },
  phoneNumber: {
    type: String,
    unique: true,
    default: "",
  },
  status: {
    type: String,
    default: "ACTIVE",
  },
  customerType: {
    type: String,
    default: "CUSTOMER",
  },
  as_on_date: {
    type: Date,
    default: Date.now,
  },
  updated_at: { type: Date, default: Date.now },
  updated_user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

const Customer = mongoose.model("Customer", customer);
module.exports = { Customer };
