const express = require("express");
const stockController = require("../../controllers/stocks");

const { body, param } = require("express-validator");
const isAuth = require("../../middleware/is-auth");
const router = express.Router();
router.post(
  "",
  isAuth,
  [
    body("materialType").trim().not().isEmpty(),
    body("quantity").isNumeric(),
    body("unit").trim().not().isEmpty(),
    body("as_on_date").isISO8601().toDate(),
  ],
  stockController.createStock
);

// Update Stock
router.put(
  "/:stockId",
  isAuth,
  [
    param("stockId").trim().not().isEmpty(),
    body("materialType").trim().not().isEmpty(),
    body("quantity").isNumeric(),
    body("unit").trim().not().isEmpty(),
    body("as_on_date").isISO8601().toDate(),
  ],
  stockController.updateStock
);

// Delete Stock
router.delete(
  "/:stockId",
  isAuth,
  [param("stockId").trim().not().isEmpty()],
  stockController.deleteStock
);

// Get Stocks
router.get("", isAuth, stockController.getStocks);
router.use(stockController.handleError);
module.exports = router;
