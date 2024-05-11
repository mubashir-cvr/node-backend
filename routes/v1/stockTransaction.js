const express = require("express");
const stockTransactionzCntrlr = require("../../controllers/stockTransaction");

const { body, param } = require("express-validator");
const isAuth = require("../../middleware/is-auth");
const router = express.Router();

router.get(
  "/:itemID",
  isAuth,
  stockTransactionzCntrlr.getStockLedgers
);

router.use(stockTransactionzCntrlr.handleError);
module.exports = router;