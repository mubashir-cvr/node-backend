const express = require("express");
const stockController = require("../../controllers/stockitem");

const { body, param } = require("express-validator");
const isAuth = require("../../middleware/is-auth");
const router = express.Router();
router.post(
  "",
  isAuth,
  [
    body("item").trim().not().isEmpty(),
    body("item_type").trim().not().isEmpty(),
    body("gsm").isNumeric().optional(),
    body("dimention_length").isNumeric().optional(),
    body("dimention_breadth").isNumeric().optional(),
    body("unit_of_measurement")
      .trim()
      .not()
      .isEmpty()
      .isIn(["KG", "METER", "NUMBER"]),
  ],
  stockController.createStockItem
);

// Update Stock Item
router.put(
  "/:stockItemId",
  isAuth,
  [
    param("stockItemId").trim().not().isEmpty(),
    body("item").trim().not().isEmpty(),
    body("item_type").trim().not().isEmpty(),
    body("gsm").isNumeric().optional(),
    body("dimention_length").isNumeric().optional(),
    body("dimention_breadth").isNumeric().optional(),
    body("unit_of_measurement")
      .trim()
      .not()
      .isEmpty()
      .isIn(["KG", "METER", "NUMBER"]),
  ],
  stockController.updateStockItem
);

// Delete Stock Item
router.delete(
  "/:stockItemId",
  isAuth,
  [param("stockItemId").trim().not().isEmpty()],
  stockController.deleteStockItem
);

// Get Stock Items
router.get("", isAuth, stockController.getStockItems);
router.use(stockController.handleError);
module.exports = router;
